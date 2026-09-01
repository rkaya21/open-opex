from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Process(models.Model):
    """A business process in the tenant's process map.

    Hierarchical (main process → sub-process) with SIPOC-style definition
    fields. Lifecycle: draft → published (version bumps on each publish)
    → archived.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=200)
    code = models.CharField(
        max_length=32,
        unique=True,
        help_text="Short unique identifier, e.g. PR-001",
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="children",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_processes",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    version = models.PositiveIntegerField(default=1)

    purpose = models.TextField(blank=True)
    # SIPOC definition
    suppliers = models.TextField(blank=True)
    inputs = models.TextField(blank=True)
    steps = models.TextField(blank=True, help_text="High-level process steps")
    outputs = models.TextField(blank=True)
    customers = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name_plural = "processes"

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"

    def clean(self) -> None:
        if self.parent is not None:
            if self.parent == self:
                raise ValidationError({"parent": "A process cannot be its own parent."})
            ancestor = self.parent
            while ancestor is not None:
                if ancestor.pk == self.pk:
                    raise ValidationError(
                        {"parent": "Cannot move a process under one of its descendants."}
                    )
                ancestor = ancestor.parent

    def publish(self) -> None:
        """Publish the process; each publish after the first bumps the version."""
        if self.status == self.Status.PUBLISHED:
            self.version += 1
        else:
            if self.status == self.Status.ARCHIVED:
                raise ValidationError("Archived processes cannot be published; restore first.")
            self.status = self.Status.PUBLISHED
        self.save(update_fields=["status", "version", "updated_at"])

    def archive(self) -> None:
        self.status = self.Status.ARCHIVED
        self.save(update_fields=["status", "updated_at"])
