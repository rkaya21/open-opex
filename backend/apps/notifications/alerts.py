"""Rule-based smart alerts.

Runs inside a tenant schema (the Celery task iterates tenants). Rules:

1. KPI outside target (red status)          → KPI owner, else all managers
2. KPI sharp drop vs previous measurement   → KPI owner, else all managers
3. Action due within DUE_SOON_DAYS          → assignee
4. Action overdue                           → assignee

All alerts carry a dedup key so re-running the checker never duplicates.
"""

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.accounts.models import User
from apps.actions.models import Action
from apps.kpis.models import KPI
from apps.notifications.models import Notification
from apps.notifications.services import notify

SHARP_DROP_RATIO = Decimal("0.15")  # 15% worse than the previous period
DUE_SOON_DAYS = 3


def _kpi_recipients(kpi: KPI) -> list[User]:
    if kpi.owner:
        return [kpi.owner]
    return list(
        User.objects.filter(role__in=[User.Role.ADMIN, User.Role.MANAGER], is_active=True)
    )


def check_kpi_alerts() -> int:
    """Returns the number of notifications created."""
    created = 0
    kpis = KPI.objects.filter(is_active=True).prefetch_related("measurements")
    for kpi in kpis:
        measurements = list(kpi.measurements.all())
        if not measurements:
            continue
        latest = measurements[-1]

        if kpi.status_for(latest.value) == "red":
            for user in _kpi_recipients(kpi):
                if notify(
                    user,
                    f"KPI hedef dışında: {kpi.name}",
                    body=f"{latest.period}: {latest.value} {kpi.unit} (hedef {kpi.target})",
                    link=f"/kpis/{kpi.id}",
                    kind=Notification.Kind.WARNING,
                    dedup_key=f"kpi-red-{kpi.id}-{latest.period}",
                ):
                    created += 1

        if len(measurements) >= 2:
            previous = measurements[-2]
            # Relative change is undefined for a zero baseline (division by
            # zero) — skip drop detection for that pair explicitly.
            if previous.value != 0:
                change = (latest.value - previous.value) / abs(previous.value)
                worse = (
                    -change if kpi.direction == KPI.Direction.HIGHER_IS_BETTER else change
                )
                if worse >= SHARP_DROP_RATIO:
                    for user in _kpi_recipients(kpi):
                        if notify(
                            user,
                            f"KPI'da keskin kötüleşme: {kpi.name}",
                            body=(
                                f"{previous.value} → {latest.value} {kpi.unit} "
                                f"(%{abs(change) * 100:.0f})"
                            ),
                            link=f"/kpis/{kpi.id}",
                            kind=Notification.Kind.WARNING,
                            dedup_key=f"kpi-drop-{kpi.id}-{latest.period}",
                        ):
                            created += 1
    return created


def check_action_reminders() -> int:
    """Returns the number of notifications created."""
    created = 0
    today = timezone.now().date()
    soon = today + timedelta(days=DUE_SOON_DAYS)
    open_actions = Action.objects.exclude(status=Action.Status.DONE).filter(
        assignee__isnull=False, due_date__isnull=False
    )

    for action in open_actions.filter(due_date__lt=today):
        if notify(
            action.assignee,
            f"Aksiyon gecikti: {action.title}",
            body=f"Termin: {action.due_date}",
            link="/actions",
            kind=Notification.Kind.WARNING,
            dedup_key=f"action-overdue-{action.id}-{action.due_date}",
        ):
            created += 1

    for action in open_actions.filter(due_date__gte=today, due_date__lte=soon):
        if notify(
            action.assignee,
            f"Aksiyon termini yaklaşıyor: {action.title}",
            body=f"Termin: {action.due_date}",
            link="/actions",
            dedup_key=f"action-due-{action.id}-{action.due_date}",
        ):
            created += 1
    return created
