from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Suggestion(models.Model):
    """An employee improvement suggestion.

    Lifecycle: submitted → approved | rejected; approved → implemented.
    Implemented suggestions auto-feed the "implemented_suggestions" KPI.
    """

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        IMPLEMENTED = "implemented", "Implemented"

    class Category(models.TextChoices):
        FIVE_S = "five_s", "5S"
        SEC = "sec", "SEÇ (Sağlık-Emniyet-Çevre)"
        RESPECT = "respect", "İnsana Saygı"
        SIGMA_GREEN = "sigma_green", "6 Sigma Yeşil Kuşak"
        SIGMA_BLACK = "sigma_black", "6 Sigma Kara Kuşak"
        KAIZEN = "kaizen", "A3 Kaizen / Kobetsu Kaizen"
        INVESTMENT = "investment", "Yatırım"
        REASONABLE = "reasonable", "Makul Öneri"
        ASAKAI_CARD = "asakai_card", "Asakai / Çözüm Kartı"
        TND = "tnd", "TND (Tek Nokta Dersi)"
        AUTONOMOUS = "autonomous", "Otonom Bakım"
        RND = "rnd", "Ar-Ge"
        INNOVATION = "innovation", "İnovasyon"
        POKA_YOKE = "poka_yoke", "Poka Yoke"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, blank=True
    )
    problem = models.TextField(blank=True, help_text="Mevcut durum / problem")
    solution = models.TextField(blank=True, help_text="Çözüm önerisi")
    estimated_cost = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    cost_note = models.TextField(blank=True)
    estimated_benefit = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    benefit_note = models.TextField(blank=True)
    process = models.ForeignKey(
        "processes.Process",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="suggestions",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="suggestions",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SUBMITTED
    )
    evaluation_note = models.TextField(blank=True)
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="evaluated_suggestions",
    )
    evaluated_at = models.DateTimeField(null=True, blank=True)
    implemented_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    def evaluate(self, *, approve: bool, note: str, by) -> None:
        if self.status != self.Status.SUBMITTED:
            raise ValidationError("Only submitted suggestions can be evaluated.")
        self.status = self.Status.APPROVED if approve else self.Status.REJECTED
        self.evaluation_note = note
        self.evaluated_by = by
        self.evaluated_at = timezone.now()
        self.save(
            update_fields=[
                "status",
                "evaluation_note",
                "evaluated_by",
                "evaluated_at",
                "updated_at",
            ]
        )

    def mark_implemented(self) -> None:
        if self.status != self.Status.APPROVED:
            raise ValidationError("Only approved suggestions can be implemented.")
        self.status = self.Status.IMPLEMENTED
        self.implemented_at = timezone.now()
        self.save(update_fields=["status", "implemented_at", "updated_at"])


class ImprovementProject(models.Model):
    """A structured improvement project: PDCA phases + A3 problem solving."""

    class Phase(models.TextChoices):
        PLAN = "plan", "Plan"
        DO = "do", "Do"
        CHECK = "check", "Check"
        ACT = "act", "Act"
        DONE = "done", "Done"

    PHASE_ORDER = [Phase.PLAN, Phase.DO, Phase.CHECK, Phase.ACT, Phase.DONE]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    process = models.ForeignKey(
        "processes.Process",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="improvement_projects",
    )
    kpi = models.ForeignKey(
        "kpis.KPI",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="improvement_projects",
        help_text="The KPI this project aims to improve",
    )
    suggestion = models.ForeignKey(
        Suggestion,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="projects",
        help_text="The suggestion this project originated from",
    )
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="led_projects",
    )
    team = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="improvement_projects"
    )
    phase = models.CharField(max_length=10, choices=Phase.choices, default=Phase.PLAN)
    expected_benefit = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    realized_benefit = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )

    # A3 problem-solving sections
    a3_background = models.TextField(blank=True)
    a3_current_state = models.TextField(blank=True)
    a3_goal = models.TextField(blank=True)
    a3_root_cause = models.TextField(blank=True)
    a3_countermeasures = models.TextField(blank=True)
    a3_follow_up = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    def advance_phase(self) -> None:
        index = self.PHASE_ORDER.index(self.Phase(self.phase))
        if index == len(self.PHASE_ORDER) - 1:
            raise ValidationError("Project is already done.")
        self.phase = self.PHASE_ORDER[index + 1]
        self.save(update_fields=["phase", "updated_at"])
