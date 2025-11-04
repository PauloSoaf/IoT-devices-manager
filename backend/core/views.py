from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .serializers import HealthSerializer, RegisterSerializer


@extend_schema(
    operation_id="health",
    summary="API Healthcheck",
    description="Returns service status.",
    responses=HealthSerializer,
    tags=["health"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "version": "0.1.0"})


@extend_schema(
    operation_id="register",
    summary="User registration",
    description="Creates a new user.",
    request=RegisterSerializer,
    responses={201: RegisterSerializer},
    tags=["auth"],
)
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response(RegisterSerializer(user).data, status=status.HTTP_201_CREATED)


@extend_schema(
    operation_id="me",
    summary="Authenticated user profile",
    description="Returns the authenticated user's data.",
    responses={200: RegisterSerializer},
    tags=["auth"],
)
@api_view(["GET"]) 
@permission_classes([IsAuthenticated])
def me(request):
    return Response(RegisterSerializer(request.user).data)
