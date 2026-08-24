import os
import logging
from datetime import datetime, timezone
from typing import List, Optional, Literal, Union, Any, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Security, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader, APIKeyQuery
from pydantic import BaseModel, Field

from services.gemini_search import (
    search_corridor_disruptions,
    analyze_multiple_candidate_routes,
    chat_road_disruptions,
    analyze_corridor_dual_stream,
)
from services.routing_engine import get_driving_route

# Load environment variables
load_dotenv()

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ner_corridor_intelligence")

# Security Configuration
API_KEY_NAME = "X-AI-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)
EXPECTED_API_KEY = os.getenv("AI_SERVICE_API_KEY", "ner_ai_live_secret_key_2026")

# FastAPI App
app = FastAPI(
    title="NER Smart Logistics Platform - Corridor Intelligence AI",
    description="Production-grade AI microservice for disaster-resilient supply chain routing across Northeast India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production-ready for Next.js, mobile clients, and web dashboards
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Dependency
async def verify_api_key(
    header_key: Optional[str] = Security(api_key_header),
    query_key: Optional[str] = Security(api_key_query)
):
    """Verifies incoming requests against the configured microservice secret key."""
    provided_key = header_key or query_key
    if not provided_key or provided_key != EXPECTED_API_KEY:
        logger.warning(f"Unauthorized access attempt with key: '{provided_key}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing AI Service API Key. Provide valid 'X-AI-API-KEY' header.",
        )
    return provided_key


# Pydantic Schemas
class CorridorRequest(BaseModel):
    origin_name: str = Field(..., example="Guwahati Depot", description="Name of source hub or location")
    origin_coords: List[float] = Field(
        ..., example=[26.1445, 91.7362], description="[latitude, longitude] of origin"
    )
    destination_name: str = Field(..., example="Imphal Hub", description="Name of destination hub or location")
    destination_coords: List[float] = Field(
        ..., example=[24.8170, 93.9368], description="[latitude, longitude] of destination"
    )
    urgency_tier: Union[int, str] = Field(
        1,
        example=1,
        description="Priority Tier: 1 = Critical/Disaster Relief, 2 = Essential Supplies, 3 = Standard Commercial",
    )
    highway_context: Optional[str] = Field(
        "",
        example="NH-29 via Kohima",
        description="Optional highway or route descriptor for targeted bulletin grounding",
    )


class AIRiskAssessment(BaseModel):
    is_hazardous: bool
    hazard_type: Literal["NONE", "LANDSLIDE", "FLASH_FLOOD", "ROAD_BLOCKAGE", "WEATHER_ALERT"]
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    summary: str
    risk_score: int = Field(..., ge=0, le=100)


class CorridorResponse(BaseModel):
    status: str
    ai_risk_assessment: AIRiskAssessment
    route_geometry: List[List[float]] = Field(..., description="GeoJSON coordinates linestring [[lon, lat], ...]")
    distance_km: float
    duration_hrs: float
    rerouted: bool


# Multi-Route Alternative Exploration Schemas
class CandidateRouteInput(BaseModel):
    route_id: int = Field(..., example=0, description="Unique candidate route index")
    route_title: str = Field(..., example="Primary Direct Corridor (via NH-29)", description="Descriptive route name")
    distance_km: float = Field(..., example=74.2, description="Route distance in km")
    duration_hrs: float = Field(..., example=2.1, description="Estimated transit duration in hours")
    highway_summary: Optional[str] = Field("", description="Key highway or waypoint summary")
    waypoints_summary: Optional[str] = Field("", description="Waypoint summary string")


class MultiRouteAnalysisRequest(BaseModel):
    origin_name: str = Field(..., example="Dimapur Depot", description="Origin hub name")
    destination_name: str = Field(..., example="Kohima Hub", description="Destination hub name")
    urgency_tier: Union[int, str] = Field(1, description="Priority urgency level (1, 2, or 3)")
    candidate_routes: List[CandidateRouteInput] = Field(
        ..., description="Array of candidate routes to analyze independently"
    )


class PerRouteRiskEvaluation(BaseModel):
    route_id: int
    route_title: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    risk_score: int = Field(..., ge=0, le=100)
    hazards_detected: List[str] = Field(default_factory=list)
    recommended: bool
    ai_brief: str


class MultiRouteAnalysisResponse(BaseModel):
    status: str
    origin_name: str
    destination_name: str
    evaluations: List[PerRouteRiskEvaluation]
    recommended_route_id: int


# Context-Bounded Gemini Road Disruption Assistant Schemas
class DisruptionChatRequest(BaseModel):
    query: str = Field(..., example="Is NH-29 safe to travel right now?", description="Natural language question about road conditions")
    disruptions: Optional[List[Dict[str, Any]]] = Field(None, description="Optional override list of active disruptions from client")
    broadcasts: Optional[List[Dict[str, Any]]] = Field(None, description="Optional override list of active emergency broadcasts from client")
    session_id: Optional[str] = Field(None, description="Client session identifier")


class DisruptionChatResponse(BaseModel):
    status: str = "success"
    answer: str
    cited_disruptions: List[Dict[str, Any]] = Field(default_factory=list)
    confidence_score: float = 0.98
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# Dual-Stream Corridor Threat Assessment Schemas
class DualStreamCorridorRequest(BaseModel):
    origin_name: str = Field(..., example="Dimapur Depot")
    origin_coords: List[float] = Field(..., example=[25.9068, 93.7271])
    destination_name: str = Field(..., example="Kohima Hub")
    destination_coords: List[float] = Field(..., example=[25.6751, 94.1086])
    highway_context: Optional[str] = Field("", example="NH-29")


class GovDisruptionItem(BaseModel):
    government_body: str
    severity: str
    highway: str
    message: str
    coordinates: List[float]
    distance_to_route_km: float


class GovernmentAuthorizedData(BaseModel):
    has_disruptions: bool
    records: List[GovDisruptionItem] = Field(default_factory=list)
    official_summary: str


class InternetLiveIntelligence(BaseModel):
    has_weather_warnings: bool
    sources: List[str] = Field(default_factory=list)
    weather_advisory: str
    live_traffic_status: str
    web_summary: str


class DualStreamCorridorResponse(BaseModel):
    status: str = "success"
    origin_name: str
    destination_name: str
    government_authorized_data: GovernmentAuthorizedData
    internet_live_intelligence: InternetLiveIntelligence


# Endpoints
@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint providing microservice status and timestamp."""
    return {
        "status": "healthy",
        "service": "ner-logistics-ai",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", tags=["Root"])
async def root():
    """Root info endpoint."""
    return {
        "message": "NER Smart Logistics Platform - Corridor Intelligence AI Microservice",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
    }


@app.post(
    "/api/v1/corridor-intelligence",
    response_model=CorridorResponse,
    tags=["Corridor Intelligence"],
    dependencies=[Depends(verify_api_key)],
)
async def analyze_corridor_intelligence(request: CorridorRequest):
    """
    Evaluates real-time road disruptions along the transit corridor via Google Search Grounding
    and returns risk-aware driving geometry with mountain terrain detour calculations.
    """
    # Normalize urgency tier
    urgency = 1
    if isinstance(request.urgency_tier, int):
        urgency = request.urgency_tier
    elif isinstance(request.urgency_tier, str):
        if "1" in request.urgency_tier or "CRITICAL" in request.urgency_tier.upper():
            urgency = 1
        elif "2" in request.urgency_tier or "ESSENTIAL" in request.urgency_tier.upper():
            urgency = 2
        else:
            urgency = 3

    logger.info(
        f"Processing corridor intelligence: '{request.origin_name}' -> '{request.destination_name}' (Urgency Tier {urgency})"
    )

    try:
        # Step 1: Live search-grounded hazard intelligence
        assessment = search_corridor_disruptions(
            origin_name=request.origin_name,
            dest_name=request.destination_name,
            highway_context=request.highway_context or "",
        )

        risk_score = assessment.get("risk_score", 0)
        severity = assessment.get("severity", "LOW")
        is_hazardous = assessment.get("is_hazardous", False)

        # Step 2: Intelligent Detour & Rerouting Decision
        should_reroute = (
            severity in ["HIGH", "CRITICAL"]
            or risk_score >= 60
            or (urgency == 1 and is_hazardous and risk_score >= 40)
        )

        # Step 3: Compute driving route geometry (OSRM engine with mountain detour handling)
        route_data = get_driving_route(
            origin_coords=request.origin_coords,
            dest_coords=request.destination_coords,
            avoid_hazard=should_reroute,
        )

        return CorridorResponse(
            status="success",
            ai_risk_assessment=AIRiskAssessment(**assessment),
            route_geometry=route_data.get("coordinates", []),
            distance_km=route_data.get("distance_km", 0.0),
            duration_hrs=route_data.get("duration_hrs", 0.0),
            rerouted=should_reroute,
        )

    except Exception as e:
        logger.error(f"Error processing corridor request: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Corridor intelligence calculation failed: {str(e)}",
        )


@app.post(
    "/analyze-routes",
    response_model=List[PerRouteRiskEvaluation],
    tags=["Corridor Intelligence"],
    dependencies=[Depends(verify_api_key)],
)
@app.post(
    "/api/v1/analyze-routes",
    response_model=List[PerRouteRiskEvaluation],
    tags=["Corridor Intelligence"],
    dependencies=[Depends(verify_api_key)],
)
async def analyze_multiple_candidate_routes_endpoint(request: Union[MultiRouteAnalysisRequest, List[CandidateRouteInput], Dict[str, Any]]):
    """
    Evaluates an array of candidate transit corridors independently against live disaster bulletins,
    weather advisories, and terrain vulnerabilities using Google Search-grounded Gemini AI.
    Returns structured JSON array analyzing EACH candidate route path.
    """
    try:
        origin_name = "Origin Hub"
        dest_name = "Destination Hub"
        urgency = 1
        candidate_dicts: List[Dict[str, Any]] = []

        if isinstance(request, MultiRouteAnalysisRequest):
            origin_name = request.origin_name
            dest_name = request.destination_name
            candidate_dicts = [r.dict() for r in request.candidate_routes]
            if isinstance(request.urgency_tier, int):
                urgency = request.urgency_tier
            elif isinstance(request.urgency_tier, str):
                if "1" in request.urgency_tier or "CRITICAL" in request.urgency_tier.upper():
                    urgency = 1
                elif "2" in request.urgency_tier or "ESSENTIAL" in request.urgency_tier.upper():
                    urgency = 2
                else:
                    urgency = 3
        elif isinstance(request, list):
            candidate_dicts = [r.dict() if hasattr(r, "dict") else dict(r) for r in request]
        elif isinstance(request, dict):
            origin_name = request.get("origin_name", "Origin Hub")
            dest_name = request.get("destination_name", "Destination Hub")
            raw_urgency = request.get("urgency_tier", 1)
            if isinstance(raw_urgency, int):
                urgency = raw_urgency
            elif isinstance(raw_urgency, str) and ("1" in raw_urgency or "CRITICAL" in raw_urgency.upper()):
                urgency = 1
            elif isinstance(raw_urgency, str) and ("2" in raw_urgency or "ESSENTIAL" in raw_urgency.upper()):
                urgency = 2
            else:
                urgency = 3
            raw_candidates = request.get("candidate_routes", request.get("routes", []))
            candidate_dicts = [r.dict() if hasattr(r, "dict") else dict(r) for r in raw_candidates]

        logger.info(
            f"Processing multi-route analysis for {len(candidate_dicts)} candidate corridors: '{origin_name}' -> '{dest_name}' (Urgency Tier {urgency})"
        )

        raw_evaluations = analyze_multiple_candidate_routes(
            origin_name=origin_name,
            dest_name=dest_name,
            candidate_routes=candidate_dicts,
            urgency_tier=urgency,
        )

        evaluations = [PerRouteRiskEvaluation(**ev) for ev in raw_evaluations]
        return evaluations

    except Exception as e:
        logger.error(f"Multi-route analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-route risk analysis failed: {str(e)}",
        )


@app.post(
    "/api/chat-disruptions",
    response_model=DisruptionChatResponse,
    tags=["Disruption Assistant"],
    dependencies=[Depends(verify_api_key)],
)
@app.post(
    "/api/v1/chat-disruptions",
    response_model=DisruptionChatResponse,
    tags=["Disruption Assistant"],
    dependencies=[Depends(verify_api_key)],
)
async def chat_disruptions_endpoint(request: DisruptionChatRequest):
    """
    Context-Bounded Gemini Road Disruption Assistant.
    Evaluates user question exclusively against live government-managed disruption database records.
    Returns grounded answers citing reporting government bodies with zero hallucination.
    """
    try:
        logger.info(f"Disruption chat query received: '{request.query}'")
        res = chat_road_disruptions(
            query=request.query,
            disruptions=request.disruptions,
            broadcasts=request.broadcasts,
        )
        return DisruptionChatResponse(
            status="success",
            answer=res.get("answer", "No active government-reported disruptions are recorded for this corridor."),
            cited_disruptions=res.get("cited_disruptions", []),
            confidence_score=res.get("confidence_score", 0.98),
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        logger.error(f"Disruption chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disruption chat assistant error: {str(e)}",
        )


@app.post(
    "/api/analyze-corridor-dual",
    response_model=DualStreamCorridorResponse,
    tags=["Corridor Intelligence"],
    dependencies=[Depends(verify_api_key)],
)
@app.post(
    "/api/v1/analyze-corridor-dual",
    response_model=DualStreamCorridorResponse,
    tags=["Corridor Intelligence"],
    dependencies=[Depends(verify_api_key)],
)
async def analyze_corridor_dual_endpoint(request: DualStreamCorridorRequest):
    """
    Dual-Stream Corridor Threat Assessment.
    Returns strictly segregated response:
    1. government_authorized_data (strictly from Supabase database)
    2. internet_live_intelligence (Google Search grounded real-time weather & traffic)
    """
    try:
        logger.info(
            f"Processing dual-stream corridor intelligence: '{request.origin_name}' -> '{request.destination_name}' ({request.highway_context})"
        )
        res = analyze_corridor_dual_stream(
            origin_name=request.origin_name,
            origin_coords=request.origin_coords,
            dest_name=request.destination_name,
            dest_coords=request.destination_coords,
            highway_context=request.highway_context or "",
        )
        return res
    except Exception as e:
        logger.error(f"Dual-stream corridor analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dual-stream intelligence failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
