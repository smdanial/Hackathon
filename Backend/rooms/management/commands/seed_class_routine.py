"""Seed the real class routine into the Room Finder.

Replaces the placeholder mock schedules for the four routine rooms with the
actual CSE Level 1 Term 1 Section A timetable (lectures in Room 204, labs in
AC-109 / AC-217 / AC-126). Idempotent: re-running never creates duplicate
rows — each entry is keyed on room + day + start_time + end_time.

More routines can be added later the same way: extend ``ROOM_MAP`` (if the
room doesn't exist yet) and append to ``ROUTINE``.

Usage: python manage.py seed_class_routine
"""

from django.core.management.base import BaseCommand

from rooms.models import Room, ScheduleEntry

# Room code -> where it lives. ``capacity`` isn't part of the routine data,
# so these are sensible defaults matching the rooms around them.
ROOM_MAP = {
    "204": {
        "building": "Academic Building 1",
        "floor": 2,
        "capacity": 60,
    },
    "AC-109": {
        "building": "Academic Building 1",
        "floor": 1,
        "capacity": 30,
    },
    "AC-217": {
        "building": "Academic Building 2",
        "floor": 2,
        "capacity": 40,
    },
    "AC-126": {
        "building": "Academic Building 1",
        "floor": 1,
        "capacity": 30,
    },
}


def routine(room, day, start_time, end_time, course_code, class_name, teacher_name, section=""):
    """One recurring class slot. Lectures carry section \"A\"; labs split into
    A1/A2 subgroups at different times, so the two never clash."""
    return {
        "room_code": room,
        "day": day,
        "start_time": start_time,
        "end_time": end_time,
        "course_code": course_code,
        "class_name": class_name,
        "teacher_name": teacher_name,
        "section": section,
    }


# CSE Level 1 Term 1 Section A — weekly recurring slots (date=None).
ROUTINE = [
    # ---- Room 204 (lectures) ----
    routine("204", "mon", "10:30", "11:45", "CHE-1104", "Chemistry", "Anowara Khatun", "A"),
    routine("204", "tue", "10:30", "11:45", "CHE-1104", "Chemistry", "Anowara Khatun", "A"),
    routine("204", "mon", "09:15", "10:30", "CSE-1102", "Discrete Mathematics", "Umme Sara", "A"),
    routine("204", "wed", "09:15", "10:30", "CSE-1102", "Discrete Mathematics", "Umme Sara", "A"),
    routine(
        "204",
        "tue",
        "11:45",
        "13:00",
        "CSE-1101",
        "Fundamentals of Computers and Computing",
        "Shakila Shafiq",
        "A",
    ),
    routine(
        "204",
        "wed",
        "10:30",
        "11:45",
        "CSE-1101",
        "Fundamentals of Computers and Computing",
        "Shakila Shafiq",
        "A",
    ),
    routine("204", "mon", "11:45", "13:00", "EEE-1103", "Electrical Circuits", "Ihtesham Ibn Malek", "A"),
    routine("204", "thu", "09:15", "10:30", "EEE-1103", "Electrical Circuits", "Ihtesham Ibn Malek", "A"),
    routine(
        "204",
        "thu",
        "11:45",
        "13:00",
        "MATH-1105",
        "Differential and Integral Calculus",
        "Afsana Akter Sheefa",
        "A",
    ),
    routine(
        "204",
        "wed",
        "13:30",
        "14:45",
        "MATH-1105",
        "Differential and Integral Calculus",
        "Afsana Akter Sheefa",
        "A",
    ),
    routine(
        "204",
        "wed",
        "11:45",
        "13:00",
        "SS-1106",
        "Government and Public Administration",
        "Sharmin Sultana",
        "A",
    ),
    routine(
        "204",
        "thu",
        "10:30",
        "11:45",
        "SS-1106",
        "Government and Public Administration",
        "Kamrun Nahar",
        "A",
    ),
    # ---- Room AC-109 (Chemistry Lab) ----
    routine("AC-109", "sun", "13:30", "16:00", "CHE-1114", "Chemistry Lab", "Anowara Khatun", "A1"),
    routine("AC-109", "thu", "13:30", "16:00", "CHE-1114", "Chemistry Lab", "Mst. Farzina Akter", "A2"),
    # ---- Room AC-217 (CSE Lab) ----
    routine(
        "AC-217",
        "thu",
        "13:30",
        "16:00",
        "CSE-1111",
        "Fundamentals of Computers and Computing Lab",
        "Shakila Shafiq",
        "A1",
    ),
    routine(
        "AC-217",
        "tue",
        "08:00",
        "10:30",
        "CSE-1111",
        "Fundamentals of Computers and Computing Lab",
        "Sadia Sazzad",
        "A2",
    ),
    # ---- Room AC-126 (EEE Lab) ----
    routine("AC-126", "tue", "08:00", "10:30", "EEE-1113", "Electrical Circuits Lab", "Md. Musfikur Rahman", "A1"),
    routine("AC-126", "sun", "10:30", "13:00", "EEE-1113", "Electrical Circuits Lab", "Md. Tuhin Zahan", "A2"),
]


class Command(BaseCommand):
    help = "Seed the real class routine into the Room Finder (idempotent)."

    def handle(self, *args, **options):
        created_rooms = 0
        created_entries = 0
        for code, meta in ROOM_MAP.items():
            room, created = Room.objects.get_or_create(
                building=meta["building"],
                floor=meta["floor"],
                room_number=code,
                defaults={"capacity": meta["capacity"]},
            )
            if created:
                created_rooms += 1

        for item in ROUTINE:
            room = Room.objects.get(
                building=ROOM_MAP[item["room_code"]]["building"],
                floor=ROOM_MAP[item["room_code"]]["floor"],
                room_number=item["room_code"],
            )
            _, created = ScheduleEntry.objects.get_or_create(
                room=room,
                day=item["day"],
                start_time=item["start_time"],
                end_time=item["end_time"],
                defaults={
                    "course_code": item["course_code"],
                    "section": item["section"],
                    "class_name": item["class_name"],
                    "teacher_name": item["teacher_name"],
                },
            )
            if created:
                created_entries += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_entries} new routine entries "
                f"({created_rooms} new rooms); "
                f"{ScheduleEntry.objects.count()} schedule entries total."
            )
        )
