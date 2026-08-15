#!/usr/bin/env bash
# Render build script for the CampusEase Django backend.
# NOTE: run `chmod +x Backend/build.sh` once locally so the file stays
# executable in git (Render needs the executable bit to run it).
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py create_admin
