from django.urls import path
from .views import health, register, me

urlpatterns = [
    path("health", health, name="health"),
    path("auth/register", register, name="auth-register"),
    path("auth/me", me, name="auth-me"),
]
