# Wind Turbine Monitoring System

A full-stack IoT system for monitoring and controlling offshore wind turbines.

The system receives **telemetry data via MQTT**, stores it in **PostgreSQL**, and displays it in a **React dashboard**.

---

# Architecture

```
Wind Turbines (IoT)
        ↓
     MQTT Broker
        ↓
 ASP.NET Core API
        ↓
    PostgreSQL
        ↓
 React Dashboard
```

---

# Tech Stack

Backend

* .NET 10
* ASP.NET Core
* Entity Framework Core
* PostgreSQL
* MQTT (Mqtt.Controllers)
* Swagger / OpenAPI

Frontend

* React
* Vite
* JavaScript / TypeScript

Infrastructure

* Docker
* PostgreSQL

---

# Project Structure

```
WindTurbine/
│
├── backend/
│   ├── Controllers
│   ├── Entities
│   ├── Data
│   ├── Services
│   └── Program.cs
│
├── frontend/
│   └── React dashboard
│
└── README.md
```

---

# Running the Backend

Navigate to the backend folder:

```bash
cd backend
```

Restore dependencies:

```bash
dotnet restore
```

Run the API:

```bash
dotnet run
```

The API will run on something like:

```
http://localhost:5199
```

Swagger documentation:

```
http://localhost:5199/swagger
```

---

# Running the Frontend

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run on:

```
http://localhost:5173
```

---

# Creating a Local PostgreSQL Database (Docker)

Install Docker if not installed.

Start PostgreSQL container:

```bash
docker run -d \
--name windturbine-db \
-e POSTGRES_USER=admin \
-e POSTGRES_PASSWORD=secret \
-e POSTGRES_DB=WindTurbineDb \
-p 5432:5432 \
postgres:15
```

Check running containers:

```bash
docker ps
```

---

# Database Connection String

In `appsettings.json`:

```
Host=localhost;
Port=5432;
Database=WindTurbineDb;
Username=admin;
Password=secret
```

---

# Viewing Database Tables (Linux Terminal)

Connect to PostgreSQL:

```bash
psql -h localhost -p 5432 -U admin -d WindTurbineDb
```

List all tables:

```sql
\dt
```

View table structure:

```sql
\d "TurbineMetrics"
```

Show all data in a table:

```sql
SELECT * FROM "TurbineMetrics";
```

Limit results:

```sql
SELECT * FROM "TurbineMetrics" LIMIT 10;
```

Exit psql:

```
\q
```

---

# Viewing All Tables Data Quickly

Example queries:

Show turbines:

```sql
SELECT * FROM "Turbines";
```

Show metrics:

```sql
SELECT * FROM "TurbineMetrics";
```

Show alerts:

```sql
SELECT * FROM "Alerts";
```

---

# Updating Models Using Scaffold

Scaffold generates **Entity Framework models from the database**.

Run:

```bash
dotnet ef dbcontext scaffold \
"Host=localhost;Port=5432;Database=WindTurbineDb;Username=admin;Password=secret" \
Npgsql.EntityFrameworkCore.PostgreSQL \
-o Entities \
-c WindTurbineDbContext \
--force
```

Explanation:

| Option                    | Description                        |
| ------------------------- | ---------------------------------- |
| `-o Entities`             | Output folder for generated models |
| `-c WindTurbineDbContext` | DbContext name                     |
| `--force`                 | Overwrite existing files           |

---

# Scaffold Specific Tables

Example:

```bash
dotnet ef dbcontext scaffold \
"Host=localhost;Port=5432;Database=WindTurbineDb;Username=admin;Password=secret" \
Npgsql.EntityFrameworkCore.PostgreSQL \
-o Entities \
-t TurbineMetrics \
--force
```

---

# MQTT Telemetry

The system subscribes to telemetry messages:

```
farm/{farmId}/windmill/{turbineId}/telemetry
```

Example broker used:

```
broker.hivemq.com
```

Telemetry messages are stored in:

```
TurbineMetrics table
```

---

# Common Commands

Run backend

```bash
dotnet run
```

Run frontend

```bash
npm run dev
```

Connect to database

```bash
psql -h localhost -U admin -d WindTurbineDb
```

Show tables

```sql
\dt
```

---

# Useful Development Tools

Recommended tools:

* Docker
* pgAdmin
* Postman
* Swagger UI

---

# Troubleshooting

CORS errors

Ensure the backend allows:

```
http://localhost:5173
```

Database connection issues

Check container:

```bash
docker stop windturbine-db
docker rm windturbine-db

docker run -d \
  --name windturbine-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=WindTurbineDb \
  -p 5432:5432 \
  postgres:15

dotnet ef migrations add AddTelemetryTable
dotnet ef database update

psql -h localhost -p 5432 -U admin -d WindTurbineDb

```
The password in this example is : secret

Restart database:

```bash
docker restart windturbine-db
```

---

# Authors

Wind Turbine Monitoring System
Built using .NET, MQTT, PostgreSQL, and React.
