from django.contrib import admin

from apps.meetings.models import AsakaiItem, AsakaiMeeting


class AsakaiItemInline(admin.TabularInline):
    model = AsakaiItem
    extra = 0


@admin.register(AsakaiMeeting)
class AsakaiMeetingAdmin(admin.ModelAdmin):
    list_display = ["title", "area", "held_at", "participant_count", "created_by"]
    list_filter = ["area"]
    search_fields = ["title"]
    inlines = [AsakaiItemInline]
