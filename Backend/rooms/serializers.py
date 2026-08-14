from rest_framework import serializers

from .models import Room, RoomBooking, ScheduleEntry

TIME_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


class ScheduleEntrySerializer(serializers.ModelSerializer):
    start_time = serializers.RegexField(TIME_PATTERN)
    end_time = serializers.RegexField(TIME_PATTERN)

    class Meta:
        model = ScheduleEntry
        fields = [
            "id",
            "day",
            "date",
            "start_time",
            "end_time",
            "course_code",
            "section",
            "class_name",
            "teacher_name",
        ]


class RoomBookingSummarySerializer(serializers.ModelSerializer):
    """Public view of a room's active bookings (who booked what, and when)."""

    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = RoomBooking
        fields = [
            "id",
            "date",
            "class_type",
            "department",
            "class_name",
            "start_time",
            "end_time",
            "student_name",
        ]


class RoomSerializer(serializers.ModelSerializer):
    schedule = ScheduleEntrySerializer(many=True, read_only=True)
    bookings = RoomBookingSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "building",
            "floor",
            "room_number",
            "capacity",
            "schedule",
            "bookings",
        ]


class RoomBookingSerializer(serializers.ModelSerializer):
    """A student's time-slot booking for a room.

    ``student`` is set from the authenticated user (never taken from the
    payload). Creating a booking also adds a ScheduleEntry for the window, so
    everyone sees the room as occupied; the entry disappears with the booking.
    """

    student = serializers.HiddenField(default=serializers.CurrentUserDefault())
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())
    date = serializers.DateField()
    start_time = serializers.RegexField(TIME_PATTERN)
    end_time = serializers.RegexField(TIME_PATTERN)

    class Meta:
        model = RoomBooking
        fields = [
            "id",
            "room",
            "student",
            "date",
            "class_type",
            "department",
            "class_name",
            "start_time",
            "end_time",
            "booked_at",
        ]
        read_only_fields = ["id", "booked_at"]
        # Disable the auto UniqueTogetherValidator so our friendly message in
        # validate() wins; the DB constraint still guards against races.
        validators = []

    def validate(self, attrs):
        from datetime import datetime, time as dtime

        from django.utils import timezone

        room = attrs.get("room")
        student = attrs.get("student")
        day = attrs.get("date")
        start = attrs.get("start_time")
        end = attrs.get("end_time")

        if start and end and start >= end:
            raise serializers.ValidationError(
                {"end_time": "End time must be after the start time."}
            )

        # Classes only run inside the academic day (08:00–16:00). A booking
        # outside that window would be invisible in the Room Finder, so reject
        # it here rather than let a CR book an unseen evening class.
        if start and end and (start < "08:00" or end > "16:00"):
            raise serializers.ValidationError(
                {
                    "start_time": (
                        "Classes run between 08:00 AM and 04:00 PM only."
                    )
                }
            )

        # The class (date + end time) must be in the future. Students pick
        # times in the campus wall clock (Asia/Dhaka), so compare against the
        # Dhaka time — never the container's UTC clock.
        if day and end:
            hours, minutes = (int(part) for part in end.split(":"))
            end_dt = datetime.combine(day, dtime(hours, minutes))
            now_local = timezone.localtime().replace(tzinfo=None)
            if end_dt <= now_local:
                raise serializers.ValidationError(
                    {"end_time": "End time must be in the future."}
                )

        if (
            room
            and student
            and RoomBooking.objects.filter(room=room, student=student).exists()
        ):
            raise serializers.ValidationError(
                {
                    "room": (
                        "You already have a booking for this room. "
                        "Cancel it first to book again."
                    )
                }
            )

        # No two active bookings may overlap on the same room, same day.
        if room and day and start and end:
            clash = (
                RoomBooking.objects.filter(room=room, date=day)
                .exclude(student=student)
                .filter(start_time__lt=end, end_time__gt=start)
                .first()
            )
            if clash:
                raise serializers.ValidationError(
                    {
                        "start_time": (
                            f"This room is already booked {clash.start_time}–"
                            f"{clash.end_time} on {clash.date}."
                        )
                    }
                )
        return attrs

    def create(self, validated_data):
        booking = RoomBooking.objects.create(**validated_data)
        # Make the booked window visible in the room's schedule on that date so
        # every student sees the room as occupied during that time. The entry
        # carries the booking's date; deleting the booking removes it.
        ScheduleEntry.objects.create(
            room=booking.room,
            date=booking.date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            class_name=booking.class_name,
            teacher_name=f"Booked by {booking.student.full_name}",
            booking=booking,
        )
        return booking
