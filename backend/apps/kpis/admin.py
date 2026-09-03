from django.contrib import admin

from apps.kpis.models import KPI, KPIMeasurement


class KPIMeasurementInline(admin.TabularInline):
    model = KPIMeasurement
    extra = 0


@admin.register(KPI)
class KPIAdmin(admin.ModelAdmin):
    list_display = ["name", "unit", "direction", "frequency", "process", "target", "is_active"]
    list_filter = ["direction", "frequency", "is_active"]
    search_fields = ["name"]
    inlines = [KPIMeasurementInline]
