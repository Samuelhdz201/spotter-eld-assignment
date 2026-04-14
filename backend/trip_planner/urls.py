from django.urls import path
from .views import TripPlanView, HealthCheckView

urlpatterns = [
    path('trip/plan/', TripPlanView.as_view(), name='trip-plan'),
    path('trip/health/', HealthCheckView.as_view(), name='health-check'),
]
