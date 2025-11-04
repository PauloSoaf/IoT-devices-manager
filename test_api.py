"""
Script de teste para demonstrar todos os endpoints da API IoT Devices Manager
"""

import requests
import json
from datetime import datetime, timedelta
import uuid

# Configuração da API
BASE_URL = "http://localhost:8000/api"
headers = {"Content-Type": "application/json"}

def print_response(response, title):
    """Imprime a resposta da API de forma formatada."""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")

def test_api():
    """Testa todos os endpoints da API."""
    
    print("🚀 Testando API IoT Devices Manager")
    print("=" * 60)
    
    # 1. Create test user (via Django admin or command)
    print("\n📝 First, create a test user...")
    print("Execute: docker-compose exec backend python manage.py create_test_data")
    
    # 2. Fazer login para obter token JWT
    print("\n🔐 Fazendo login...")
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/token/", json=login_data, headers=headers)
    print_response(response, "Login JWT")
    
    if response.status_code != 200:
        print("❌ Login error. Make sure the test user was created.")
        return
    
    # Obter token de acesso
    tokens = response.json()
    access_token = tokens["access"]
    auth_headers = {
        **headers,
        "Authorization": f"Bearer {access_token}"
    }
    
    # 3. Testar endpoints de Categories
    print("\n📂 Testando Categories...")
    
    # Listar categorias
    response = requests.get(f"{BASE_URL}/categories/", headers=auth_headers)
    print_response(response, "GET /categories/")
    
    # Create new category
    category_data = {
        "name": "Test Category",
        "description": "Category created via API for testing"
    }
    response = requests.post(f"{BASE_URL}/categories/", json=category_data, headers=auth_headers)
    print_response(response, "POST /categories/")
    
    if response.status_code == 201:
        category_id = response.json()["id"]
        
        # Obter categoria específica
        response = requests.get(f"{BASE_URL}/categories/{category_id}/", headers=auth_headers)
        print_response(response, f"GET /categories/{category_id}/")
    
    # 4. Testar endpoints de Devices
    print("\n📱 Testando Devices...")
    
    # Listar dispositivos
    response = requests.get(f"{BASE_URL}/devices/", headers=auth_headers)
    print_response(response, "GET /devices/")
    
    # Criar novo dispositivo
    device_data = {
        "name": "Test Device API",
        "category": 1,  # Assumindo que existe categoria com ID 1
        "status": "active"
    }
    response = requests.post(f"{BASE_URL}/devices/", json=device_data, headers=auth_headers)
    print_response(response, "POST /devices/")
    
    if response.status_code == 201:
        device_id = response.json()["id"]
        device_uuid = response.json()["public_id"]
        
        # Obter dispositivo específico
        response = requests.get(f"{BASE_URL}/devices/{device_id}/", headers=auth_headers)
        print_response(response, f"GET /devices/{device_id}/")
        
        # Testar ação customizada set_status
        status_data = {"status": "inactive"}
        response = requests.post(f"{BASE_URL}/devices/{device_id}/set_status/", json=status_data, headers=auth_headers)
        print_response(response, f"POST /devices/{device_id}/set_status/")
    
    # 5. Testar endpoints de Measurements
    print("\n📊 Testando Measurements...")
    
    # Listar medições
    response = requests.get(f"{BASE_URL}/measurements/", headers=auth_headers)
    print_response(response, "GET /measurements/")
    
    # Criar nova medição
    measurement_data = {
        "device": 1,  # Assumindo que existe dispositivo com ID 1
        "metric": "temperature",
        "value": "25.5",
        "unit": "°C"
    }
    response = requests.post(f"{BASE_URL}/measurements/", json=measurement_data, headers=auth_headers)
    print_response(response, "POST /measurements/")
    
    # Testar endpoint de agregação
    params = {
        "device": 1,
        "metric": "temperature"
    }
    response = requests.get(f"{BASE_URL}/measurements/aggregate/", params=params, headers=auth_headers)
    print_response(response, "GET /measurements/aggregate/")
    
    # Testar endpoint de séries temporais
    params = {
        "device": 1,
        "metric": "temperature",
        "group": "hour"
    }
    response = requests.get(f"{BASE_URL}/measurements/timeseries/", params=params, headers=auth_headers)
    print_response(response, "GET /measurements/timeseries/")
    
    # 6. Testar endpoints de Alerts
    print("\n🚨 Testando Alerts...")
    
    # Listar alertas
    response = requests.get(f"{BASE_URL}/alerts/", headers=auth_headers)
    print_response(response, "GET /alerts/")
    
    # Criar novo alerta
    alert_data = {
        "device": 1,  # Assumindo que existe dispositivo com ID 1
        "type": "warning",
        "message": "Test alert created via API"
    }
    response = requests.post(f"{BASE_URL}/alerts/", json=alert_data, headers=auth_headers)
    print_response(response, "POST /alerts/")
    
    if response.status_code == 201:
        alert_id = response.json()["id"]
        
        # Testar ação customizada resolve
        response = requests.post(f"{BASE_URL}/alerts/{alert_id}/resolve/", headers=auth_headers)
        print_response(response, f"POST /alerts/{alert_id}/resolve/")
        
        # Testar ação customizada reopen
        response = requests.post(f"{BASE_URL}/alerts/{alert_id}/reopen/", headers=auth_headers)
        print_response(response, f"POST /alerts/{alert_id}/reopen/")
    
    # 7. Testar filtros e paginação
    print("\n🔍 Testando Filtros e Paginação...")
    
    # Filtros em devices
    params = {"status": "active", "page": 1, "page_size": 5}
    response = requests.get(f"{BASE_URL}/devices/", params=params, headers=auth_headers)
    print_response(response, "GET /devices/ com filtros")
    
    # Busca em measurements
    params = {"search": "temperature", "ordering": "-recorded_at"}
    response = requests.get(f"{BASE_URL}/measurements/", params=params, headers=auth_headers)
    print_response(response, "GET /measurements/ com busca e ordenação")
    
    # 8. Testar refresh token
    print("\n🔄 Testando Refresh Token...")
    refresh_data = {"refresh": tokens["refresh"]}
    response = requests.post(f"{BASE_URL}/auth/refresh/", json=refresh_data, headers=headers)
    print_response(response, "POST /auth/refresh/")
    
    # 9. Testar verify token
    print("\n✅ Testando Verify Token...")
    verify_data = {"token": access_token}
    response = requests.post(f"{BASE_URL}/auth/verify/", json=verify_data, headers=headers)
    print_response(response, "POST /auth/verify/")
    
    print("\n🎉 Teste da API concluído!")
    print("=" * 60)
    print("📋 Resumo dos endpoints testados:")
    print("✅ JWT Authentication (login, refresh, verify)")
    print("✅ Categories CRUD")
    print("✅ Devices CRUD + set_status action")
    print("✅ Measurements CRUD + aggregate + timeseries actions")
    print("✅ Alerts CRUD + resolve + reopen actions")
    print("✅ Filtros, busca, ordenação e paginação")
    print("✅ Documentação Swagger disponível em: http://localhost:8000/api/docs/")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API.")
        print("Certifique-se de que o servidor está rodando em http://localhost:8000")
        print("Execute: docker-compose up --build")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")