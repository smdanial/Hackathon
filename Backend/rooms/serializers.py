from rest_framework import serializers

from .models import Room, ScheduleEntry

TIME_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


class ScheduleEntrySerializer(serializers.ModelSerializer):
    start_time = serializers.RegexField(TIME_PATTERN)
    end_time = serializers.RegexField(TIME_PATTERN)

    class Meta:
        model = ScheduleEntry
        fields = ["id", "start_time", "end_time", "class_name", "teacher_name"]


class RoomSerializer(serializers.ModelSerializer):
    schedule = ScheduleEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ["id", "building", "floor", "room_number", "capacity", "schedule"]
