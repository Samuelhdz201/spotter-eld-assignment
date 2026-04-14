# Spotter ELD — Trip Planner & Log Generator

**Spotter ELD** is a high-performance full-stack application designed to transform trip details into optimized routes and FMCSA-compliant Electronic Logging Device (ELD) daily log sheets. 

Built as a technical assessment for the Spotter AI Full Stack Developer role.

---

##  Features

* **Trip Planning:** Interactive interface to input location, pickup/dropoff points, and current cycle status.
* **Intelligent Route Calculation:** Integrates **OpenRouteService API** for real-world commercial routing.
* **HOS Compliance Engine:** A robust backend engine that validates and enforces **FMCSA Hours of Service** regulations.
* **Pro Interactive Map:** Customized Leaflet map with dark-mode integration.
* **ELD Log Sheets:** High-fidelity **SVG/Grid rendering** of the official FMCSA graph.

---

##  Tech Stack

* **Backend:** Django 5 + Django REST Framework (Python 3.10+)
* **Frontend:** React 18 + Vite + Tailwind CSS
* **Maps:** Leaflet.js + OpenRouteService
* **Production:** WhiteNoise (Static files), Gunicorn (WSGI Server)

---

##  HOS Rules Implemented

| Rule | Limit | Implementation Detail |
| :--- | :--- | :--- |
| **Driving Limit** | 11 Hours | Stops driving state once limit is reached within a shift. |
| **Duty Window** | 14 Hours | Enforces the "daily clock" starting from the first On-Duty event. |
| **Rest Break** | 30 Minutes | Automatically inserts a break after 8 cumulative hours of driving. |
| **Off-Duty Reset** | 10 Hours | Required consecutive rest period to reset the 11/14h clocks. |
| **Weekly Cycle** | 70h / 8 days | Tracks cumulative On-Duty time with a 34h restart detection. |
| **Fuel Stops** | 1,000 Miles | Smart insertion of 30-min fueling events based on distance. |
| **Service Time** | 1 Hour | Fixed On-Duty time for both Pickup and Dropoff locations. |

---

##  Quick Start

### 1. Prerequisites
* Python 3.10+ & Node.js 18+
* OpenRouteService API key (Free at [openrouteservice.org](https://openrouteservice.org/))

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
3. Frontend Setup
Bash
cd frontend
npm install
npm run dev
 Deployment
Backend (Railway)
Root Directory: /backend

Variables: Set ORS_API_KEY, DEBUG=False, and SECRET_KEY.

Frontend (Vercel)
Root Directory: /frontend

Variables: Set VITE_API_URL to your Railway public domain.

 Project Structure
Plaintext
spotter-eld/
├── backend/            # Django API & HOS Engine
└── frontend/           # React App & UI
 License
Built by Samuelhdz201 for the Spotter AI Assessment.
