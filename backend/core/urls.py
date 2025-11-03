from django.urls import path
from .views import health, register

urlpatterns = [
    path("health", health, name="health"),
    path("auth/register", register, name="auth-register"),
]
