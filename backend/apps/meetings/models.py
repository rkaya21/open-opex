from django.conf import settings
from django.db import models


class AsakaiMeeting(models.Model):
    """A daily shop-floor (Asakai) meeting record."""

    title = models.CharField(max_length=200)
    area = models.ForeignKey(
        "audits.Area",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="asakai_meetings",
    )
    held_at = models.DateTimeField()
    participant_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="asakai_meetings",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-held_at", "-id"]

    def __str__(self) -> str:
        return self.title


class AsakaiItem(models.Model):
    """A topic ("madde") raised in an Asakai meeting.

    Items either get resolved on the spot (status=done) or escalate into the
    shared action pool via the to-action bridge.
    """

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        DONE = "done", "Done"

    meeting = models.ForeignKey(
        AsakaiMeeting, on_delete=models.CASCADE, related_name="items"
    )
    description = models.CharField(max_length=500)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="asakai_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.description[:50]
