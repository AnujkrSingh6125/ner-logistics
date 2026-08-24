import json
import requests

url = "http://localhost:8000/api/v1/corridor-intelligence"
headers = {
    "X-AI-API-KEY": "ner_ai_live_secret_key_2026",
    "Content-Type": "application/json"
}
payload = {
    "origin_name": "Guwahati Depot",
    "origin_coords": [26.1445, 91.7362],
    "destination_name": "Imphal Hub",
    "destination_coords": [24.8170, 93.9368],
    "urgency_tier": 1
}

if __name__ == "__main__":
    print(f"Sending POST request to {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}\n")
        print("JSON Response:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error making request: {e}")
