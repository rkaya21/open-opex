from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator
from django.db import models
from django.utils import timezone


class Area(models.Model):
    """A physical zone ("5S sahası") audits are performed in."""

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=32, unique=True, help_text="e.g. SAHA-01")
    description = models.TextField(blank=True)
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="responsible_areas",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class ChecklistTemplate(models.Model):
    """A reusable question set (e.g. the built-in 5S checklist)."""

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class ChecklistItem(models.Model):
    """One scored question. Scores run 0–5."""

    MAX_SCORE = 5

    template = models.ForeignKey(
        ChecklistTemplate, on_delete=models.CASCADE, related_name="items"
    )
    text = models.CharField(max_length=500)
    category = models.CharField(
        max_length=100, blank=True, help_text="e.g. Seiri, Seiton (5S pillars)"
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.text


class Audit(models.Model):
    """One audit = a checklist template executed in an area on a date."""

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        COMPLETED = "completed", "Completed"

    template = models.ForeignKey(
        ChecklistTemplate, on_delete=models.PROTECT, related_name="audits"
    )
    area = models.ForeignKey(Area, on_delete=models.PROTECT, related_name="audits")
    auditor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audits",
    )
    scheduled_date = models.DateField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNED
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    score_percent = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_date", "-id"]

    def __str__(self) -> str:
        return f"{self.template.name} @ {self.area.code} ({self.scheduled_date})"

    def complete(self) -> None:
        """Compute the score from answers and close the audit."""
        if self.status == self.Status.COMPLETED:
            raise ValidationError("Audit is already completed.")
        item_count = self.template.items.count()
        answers = self.answers.all()
        if item_count == 0 or answers.count() < item_count:
            raise ValidationError("All checklist items must be answered first.")
        total = sum(answer.score for answer in answers)
        self.score_percent = round(total / (item_count * ChecklistItem.MAX_SCORE) * 100, 1)
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=["score_percent", "status", "completed_at", "updated_at"])


class AuditAnswer(models.Model):
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name="answers")
    item = models.ForeignKey(ChecklistItem, on_delete=models.CASCADE, related_name="answers")
    score = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(ChecklistItem.MAX_SCORE)]
    )
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["audit", "item"], name="unique_audit_item")
        ]

    def __str__(self) -> str:
        return f"{self.item_id}: {self.score}"


def finding_photo_path(instance, filename: str) -> str:
    """Segregate uploads per tenant schema — DB isolation is schema-based,
    media isolation must mirror it on disk."""
    from django.db import connection

    return f"findings/{connection.schema_name}/{filename}"


class Finding(models.Model):
    """A nonconformity — usually raised during an audit, photo optional."""

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    audit = models.ForeignKey(
        Audit, null=True, blank=True, on_delete=models.SET_NULL, related_name="findings"
    )
    area = models.ForeignKey(
        Area, null=True, blank=True, on_delete=models.SET_NULL, related_name="findings"
    )
    photo = models.ImageField(upload_to=finding_photo_path, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="findings"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title
