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

    room = models.ForeignKey(
        Room, related_name="schedule", on_delete=models.CASCADE
    )
    start_time = models.CharField(max_length=5)
    end_time = models.CharField(max_length=5)
    class_name = models.CharField(max_length=100)
    teacher_name = models.CharField(max_length=100)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.class_name} {self.start_time}–{self.end_time}"
