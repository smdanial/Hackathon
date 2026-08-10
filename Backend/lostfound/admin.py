from django.contrib import admin

from .models import FoundItem


@admin.register(FoundItem)
class FoundItemAdmin(admin.ModelAdmin):
    list_display = [
        "item_name",
        "category",
        "finder_name",
        "date_posted",
        "reported_by",
        "is_received",
        "received_at",
    ]
    list_filter = ["category", "date_posted", "is_received"]
    search_fields = ["item_name", "description", "finder_name", "finder_phone"]
