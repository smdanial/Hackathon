from django.contrib import admin

from .models import FoundItem


@admin.register(FoundItem)
class FoundItemAdmin(admin.ModelAdmin):
    list_display = ["item_name", "category", "finder_name", "date_posted"]
    list_filter = ["category", "date_posted"]
    search_fields = ["item_name", "description", "finder_name", "finder_phone"]
