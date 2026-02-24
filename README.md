# IoT Devices Manager

Full-stack IoT device management with real-time data visualization.

- **Backend:** Django + DRF, JWT, WebSockets (Channels), PostgreSQL, Redis
- **Frontend:** Angular 16, SCSS, Material Icons

📺 **Demo video**: `https://drive.google.com/drive/folders/1O-2FtOgS-pC8BWdz0__vqsRs_5jWUtPj?usp=drive_link` 

---

## Run project with Docker

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py create_test_data
```

The `simulator` service starts automatically and generates measurements every 5s with real-time WebSocket updates.

| Service          | URL                              |
|------------------|----------------------------------|
| Frontend         | http://localhost:4200             |
| Swagger UI       | http://localhost:8000/api/docs/  |

---

## Run project without Docker

> Uses SQLite and InMemoryChannelLayer — no Postgres/Redis needed.
> Real-time simulator (`simulate_data`) only works via Docker.

**Backend:**

```bash
cd backend
python -m venv env
env\Scripts\activate             # Linux/Mac: source env/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_test_data
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**

```bash
cd frontend
npm ci
npm start
```

Frontend runs at http://localhost:4200 and proxies `/api` to `localhost:8000`.

---

## Login TestData

| Field    | Value         |
|----------|---------------|
| Username | `testuser`    |
| Password | `testpass123` |
