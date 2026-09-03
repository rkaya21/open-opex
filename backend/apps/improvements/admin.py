from django.contrib import admin

from apps.improvements.models import ImprovementProject, Suggestion


@admin.register(Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ["title", "submitted_by", "process", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["title", "description"]


@admin.register(ImprovementProject)
class ImprovementProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "lead", "process", "kpi", "phase", "created_at"]
    list_filter = ["phase"]
    search_fields = ["title"]
