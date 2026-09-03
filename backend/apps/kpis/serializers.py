from rest_framework import serializers

from apps.kpis.models import KPI, KPIMeasurement

TREND_LENGTH = 12


class KPIMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = KPIMeasurement
        fields = ["id", "period", "value", "note", "created_by", "updated_at"]
        read_only_fields = ["id", "created_by", "updated_at"]


class MeasurementUpsertSerializer(serializers.Serializer):
    """One item of the idempotent bulk ingest payload."""

    period = serializers.DateField()
    value = serializers.DecimalField(max_digits=14, decimal_places=2)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class KPISerializer(serializers.ModelSerializer):
    process_code = serializers.CharField(source="process.code", read_only=True)
    latest_value = serializers.SerializerMethodField()
    latest_period = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    trend = serializers.SerializerMethodField()

    class Meta:
        model = KPI
        fields = [
            "id",
            "name",
            "description",
            "unit",
            "direction",
            "frequency",
            "process",
            "process_code",
            "owner",
            "target",
            "tolerance_percent",
            "is_active",
            "latest_value",
            "latest_period",
            "status",
            "trend",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _latest(self, obj: KPI) -> KPIMeasurement | None:
        # Uses the prefetched, period-ordered measurements when available.
        measurements = list(obj.measurements.all())
        return measurements[-1] if measurements else None

    def get_latest_value(self, obj: KPI) -> str | None:
        latest = self._latest(obj)
        return str(latest.value) if latest else None

    def get_latest_period(self, obj: KPI) -> str | None:
        latest = self._latest(obj)
        return latest.period.isoformat() if latest else None

    def get_status(self, obj: KPI) -> str:
        latest = self._latest(obj)
        return obj.status_for(latest.value if latest else None)

    def get_trend(self, obj: KPI) -> list[dict]:
        measurements = list(obj.measurements.all())[-TREND_LENGTH:]
        return [
            {"period": m.period.isoformat(), "value": str(m.value)} for m in measurements
        ]
