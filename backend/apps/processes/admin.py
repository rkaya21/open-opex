from django.contrib import admin

from apps.processes.models import Process


@admin.register(Process)
class ProcessAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "parent", "owner", "status", "version"]
    list_filter = ["status"]
    search_fields = ["code", "name"]
