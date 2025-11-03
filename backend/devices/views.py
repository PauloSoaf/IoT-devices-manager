from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Min, Max, Avg, Count
from django.db.models.functions import TruncMinute, TruncHour, TruncDate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from datetime import datetime
import uuid

from .models import Category, Device, Measurement, Alert
from .serializers import CategorySerializer, DeviceSerializer, MeasurementSerializer, AlertSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category model."""
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["name"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class DeviceViewSet(viewsets.ModelViewSet):
    """ViewSet for Device model."""
    
    queryset = Device.objects.select_related("category").all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "status"]
    search_fields = ["name", "public_id"]
    ordering_fields = ["name", "created_at", "status", "last_seen_at"]
    ordering = ["name"]
    
    @extend_schema(
        summary="Set device status",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['active', 'inactive', 'offline']
                    }
                },
                'required': ['status']
            }
        },
        responses={200: DeviceSerializer}
    )
    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Set device status."""
        device = self.get_object()
        status_value = request.data.get('status')
        
        if status_value not in ['active', 'inactive', 'offline']:
            return Response(
                {'error': 'Invalid status. Must be one of: active, inactive, offline'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        device.status = status_value
        device.save()
        
        serializer = self.get_serializer(device)
        return Response(serializer.data)


class MeasurementViewSet(viewsets.ModelViewSet):
    """ViewSet for Measurement model."""
    
    queryset = Measurement.objects.select_related("device").all()
    serializer_class = MeasurementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["device", "metric", "unit"]
    search_fields = ["device__name", "metric", "unit"]
    ordering_fields = ["recorded_at", "value", "created_at"]
    ordering = ["-recorded_at"]
    
    def get_queryset(self):
        """Apply date filters from query params."""
        queryset = super().get_queryset()
        
        from_date = self.request.query_params.get('from')
        to_date = self.request.query_params.get('to')
        
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                queryset = queryset.filter(recorded_at__gte=from_dt)
            except ValueError:
                pass
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                queryset = queryset.filter(recorded_at__lte=to_dt)
                
                # Validate from < to
                if from_date and from_dt > to_dt:
                    return queryset.none()  # Return empty queryset for invalid range
            except ValueError:
                pass
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """Disable destroy for data integrity."""
        return Response(
            {'error': 'Deleting measurements is not allowed for data integrity.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @extend_schema(
        summary="Aggregate measurements",
        parameters=[
            OpenApiParameter(name="device", type=int, required=False, description="Device ID"),
            OpenApiParameter(name="device_public_id", type=str, required=False, description="Device UUID"),
            OpenApiParameter(name="metric", type=str, required=False, description="Metric type"),
            OpenApiParameter(name="from", type=str, required=False, description="Start date (ISO 8601)"),
            OpenApiParameter(name="to", type=str, required=False, description="End date (ISO 8601)"),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=['get'])
    def aggregate(self, request):
        """Get aggregated measurement data."""
        device_id = request.query_params.get('device')
        device_public_id = request.query_params.get('device_public_id')
        metric = request.query_params.get('metric')
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        # Build queryset
        queryset = Measurement.objects.all()
        
        # Filter by device (prioritize device_id over device_public_id)
        device_filter = None
        if device_id:
            try:
                device_filter = int(device_id)
                queryset = queryset.filter(device_id=device_filter)
            except ValueError:
                return Response(
                    {'error': 'Invalid device ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif device_public_id:
            try:
                device_uuid = uuid.UUID(device_public_id)
                device = get_object_or_404(Device, public_id=device_uuid)
                device_filter = device.public_id
                queryset = queryset.filter(device=device)
            except (ValueError, Device.DoesNotExist):
                return Response(
                    {'error': 'Invalid or non-existent device public ID'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Filter by metric
        if metric:
            queryset = queryset.filter(metric=metric)
        
        # Filter by date range
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                queryset = queryset.filter(recorded_at__gte=from_dt)
            except ValueError:
                return Response(
                    {'error': 'Invalid from date format. Use ISO 8601.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                queryset = queryset.filter(recorded_at__lte=to_dt)
                
                # Validate date range
                if from_date and from_dt > to_dt:
                    return Response(
                        {'error': 'from date must be before to date'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Invalid to date format. Use ISO 8601.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Calculate aggregations
        aggregations = queryset.aggregate(
            count=Count('id'),
            min=Min('value'),
            max=Max('value'),
            avg=Avg('value')
        )
        
        # Get last measurement
        last_measurement = queryset.order_by('-recorded_at').first()
        
        result = {
            'device': str(device_filter) if device_filter else None,
            'metric': metric,
            'from': from_date,
            'to': to_date,
            'count': aggregations['count'] or 0,
            'min': float(aggregations['min']) if aggregations['min'] is not None else None,
            'max': float(aggregations['max']) if aggregations['max'] is not None else None,
            'avg': float(aggregations['avg']) if aggregations['avg'] is not None else None,
            'last_value': float(last_measurement.value) if last_measurement else None,
            'last_recorded_at': last_measurement.recorded_at.isoformat() if last_measurement else None
        }
        
        return Response(result)
    
    @extend_schema(
        summary="Get time series data",
        parameters=[
            OpenApiParameter(name="device", type=int, required=False, description="Device ID"),
            OpenApiParameter(name="device_public_id", type=str, required=False, description="Device UUID"),
            OpenApiParameter(name="metric", type=str, required=True, description="Metric type"),
            OpenApiParameter(name="from", type=str, required=False, description="Start date (ISO 8601)"),
            OpenApiParameter(name="to", type=str, required=False, description="End date (ISO 8601)"),
            OpenApiParameter(name="group", type=str, required=False, description="Group by: minute, hour, day", default="hour"),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=['get'])
    def timeseries(self, request):
        """Get time series aggregated data."""
        device_id = request.query_params.get('device')
        device_public_id = request.query_params.get('device_public_id')
        metric = request.query_params.get('metric')
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        group_by = request.query_params.get('group', 'hour')
        
        # Validate required parameters
        if not metric:
            return Response(
                {'error': 'metric parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not device_id and not device_public_id:
            return Response(
                {'error': 'Either device or device_public_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate group_by parameter
        if group_by not in ['minute', 'hour', 'day']:
            return Response(
                {'error': 'group parameter must be one of: minute, hour, day'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build queryset
        queryset = Measurement.objects.all()
        
        # Filter by device
        if device_id:
            try:
                device_filter = int(device_id)
                queryset = queryset.filter(device_id=device_filter)
            except ValueError:
                return Response(
                    {'error': 'Invalid device ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif device_public_id:
            try:
                device_uuid = uuid.UUID(device_public_id)
                device = get_object_or_404(Device, public_id=device_uuid)
                queryset = queryset.filter(device=device)
            except (ValueError, Device.DoesNotExist):
                return Response(
                    {'error': 'Invalid or non-existent device public ID'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Filter by metric
        queryset = queryset.filter(metric=metric)
        
        # Filter by date range
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                queryset = queryset.filter(recorded_at__gte=from_dt)
            except ValueError:
                return Response(
                    {'error': 'Invalid from date format. Use ISO 8601.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                queryset = queryset.filter(recorded_at__lte=to_dt)
                
                # Validate date range
                if from_date and from_dt > to_dt:
                    return Response(
                        {'error': 'from date must be before to date'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Invalid to date format. Use ISO 8601.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Choose truncation function based on group_by
        if group_by == 'minute':
            trunc_func = TruncMinute
        elif group_by == 'hour':
            trunc_func = TruncHour
        else:  # day
            trunc_func = TruncDate
        
        # Group and aggregate
        buckets = (
            queryset
            .annotate(bucket=trunc_func('recorded_at'))
            .values('bucket')
            .annotate(
                avg=Avg('value'),
                min=Min('value'),
                max=Max('value'),
                count=Count('id')
            )
            .order_by('bucket')
        )
        
        # Format results
        result = []
        for bucket in buckets:
            result.append({
                'timestamp': bucket['bucket'].isoformat(),
                'avg': float(bucket['avg']) if bucket['avg'] is not None else None,
                'min': float(bucket['min']) if bucket['min'] is not None else None,
                'max': float(bucket['max']) if bucket['max'] is not None else None,
                'count': bucket['count']
            })
        
        return Response(result)


class AlertViewSet(viewsets.ModelViewSet):
    """ViewSet for Alert model."""
    
    queryset = Alert.objects.select_related("device").all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["device", "type", "resolved"]
    search_fields = ["type", "message", "device__name"]
    ordering_fields = ["created_at", "resolved", "resolved_at"]
    ordering = ["-created_at"]
    
    @extend_schema(
        summary="Resolve alert",
        responses={200: AlertSerializer}
    )
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark alert as resolved."""
        alert = self.get_object()
        alert.resolved = True
        alert.resolved_at = timezone.now()
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Reopen alert",
        responses={200: AlertSerializer}
    )
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Mark alert as unresolved."""
        alert = self.get_object()
        alert.resolved = False
        alert.resolved_at = None
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
