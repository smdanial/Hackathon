"""Create a superuser from ADMIN_* environment variables.

Render's free tier has no shell access, so ``createsuperuser`` can't be run
interactively against the live database. This command is invoked from
``build.sh`` on every deploy and creates the admin account described by the
ADMIN_* environment variables — or leaves it alone if it already exists, so
re-running it on every deploy is safe (idempotent).
"""

import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import Student


class Command(BaseCommand):
    help = (
        "Create a superuser from ADMIN_EMAIL / ADMIN_PASSWORD / "
        "ADMIN_FULL_NAME / ADMIN_STUDENT_ID (idempotent)."
    )

    def handle(self, *args, **options):
        email = (os.environ.get("ADMIN_EMAIL") or "").strip()
        password = os.environ.get("ADMIN_PASSWORD") or ""
        full_name = (os.environ.get("ADMIN_FULL_NAME") or "").strip()
        student_id = (os.environ.get("ADMIN_STUDENT_ID") or "").strip()

        missing = [
            name
            for name, value in (
                ("ADMIN_EMAIL", email),
                ("ADMIN_PASSWORD", password),
                ("ADMIN_FULL_NAME", full_name),
                ("ADMIN_STUDENT_ID", student_id),
            )
            if not value
        ]
        if missing:
            raise CommandError(
                "Missing required env var(s) for create_admin: "
                + ", ".join(missing)
            )

        # Idempotent: email is unique on the model, so a matching account is
        # never recreated or overwritten across deploys.
        if Student.objects.filter(email__iexact=email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f"Superuser {email} already exists — nothing to do."
                )
            )
            return

        with transaction.atomic():
            student = Student(
                email=email,
                full_name=full_name,
                student_id=student_id,
                # Optional extras, taken from the env when provided.
                phone=(os.environ.get("ADMIN_PHONE") or "").strip(),
                department=(os.environ.get("ADMIN_DEPARTMENT") or "").strip(),
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            student.set_password(password)
            student.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Created superuser {email} (student_id={student_id})."
            )
        )
