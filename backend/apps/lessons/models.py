from django.conf import settings
from django.db import models


class OnePointLesson(models.Model):
    """A One-Point Lesson ("Tek Nokta Dersi" / TND): a short 10–15 minute
    shop-floor training on a single topic, delivered to a small group.

    Follows the classic TPM OPL taxonomy: basic knowledge, problem case,
    improvement case.
    """

    class Category(models.TextChoices):
        BASIC = "basic", "Temel Bilgi"
        PROBLEM = "problem", "Problem Vakası"
        IMPROVEMENT = "improvement", "İyileştirme Örneği"

    MIN_PARTICIPANTS = 3

    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="given_lessons",
        help_text="Eğitim veren",
    )
    category = models.CharField(max_length=20, choices=Category.choices)
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
