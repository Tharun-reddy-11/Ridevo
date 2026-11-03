# RideNexa

**Your ride, delivered.** RideNexa is a multi-vendor vehicle-rental marketplace for nearby self-drive and chauffeur-driven vehicles, doorstep handover, flexible returns, and operations-aware rental shops.

## Current milestone — working marketplace core

This repository contains an operational marketplace core, not a static catalogue:

- `frontend/` — React + Vite landing experience, customer registration/login, search, booking, customer history, owner onboarding/inventory/decisions, and an administrator review console.
- `backend/` — Spring Boot JWT API backed by MySQL. It persists user accounts, owner applications, owner-uploaded vehicle images and inventory, booking requests, decisions, and interactions.
- `database/` — MySQL initialization script.
- `ml-service/` — FastAPI content-ranking model service. It trains only on real RideNexa interaction events; it never claims a model exists before one has been trained.

## Prerequisites

- Docker Desktop running
- Java 21+ and Maven 3.9+
- Node.js 20+
- Python 3.11+ (not the Microsoft Store launcher)

## Run locally on Windows PowerShell

1. Create local environment values:

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

2. Start and verify MySQL:

```powershell
docker compose up -d mysql
docker compose ps
```

Wait for the MySQL health status to be `healthy`.

3. Start the Spring Boot API in a separate terminal. The application reads `../.env` when launched from `backend/`, including the local administrator seed configuration:

```powershell
Set-Location backend
mvn.cmd spring-boot:run
```

4. Start the ML health service in a third terminal:

```powershell
Set-Location ml-service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

5. Start the web app in a fourth terminal:

```powershell
Set-Location frontend
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:5173](http://localhost:5173). Once the API is running, the header should show **System online**.

## Functional flow to verify

```powershell
Invoke-RestMethod http://localhost:8081/actuator/health
Invoke-RestMethod http://localhost:8081/api/v1/public/health
Invoke-RestMethod http://localhost:8000/health
```

1. Sign in with the administrator credentials you configured in the ignored root `.env` file.
2. Submit a rental-owner application from the landing-page footer.
3. In the Admin dashboard, approve it.
4. Sign in as that owner; upload a real vehicle image and publish a physical vehicle.
5. Register a customer, find that vehicle by city, request a date/time period, and see the owner accept or decline it.
6. Confirm the customer booking-history and owner request dashboards both update from MySQL.

Spring reports `UP`; the public API returns `service: ridenexa-api`, `status: UP`; FastAPI returns `service: ridenexa-ml`. An untrained ML service correctly reports `model_loaded: false` rather than inventing recommendations. Port `8081` is used locally because `8080` is already occupied on this computer; change `BACKEND_PORT` and `frontend/.env` together if you free that port.

## Configuration and provider safety

All credentials are represented only by `.env.example` variables; none are hardcoded. Payment, maps, SMS/voice, storage and AI adapters will return an explicit unconfigured state until valid credentials are supplied.

The public Nominatim service is **not** planned for browser autocomplete or bulk data collection. Its usage policy requires a valid identifying User-Agent, caching, a maximum rate of one request per second, and prohibits client-side autocomplete. See [Nominatim's official policy](https://operations.osmfoundation.org/policies/nominatim/). For routing, RideNexa will use a provider adapter; [OSRM](https://project-osrm.org/docs/) is a candidate for a self-hosted road-routing service.

## Next development milestones

1. Handover inspection, licence verification and OTP release workflow.
2. Durable return reminders, delivery/pickup schedules and late-fee invoicing.
3. Razorpay, maps, SMS/voice, storage and AI adapters using credentials you supply.
4. Training export/consented interaction pipeline and model refresh orchestration.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).
