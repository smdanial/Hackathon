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
| POST   | `/api/auth/signup/`  | —           | `full_name`, `email`, `student_id`, `phone`, `password`, `confirm_password` → `{ token, student }` |
| POST   | `/api/auth/login/`   | —           | `identifier` (email **or** student ID) + `password` → `{ token, student }` |
| GET    | `/api/auth/me/`      | Token       | Returns the current student profile                     |
| PATCH  | `/api/auth/me/`      | Token       | Update profile: `full_name`, `email`, `phone`, `department`, `bio`, `profile_picture` (multipart for the image). `student_id` is read-only |
| POST   | `/api/auth/logout/`  | Token       | Revokes the current token (204)                         |
| POST   | `/api/auth/password-reset/` | —       | Forgot password: `identifier` (email or student ID). In DEBUG the response includes `uidb64` + `token` (the dev stand-in for a reset email) |
| POST   | `/api/auth/password-reset/confirm/` | — | Finish the reset: `uidb64`, `token`, `new_password`, `confirm_password`. Revokes existing tokens |
| GET    | `/api/rooms/`        | —           | All rooms with their daily schedules                    |
| GET    | `/api/lost-found/`   | —           | All reported found items (newest first)                 |
| POST   | `/api/lost-found/`   | —           | Report a found item: `item_name`, `category`, `description`, `location_found`, `finder_name`, `finder_phone`, optional `image` (multipart) |
| GET    | `/admin/`            | —           | Django admin — dev superuser: `admin@campusease.com` / `admin12345`       |

Authenticated requests send `Authorization: Token <token>`.

## Dev seed account

The dev database ships with a test student matching the frontend's mock
profile:

- Email: `arif@student.edu` — Student ID: `NIT-2101004`
- Password: `hackathon123`

## Config

- `CORS_ALLOW_ALL_ORIGINS` is enabled while `DEBUG = True` so the Next.js dev
  server works on any localhost port.
- The frontend's API base URL defaults to `http://localhost:8000/api` and can
  be overridden with `NEXT_PUBLIC_API_URL`.
