"""Seed the room database with the campus room list and schedules.

The data mirrors the frontend's original mock (`Frontend/lib/mockRooms.ts`)
so the Room Finder looks identical once connected to the API. Idempotent:
re-running replaces each room's schedule instead of duplicating it.

Usage: python manage.py seed_rooms
"""

from django.core.management.base import BaseCommand

from rooms.models import Room, ScheduleEntry


def entry(start_time, end_time, class_name, teacher_name):
    return {
        "start_time": start_time,
        "end_time": end_time,
        "class_name": class_name,
        "teacher_name": teacher_name,
    }


ROOMS = [
    # ---- Academic Building 1 ----
    {
        "building": "Academic Building 1",
        "floor": 1,
        "room_number": "101",
        "capacity": 60,
        "schedule": [
            entry("08:00", "09:30", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("09:45", "11:15", "CSE-305", "Farhana Akter"),
            entry("11:30", "13:00", "MATH-203", "Dr. Mahmuda Khatun"),
            entry("13:15", "14:45", "CSE-311", "Rakibul Hasan"),
            entry("15:00", "16:30", "ENG-102", "Sharmin Sultana"),
            entry("16:45", "18:15", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("18:30", "20:00", "MATH-203", "Dr. Mahmuda Khatun"),
            entry("20:15", "21:45", "CSE-305", "Farhana Akter"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 1,
        "room_number": "102",
        "capacity": 55,
        "schedule": [
            entry("08:00", "09:30", "ENG-101", "Rakibul Hasan"),
            entry("09:45", "11:15", "PHY-101", "Dr. Mahmuda Khatun"),
            entry("11:30", "13:00", "CHE-101", "Dr. Nazmul Islam"),
            entry("13:15", "14:45", "CSE-311", "Rakibul Hasan"),
            entry("15:00", "16:30", "STAT-201", "Farhana Akter"),
            entry("16:45", "18:15", "ENG-103", "Sharmin Sultana"),
            entry("18:30", "20:00", "PHY-101", "Dr. Mahmuda Khatun"),
            entry("20:15", "21:45", "HUM-101", "Rakibul Hasan"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 1,
        "room_number": "103",
        "capacity": 50,
        "schedule": [
            entry("10:00", "11:30", "MATH-101", "Dr. Mahmuda Khatun"),
            entry("14:00", "15:30", "STAT-201", "Farhana Akter"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 2,
        "room_number": "201",
        "capacity": 70,
        "schedule": [
            entry("08:00", "09:30", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("09:45", "11:15", "CSE-305", "Farhana Akter"),
            entry("11:30", "13:00", "MATH-203", "Dr. Mahmuda Khatun"),
            entry("13:15", "14:45", "CSE-311", "Rakibul Hasan"),
            entry("15:00", "16:30", "EEE-211", "Asif Rahman"),
            entry("16:45", "18:15", "ENG-102", "Sharmin Sultana"),
            entry("18:30", "20:00", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("20:15", "21:45", "CSE-311", "Rakibul Hasan"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 2,
        "room_number": "202",
        "capacity": 65,
        "schedule": [
            entry("08:00", "09:30", "EEE-211", "Asif Rahman"),
            entry("09:45", "11:15", "EEE-213", "Asif Rahman"),
            entry("11:30", "13:00", "ENG-101", "Sharmin Sultana"),
            entry("13:15", "14:45", "MATH-203", "Dr. Mahmuda Khatun"),
            entry("15:00", "16:30", "PHY-101", "Dr. Mahmuda Khatun"),
            entry("16:45", "18:15", "EEE-213", "Asif Rahman"),
            entry("18:30", "20:00", "CSE-305", "Farhana Akter"),
            entry("20:15", "21:45", "NITER Programming Club", "Sharmin Sultana"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 2,
        "room_number": "203",
        "capacity": 45,
        "schedule": [
            entry("11:00", "12:30", "ENG-102", "Sharmin Sultana"),
            entry("14:00", "15:30", "HUM-101", "Rakibul Hasan"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 3,
        "room_number": "301",
        "capacity": 80,
        "schedule": [
            entry("08:00", "09:30", "CSE-311", "Rakibul Hasan"),
            entry("09:45", "11:15", "CSE-311", "Rakibul Hasan"),
            entry("11:30", "13:00", "EEE-211", "Asif Rahman"),
            entry("13:15", "14:45", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("15:00", "16:30", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("16:45", "18:15", "MATH-101", "Dr. Mahmuda Khatun"),
            entry("18:30", "20:00", "EEE-213", "Asif Rahman"),
            entry("20:15", "21:45", "ENG-101", "Rakibul Hasan"),
        ],
    },
    {
        "building": "Academic Building 1",
        "floor": 3,
        "room_number": "302",
        "capacity": 40,
        "schedule": [
            entry("09:30", "11:00", "MATH-101", "Dr. Mahmuda Khatun"),
            entry("13:00", "14:30", "HUM-101", "Sharmin Sultana"),
        ],
    },
    # ---- Academic Building 2 ----
    {
        "building": "Academic Building 2",
        "floor": 1,
        "room_number": "101",
        "capacity": 60,
        "schedule": [
            entry("08:00", "09:30", "CSE-305", "Farhana Akter"),
            entry("09:45", "11:15", "CSE-311", "Rakibul Hasan"),
            entry("11:30", "13:00", "ENG-103", "Sharmin Sultana"),
            entry("13:15", "14:45", "MATH-203", "Dr. Mahmuda Khatun"),
            entry("15:00", "16:30", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("16:45", "18:15", "STAT-201", "Farhana Akter"),
            entry("18:30", "20:00", "CSE-305", "Farhana Akter"),
            entry("20:15", "21:45", "CSE-311", "Rakibul Hasan"),
        ],
    },
    {
        "building": "Academic Building 2",
        "floor": 1,
        "room_number": "102",
        "capacity": 55,
        "schedule": [
            entry("10:00", "11:30", "PHY-101", "Dr. Mahmuda Khatun"),
            entry("15:00", "16:30", "MATH-203", "Dr. Mahmuda Khatun"),
        ],
    },
    {
        "building": "Academic Building 2",
        "floor": 2,
        "room_number": "201",
        "capacity": 50,
        "schedule": [
            entry("09:00", "10:30", "CHE-101", "Dr. Nazmul Islam"),
            entry("12:30", "14:00", "STAT-201", "Farhana Akter"),
        ],
    },
    {
        "building": "Academic Building 2",
        "floor": 2,
        "room_number": "202",
        "capacity": 60,
        "schedule": [
            entry("08:00", "09:30", "ENG-102", "Sharmin Sultana"),
            entry("09:45", "11:15", "EEE-213", "Asif Rahman"),
            entry("11:30", "13:00", "CSE-301", "Dr. Tanvir Ahmed"),
            entry("13:15", "14:45", "PHY-101", "Dr. Mahmuda Khatun"),
            entry("15:00", "16:30", "CSE-305", "Farhana Akter"),
            entry("16:45", "18:15", "ENG-103", "Sharmin Sultana"),
            entry("18:30", "20:00", "MATH-203", "Dr. Mahmuda Khatun"),
            entry("20:15", "21:45", "HUM-101", "Rakibul Hasan"),
        ],
    },
    {
        "building": "Academic Building 2",
        "floor": 1,
        "room_number": "IT Lab 1",
        "capacity": 40,
        "schedule": [
            entry("08:00", "10:00", "CSE-311 Lab", "Asif Rahman"),
            entry("10:15", "12:15", "CSE-305 Lab", "Farhana Akter"),
            entry("12:30", "14:30", "CSE-301 Lab", "Dr. Tanvir Ahmed"),
            entry("14:45", "16:45", "CSE-311 Lab", "Asif Rahman"),
            entry("17:00", "19:00", "CSE-305 Lab", "Farhana Akter"),
            entry("19:15", "21:15", "NITER Programming Club", "Sharmin Sultana"),
        ],
    },
    {
        "building": "Academic Building 2",
        "floor": 1,
        "room_number": "IT Lab 2",
        "capacity": 35,
        "schedule": [
            entry("08:00", "10:00", "CSE-305 Lab", "Farhana Akter"),
            entry("10:15", "12:15", "CSE-311 Lab", "Asif Rahman"),
            entry("12:30", "14:30", "CSE-301 Lab", "Dr. Tanvir Ahmed"),
            entry("14:45", "16:45", "CSE-305 Lab", "Farhana Akter"),
            entry("17:00", "19:00", "CSE-311 Lab", "Asif Rahman"),
            entry("19:15", "21:15", "IT Club Open Lab", "Sharmin Sultana"),
        ],
    },
    # ---- Yan Shet ----
    {
        "building": "Yan Shet",
        "floor": 1,
        "room_number": "Chemistry Lab 1",
        "capacity": 30,
        "schedule": [
            entry("09:00", "10:30", "CHE-101 Lab", "Dr. Nazmul Islam"),
            entry("11:00", "12:30", "CHE-101 Lab", "Dr. Nazmul Islam"),
        ],
    },
    {
        "building": "Yan Shet",
        "floor": 1,
        "room_number": "Physics Lab 2",
        "capacity": 30,
        "schedule": [
            entry("10:30", "12:30", "PHY-101 Lab", "Dr. Mahmuda Khatun"),
            entry("14:00", "16:00", "PHY-101 Lab", "Dr. Mahmuda Khatun"),
        ],
    },
    {
        "building": "Yan Shet",
        "floor": 2,
        "room_number": "Seminar Room",
        "capacity": 120,
        "schedule": [
            entry("10:00", "12:00", "CSE-301 Makeup Lecture", "Dr. Tanvir Ahmed"),
        ],
    },
    {
        "building": "Yan Shet",
        "floor": 2,
        "room_number": "Multimedia Room",
        "capacity": 45,
        "schedule": [
            entry("09:30", "11:00", "ENG-101", "Sharmin Sultana"),
            entry("14:00", "15:30", "CSE-305", "Farhana Akter"),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed rooms and schedules (idempotent; mirrors the frontend mock)."

    def handle(self, *args, **options):
        created_rooms = 0
        for data in ROOMS:
            # Copy so we never mutate the module-level ROOMS list.
            data = dict(data)
            schedule = data.pop("schedule")
            room, created = Room.objects.get_or_create(
                building=data["building"],
                floor=data["floor"],
                room_number=data["room_number"],
                defaults=data,
            )
            if created:
                created_rooms += 1
            # Replace the seeded schedule so re-seeding reflects edits to this
            # file — but keep entries created by student bookings (they are
            # linked to RoomBooking and disappear when the booking ends).
            room.schedule.filter(booking__isnull=True).delete()
            ScheduleEntry.objects.bulk_create(
                ScheduleEntry(room=room, **item) for item in schedule
            )

        total = Room.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_rooms} new rooms; {total} rooms total, "
                f"{ScheduleEntry.objects.count()} schedule entries."
            )
        )
