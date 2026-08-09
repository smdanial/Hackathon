# CampusEase (Hackathon)

Student-life toolkit: room finder, library seats, bus tracker, lost & found,
and notices — with a Django REST API backend and a Next.js frontend.

## Run the full project with Docker (recommended)

Requires Docker Desktop (or any Docker Engine with Compose).

```bash
docker compose up -d --build
```

This starts two services:

| Service  | URL                     | Notes                                              |
| -------- | ----------------------- | -------------------------------------------------- |
| frontend | http://localhost:3000   | Next.js dev server (hot reload)                    |
| backend  | http://localhost:8000   | Django REST API (auto-reload)                      |

First-time setup only:

```bash
docker compose exec backend python manage.py migrate
```

Then open http://localhost:3000 — the login/signup pages talk to the API on
port 8000 automatically.

### Django admin / superuser

The dev database already has a superuser — open http://localhost:8000/admin/
and log in with:

- Email: `admin@campusease.com` — Password: `admin12345`

To create another one (or change the password):

```bash
docker compose exec backend python manage.py createsuperuser
```

See `Backend/README.md` for the API endpoints and a seed student account
(`arif@student.edu` / `hackathon123`).

## Run without Docker (development)

- Backend: `cd Backend && pip install -r requirements.txt && python manage.py runserver`
- Frontend: `cd Frontend && npm install && npm run dev`
