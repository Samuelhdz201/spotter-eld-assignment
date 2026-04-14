# Spotter AI — ELD Trip Planner & Log Generator

A full-stack application that takes trip details as inputs and generates route instructions with compliant ELD (Electronic Logging Device) daily log sheets as outputs.

## Features

- **Trip Planning**: Enter current location, pickup, dropoff, and current cycle hours
- **Route Calculation**: Uses OpenRouteService API to calculate optimal driving route
- **HOS Compliance Engine**: Validates against FMCSA Hours of Service regulations:
  - 11-hour driving limit
  - 14-hour driving window
  - 30-minute mandatory rest break after 8 hours driving
  - 70-hour/8-day cycle limit
  - 10-hour off-duty requirement between shifts
  - Fuel stops every 1,000 miles
- **Interactive Map**: Shows route with stops (fuel, rest, pickup, dropoff) using Leaflet
- **Daily Log Sheets**: Generates FMCSA-compliant graph grid log sheets with drawn duty status lines
- **Multi-day Support**: Automatically generates multiple log sheets for longer trips

## Tech Stack

- **Backend**: Django 5 + Django REST Framework
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Maps**: Leaflet + OpenRouteService (free API)
- **Log Rendering**: HTML Canvas / SVG for FMCSA grid

## Assumptions (per assessment)

- Property-carrying driver
- 70-hour/8-day cycle
- No adverse driving conditions
- Fueling at least once every 1,000 miles
- 1 hour for pickup and drop-off
- Average speed: 55 mph (for time estimation)

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenRouteService API key (free at https://openrouteservice.org/dev/#/signup)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your ORS_API_KEY

python manage.py migrate
python manage.py runserver
```

Backend runs at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (default API URL is http://localhost:8000)

npm run dev
```

Frontend runs at http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trip/plan/` | Generate trip plan with route and log sheets |
| GET | `/api/trip/health/` | Health check |

### POST /api/trip/plan/

**Request Body:**
```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Denver, CO",
  "current_cycle_used": 20
}
```

**Response:**
```json
{
  "trip": {
    "current_location": "Dallas, TX",
    "pickup_location": "Oklahoma City, OK",
    "dropoff_location": "Denver, CO",
    "current_cycle_used": 20,
    "total_distance_miles": 890,
    "total_driving_hours": 16.2,
    "total_trip_days": 2
  },
  "route": {
    "geometry": [[lon, lat], ...],
    "legs": [...]
  },
  "stops": [
    {
      "type": "start",
      "location": "Dallas, TX",
      "coordinates": [lat, lon],
      "mile_marker": 0,
      "arrival_time": "2025-01-01T08:00:00",
      "departure_time": "2025-01-01T08:00:00"
    },
    ...
  ],
  "daily_logs": [
    {
      "day": 1,
      "date": "2025-01-01",
      "entries": [
        {
          "status": "off_duty",
          "start_hour": 0,
          "end_hour": 8,
          "location": "Dallas, TX",
          "remarks": "Off duty"
        },
        ...
      ],
      "totals": {
        "off_duty": 10,
        "sleeper_berth": 0,
        "driving": 11,
        "on_duty_not_driving": 3
      },
      "total_miles": 605
    }
  ]
}
```

---

## HOS Rules Implemented

| Rule | Limit | Implementation |
|------|-------|---------------|
| Driving limit | 11 hours max | Enforced per shift |
| Driving window | 14 hours from first on-duty | Stops driving at hour 14 |
| Rest break | 30 min after 8h driving | Inserted automatically |
| Off-duty | 10 consecutive hours | Required between shifts |
| Weekly cycle | 70 hours / 8 days | Tracks cumulative on-duty |
| Fuel stops | Every 1,000 miles | Auto-inserted |
| Pickup/Dropoff | 1 hour each | On-duty not driving |

---

## Deployment

### Backend (Railway / Render)
```bash
cd backend
# Uses gunicorn for production
gunicorn spotter_backend.wsgi:application --bind 0.0.0.0:8000
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

---

## Project Structure

```
spotter-eld/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── spotter_backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── trip_planner/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       └── services/
│           ├── route_service.py
│           ├── hos_engine.py
│           └── log_generator.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── TripForm.jsx
        │   ├── RouteMap.jsx
        │   ├── LogSheet.jsx
        │   ├── LogSheetGrid.jsx
        │   ├── StopsList.jsx
        │   └── Dashboard.jsx
        ├── services/
        │   └── api.js
        └── utils/
            └── hosConstants.js
```

## License

Built for Spotter AI Full Stack Developer Assessment.
