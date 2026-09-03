from decimal import Decimal

from django_tenants.test.cases import TenantTestCase

from apps.kpis.models import KPI


class KPIStatusTests(TenantTestCase):
    def _kpi(self, direction: str, target: str | None) -> KPI:
        return KPI.objects.create(
            name="Test KPI",
            unit="%",
            direction=direction,
            target=None if target is None else Decimal(target),
            tolerance_percent=5,
        )

    def test_no_target_or_value_is_gray(self):
        kpi = self._kpi(KPI.Direction.HIGHER_IS_BETTER, None)
        self.assertEqual(kpi.status_for(Decimal("50")), "gray")
        kpi_with_target = self._kpi(KPI.Direction.HIGHER_IS_BETTER, "80")
        self.assertEqual(kpi_with_target.status_for(None), "gray")

    def test_higher_is_better_bands(self):
        kpi = self._kpi(KPI.Direction.HIGHER_IS_BETTER, "80")
        self.assertEqual(kpi.status_for(Decimal("85")), "green")
        self.assertEqual(kpi.status_for(Decimal("80")), "green")
        self.assertEqual(kpi.status_for(Decimal("77")), "yellow")  # within 5% band (76+)
        self.assertEqual(kpi.status_for(Decimal("75")), "red")

    def test_lower_is_better_bands(self):
        kpi = self._kpi(KPI.Direction.LOWER_IS_BETTER, "10")
        self.assertEqual(kpi.status_for(Decimal("9")), "green")
        self.assertEqual(kpi.status_for(Decimal("10")), "green")
        self.assertEqual(kpi.status_for(Decimal("10.4")), "yellow")  # within 10.5
        self.assertEqual(kpi.status_for(Decimal("11")), "red")
