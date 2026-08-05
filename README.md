# RailVista - Sri Lankan Railway Ticketing Platform

RailVista is a full-stack railway reservation platform inspired by Sri Lankan train travel workflows. It provides a customer-facing booking experience and an operations-focused admin console for monitoring service performance.

The project is split into:

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS 11, Prisma, PostgreSQL, JWT auth, booking/seat APIs
- **Infrastructure**: Docker Compose for one-shot database startup

---

## Quick Start (Single Command)

If your environment variables are already set, the full stack can be started with one command:

```bash
docker compose up --build
```

Use this command to rebuild images and start the full stack.

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

The compose setup now provisions PostgreSQL, runs backend migrations automatically, and starts both the API and web app in containers.

If you see a PostgreSQL authentication error (for example, Prisma `P1000`) after changing DB credentials, your local Postgres volume may still contain older credentials. Remove containers and the named volume, then start again with `docker compose up --build`.

---

## Core Features

### 1. Authentication & User Session
- User registration and login with JWT.
- Role model for `CUSTOMER` and `ADMIN`.
- Protected routes/endpoints for account and admin operations.

### 2. Journey Search & Train Discovery
- Search trains by origin and destination.
- Route-aware train listings with schedule metadata.
- Train details and route stop awareness.

### 3. Reservation Flow
- Seat hold + booking confirmation flow.
- Booking creation with idempotency support to reduce duplicate bookings.
- Booking history for logged-in users and cancellation support.

### 4. Seat Availability & Segment-Safe Booking
- Segment-aware seat occupancy checks (origin -> destination overlap handling).
- Seat locking and temporary seat holds.
- Availability API integrated into the seat selection UI.

### 5. Admin Operations Console
- Dashboard with occupancy, revenue, booking totals, train/coach counts.
- Daily/weekly/monthly analytics views.
- Coach-level booking status and amenities updates.
- Admin role management and train management endpoints.

---

## Additional Enhancements

This project includes and/or is structured to support the following enhancements:

1. **Seat map visualization**
	- Interactive, coach-based seat grid with availability status and clear visual states.

2. **Simple admin department view (occupancy, revenue, etc.)**
	- Admin dashboard provides aggregate KPIs plus occupancy and revenue trend charts.

3. **Clearer booking conflict handling in UI**
	- Loading indicators during reservation actions.
	- Availability refresh and user-facing conflict messages when seats are no longer free.
	- Seat hold mechanism to reduce race-condition failures during checkout.

4. **Fare logic beyond basic distance-only pricing**
	- Current implementation already factors travel class and coach economics.
	- Extendable points: dynamic pricing windows, peak/off-peak bands, demand multipliers, concession rules, loyalty pricing.

---

## Screenshots

### Journey Search
![Journey Search UI](docs/screenshots/01-home-search.png)

### Seat Map Visualization
![Seat Map UI](docs/screenshots/02-seat-map.png)

### Booking Flow
![Booking Flow UI](docs/screenshots/03-booking-flow.png)

### Admin Dashboard
![Admin Dashboard UI](docs/screenshots/04-admin-dashboard.png)

---

## ER Diagram

```mermaid
erDiagram
	USER ||--o{ BOOKING : places
	USER ||--o{ IDEMPOTENCY_KEY : owns

	TRAIN ||--o{ TRAIN_STOP : has
	TRAIN ||--o{ FARE : defines
	TRAIN ||--o{ BOOKING : serves

	COACH ||--o{ SEAT : contains
	COACH ||--o{ BOOKING : assigned_to

	SEAT ||--o{ BOOKING : reserved_in

	STATION ||--o{ BOOKING : origin_for
	STATION ||--o{ BOOKING : destination_for

	BOOKING ||--o| IDEMPOTENCY_KEY : cached_by

	USER {
		string id PK
		string email
		string role
		datetime createdAt
	}

	TRAIN {
		string id PK
		string trainNo
		string trainName
		int firstClassFarePerHop
		int secondClassFarePerHop
	}

	TRAIN_STOP {
		string id PK
		string trainId FK
		string station
		string time
		int stopOrder
	}

	STATION {
		string id PK
		string name
		int sequence
	}

	COACH {
		string id PK
		string code
		string travelClass
		int baseFare
	}

	SEAT {
		string id PK
		string coachId FK
		string number
	}

	FARE {
		string id PK
		string trainId FK
		string originStation
		string destinationStation
		string travelClass
		int fare
	}

	BOOKING {
		string id PK
		string bookingCode
		string userId FK
		string trainId FK
		string coachId FK
		string seatId FK
		string originStationId FK
		string destinationStationId FK
		datetime journeyDate
		string status
		int fare
	}

	IDEMPOTENCY_KEY {
		string id PK
		string key
		string userId FK
		string bookingId FK
		datetime createdAt
	}
```

---

## Project Structure

```text
railway-ticketing/
  backend/      # NestJS API + Prisma + booking domain logic
  frontend/     # Next.js customer + admin interfaces
  docker-compose.yml
```

---

## Environment Configuration

### Backend (`backend/.env`)

```env
PORT=3001

# PostgreSQL
DATABASE_URL=postgresql://postgres:familyuser@localhost:5432/train_booking
DB_USER=postgres
DB_PASSWORD=familyuser
DB_NAME=train_booking

# Auth
JWT_SECRET=railvista-dev-secret
JWT_EXPIRES_IN=8h

# Optional
REDIS_URL=redis://localhost:6379
DB_TIMEZONE=Asia/Colombo
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

## Backend Commands

```bash
cd backend
npm install
npm run start:dev
```

Other useful scripts:

- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run lint`

## Frontend Commands

```bash
cd frontend
npm install
npm run dev
```

Other useful scripts:

- `npm run build`
- `npm run lint`

---

## API Highlights

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /trains`
- `GET /seats/availability`
- `POST /seats/hold`
- `POST /bookings`
- `GET /bookings/me`
- `DELETE /bookings/:id`
- `GET /admin/analytics/overview` (ADMIN)
- `GET /admin/trains/:trainNo/coaches/status` (ADMIN)

---

## Design & Visual Inspiration References

The UI styling direction and travel imagery ideas were inspired by:

- https://www.getyourguide.com/colombo-l112/colombo-3-lakes-wetland-park-lotus-tower-sunset-tour-t1288641/
- https://www.tripadvisor.com/Attraction_Review-g1073495-d13954070-Reviews-Idalgashinna_Railway_Station-Haputale_Uva_Province.html#/media/13954070/?type=ALL_INCLUDING_RESTRICTED&albumid=-160&category=-160
- https://holidayarchitects.co.uk/asia/sri-lanka/excursions/scenic-train-journey
- https://www.pinterest.com/pin/lions-mouth-railway-track-kadugannawa-sri-lanka--377458012502663672/
- RDMNS app (Sri Lanka)
- Pravesha ticket booking system (Sri Lanka)

Please ensure any screenshots or third-party images used in documentation are compliant with their original licenses/terms.

---

## License

This repository currently does not define a top-level license. Add one if you plan to distribute publicly.
