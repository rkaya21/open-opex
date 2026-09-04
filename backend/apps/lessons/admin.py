from django.contrib import admin

from apps.lessons.models import OnePointLesson


@admin.register(OnePointLesson)
class OnePointLessonAdmin(admin.ModelAdmin):
    list_display = ["topic", "category", "trainer", "held_at", "duration_minutes"]
    list_filter = ["category"]
    search_fields = ["topic", "content"]
