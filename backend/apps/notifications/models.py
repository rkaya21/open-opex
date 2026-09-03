from django.conf import settings
from django.db import models


class Notification(models.Model):
    """An in-app notification for one user.

    dedup_key makes rule-based alerts idempotent: the same alert for the same
    subject and period is delivered once, however often the checker runs.
    """

    class Kind(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=300)
    body = models.CharField(max_length=500, blank=True)
    link = models.CharField(max_length=200, blank=True, help_text="Frontend path, e.g. /kpis/3")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.INFO)
    dedup_key = models.CharField(max_length=200, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "dedup_key"],
                name="unique_user_dedup_key",
                condition=~models.Q(dedup_key=""),
            )
        ]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.title}"
