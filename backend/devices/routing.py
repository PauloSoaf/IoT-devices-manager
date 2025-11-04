from django.urls import re_path
from .consumers import MeasurementStreamConsumer

websocket_urlpatterns = [
    re_path(r"^ws/measurements/(?P<public_id>[0-9a-f-]+)/$", MeasurementStreamConsumer.as_asgi()),
]