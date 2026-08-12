# CampusEase Backend

Django REST API for CampusEase (student portal). Handles student accounts and
authentication for the Next.js frontend in `../Frontend`.

## Stack

- Python 3.12 + Django 5 (Django REST Framework), run via Docker Compose
- SQLite database (`db.sqlite3`, auto-created on first `migrate`)
- Token authentication (`djangorestframework` authtokens)

## Running the API

The whole project (frontend + backend) is Dockerized from the **repo root**:

```bash
docker compose up -d --build   # starts both services
# first run only:
docker compose exec backend python manage.py migrate
```

The backend is then on http://localhost:8000. The server runs with
`--reload`, so backend code changes are picked up automatically. The
frontend (default `http://localhost:8000/api`) calls the API from the
browser, so both services must be up (`docker compose ps`).

## API endpoints

| Method | Endpoint             | Auth        | Body / notes                                            |
| ------ | -------------------- | ----------- | ------------------------------------------------------- |
| POST   | `/api/auth/signup/`  | —           | `full_name`, `email`, `student_id`, `phone`, `department` (`CSE`/`EEE`/`TE`/`IPE`/`FDAE` — required dropdown), `password`, `confirm_password` → `{ token, student }` |
| POST   | `/api/auth/login/`   | —           | `identifier` (email **or** student ID) + `password` → `{ token, student }` |
| GET    | `/api/auth/me/`      | Token       | Returns the current student profile                     |
| PATCH  | `/api/auth/me/`      | Token       | Update profile: `full_name`, `email`, `phone`, `department`, `bio`, `profile_picture` (multipart for the image). `student_id`, `is_cr` and `is_librarian` are read-only |
| POST   | `/api/auth/logout/`  | Token       | Revokes the current token (204)                         |
| POST   | `/api/auth/password-reset/` | —       | Forgot password: `identifier` (email or student ID). In DEBUG the response includes `uidb64` + `token` (the dev stand-in for a reset email) |
| POST   | `/api/auth/password-reset/confirm/` | — | Finish the reset: `uidb64`, `token`, `new_password`, `confirm_password`. Revokes existing tokens |
| GET    | `/api/rooms/`        | —           | All rooms with their daily schedules                    |
| GET    | `/api/rooms/bookings/` | Token     | The logged-in student's room bookings                   |
| POST   | `/api/rooms/bookings/` | Token     | Book a room — **CRs only** (403 for regular students): `room`, `date` (class day, e.g. `2026-08-12`), `class_type` (`regular`/`reschedule`), `department` (`CSE`/`EEE`/`TE`/`IPE`/`FDAE`), `class_name`, `start_time`, `end_time` (HH:MM). Adds the class to that day's schedule so everyone sees it booked; overlapping slots on the same day and past end times are rejected. Times are judged on the **Asia/Dhaka campus clock** (so an 8–11 AM class can be booked for tomorrow at any hour) |
| DELETE | `/api/rooms/bookings/<id>/` | Token | Cancel (delete) one of the caller's bookings (204). Finished bookings are released automatically |
| GET    | `/api/lost-found/`   | Token       | All reported found items (newest first) — login required  |
| POST   | `/api/lost-found/`   | Token       | Report a found item: `item_name`, `category`, `description`, `location_found`, `finder_name`, `finder_phone`, optional `image` (multipart). Attached to the logged-in student |
| POST   | `/api/lost-found/<id>/received/` | Token | Mark a found item as received — only the student who reported it (403 otherwise) |
| GET    | `/api/notices/`      | —           | Notices, newest first (public). Pass `?department=CSE` to include that department's class/lab notices; without it (or an anonymous visitor) only campus-wide club/EMS notices are returned. Class/lab notices are department-scoped — students only ever see their own department's |
| POST   | `/api/notices/`      | Token       | Post a notice — role × category gated: **CRs** post `class`/`lab` (department taken from the posting CR's own profile, never the payload), **Club Members** post `club` with an optional `image` (multipart) and a safe `link_url` (http/https/ftp only — `javascript:` and friends rejected) + `link_label`. `ems` is admin-managed (403) |
| PATCH   | `/api/notices/<id>/` | Token       | Update a notice — class/lab by a **CR of the notice's own department**, club by any **Club Member** (403 otherwise). Multipart so an image can be replaced |
| DELETE | `/api/notices/<id>/` | Token       | Delete a notice — same role × category rules as PATCH (204) |
| GET    | `/admin/`            | —           | Django admin — dev superuser: `admin@campusease.com` / `admin12345`. The student list has **CR**, **Librarian** and **Club Member** columns you can tick directly to grant roles |
| GET    | `/api/library/`      | —           | The library's book catalogue (public read) — title, author, ISBN, format (`Physical`/`PDF`), status (`Available`/`Taken`), cover URL, uploaded PDF URL |
| POST   | `/api/library/`      | Token       | Add a book / upload a PDF — **Librarians only** (403 otherwise). Multipart: `title`, `author`, `isbn`, `format`, `status`, `cover_url`, optional `return_date` (`YYYY-MM-DD` when Taken), optional `pdf_file` |
| PATCH  | `/api/library/<id>/` | Token       | Update a book — **Librarians only** (403 otherwise) |
| DELETE | `/api/library/<id>/` | Token       | Remove a book — **Librarians only** (204) |


Authenticated requests send `Authorization: Token <token>`.

## Dev seed account

The dev database ships with a test student matching the frontend's mock
profile:

- Email: `arif@student.edu` — Student ID: `NIT-2101004`
- Password: `hackathon123`
- Role: **CR** (`is_cr = True`) — the demo CR, so room booking and notice
  posting work out of the box. Grant/revoke the role from the Django admin
  (Students list → CR column, or the Role section of a student's change page).
- Department: `CSE` — the demo CR's class/lab notices are seeded to CSE.
  `nusrat@student.edu` (`hackathon123`) is the demo **Librarian**
  (`is_librarian = True`) and an **EEE** regular student, handy for testing
  department scoping: she sees only campus-wide (club/EMS) notices, never
  CSE class/lab ones, but she *can* add/upload/update library books while
  arif (CR, not librarian) cannot.
- `paulakash187@gmail.com` (`hackathon123`) is the demo **Club Member**
  (`is_club_member = True`) — he can post and update Club notices with
  images and safe links. arif (CR) cannot touch club notices, and paulakash
  cannot touch class/lab ones.

Starter notices can be (re)seeded with `python manage.py seed_notices`.
The library's starter catalogue (9 books) with `python manage.py seed_books`.
## Config

- `CORS_ALLOW_ALL_ORIGINS` is enabled while `DEBUG = True` so the Next.js dev
  server works on any localhost port.
- The frontend's API base URL defaults to `http://localhost:8000/api` and can
  be overridden with `NEXT_PUBLIC_API_URL`.
