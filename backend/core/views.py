from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiExample
from .serializers import HealthSerializer

@extend_schema(
    summary="Healthcheck da API",
    description="Retorna o status simples da API.",
    responses={200: HealthSerializer},
    examples=[OpenApiExample("OK", value={"status": "ok"})],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})
