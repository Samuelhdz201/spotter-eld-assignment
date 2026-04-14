Spotter ELD — Trip Planner & Log GeneratorSpotter ELD is a high-performance full-stack application designed to transform trip details into optimized routes and FMCSA-compliant Electronic Logging Device (ELD) daily log sheets.Built as a technical assessment for the Spotter AI Full Stack Developer role. FeaturesTrip Planning: Interactive interface to input location, pickup/dropoff points, and current cycle status.Intelligent Route Calculation: Integrates OpenRouteService API for real-world commercial routing.HOS Compliance Engine: A robust backend engine that validates and enforces FMCSA Hours of Service regulations:11-hour driving limit & 14-hour duty window.Automatic 30-minute rest break insertion after 8 hours of driving.70-hour/8-day cycle tracking with 34-hour restart logic.Mandatory 10-hour off-duty reset between shifts.Pro Interactive Map: Customized Leaflet map with dark-mode integration, showing route geometry and categorized stops (Fuel, Rest, Pickup/Dropoff).ELD Log Sheets: High-fidelity SVG/Grid rendering of the official FMCSA graph, including 4-line duty status transitions and remarks.🛠 Tech StackBackend: Django 5 + Django REST Framework (Python 3.10+)Frontend: React 18 + Vite + Tailwind CSSMaps: Leaflet.js + OpenRouteServiceProduction: WhiteNoise (Static files), Gunicorn (WSGI Server)📋 HOS Rules ImplementedRuleLimitImplementation DetailDriving Limit11 HoursStops driving state once limit is reached within a shift.Duty Window14 HoursEnforces the "daily clock" starting from the first On-Duty event.Rest Break30 MinutesAutomatically inserts a break after 8 cumulative hours of driving.Off-Duty Reset10 HoursRequired consecutive rest period to reset the 11/14h clocks.Weekly Cycle70h / 8 daysTracks cumulative On-Duty time with a 34h restart detection.Fuel Stops1,000 MilesSmart insertion of 30-min fueling events based on distance.Service Time1 HourFixed On-Duty time for both Pickup and Dropoff locations.⚙️ Quick Start1. PrerequisitesPython 3.10+ & Node.js 18+OpenRouteService API key (Free at openrouteservice.org)2. Backend SetupBashcd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment Variables
cp .env.example .env
# Edit .env and add your ORS_API_KEY, DEBUG=True, and ALLOWED_HOSTS
python manage.py migrate
python manage.py runserver
Backend runs at http://localhost:80003. Frontend SetupBashcd frontend
npm install

# Environment Variables
# Create a .env file in /frontend:
# VITE_API_URL=http://localhost:8000
npm run dev
Frontend runs at http://localhost:5173 DeploymentThis project is architected for seamless cloud deployment.Backend (Railway)Root Directory: /backendVariables: Set ORS_API_KEY, DEBUG=False, and SECRET_KEY in the Railway dashboard.CORS: Add your Vercel production URL to CORS_ALLOWED_ORIGINS in settings.py.Process: Railway uses the Procfile to run Gunicorn.Frontend (Vercel)Root Directory: /frontendVariables: Set VITE_API_URL to your Railway public domain.Build Command: npm run build Project StructurePlaintextspotter-eld/
├── backend/            # Django API, HOS Engine & Log Logic
│   ├── trip_planner/
│   │   └── services/   # hos_engine.py, route_service.py, log_generator.py
│   └── spotter_backend/ # Core settings & WSGI
└── frontend/           # React App & UI Components
    └── src/
        ├── components/ # RouteMap, LogSheetGrid, Dashboard, etc.
        └── services/   # api.js connection
 LicenseBuilt by Samuelhdz201 for the Spotter AI Full Stack Developer Assessment.
