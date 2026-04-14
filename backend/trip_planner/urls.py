from django.urls import path
from .views import TripPlanView, HealthCheckView

urlpatterns = [
    path('trip/plan/', TripPlanView.as_view(), name='trip-plan'),
    path('trip/health/', HealthCheckView.as_view(), name='health-check'),
]
# backend/spotter_backend/urls.py (o como se llame tu carpeta principal)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('trip_planner.urls')), 
]