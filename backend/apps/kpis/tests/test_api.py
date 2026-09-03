from decimal import Decimal

from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.kpis.models import KPI, KPIMeasurement
from apps.kpis.templates import KPI_TEMPLATES


class KPIApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.kpi = KPI.objects.create(
            name="OEE", unit="%", direction=KPI.Direction.HIGHER_IS_BETTER,
            target=Decimal("85"),
        )

    def test_member_cannot_create_kpi(self):
        self.client.force_authenticate(self.member)
        response = self.client.post("/api/v1/kpis/", {"name": "X", "unit": "%"})
        self.assertEqual(response.status_code, 403)

    def test_manager_can_create_kpi(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            "/api/v1/kpis/",
            {"name": "Scrap Rate", "unit": "%", "direction": "lower", "target": "2"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "gray")  # no measurements yet

    def test_templates_listed(self):
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/kpis/templates/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), KPI_TEMPLATES)

    def test_member_can_upsert_measurements(self):
        self.client.force_authenticate(self.member)
        response = self.client.put(
            f"/api/v1/kpis/{self.kpi.id}/measurements/",
            [{"period": "2026-08-01", "value": "83.5"}],
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(KPIMeasurement.objects.count(), 1)

    def test_upsert_is_idempotent_by_period(self):
        self.client.force_authenticate(self.member)
        for value in ("80", "86.2"):
            self.client.put(
                f"/api/v1/kpis/{self.kpi.id}/measurements/",
                [{"period": "2026-08-01", "value": value}],
                format="json",
            )
        measurements = KPIMeasurement.objects.filter(kpi=self.kpi)
        self.assertEqual(measurements.count(), 1)
        self.assertEqual(measurements.first().value, Decimal("86.2"))

    def test_upsert_preserves_original_recorder(self):
        self.client.force_authenticate(self.member)
        self.client.put(
            f"/api/v1/kpis/{self.kpi.id}/measurements/",
            [{"period": "2026-08-01", "value": "80"}],
            format="json",
        )
        self.client.force_authenticate(self.manager)
        self.client.put(
            f"/api/v1/kpis/{self.kpi.id}/measurements/",
            [{"period": "2026-08-01", "value": "85"}],
            format="json",
        )
        measurement = KPIMeasurement.objects.get(kpi=self.kpi, period="2026-08-01")
        self.assertEqual(measurement.value, Decimal("85"))
        self.assertEqual(measurement.created_by, self.member)  # not overwritten

    def test_upsert_rejects_invalid_payload(self):
        self.client.force_authenticate(self.member)
        response = self.client.put(
            f"/api/v1/kpis/{self.kpi.id}/measurements/",
            [{"period": "not-a-date", "value": "x"}],
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_dashboard_returns_status_and_trend(self):
        for month, value in (("06", "70"), ("07", "82"), ("08", "86")):
            KPIMeasurement.objects.create(
                kpi=self.kpi, period=f"2026-{month}-01", value=Decimal(value)
            )
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/kpis/dashboard/")
        self.assertEqual(response.status_code, 200)
        kpi = response.json()[0]
        self.assertEqual(kpi["latest_value"], "86.00")
        self.assertEqual(kpi["latest_period"], "2026-08-01")
        self.assertEqual(kpi["status"], "green")
        self.assertEqual(len(kpi["trend"]), 3)
        self.assertEqual(kpi["trend"][0]["value"], "70.00")

    def test_dashboard_excludes_inactive(self):
        KPI.objects.create(name="Old KPI", unit="%", is_active=False)
        self.client.force_authenticate(self.member)
        names = [k["name"] for k in self.client.get("/api/v1/kpis/dashboard/").json()]
        self.assertEqual(names, ["OEE"])

    def test_csv_export_escapes_formula_notes(self):
        KPIMeasurement.objects.create(
            kpi=self.kpi, period="2026-08-01", value=Decimal("83"), note="=HYPERLINK(...)"
        )
        self.client.force_authenticate(self.member)
        response = self.client.get(f"/api/v1/kpis/{self.kpi.id}/export/")
        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn("'=HYPERLINK", content)
        self.assertIn("2026-08-01", content)

    def test_measurement_history_readable(self):
        KPIMeasurement.objects.create(kpi=self.kpi, period="2026-08-01", value=Decimal("83"))
        self.client.force_authenticate(self.member)
        response = self.client.get(f"/api/v1/kpis/{self.kpi.id}/measurements/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
