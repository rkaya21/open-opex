from django.contrib import admin

from apps.actions.models import Action


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ["title", "assignee", "due_date", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["title"]
