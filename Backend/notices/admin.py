from django.contrib import admin

from .models import Notice


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "posted_by", "created_at", "updated_at"]
    list_filter = ["category"]
    search_fields = ["title", "body"]
