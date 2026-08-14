"""Tests for the room finder's real class routine seed and API fields."""

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Room, ScheduleEntry


def _overlaps(entry, start_time, end_time):
    """True when ``entry`` covers any part of the given 24-hour window."""
    return entry.start_time < end_time and entry.end_time > start_time


class SeedClassRoutineTests(TestCase):
    """The real CSE L1T1 Section A routine: rooms, entries, idempotency."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_class_routine", verbosity=0)

    def test_routine_rooms_created_with_correct_location(self):
        expected = {
            "204": ("Academic Building 1", 2, 60),
            "AC-109": ("Academic Building 1", 1, 30),
            "AC-217": ("Academic Building 2", 2, 40),
            "AC-126": ("Academic Building 1", 1, 30),
        }
        for code, (building, floor, capacity) in expected.items():
            room = Room.objects.get(room_number=code)
            self.assertEqual(room.building, building)
            self.assertEqual(room.floor, floor)
            self.assertEqual(room.capacity, capacity)

    def test_all_routine_entries_seeded(self):
        self.assertEqual(
            ScheduleEntry.objects.filter(
                room__room_number__in=["204", "AC-109", "AC-217", "AC-126"]
            ).count(),
            18,
        )

    def test_seed_is_idempotent(self):
        before = ScheduleEntry.objects.count()
        rooms_before = Room.objects.count()
        call_command("seed_class_routine", verbosity=0)
        self.assertEqual(ScheduleEntry.objects.count(), before)
        self.assertEqual(Room.objects.count(), rooms_before)

    def test_known_occupied_slot_monday_morning(self):
        # Room 204, Monday 10:30–11:45 -> CHE-1104 Chemistry (Anowara Khatun).
        room = Room.objects.get(room_number="204")
        entry = room.schedule.get(day="mon", start_time="10:30", end_time="11:45")
        self.assertEqual(entry.course_code, "CHE-1104")
        self.assertEqual(entry.class_name, "Chemistry")
        self.assertEqual(entry.teacher_name, "Anowara Khatun")
        self.assertEqual(entry.section, "A")
        self.assertIsNone(entry.date)

    def test_known_free_slot_monday_early(self):
        # Room 204, Monday 08:00–09:15 — nothing runs before 09:15.
        room = Room.objects.get(room_number="204")
        monday = room.schedule.filter(day="mon")
        self.assertFalse(
            any(_overlaps(e, "08:00", "09:15") for e in monday),
            "Room 204 Monday 08:00–09:15 should be free",
        )

    def test_lab_sections_are_seeded(self):
        # Both lab subgroups exist with their own section labels.
        ac217 = Room.objects.get(room_number="AC-217")
        self.assertEqual(ac217.schedule.get(day="thu").section, "A1")
        self.assertEqual(ac217.schedule.get(day="tue").section, "A2")
        self.assertEqual(ac217.schedule.get(day="thu").course_code, "CSE-1111")


class RoutineApiTests(APITestCase):
    """The rooms API exposes the routine's day/course/section fields."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_class_routine", verbosity=0)

    def test_room_serializer_includes_routine_fields(self):
        res = self.client.get("/api/rooms/")
        self.assertEqual(res.status_code, 200)
        room204 = next(r for r in res.data if r["room_number"] == "204")
        mon_che = next(
            e
            for e in room204["schedule"]
            if e["day"] == "mon" and e["start_time"] == "10:30"
        )
        self.assertEqual(mon_che["course_code"], "CHE-1104")
        self.assertEqual(mon_che["class_name"], "Chemistry")
        self.assertEqual(mon_che["teacher_name"], "Anowara Khatun")
        self.assertEqual(mon_che["section"], "A")
        self.assertIsNone(mon_che["date"])


class BookingWindowTests(APITestCase):
    """Bookings must fit inside the 08:00–16:00 academic day."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_class_routine", verbosity=0)
        from django.contrib.auth import get_user_model
        from rest_framework.authtoken.models import Token

        Student = get_user_model()
        cls.cr = Student(
            email="cr@test.edu",
            full_name="CR User",
            student_id="CR-1",
            department="CSE",
            is_cr=True,
        )
        cls.cr.set_password("hackathon123")
        cls.cr.save()
        cls.token = f"Token {Token.objects.create(user=cls.cr).key}"

    def _book(self, start, end):
        room = Room.objects.get(room_number="204")
        return self.client.post(
            "/api/rooms/bookings/",
            {
                "room": room.id,
                "date": "2026-08-17",  # a Monday in the future
                "class_type": "regular",
                "department": "CSE",
                "class_name": "Test Class",
                "start_time": start,
                "end_time": end,
            },
            format="json",
            HTTP_AUTHORIZATION=self.token,
        )

    def test_evening_booking_rejected(self):
        res = self._book("17:00", "18:00")
        self.assertEqual(res.status_code, 400)
        self.assertIn("08:00 AM", str(res.data))

    def test_before_8am_booking_rejected(self):
        res = self._book("07:00", "08:00")
        self.assertEqual(res.status_code, 400)

    def test_booking_within_window_accepted(self):
        res = self._book("10:00", "11:00")
        self.assertEqual(res.status_code, 201)
