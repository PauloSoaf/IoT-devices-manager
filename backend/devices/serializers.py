from rest_framework import serializers
from django.utils import timezone
from .models import Category, Device, Measurement, Alert


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for Device model."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Device
        fields = [
            'id', 'public_id', 'name', 'category', 'category_name', 
            'status', 'last_seen_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class MeasurementSerializer(serializers.ModelSerializer):
    """Serializer for Measurement model."""
    
    class Meta:
        model = Measurement
        fields = [
            'id', 'device', 'metric', 'value', 'unit', 
            'recorded_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_value(self, value):
        """Validate that value is >= 0 when applicable."""
        # Allow negative values for some metrics (e.g., temperature)
        # but validate based on context if needed
        if value is None:
            raise serializers.ValidationError("Value cannot be null.")
        return value


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for Alert model."""
    
    class Meta:
        model = Alert
        fields = [
            'id', 'device', 'type', 'message', 'resolved', 
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def update(self, instance, validated_data):
        """Auto-fill resolved_at when marking as resolved."""
        if validated_data.get('resolved', False) and not instance.resolved:
            if 'resolved_at' not in validated_data or not validated_data['resolved_at']:
                validated_data['resolved_at'] = timezone.now()
        elif not validated_data.get('resolved', True):
            # If marking as unresolved, clear resolved_at
            validated_data['resolved_at'] = None
        
        return super().update(instance, validated_data)