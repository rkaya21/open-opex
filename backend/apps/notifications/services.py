from django.db import IntegrityError, transaction

from apps.notifications.models import Notification


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
            return Notification.objects.create(
                user=user,
                title=title,
                body=body,
                link=link,
                kind=kind,
                dedup_key=dedup_key,
            )
    except IntegrityError:
        return None
