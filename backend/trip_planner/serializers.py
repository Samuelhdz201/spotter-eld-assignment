from rest_framework import serializers


class TripPlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(
        max_length=255,
        help_text="Current location of the driver (e.g., 'Dallas, TX')"
    )
    pickup_location = serializers.CharField(
        max_length=255,
        help_text="Pickup location (e.g., 'Oklahoma City, OK')"
    )
    dropoff_location = serializers.CharField(
        max_length=255,
        help_text="Dropoff location (e.g., 'Denver, CO')"
    )
    current_cycle_used = serializers.FloatField(
        min_value=0,
        max_value=70,
        help_text="Hours already used in the current 70-hour/8-day cycle"
    )

    def validate_current_cycle_used(self, value):
        if value >= 70:
            raise serializers.ValidationError(
                "Cycle hours cannot be 70 or more. Driver needs a 34-hour restart first."
            )
        return value

    def validate(self, data):
        # Check that locations are different
        locations = [
            data['current_location'].strip().lower(),
            data['pickup_location'].strip().lower(),
            data['dropoff_location'].strip().lower(),
        ]
        if locations[0] == locations[1] == locations[2]:
            raise serializers.ValidationError(
                "All three locations cannot be the same."
            )
        return data
