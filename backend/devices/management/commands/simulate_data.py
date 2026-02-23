"""
Management command that continuously generates realistic IoT measurements
for every active device.  Each new Measurement triggers the existing
post_save signal, which updates device.last_seen_at and broadcasts
via WebSocket.

Usage
-----
    python manage.py simulate_data              # default 5 s interval
    python manage.py simulate_data --interval 2 # every 2 s
"""
import random
import time

from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal

from devices.models import Device, Measurement, DeviceStatus


# Realistic value ranges per metric type
METRIC_RANGES = {
    "temperature": {"min": 18.0, "max": 35.0, "unit": "°C", "precision": 1},
    "humidity":    {"min": 30.0, "max": 90.0, "unit": "%",  "precision": 1},
    "power":      {"min": 100.0, "max": 2500.0, "unit": "W", "precision": 1},
    "energy":     {"min": 0.5, "max": 50.0, "unit": "kWh",  "precision": 2},
}

# Map category keywords → metric type
CATEGORY_METRIC_MAP = {
    "temperature": "temperature",
    "humidity":    "humidity",
    "energy":     "energy",
    "power":      "power",
}


def _metric_for_device(device: Device) -> str:
    """Guess the best metric type from the device's category name."""
    cat_lower = device.category.name.lower()
    for keyword, metric in CATEGORY_METRIC_MAP.items():
        if keyword in cat_lower:
            return metric
    return "temperature"  # fallback


class Command(BaseCommand):
    help = "Continuously generate random measurements for all active devices."

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=int,
            default=5,
            help="Seconds between each batch of measurements (default: 5)",
        )

    def handle(self, *args, **options):
        interval = options["interval"]
        self.stdout.write(
            self.style.SUCCESS(
                f"[simulate_data] Starting – one measurement per active device every {interval}s.  Ctrl+C to stop."
            )
        )

        # Keep a "last value" per device so readings drift realistically
        last_values: dict[int, float] = {}

        try:
            while True:
                devices = list(
                    Device.objects.select_related("category")
                    .filter(status=DeviceStatus.ACTIVE)
                )
                if not devices:
                    self.stdout.write("[simulate_data] No active devices – waiting…")
                    time.sleep(interval)
                    continue

                now = timezone.now()
                for dev in devices:
                    metric = _metric_for_device(dev)
                    spec = METRIC_RANGES.get(metric, METRIC_RANGES["temperature"])

                    # Drift from the previous value or start randomly
                    prev = last_values.get(dev.id)
                    if prev is None:
                        value = random.uniform(spec["min"], spec["max"])
                    else:
                        drift = random.uniform(-2.0, 2.0)
                        value = max(spec["min"], min(spec["max"], prev + drift))

                    value = round(value, spec["precision"])
                    last_values[dev.id] = value

                    Measurement.objects.create(
                        device=dev,
                        metric=metric,
                        value=Decimal(str(value)),
                        unit=spec["unit"],
                        recorded_at=now,
                    )
                    self.stdout.write(
                        f"  {dev.name} → {metric}={value}{spec['unit']}"
                    )

                self.stdout.write(
                    f"[simulate_data] {len(devices)} measurement(s) created – sleeping {interval}s"
                )
                time.sleep(interval)

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("\n[simulate_data] Stopped."))
