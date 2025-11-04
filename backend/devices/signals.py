from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Measurement, Device, DeviceStatus


@receiver(post_save, sender=Measurement)
def update_device_last_seen(sender, instance: Measurement, created: bool, **kwargs):
    if not created:
        return
    # Update last_seen and status
    Device.objects.filter(id=instance.device_id).update(
        last_seen_at=instance.recorded_at or timezone.now(),
        status=DeviceStatus.ACTIVE,
    )

    # Broadcast to device group
    try:
        public_id = str(instance.device.public_id)
        payload = {
            "device_public_id": public_id,
            "metric": instance.metric,
            "value": float(instance.value),
            "unit": instance.unit,
            "recorded_at": instance.recorded_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"device-{public_id}",
            {"type": "measurement_created", "data": payload},
        )
    except Exception:
        # If broadcast fails, continue without interrupting creation
        pass
