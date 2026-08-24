# NER Smart Logistics Platform - Corridor Intelligence AI Microservice

A production-grade FastAPI microservice designed for **disaster-resilient logistics in the North Eastern Region (NER) of India**. It combines **Google Search Grounded Gemini AI** to monitor real-time road conditions (landslides, flash floods, BRO/ASDMA bulletins) with **OSRM Driving Routing** and priority-aware mountain detour calculations.

---

## Features

- **Search-Grounded Road Intelligence**: Uses the official `google-genai` SDK with Google Search Grounding to evaluate live advisories from ASDMA, BRO, NHIDCL, and State Police.
- **OSRM Driving Engine**: Computes high-precision GeoJSON route linestrings between Northeast Indian supply hubs.
- **Priority-Aware Mountain Detours**: Automatically computes bypass waypoints and applies mountain terrain slowdown multipliers (`1.35x - 1.50x`) when landslides, floods, or high-risk corridors are detected.
- **Resilient Fallback Design**: Built-in heuristic intelligence and Bezier mountain geometry generator to guarantee 100% uptime during network dropouts or API quota limits.
- **Production Security**: Header-based API key verification (`X-AI-API-KEY`) and full CORS support for Next.js / React web applications.

---

## Directory Structure

```
ai_model/
├── .env.example              # Environment variables template
├── .env                      # Local configuration
├── requirements.txt          # Production dependencies
├── main.py                   # FastAPI application & endpoints
├── test_client.py            # Integration test suite
├── services/
│   ├── __init__.py
│   ├── gemini_search.py      # Google GenAI Search Grounding & hazard scoring
│   └── routing_engine.py     # OSRM routing & mountain detour calculations
└── README.md
```

---

## Quickstart Guide

### 1. Installation

```bash
# Optional: Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Setup

Copy `.env.example` to `.env` and set your Google Gemini API key:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
AI_SERVICE_API_KEY=ner_ai_live_secret_key_2026
PORT=8000
```

### 3. Run the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## API Reference

### 1. Health Check
`GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "ner-logistics-ai",
  "version": "1.0.0",
  "timestamp": "2026-08-23T17:26:35.992467+00:00"
}
```

---

### 2. Corridor Intelligence Assessment
`POST /api/v1/corridor-intelligence`

**Headers:**
- `X-AI-API-KEY`: `ner_ai_live_secret_key_2026`
- `Content-Type`: `application/json`

**Request Body:**
```json
{
  "origin_name": "Guwahati Depot",
  "origin_coords": [26.1445, 91.7362],
  "destination_name": "Imphal Hub",
  "destination_coords": [24.8170, 93.9368],
  "urgency_tier": 1,
  "highway_context": "NH-29 via Kohima"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "ai_risk_assessment": {
    "is_hazardous": true,
    "hazard_type": "LANDSLIDE",
    "severity": "HIGH",
    "summary": "High risk of monsoon landslides and rockfall along the Guwahati Depot to Imphal Hub mountain corridor (NH-29/NH-2). Caution advised.",
    "risk_score": 75
  },
  "route_geometry": [
    [91.7362, 26.1445],
    [91.7371, 26.1450],
    ...
    [93.9368, 24.8170]
  ],
  "distance_km": 648.9,
  "duration_hrs": 12.1,
  "rerouted": true
}
```

---

## Testing

Run the automated integration test suite:

```bash
python test_client.py
```
