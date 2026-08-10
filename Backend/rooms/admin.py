from django.contrib import admin

from .models import Room, RoomBooking, ScheduleEntry


class ScheduleEntryInline(admin.TabularInline):
    model = ScheduleEntry
    extra = 0


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ["room_number", "building", "floor", "capacity"]
    list_filter = ["building", "floor"]
    search_fields = ["room_number", "building"]
    inlines = [ScheduleEntryInline]


@admin.register(RoomBooking)
class RoomBookingAdmin(admin.ModelAdmin):
    list_display = ["room", "student", "class_type", "department", "class_name", "start_time", "end_time", "booked_at"]
    list_filter = ["class_type", "department", "room__building"]
    search_fields = ["student__full_name", "student__student_id", "class_name", "room__room_number"]
    autocomplete_fields = ["student"]
