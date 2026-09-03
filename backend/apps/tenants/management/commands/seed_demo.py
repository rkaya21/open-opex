"""Populate a tenant with realistic demo data for evaluation.

Usage:
    python manage.py tenant_command seed_demo --schema=acme
"""

from datetime import date, timedelta
from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.actions.models import Action
from apps.audits.models import Area, Audit, AuditAnswer, ChecklistTemplate, Finding
from apps.improvements.models import ImprovementProject, Suggestion
from apps.kpis.models import KPI, KPIMeasurement
from apps.processes.models import Process


def _month_start(months_ago: int) -> date:
    today = timezone.now().date().replace(day=1)
    year, month = today.year, today.month - months_ago
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1)


class Command(BaseCommand):
    help = "Seed demo data (processes, KPIs, suggestions, audit, actions)"

    def handle(self, **options) -> None:
        if Process.objects.exists():
            self.stdout.write("Tenant already has data; skipping demo seed")
            return

        manager = User.objects.filter(role=User.Role.ADMIN).first()

        production = Process.objects.create(
            name="Üretim",
            code="PR-001",
            purpose="Hammaddeden sevkiyata değer akışını yönetmek",
            status=Process.Status.PUBLISHED,
            owner=manager,
        )
        assembly = Process.objects.create(
            name="Montaj", code="PR-002", parent=production, status=Process.Status.PUBLISHED
        )
        Process.objects.create(name="Kaynakhane", code="PR-003", parent=production)
        Process.objects.create(name="Kalite Kontrol", code="PR-010", owner=manager)

        oee = KPI.objects.create(
            name="OEE (Overall Equipment Effectiveness)",
            template_key="oee",
            unit="%",
            direction=KPI.Direction.HIGHER_IS_BETTER,
            frequency=KPI.Frequency.MONTHLY,
            target=Decimal("85"),
            process=assembly,
            owner=manager,
        )
        scrap = KPI.objects.create(
            name="Hurda Oranı",
            template_key="scrap_rate",
            unit="%",
            direction=KPI.Direction.LOWER_IS_BETTER,
            frequency=KPI.Frequency.MONTHLY,
            target=Decimal("2"),
            process=production,
        )
        KPI.objects.create(
            name="Uygulanan Öneriler",
            template_key="implemented_suggestions",
            unit="adet",
            direction=KPI.Direction.HIGHER_IS_BETTER,
            frequency=KPI.Frequency.MONTHLY,
        )
        monthly_values = [
            ("86.2", "1.8"),
            ("83.5", "2.4"),
            ("79.1", "2.9"),
            ("81.4", "2.2"),
            ("77.9", "3.1"),
            ("75.2", "3.4"),
        ]
        for months_ago, (oee_value, scrap_value) in enumerate(monthly_values):
            period = _month_start(months_ago)
            KPIMeasurement.objects.create(kpi=oee, period=period, value=Decimal(oee_value))
            KPIMeasurement.objects.create(kpi=scrap, period=period, value=Decimal(scrap_value))

        smed = Suggestion.objects.create(
            title="SMED ile kalıp değişimini kısaltalım",
            description=(
                "Kalıp değişimi 45 dk sürüyor; dış ayar adımlarını ayırırsak "
                "20 dk altına ineriz."
            ),
            process=assembly,
            submitted_by=manager,
            status=Suggestion.Status.APPROVED,
            evaluation_note="Pilot hat için onaylandı",
            evaluated_by=manager,
            evaluated_at=timezone.now(),
        )
        Suggestion.objects.create(
            title="Andon ışıkları eklensin",
            description="Hat duruşlarında görsel uyarı yok, andon direkleri ekleyelim.",
            process=assembly,
            submitted_by=manager,
        )

        ImprovementProject.objects.create(
            title="SMED Projesi — Montaj Hattı",
            process=assembly,
            kpi=oee,
            suggestion=smed,
            lead=manager,
            phase=ImprovementProject.Phase.DO,
            expected_benefit=Decimal("150000"),
            a3_background="Kalıp değişimi ortalama 45 dk; ayda 20 değişim yapılıyor.",
            a3_current_state="Tüm ayar adımları makine dururken yapılıyor.",
            a3_goal="Değişim süresini 20 dk altına indirmek (OEE +4 puan).",
            a3_root_cause="İç/dış ayar ayrımı yok; takımlar hazır bekletilmiyor.",
            a3_countermeasures="Dış ayar checklist'i, takım arabası, paralel görev planı.",
        )

        call_command("seed_5s_checklist")
        template = ChecklistTemplate.objects.get(name="5S Denetimi")
        area = Area.objects.create(
            name="Montaj Sahası", code="SAHA-01", responsible=manager
        )
        Area.objects.create(name="Kaynakhane", code="SAHA-02")
        audit = Audit.objects.create(
            template=template,
            area=area,
            auditor=manager,
            scheduled_date=timezone.now().date() - timedelta(days=3),
        )
        for index, item in enumerate(template.items.all()):
            AuditAnswer.objects.create(
                audit=audit, item=item, score=3 if index % 3 == 0 else 4
            )
        audit.complete()

        finding = Finding.objects.create(
            title="Zemin çizgileri silinmiş",
            description="Forklift yolu ile yaya yolu ayrımı görünmüyor.",
            audit=audit,
            area=area,
            created_by=manager,
        )
        Action.objects.create(
            title="Zemin çizgilerini yeniletmek",
            assignee=manager,
            due_date=timezone.now().date() + timedelta(days=7),
            finding=finding,
            created_by=manager,
        )
        Action.objects.create(
            title="SMED dış ayar checklist'ini hazırla",
            assignee=manager,
            due_date=timezone.now().date() + timedelta(days=2),
            created_by=manager,
        )

        self.stdout.write(self.style.SUCCESS("Demo data created"))
