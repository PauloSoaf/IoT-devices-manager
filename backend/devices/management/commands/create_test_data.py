from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from devices.models import Category, Device, Measurement, Alert
import uuid


class Command(BaseCommand):
    help = 'Create test data for the IoT API'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')
        
        # Create test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(f'Created user: {user.username}')
        else:
            self.stdout.write(f'User already exists: {user.username}')
        
        # Create categories
        categories_data = [
            {'name': 'Temperature Sensors', 'description': 'Devices that measure temperature'},
            {'name': 'Humidity Sensors', 'description': 'Devices that measure humidity'},
            {'name': 'Energy Meters', 'description': 'Devices that measure energy consumption'},
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        # Create devices
        devices_data = [
            {'name': 'Temp Sensor 001', 'category': categories[0], 'status': 'active'},
            {'name': 'Temp Sensor 002', 'category': categories[0], 'status': 'active'},
            {'name': 'Humidity Sensor 001', 'category': categories[1], 'status': 'active'},
            {'name': 'Energy Meter 001', 'category': categories[2], 'status': 'inactive'},
        ]
        
        devices = []
        for dev_data in devices_data:
            device, created = Device.objects.get_or_create(
                name=dev_data['name'],
                category=dev_data['category'],
                defaults={
                    'status': dev_data['status'],
                    'last_seen_at': timezone.now()
                }
            )
            devices.append(device)
            if created:
                self.stdout.write(f'Created device: {device.name} ({device.public_id})')
        
        # Create measurements
        measurements_data = [
            {'device': devices[0], 'metric': 'temperature', 'value': Decimal('23.5'), 'unit': '°C'},
            {'device': devices[0], 'metric': 'temperature', 'value': Decimal('24.1'), 'unit': '°C'},
            {'device': devices[1], 'metric': 'temperature', 'value': Decimal('22.8'), 'unit': '°C'},
            {'device': devices[2], 'metric': 'humidity', 'value': Decimal('65.2'), 'unit': '%'},
            {'device': devices[2], 'metric': 'humidity', 'value': Decimal('67.1'), 'unit': '%'},
            {'device': devices[3], 'metric': 'power', 'value': Decimal('1250.5'), 'unit': 'W'},
        ]
        
        for meas_data in measurements_data:
            measurement = Measurement.objects.create(**meas_data)
            self.stdout.write(f'Created measurement: {measurement.device.name} - {measurement.metric}={measurement.value}{measurement.unit}')
        
        # Create alerts
        alerts_data = [
            {'device': devices[0], 'type': 'warning', 'message': 'Temperature above normal range'},
            {'device': devices[2], 'type': 'info', 'message': 'Humidity sensor calibrated'},
            {'device': devices[3], 'type': 'critical', 'message': 'Energy consumption spike detected'},
        ]
        
        for alert_data in alerts_data:
            alert = Alert.objects.create(**alert_data)
            self.stdout.write(f'Created alert: {alert.device.name} - {alert.type}: {alert.message}')
        
        self.stdout.write(self.style.SUCCESS('Test data created successfully!'))
        self.stdout.write(f'Test user credentials: testuser / testpass123')
        self.stdout.write(f'Device UUIDs:')
        for device in devices:
            self.stdout.write(f'  {device.name}: {device.public_id}')