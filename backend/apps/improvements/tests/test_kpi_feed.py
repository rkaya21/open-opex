from decimal import Decimal

from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.kpis.models import KPI, KPIMeasurement


class ImplementedSuggestionsKpiFeedTests(TenantTestCase):
    """Implementing a suggestion upserts the month's count into the
    implemented_suggestions KPI."""

    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.kpi = KPI.objects.create(
            name="Uygulanan Öneriler",
            unit="count",
            template_key="implemented_suggestions",
            direction=KPI.Direction.HIGHER_IS_BETTER,
            frequency=KPI.Frequency.MONTHLY,
        )

    def _implement_new_suggestion(self) -> None:
        self.client.force_authenticate(self.manager)
        suggestion_id = self.client.post(
            "/api/v1/suggestions/", {"title": "Fikir", "description": "Detay"}
        ).json()["id"]
        self.client.post(f"/api/v1/suggestions/{suggestion_id}/approve/")
        response = self.client.post(f"/api/v1/suggestions/{suggestion_id}/implement/")
        assert response.status_code == 200, response.json()

    def test_first_implementation_creates_measurement(self):
        self._implement_new_suggestion()
        measurement = KPIMeasurement.objects.get(kpi=self.kpi)
        self.assertEqual(measurement.value, Decimal("1"))
        self.assertEqual(measurement.period.day, 1)

    def test_second_implementation_updates_same_period(self):
        self._implement_new_suggestion()
        self._implement_new_suggestion()
        measurements = KPIMeasurement.objects.filter(kpi=self.kpi)
        self.assertEqual(measurements.count(), 1)
        self.assertEqual(measurements.first().value, Decimal("2"))

    def test_noop_without_template_kpi(self):
        self.kpi.delete()
        self._implement_new_suggestion()  # must not raise
        self.assertEqual(KPIMeasurement.objects.count(), 0)

    def test_inactive_kpi_not_fed(self):
        self.kpi.is_active = False
        self.kpi.save()
        self._implement_new_suggestion()
        self.assertEqual(KPIMeasurement.objects.count(), 0)
