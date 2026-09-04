from django.conf import settings
from django.db import models


class OnePointLesson(models.Model):
    """A One-Point Lesson ("Tek Nokta Dersi" / TND): a short 10–15 minute
    shop-floor training on a single topic, delivered to a small group.

    Follows the classic TPM OPL taxonomy: basic knowledge, problem case,
    improvement case.
    """

    class Category(models.TextChoices):
        EMPLOYEE_SATISFACTION = "employee_satisfaction", "Çalışan Memnuniyeti"
        MAINTENANCE = "maintenance", "Bakım Onarım"
        QUALITY = "quality", "Kalite"
        NEW_PRODUCT = "new_product", "Yeni Ürün"
        NEW_PROCESS = "new_process", "Yeni Proses"
        KAIZEN = "kaizen", "Kaizen"
        FIVE_S = "five_s", "5S"
        POKA_YOKE = "poka_yoke", "Poka-Yoke"
        COMPETENCY = "competency", "Yetkinlik"
        MOTIVATION = "motivation", "Motivasyon"
        HSE = "hse", "İSG"
        CAPACITY_GAIN = "capacity_gain", "Kapasite Kazancı"
        LABOR_GAIN = "labor_gain", "İş Gücü Kazancı"
        ENERGY_GAIN = "energy_gain", "Enerji Kazancı"
        SPACE_GAIN = "space_gain", "Alan Kazancı"
        MATERIAL_GAIN = "material_gain", "Malzeme Kazancı"
        ERGONOMICS = "ergonomics", "Ergonomi"
        CUSTOMER_SATISFACTION = "customer_satisfaction", "Müşteri Memnuniyeti"
        ENVIRONMENT = "environment", "Çevre"
        STOCK_TRANSPORT = "stock_transport", "Stok/Taşıma"
        SCRAP_REWORK = "scrap_rework", "Hurda/Yeniden İşlem"

    MIN_PARTICIPANTS = 3

    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="given_lessons",
        help_text="Eğitim veren",
    )
    category = models.CharField(max_length=30, choices=Category.choices)
    topic = models.CharField(max_length=200, help_text="Eğitimin konusu")
    content = models.TextField(blank=True, help_text="Eğitimin içeriği")
    held_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=15, help_text="Süre (dakika)")
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="attended_lessons"
    )
    process = models.ForeignKey(
        "processes.Process",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="lessons",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="created_lessons",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-held_at", "-id"]

    def __str__(self) -> str:
        return self.topic
