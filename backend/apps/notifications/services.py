from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, transaction

from apps.notifications.models import Notification


def _send_email(notification: Notification) -> None:
    """Best-effort email for warning-level notifications; no-op without SMTP."""
    if notification.kind != Notification.Kind.WARNING:
        return
    if "smtp" in settings.EMAIL_BACKEND and not settings.EMAIL_HOST:
        return  # SMTP selected but not configured
    send_mail(
        subject=f"[open-opex] {notification.title}",
        message=notification.body or notification.title,
        from_email=None,  # DEFAULT_FROM_EMAIL
        recipient_list=[notification.user.email],
        fail_silently=True,
    )


def notify(
    user,
    title: str,
    *,
    body: str = "",
    link: str = "",
    kind: str = Notification.Kind.INFO,
    dedup_key: str = "",
) -> Notification | None:
    """Create a notification; silently skip if the dedup key was already sent.

    The savepoint keeps the surrounding transaction usable when the unique
    constraint fires (PostgreSQL aborts the transaction otherwise).
    """
    try:
        with transaction.atomic():
            notification = Notification.objects.create(
                user=user,
                title=title,
                body=body,
                link=link,
                kind=kind,
                dedup_key=dedup_key,
            )
    except IntegrityError:
        return None
    _send_email(notification)
    return notification
