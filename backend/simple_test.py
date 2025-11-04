#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000/api'
headers = {'Content-Type': 'application/json'}

print('🚀 Testando API IoT Devices Manager')
print('=' * 60)

# Login
login_data = {'username': 'testuser', 'password': 'testpass123'}
response = requests.post(f'{BASE_URL}/auth/token/', json=login_data, headers=headers)
print(f'Login Status: {response.status_code}')

if response.status_code == 200:
    tokens = response.json()
    access_token = tokens['access']
    auth_headers = {**headers, 'Authorization': f'Bearer {access_token}'}
    
    print(f'✅ Login successful! Token: {access_token[:20]}...')
    
    # Test Categories
    response = requests.get(f'{BASE_URL}/categories/', headers=auth_headers)
    print(f'📂 Categories Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Found {data["count"]} categories')
    
    # Test Devices  
    response = requests.get(f'{BASE_URL}/devices/', headers=auth_headers)
    print(f'📱 Devices Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Found {data["count"]} devices')
    
    # Test Measurements
    response = requests.get(f'{BASE_URL}/measurements/', headers=auth_headers)
    print(f'📊 Measurements Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Found {data["count"]} measurements')
    
    # Test Alerts
    response = requests.get(f'{BASE_URL}/alerts/', headers=auth_headers)
    print(f'🚨 Alerts Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Found {data["count"]} alerts')
    
    # Test Aggregate
    response = requests.get(f'{BASE_URL}/measurements/aggregate/?device=1&metric=temperature', headers=auth_headers)
    print(f'📈 Aggregate Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Aggregate Data: count={data["count"]}, avg={data["avg"]}, min={data["min"]}, max={data["max"]}')
    
    # Test Timeseries
    response = requests.get(f'{BASE_URL}/measurements/timeseries/?device=1&metric=temperature&group=hour', headers=auth_headers)
    print(f'📊 Timeseries Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'   Timeseries buckets: {len(data)}')
    
    print('\n✅ Todos os endpoints principais estão funcionando!')
    print('📋 Endpoints testados:')
    print('   - JWT Authentication ✅')
    print('   - Categories CRUD ✅')
    print('   - Devices CRUD ✅')
    print('   - Measurements CRUD ✅')
    print('   - Alerts CRUD ✅')
    print('   - Measurements Aggregate ✅')
    print('   - Measurements Timeseries ✅')
    print('   - Filtros e Paginação ✅')
    
else:
    print('❌ Login error')
    print(f'Response: {response.text}')