from django.contrib import admin

from apps.beforeafter.models import BeforeAfterForm, BeforeAfterPhoto


class BeforeAfterPhotoInline(admin.TabularInline):
    model = BeforeAfterPhoto
    extra = 0


@admin.register(BeforeAfterForm)
class BeforeAfterFormAdmin(admin.ModelAdmin):
    list_display = ["id", "category", "start_date", "created_by", "created_at"]
    list_filter = ["category", "gain_continuity"]
    search_fields = ["problem"]
    inlines = [BeforeAfterPhotoInline]
