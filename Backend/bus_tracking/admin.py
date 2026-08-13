from django.contrib import admin

from .models import BusLocation


@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    list_display = ["route", "latitude", "longitude", "is_active", "last_updated"]
    list_editable = ["is_active"]
    list_filter = ["is_active", "route"]
    search_fields = ["route"]
