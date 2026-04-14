from django.urls import path
from .views import TripPlanView, HealthCheckView

urlpatterns = [
    path('plan/', TripPlanView.as_view(), name='trip-plan'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]