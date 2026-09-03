"""Cross-module glue: implemented suggestions feed their KPI automatically."""

from datetime import date

from apps.improvements.models import Suggestion
from apps.kpis.models import KPI, KPIMeasurement

IMPLEMENTED_SUGGESTIONS_TEMPLATE_KEY = "implemented_suggestions"


def sync_implemented_suggestions_kpi(when: date) -> None:
    """Upsert the month's implemented-suggestion count into every active KPI
    created from the implemented_suggestions template. No-op if none exists.
    """
    kpis = KPI.objects.filter(
        template_key=IMPLEMENTED_SUGGESTIONS_TEMPLATE_KEY, is_active=True
    )
    if not kpis.exists():
        return

    month_start = when.replace(day=1)
    count = Suggestion.objects.filter(
        status=Suggestion.Status.IMPLEMENTED,
        implemented_at__year=when.year,
        implemented_at__month=when.month,
    ).count()

    for kpi in kpis:
        KPIMeasurement.objects.update_or_create(
            kpi=kpi,
            period=month_start,
            defaults={"value": count},
            create_defaults={"value": count, "created_by": None},
        )
