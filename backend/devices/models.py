import uuid
from django.db import models
from django.utils import timezone


class Category(models.Model):
    """
    Device category (e.g., HVAC, Energy Meter, Environment Sensor).
    """
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "category"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class DeviceStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    OFFLINE = "offline", "Offline"


class Device(models.Model):
    """
    A physical/virtual device that can emit measurements.
    """
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="devices")
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=160)
    status = models.CharField(max_length=16, choices=DeviceStatus.choices, default=DeviceStatus.INACTIVE)

    last_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category", "status"]),
        ]
        unique_together = [("category", "name")]  
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.public_id})"


class MetricType(models.TextChoices):
    TEMPERATURE = "temperature", "Temperature"
    HUMIDITY = "humidity", "Humidity"
    POWER = "power", "Power"
    ENERGY = "energy", "Energy"
    CUSTOM = "custom", "Custom"


class Measurement(models.Model):
    """
    A single sampled value emitted by a device.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="measurements")
    metric = models.CharField(max_length=48, choices=MetricType.choices, default=MetricType.CUSTOM)
    value = models.DecimalField(max_digits=14, decimal_places=4)  
    unit = models.CharField(max_length=24)  
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "measurement"
        indexes = [
            models.Index(fields=["device", "recorded_at"]),
            models.Index(fields=["device", "metric", "recorded_at"]),
        ]
        ordering = ["-recorded_at"]

    def __str__(self) -> str:
        return f"{self.device_id} {self.metric}={self.value}{self.unit} @ {self.recorded_at.isoformat()}"


class Alert(models.Model):
    """
    Alert related to a device (e.g., threshold exceeded).
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="alerts")
    type = models.CharField(max_length=48)  
    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "alert"
        indexes = [
            models.Index(fields=["device", "created_at"]),
            models.Index(fields=["resolved", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.type}] {self.device_id} - {'RESOLVED' if self.resolved else 'OPEN'}"
