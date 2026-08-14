from datetime import date as date_cls

from django.conf import settings
from django.db import models


class Room(models.Model):
    """A campus classroom or lab, identified by building + floor + number."""

    building = models.CharField(max_length=100)
    floor = models.PositiveSmallIntegerField()
    room_number = models.CharField(max_length=50)
    capacity = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["building", "floor", "room_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["building", "floor", "room_number"],
                name="unique_room",
            )
        ]

    def __str__(self):
        return f"{self.room_number} — {self.building}"


class ScheduleEntry(models.Model):
    """One booking in a room's daily schedule.

    Times are 24-hour "HH:MM" strings (e.g. "09:00") — the exact shape the
    frontend's status derivation expects.
    """

    # Weekday this recurring entry applies to ("mon", "tue", …). Null means
    # the entry repeats every day — the legacy seeded schedule and student
    # bookings (which pin a specific date instead).
    DAY_CHOICES = [
        ("sun", "Sunday"),
        ("mon", "Monday"),
        ("tue", "Tuesday"),
        ("wed", "Wednesday"),
        ("thu", "Thursday"),
        ("fri", "Friday"),
        ("sat", "Saturday"),
    ]
    day = models.CharField(
        max_length=3, choices=DAY_CHOICES, null=True, blank=True
    )
    room = models.ForeignKey(
        Room, related_name="schedule", on_delete=models.CASCADE
    )
    # When set, this entry exists only on that date (created by a student
    # booking). When null, the entry repeats on its weekday (or every day
    # when ``day`` is also null — the original seeded schedule).
    date = models.DateField(null=True, blank=True)
    start_time = models.CharField(max_length=5)
    end_time = models.CharField(max_length=5)
    # The course code (e.g. "CHE-1104") and, when the class has subgroups,
    # the section (e.g. "A1"/"A2"). Student bookings leave both blank.
    course_code = models.CharField(max_length=20, blank=True, default="")
    section = models.CharField(max_length=10, blank=True, default="")
    class_name = models.CharField(max_length=100)
    teacher_name = models.CharField(max_length=100)
    # Present when this entry was created by a student room booking. Deleting
    # the booking removes the entry, so the room's schedule returns to its
    # original state once the class time has passed.
    booking = models.OneToOneField(
        "RoomBooking",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="schedule_entry",
    )

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.class_name} {self.start_time}–{self.end_time}"


class RoomBooking(models.Model):
    """A student's booking request for a room.

    Students pick a class type (regular / reschedule), their department, and
    the class name; the booking is attached to the room and the student who
    made it. A student can hold at most one active booking per room.
    """

    CLASS_TYPE_REGULAR = "regular"
    CLASS_TYPE_RESCHEDULE = "reschedule"
    CLASS_TYPE_CHOICES = [
        (CLASS_TYPE_REGULAR, "Regular class"),
        (CLASS_TYPE_RESCHEDULE, "Reschedule class"),
    ]

    DEPARTMENT_CHOICES = [
        ("CSE", "CSE"),
        ("EEE", "EEE"),
        ("TE", "TE"),
        ("IPE", "IPE"),
        ("FDAE", "FDAE"),
    ]

    room = models.ForeignKey(
        Room, related_name="bookings", on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="room_bookings",
        on_delete=models.CASCADE,
    )
    class_type = models.CharField(max_length=20, choices=CLASS_TYPE_CHOICES)
    department = models.CharField(max_length=10, choices=DEPARTMENT_CHOICES)
    class_name = models.CharField(max_length=100)
    # The day of the class. A booking is date + window: "08:00–11:00" on a
    # past date is meaningless, and a morning slot picked in the afternoon
    # refers to a future day. Defaults are only a migration convenience — the
    # serializer requires the field.
    date = models.DateField(default=date_cls.today)
    # The booked time window (24-hour "HH:MM", same shape as ScheduleEntry).
    # Defaults are only a migration convenience — the serializer requires them.
    start_time = models.CharField(max_length=5, default="")
    end_time = models.CharField(max_length=5, default="")
    booked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-booked_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["room", "student"], name="unique_room_booking"
            )
        ]

    def __str__(self):
        return f"{self.class_name} {self.start_time}–{self.end_time} — {self.room} ({self.student})"


def expire_past_bookings():
    """Delete bookings whose class time has already passed.

    Their schedule entries go with them (OneToOne cascade), so the room's
    schedule returns to its original state and the slot is bookable again.
    A booking on an earlier date, or a slot on today whose end time has
    passed, is expired.
    """

    from django.utils import timezone

    now = timezone.localtime()  # Campus wall clock (Asia/Dhaka).
    today = now.date()
    # All bookings on past days, plus today's that have already ended.
    expired = RoomBooking.objects.filter(date__lt=today)
    expired |= RoomBooking.objects.filter(
        date=today, end_time__lte=now.strftime("%H:%M")
    )
    expired.delete()
