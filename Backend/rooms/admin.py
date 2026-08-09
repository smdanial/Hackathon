from django.contrib import admin

from .models import Room, ScheduleEntry


class ScheduleEntryInline(admin.TabularInline):
    model = ScheduleEntry
    extra = 0


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ["room_number", "building", "floor", "capacity"]
    list_filter = ["building", "floor"]
    search_fields = ["room_number", "building"]
    inlines = [ScheduleEntryInline]
