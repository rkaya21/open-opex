from decimal import Decimal

from django.conf import settings
from django.db import models


class KPI(models.Model):
    """A key performance indicator, optionally tied to a process.

    Status vs target is computed with a tolerance band:
    green = meets target, yellow = within tolerance, red = outside, gray = no
    target or no data.
    """

    class Direction(models.TextChoices):
        HIGHER_IS_BETTER = "higher", "Higher is better"
        LOWER_IS_BETTER = "lower", "Lower is better"

    class Frequency(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    template_key = models.CharField(
        max_length=50,
        blank=True,
        help_text="Set when created from a built-in template; lets other "
        "modules find and auto-feed this KPI (e.g. implemented_suggestions).",
    )
    unit = models.CharField(max_length=50, help_text="e.g. %, hours, pieces")
    direction = models.CharField(
        max_length=10, choices=Direction.choices, default=Direction.HIGHER_IS_BETTER
    )
    frequency = models.CharField(
        max_length=10, choices=Frequency.choices, default=Frequency.MONTHLY
    )
    process = models.ForeignKey(
        "processes.Process",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="kpis",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_kpis",
    )
    target = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    tolerance_percent = models.PositiveSmallIntegerField(
        default=5, help_text="Deviation from target that still counts as yellow"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "KPI"
        verbose_name_plural = "KPIs"

    def __str__(self) -> str:
        return self.name

    def status_for(self, value: Decimal | None) -> str:
        if self.target is None or value is None:
            return "gray"
        tolerance = self.target * Decimal(self.tolerance_percent) / Decimal(100)
        if self.direction == self.Direction.HIGHER_IS_BETTER:
            if value >= self.target:
                return "green"
            return "yellow" if value >= self.target - abs(tolerance) else "red"
        if value <= self.target:
            return "green"
        return "yellow" if value <= self.target + abs(tolerance) else "red"


class KPIMeasurement(models.Model):
    """One measured value for a KPI period (period = start date of the bucket).

    (kpi, period) is unique so ingest is idempotent: re-sending the same
    period overwrites instead of duplicating.
    """

    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name="measurements")
    period = models.DateField()
    value = models.DecimalField(max_digits=14, decimal_places=2)
    note = models.CharField(max_length=500, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["period"]
        constraints = [
            models.UniqueConstraint(fields=["kpi", "period"], name="unique_kpi_period")
        ]

    def __str__(self) -> str:
        return f"{self.kpi.name} @ {self.period}: {self.value}"
