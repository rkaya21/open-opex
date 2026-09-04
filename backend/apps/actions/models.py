from django.conf import settings
from django.db import models


class Action(models.Model):
    """One entry in the shared CAPA action pool.

    Actions are born from audit findings, suggestions, or improvement
    projects — or created standalone. Every action has an assignee, a due
    date and a simple open → in_progress → done lifecycle.
    """

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        DONE = "done", "Done"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_actions",
    )
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    # Sources — at most one is normally set
    finding = models.ForeignKey(
        "audits.Finding",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="actions",
    )
    suggestion = models.ForeignKey(
        "improvements.Suggestion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="actions",
    )
    project = models.ForeignKey(
        "improvements.ImprovementProject",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="actions",
    )
    asakai_item = models.ForeignKey(
        "meetings.AsakaiItem",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="actions",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="created_actions",
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "-created_at"]

    def __str__(self) -> str:
        return self.title
