# RideNexa foundation architecture

```mermaid
flowchart LR
  W[React + Vite web] -->|REST /api/v1| A[Spring Boot API]
  A -->|JDBC| D[(MySQL 8.4)]
  A -. future recommendation call .-> M[FastAPI ML service]
  A -. future adapters .-> X[Payments · Maps · Notifications · AI]
```

Phase 1 provides a real cross-origin frontend-to-backend health request, a MySQL-backed public API health endpoint, and an independently runnable FastAPI health endpoint. Authoritative business rules will remain in Spring Boot; the ML service will only rank eligible candidates supplied by the API.
