from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from django_tenants.test.cases import TenantTestCase

from apps.accounts.models import User
from apps.actions.models import Action
from apps.kpis.models import KPI, KPIMeasurement
from apps.notifications.alerts import check_action_reminders, check_kpi_alerts
from apps.notifications.models import Notification


class KpiAlertTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(email="owner@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.kpi = KPI.objects.create(
            name="OEE",
            unit="%",
            direction=KPI.Direction.HIGHER_IS_BETTER,
            target=Decimal("85"),
            owner=self.owner,
        )

    def _measure(self, period: str, value: str) -> None:
        KPIMeasurement.objects.create(kpi=self.kpi, period=period, value=Decimal(value))

    def test_red_kpi_notifies_owner(self):
        self._measure("2026-08-01", "60")
        created = check_kpi_alerts()
        self.assertEqual(created, 1)
        notification = Notification.objects.get(user=self.owner)
        self.assertIn("hedef dışında", notification.title)
        self.assertEqual(notification.kind, "warning")
        self.assertEqual(notification.link, f"/kpis/{self.kpi.id}")

    def test_alert_is_deduplicated(self):
        self._measure("2026-08-01", "60")
        check_kpi_alerts()
        created_again = check_kpi_alerts()
        self.assertEqual(created_again, 0)
        self.assertEqual(Notification.objects.count(), 1)

    def test_green_kpi_no_alert(self):
        self._measure("2026-08-01", "90")
        self.assertEqual(check_kpi_alerts(), 0)

    def test_sharp_drop_detected(self):
        self.kpi.target = None
        self.kpi.save()
        self._measure("2026-07-01", "90")
        self._measure("2026-08-01", "70")  # 22% drop
        created = check_kpi_alerts()
        self.assertEqual(created, 1)
        self.assertIn("keskin", Notification.objects.get().title)

    def test_small_change_no_drop_alert(self):
        self.kpi.target = None
        self.kpi.save()
        self._measure("2026-07-01", "90")
        self._measure("2026-08-01", "85")  # ~5%
        self.assertEqual(check_kpi_alerts(), 0)

    def test_lower_is_better_drop_direction(self):
        scrap = KPI.objects.create(
            name="Hurda",
            unit="%",
            direction=KPI.Direction.LOWER_IS_BETTER,
            owner=self.owner,
        )
        KPIMeasurement.objects.create(kpi=scrap, period="2026-07-01", value=Decimal("2"))
        KPIMeasurement.objects.create(kpi=scrap, period="2026-08-01", value=Decimal("3"))
        created = check_kpi_alerts()  # 50% worse (increase is bad)
        self.assertEqual(created, 1)

    def test_ownerless_kpi_notifies_managers(self):
        self.kpi.owner = None
        self.kpi.save()
        self._measure("2026-08-01", "60")
        check_kpi_alerts()
        self.assertTrue(Notification.objects.filter(user=self.manager).exists())
        self.assertFalse(Notification.objects.filter(user=self.owner).exists())


class ActionReminderTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.today = timezone.now().date()

    def test_overdue_action_warns_assignee(self):
        Action.objects.create(
            title="Geciken iş",
            assignee=self.member,
            due_date=self.today - timedelta(days=2),
        )
        created = check_action_reminders()
        self.assertEqual(created, 1)
        self.assertIn("gecikti", Notification.objects.get().title)

    def test_due_soon_reminds(self):
        Action.objects.create(
            title="Yaklaşan iş", assignee=self.member, due_date=self.today + timedelta(days=2)
        )
        created = check_action_reminders()
        self.assertEqual(created, 1)
        self.assertIn("yaklaşıyor", Notification.objects.get().title)

    def test_done_and_far_actions_ignored(self):
        Action.objects.create(
            title="Bitti",
            assignee=self.member,
            due_date=self.today - timedelta(days=1),
            status=Action.Status.DONE,
        )
        Action.objects.create(
            title="Uzak", assignee=self.member, due_date=self.today + timedelta(days=30)
        )
        self.assertEqual(check_action_reminders(), 0)

    def test_reminders_deduplicated(self):
        Action.objects.create(
            title="Geciken", assignee=self.member, due_date=self.today - timedelta(days=1)
        )
        check_action_reminders()
        self.assertEqual(check_action_reminders(), 0)
