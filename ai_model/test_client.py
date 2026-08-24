"""
Verification and Test Suite for NER Smart Logistics Corridor Intelligence AI Microservice
"""
import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    print("Testing GET /health...")
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    print(f"PASS: Health check -> {data}")

def test_auth_rejection():
    print("\nTesting unauthorized request rejection...")
    payload = {
        "origin_name": "Guwahati Depot",
        "origin_coords": [26.1445, 91.7362],
        "destination_name": "Imphal Hub",
        "destination_coords": [24.8170, 93.9368],
        "urgency_tier": 1
    }
    # No header
    response = client.post("/api/v1/corridor-intelligence", json=payload)
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print(f"PASS: Unauthorized request rejected properly (401)")

def test_corridor_intelligence_authorized():
    print("\nTesting POST /api/v1/corridor-intelligence with valid API Key...")
    headers = {"X-AI-API-KEY": "ner_ai_live_secret_key_2026"}
    payload = {
        "origin_name": "Guwahati Depot",
        "origin_coords": [26.1445, 91.7362],
        "destination_name": "Imphal Hub",
        "destination_coords": [24.8170, 93.9368],
        "urgency_tier": 1,
        "highway_context": "NH-29 via Dimapur and Kohima"
    }
    response = client.post("/api/v1/corridor-intelligence", json=payload, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Assert schema
    assert data["status"] == "success"
    assert "ai_risk_assessment" in data
    assert "route_geometry" in data
    assert len(data["route_geometry"]) > 0
    assert "distance_km" in data
    assert "duration_hrs" in data
    assert "rerouted" in data
    
    print("PASS: Corridor intelligence returned valid schema:")
    print(f"  - Risk Assessment: {data['ai_risk_assessment']}")
    print(f"  - Distance: {data['distance_km']} km")
    print(f"  - Duration: {data['duration_hrs']} hrs")
    print(f"  - Rerouted: {data['rerouted']}")
    print(f"  - Geometry points: {len(data['route_geometry'])}")

def test_clear_corridor():
    print("\nTesting Clear Corridor (Guwahati -> Shillong)...")
    headers = {"X-AI-API-KEY": "ner_ai_live_secret_key_2026"}
    payload = {
        "origin_name": "Guwahati Central Depot",
        "origin_coords": [26.1445, 91.7362],
        "destination_name": "Shillong Civil Hospital",
        "destination_coords": [25.5788, 91.8933],
        "urgency_tier": 3
    }
    response = client.post("/api/v1/corridor-intelligence", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    print(f"PASS: Guwahati -> Shillong: distance={data['distance_km']}km, duration={data['duration_hrs']}hrs, rerouted={data['rerouted']}")

def test_multi_route_analysis():
    print("\nTesting POST /analyze-routes with candidate routes...")
    headers = {"X-AI-API-KEY": "ner_ai_live_secret_key_2026"}
    payload = {
        "origin_name": "Dimapur Depot",
        "destination_name": "Kohima Hub",
        "urgency_tier": 1,
        "candidate_routes": [
            {
                "route_id": 0,
                "route_title": "Primary Direct Corridor (via NH-29)",
                "distance_km": 74.2,
                "duration_hrs": 2.1,
                "highway_summary": "via NH-29"
            },
            {
                "route_id": 1,
                "route_title": "Bypass Corridor (via NH-02)",
                "distance_km": 88.5,
                "duration_hrs": 2.4,
                "highway_summary": "via NH-02"
            }
        ]
    }
    response = client.post("/analyze-routes", json=payload, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert isinstance(data, list), f"Expected list response, got {type(data)}"
    assert len(data) == 2, f"Expected 2 evaluations, got {len(data)}"
    
    for item in data:
        assert "route_id" in item
        assert "route_title" in item
        assert "risk_level" in item
        assert "risk_score" in item
        assert "hazards_detected" in item
        assert "recommended" in item
        assert "ai_brief" in item

    print("PASS: Multi-route analysis returned structured JSON per route:")
    for item in data:
        print(f"  - Route {item['route_id']}: {item['route_title']} | Risk: {item['risk_level']} ({item['risk_score']}) | Recommended: {item['recommended']}")
        print(f"    AI Brief: {item['ai_brief']}")

def test_disruption_chat():
    print("\nTesting POST /api/chat-disruptions (Context-Bounded Assistant)...")
    headers = {"X-AI-API-KEY": "ner_ai_live_secret_key_2026"}

    # Test 1: Query about active NH-29 landslide
    payload_active = {
        "query": "Is NH-29 safe to travel right now? Any landslides reported?",
    }
    response = client.post("/api/chat-disruptions", json=payload_active, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    assert "answer" in data
    assert len(data["answer"]) > 0
    print(f"PASS: Active corridor chat response -> {data['answer'][:150]}...")

    # Test 2: Query about an unlisted corridor (strict zero-shot negative test)
    payload_unlisted = {
        "query": "Is the road between Tawang and Bomdila completely open?",
        "disruptions": [
            {
                "id": "disrupt-01",
                "title": "Major Landslide near Kohima-Dimapur Bypass",
                "disruption_type": "LANDSLIDE",
                "severity": "CRITICAL",
                "highway_reference": "NH-29",
                "government_body_name": "BRO Project Vartak",
            }
        ]
    }
    response_unlisted = client.post("/api/chat-disruptions", json=payload_unlisted, headers=headers)
    assert response_unlisted.status_code == 200
    data_unlisted = response_unlisted.json()
    assert "No active government-reported disruptions are recorded for this corridor." in data_unlisted["answer"]
    print(f"PASS: Bounded negative test returned exact required zero-shot phrase -> '{data_unlisted['answer']}'")


if __name__ == "__main__":
    print("========================================")
    print("NER AI Microservice Integration Tests")
    print("========================================")
    test_health_check()
    test_auth_rejection()
    test_corridor_intelligence_authorized()
    test_clear_corridor()
    test_multi_route_analysis()
    test_disruption_chat()
    print("\nAll integration tests passed successfully!")
