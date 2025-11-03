# backend/config/settings.py
import os
from pathlib import Path

# Base
BASE_DIR = Path(__file__).resolve().parent.parent

# Segurança e execução (via .env quando estiver no Docker)
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")

# Aplicativos instalados
INSTALLED_APPS = [
    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Terceiros (API/Docs)
    "rest_framework",
    "drf_spectacular",

    # Apps locais
    "core",
]

# Middleware padrão
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Rotas principais
ROOT_URLCONF = "config.urls"

# Templates padrão
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],  # adicione pastas de templates aqui se precisar
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Banco de dados
# - Se existir POSTGRES_HOST no ambiente, usa Postgres (Docker).
# - Caso contrário, usa SQLite (modo local sem Docker).
if os.getenv("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "iotdb"),
            "USER": os.getenv("POSTGRES_USER", "iotuser"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "iotpass"),
            "HOST": os.getenv("POSTGRES_HOST", "db"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Validação de senhas (padrão Django)
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internacionalização
LANGUAGE_CODE = "en-us"  # se preferir: "pt-br"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Arquivos estáticos
STATIC_URL = "static/"

# Campo padrão de chave primária
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework + OpenAPI (Swagger via drf-spectacular)
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # (JWT entra na próxima etapa, então não setamos DEFAULT_AUTHENTICATION_CLASSES ainda)
}

SPECTACULAR_SETTINGS = {
    "TITLE": "IoT Monitoring API",
    "DESCRIPTION": "API para dispositivos, medições e alertas",
    "VERSION": "0.1.0",
}
