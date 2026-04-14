Spotter ELD — Trip Planner & Log Generator
A full-stack application that transforms trip details into optimized routes and FMCSA-compliant ELD daily log sheets. Enter your current location, pickup, dropoff, and cycle hours — the system calculates the complete route with all required stops and generates drawn log sheets for each day of the trip.
Built as a technical assessment for the Spotter AI Full Stack Developer role.
Live Demo

Frontend: your-vercel-url.vercel.app
Backend API: your-railway-url.up.railway.app
Loom Walkthrough: your-loom-link


Replace these links with your actual URLs before submitting.


Features

Trip Planning — Interactive form to input current location, pickup/dropoff points, and current cycle hours used
Route Calculation — Integrates OpenRouteService API (HGV profile) for commercial truck routing with haversine fallback
HOS Compliance Engine — Validates and enforces all FMCSA Hours of Service regulations (49 CFR Part 395)
Interactive Map — Dark-mode Leaflet map showing the route with color-coded stop markers
ELD Log Sheets — High-fidelity SVG rendering of the official FMCSA Form 395.8 graph grid, with drawn duty status lines, 15-minute increments, remarks, and 24-hour verification totals
Multi-Day Support — Automatically generates multiple log sheets for longer trips, correctly splitting entries at midnight


Tech Stack
LayerTechnologyBackendDjango 5 + Django REST FrameworkFrontendReact 18 + Vite + Tailwind CSSMapsLeaflet.js + OpenRouteService (HGV profile)Log RenderingCustom SVG (no external charting libraries)ProductionGunicorn + WhiteNoise

HOS Rules Implemented
RuleLimitCFR ReferenceImplementationDriving Limit11 hours§395.3(a)(3)Stops driving once limit is reached within a shiftDuty Window14 hours§395.3(a)(2)Enforces clock starting from first on-duty eventRest Break30 minutes§395.3(a)(3)(ii)Auto-inserted after 8 cumulative hours of drivingOff-Duty Reset10 hours§395.3(a)(1)Required consecutive rest to reset 11/14h clocksWeekly Cycle70h / 8 days§395.3(b)Tracks cumulative on-duty with 34-hour restartFuel StopsEvery 1,000 miAssessment req.30-min fueling stops based on distancePickup/Dropoff1 hour eachAssessment req.Fixed on-duty not driving time
Assumptions (per assessment requirements)

Property-carrying CMV driver
70-hour/8-day cycle (no 60/7)
No adverse driving conditions
Average speed: 55 mph


Quick Start
Prerequisites

Python 3.10+
Node.js 18+
OpenRouteService API key (free at openrouteservice.org)

Backend
bashcd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your ORS_API_KEY

python manage.py migrate
python manage.py runserver
Backend runs at http://localhost:8000
Frontend
bashcd frontend
npm install
npm run dev
Frontend runs at http://localhost:5173

API
POST /api/trip/plan/
Request:
json{
  "current_location": "Dallas, TX",
  "pickup_location": "Denver, CO",
  "dropoff_location": "Seattle, WA",
  "current_cycle_used": 20
}
Response: Trip summary, route geometry, stops array, and daily log sheets with entries and totals.
GET /api/trip/health/
Health check endpoint.

Deployment
Backend (Railway)

Root directory: /backend
Start command: gunicorn spotter_backend.wsgi:application --bind 0.0.0.0:$PORT
Environment variables: ORS_API_KEY, SECRET_KEY, DEBUG=False, ALLOWED_HOSTS

Frontend (Vercel)

Root directory: /frontend
Build command: npm run build
Output directory: dist
Environment variable: VITE_API_URL = your Railway backend URL


Project Structure
spotter-eld/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── spotter_backend/        # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── trip_planner/           # Main app
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       └── services/
│           ├── hos_engine.py       # HOS compliance engine
│           ├── route_service.py    # ORS API + fallback routing
│           └── log_generator.py    # Orchestrator
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── TripForm.jsx        # Input form
        │   ├── RouteMap.jsx        # Leaflet map
        │   ├── LogSheet.jsx        # Log sheets container
        │   ├── LogSheetGrid.jsx    # SVG grid renderer
        │   ├── StopsList.jsx       # Route stops timeline
        │   └── Dashboard.jsx       # Trip summary
        ├── services/
        │   └── api.js
        └── utils/
            └── hosConstants.js
            
Built by **Samuelhdz201** (Romario) for the Spotter AI Full Stack Developer Assessment.

            
