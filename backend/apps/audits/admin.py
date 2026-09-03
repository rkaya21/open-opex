from django.contrib import admin

from apps.audits.models import Area, Audit, ChecklistItem, ChecklistTemplate, Finding


class ChecklistItemInline(admin.TabularInline):
    model = ChecklistItem
    extra = 0


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "responsible", "is_active"]
    search_fields = ["code", "name"]


@admin.register(ChecklistTemplate)
class ChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active"]
    inlines = [ChecklistItemInline]


@admin.register(Audit)
class AuditAdmin(admin.ModelAdmin):
    list_display = ["template", "area", "auditor", "scheduled_date", "status", "score_percent"]
    list_filter = ["status"]


@admin.register(Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ["title", "area", "status", "created_by", "created_at"]
    list_filter = ["status"]
