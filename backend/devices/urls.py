from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, DeviceViewSet, MeasurementViewSet, AlertViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"devices", DeviceViewSet, basename="device")
router.register(r"measurements", MeasurementViewSet, basename="measurement")
router.register(r"alerts", AlertViewSet, basename="alert")

urlpatterns = router.urls