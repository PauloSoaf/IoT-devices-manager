"""
ASGI config for config project with Django Channels.
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django_asgi_app = get_asgi_application()

# Import websocket URL patterns and JWT auth stack
try:
    from devices.routing import websocket_urlpatterns
    from devices.ws_auth import JWTAuthMiddlewareStack
except Exception:
    websocket_urlpatterns = []
    def JWTAuthMiddlewareStack(inner):
        return inner

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
