from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Measurement, Device, DeviceStatus


@receiver(post_save, sender=Measurement)
def update_device_last_seen(sender, instance: Measurement, created: bool, **kwargs):
    if not created:
        return
    Device.objects.filter(id=instance.device_id).update(
        last_seen_at=instance.recorded_at or timezone.now(),
        status=DeviceStatus.ACTIVE, 
    )
