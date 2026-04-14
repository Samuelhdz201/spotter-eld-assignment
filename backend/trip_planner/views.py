from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

from .serializers import TripPlanRequestSerializer
from .services.log_generator import generate_trip_plan

logger = logging.getLogger(__name__)


class TripPlanView(APIView):
    """
    POST /api/trip/plan/

    Generate a complete trip plan with route, stops, and daily ELD log sheets.
    """

    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = generate_trip_plan(
                current_location=serializer.validated_data['current_location'],
                pickup_location=serializer.validated_data['pickup_location'],
                dropoff_location=serializer.validated_data['dropoff_location'],
                current_cycle_used=serializer.validated_data['current_cycle_used'],
            )
            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Trip plan validation error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Trip plan error: {e}", exc_info=True)
            return Response(
                {'error': 'An error occurred while generating the trip plan. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthCheckView(APIView):
    """GET /api/trip/health/ — Simple health check."""

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'Spotter ELD Trip Planner',
            'version': '1.0.0',
        })
