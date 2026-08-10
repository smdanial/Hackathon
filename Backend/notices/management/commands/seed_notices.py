from django.core.management.base import BaseCommand

from accounts.models import Student
from notices.models import Notice

# Starter notices mirroring the frontend's original demo data. Re-running the
# seed only adds missing titles — it never touches existing rows.
SEED_NOTICES = [
    # ---- Class notices ----
    {
        "category": "class",
        "title": "Midterm syllabus trimmed for CSE-301",
        "body": (
            "The course teacher has trimmed Unit 5 (Graph Algorithms) from the "
            "CSE-301 midterm syllabus. The exam will now cover Units 1-4 only. "
            "Updated slides are on the class portal."
        ),
    },
    {
        "category": "class",
        "title": "Friday's DBMS class moved to Lab 3",
        "body": (
            "Tomorrow's Database Management Systems lecture (CSE-305) will be "
            "held in Lab 3 instead of Room 204. Same time, 11:00 AM - 12:30 PM."
        ),
    },
    {
        "category": "class",
        "title": "Attendance makeup form for July 31",
        "body": (
            "Students absent on July 31 can submit a makeup form at the "
            "department office by Thursday. Bring a signed note from your "
            "guardian or a doctor's prescription as applicable."
        ),
    },
    # ---- Club notices ----
    {
        "category": "club",
        "title": "Inter-department programming contest",
        "body": (
            "Registrations are open for the annual inter-department programming "
            "contest. Team of three, free food and certificates for all "
            "participants. Register at the club booth or the online form."
        ),
    },
    {
        "category": "club",
        "title": "Cultural fest audition call",
        "body": (
            "Auditions for the NITER cultural fest run all week in the "
            "auditorium. Singing, dance, drama and band slots are up for grabs. "
            "Bring your own instrument if needed."
        ),
    },
    {
        "category": "club",
        "title": "Robotics club weekly meetup",
        "body": (
            "This week's meetup is on the line-follower bot chassis. Bring your "
            "kits - we'll assemble and test on the track in the robotics lab."
        ),
    },
    # ---- Lab notices ----
    {
        "category": "lab",
        "title": "Physics lab report deadline",
        "body": (
            "The Experiment 4 (Vernier Callipers) report must be submitted to "
            "the physics lab assistant by Sunday. Late submissions lose 5 marks "
            "per day."
        ),
    },
    {
        "category": "lab",
        "title": "Lab Group B shifted to Lab 2",
        "body": (
            "From next week, Lab Group B's Digital Electronics sessions will "
            "take place in Lab 2 (ground floor) instead of Lab 5. Timetable is "
            "on the lab noticeboard."
        ),
    },
    {
        "category": "lab",
        "title": "Chemistry lab safety orientation",
        "body": (
            "Mandatory safety orientation for all first-time chemistry lab "
            "students this Friday, 3:00 PM, in the chemistry lab. Attendance "
            "will be recorded."
        ),
    },
    # ---- EMS notices ----
    {
        "category": "ems",
        "title": "Midterm exam schedule released",
        "body": (
            "The midterm exam schedule is now live on the Exam Management "
            "System. Download your individual seat plan and checklist before "
            "the exam week begins."
        ),
    },
    {
        "category": "ems",
        "title": "Seat plan released for CSE-301",
        "body": (
            "Seat plans for the CSE-301 midterm have been published. Check your "
            "roll number against the venue map in the EMS portal before exam day."
        ),
    },
    {
        "category": "ems",
        "title": "MATH-203 exam moved to August 20",
        "body": (
            "The MATH-203 (Linear Algebra) midterm has been rescheduled to "
            "August 20, 2:00 PM. The conflict with the lab viva has been "
            "resolved - the updated schedule is on EMS."
        ),
    },
]


class Command(BaseCommand):
    help = "Seed starter notices (dev data)."

    def handle(self, *args, **options):
        # Attach seeds to the first CR so class/lab notices are editable in
        # the UI demo; falls back to no owner when no CR exists yet.
        student = Student.objects.filter(is_cr=True).first()
        # Class/lab notices are department-scoped — seed them to the CR's
        # department (club/EMS stay campus-wide).
        department = student.department if student else ""
        created = 0
        for item in SEED_NOTICES:
            is_scoped = item["category"] in ("class", "lab")
            _, was_created = Notice.objects.get_or_create(
                title=item["title"],
                defaults={
                    "category": item["category"],
                    "body": item["body"],
                    "department": department if is_scoped else "",
                    "posted_by": student,
                },
            )
            created += 1 if was_created else 0
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new notices."))
