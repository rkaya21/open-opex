from django.conf import settings
from django.db import connection, models


def before_after_photo_path(instance, filename: str) -> str:
    """Tenant-scoped upload path — mirrors DB schema isolation on disk."""
    return f"beforeafter/{connection.schema_name}/{filename}"


class BeforeAfterForm(models.Model):
    """A before/after (Önce/Sonra) improvement record: a small kaizen captured
    with before and after photos plus cost and gain accounting."""

    class GainContinuity(models.TextChoices):
        CONTINUOUS = "continuous", "Sürekli"
        ONE_TIME = "one_time", "Tek Seferlik"

    class Category(models.TextChoices):
        CAPACITY = "capacity", "Kapasite Kazancı"
        LABOR = "labor", "İş Gücü Kazancı"
        ENERGY = "energy", "Enerji Kazancı"
        SPACE = "space", "Alan Kazancı"
        MATERIAL = "material", "Malzeme Kazancı"
        STOCK_TRANSPORT = "stock_transport", "Stok/Taşıma"
        SCRAP_REWORK = "scrap_rework", "Hurda/Yeniden İşlem"
        QUALITY = "quality", "Kalite"
        SAFETY = "safety", "İSG"
        ENVIRONMENT = "environment", "Çevre"
        ERGONOMICS = "ergonomics", "Ergonomi"

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, blank=True)
    problem = models.TextField(blank=True)

    before_note = models.TextField(blank=True, help_text="ÖNCE açıklama")
    after_note = models.TextField(blank=True, help_text="SONRA açıklama")

    cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    cost_note = models.TextField(blank=True, help_text="Maliyet hesabı")
    budget_code = models.CharField(max_length=200, blank=True)

    gain_continuity = models.CharField(
        max_length=12, choices=GainContinuity.choices, blank=True
    )
    one_time_gain = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    gain_note = models.TextField(blank=True, help_text="Kazanç hesabı")
    gain_category = models.CharField(max_length=20, choices=Category.choices, blank=True)

    process = models.ForeignKey(
        "processes.Process",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="before_after_forms",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="before_after_forms",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.problem[:50] or f"Form #{self.pk}"


class BeforeAfterPhoto(models.Model):
    """A before or after photo/analysis attached to a form (max 5 per kind)."""

    MAX_PER_KIND = 5

    class Kind(models.TextChoices):
        BEFORE = "before", "Önce"
        AFTER = "after", "Sonra"

    form = models.ForeignKey(
        BeforeAfterForm, on_delete=models.CASCADE, related_name="photos"
    )
    kind = models.CharField(max_length=6, choices=Kind.choices)
    image = models.ImageField(upload_to=before_after_photo_path)
    caption = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["kind", "id"]

    def __str__(self) -> str:
        return f"{self.form_id} {self.kind}"
