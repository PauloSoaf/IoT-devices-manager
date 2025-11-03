from django.contrib import admin
from .models import Category, Device, Measurement, Alert


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("name", "public_id", "category", "status", "last_seen_at", "created_at")
    list_filter = ("status", "category")
    search_fields = ("name", "public_id")
    readonly_fields = ("public_id", "created_at", "updated_at")


@admin.register(Measurement)
class MeasurementAdmin(admin.ModelAdmin):
    list_display = ("device", "metric", "value", "unit", "recorded_at", "created_at")
    list_filter = ("metric", "unit")
    search_fields = ("device__name",)
    date_hierarchy = "recorded_at"


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("device", "type", "resolved", "created_at", "resolved_at")
    list_filter = ("type", "resolved")
    search_fields = ("device__name", "type")
