# AI-Enabled Smart Logistics Platform for North Eastern Region (SIH Problem ID: 26002)

An intelligent logistics, dynamic spatial routing, and disaster-hazard resilient supply chain management platform built specifically for the unique terrain, road network, and logistical challenges of the North Eastern Region (NER) of India.

---

## 100% Full-Stack TypeScript Architecture

```tree
hackheritage_project/
├── frontend/                 # Full-Stack Next.js 14+ App Router Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/          # Serverless Native API Route Handlers
│   │   │   │   ├── auth/     # Login, Signup, Brevo & Fast2SMS Dual-OTP
│   │   │   │   ├── route/    # Backward-compatible routing alias
│   │   │   │   ├── routing/  # OSRM Driving Engine + Turf.js Multi-Waypoint Detour
│   │   │   │   ├── health/   # System Diagnostics
│   │   │   │   ├── hubs/     # Regional Supply Hubs Feed
│   │   │   │   └── disruptions/ # Active & Injected Road Hazards (RBAC Protected)
│   │   │   ├── layout.tsx    # Root layout with AuthProvider & AuthModal
│   │   │   ├── page.tsx      # Operations & Simulation Dashboard
│   │   │   └── globals.css   # Custom Leaflet Dark styles & hazard pulses
│   │   ├── components/
│   │   │   ├── Auth/         # Dual-Portal AuthModal (Citizen vs 10 SDMA / BRO Agencies)
│   │   │   ├── Dashboard/    # Header, StatsOverview, RoutePlanner, DisruptionAlerts,
│   │   │   │                 # ShipmentFeed, HazardSimulationModal, AlternateHubRecommender
│   │   │   └── Map/          # Interactive Leaflet Map & Dynamic SSR Client with Simulation click
│   │   ├── context/          # AuthContext with session persistence & dual-channel OTP
│   │   ├── lib/
│   │   │   ├── brevo.ts      # Brevo REST API v3 Email OTP Engine
│   │   │   ├── sms.ts        # Fast2SMS REST API Mobile SMS OTP Engine (India +91)
│   │   │   ├── spatial.ts    # Turf.js Spatial Engine (buffer, collision, bypass, multi-hub, cargo ETA)
│   │   │   ├── supabaseClient.ts # Supabase PostGIS Client & Regional Fallback Feeds
│   │   │   └── api.ts        # Client API SDK
│   │   └── types/            # TypeScript Interfaces (Hubs, Hazards, Routes, Cargo, UserProfile)
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.local.example
└── supabase/                 # Spatial Database Schemas & PostGIS Scripts
    └── schema.sql            # PostGIS schema, triggers, user_profiles table, & 10 Official Accounts
```

---

## Authentication & Verification Pipeline

### 1. Dual-Channel OTP Engine (Citizen Registration)
- **Email Verification**: Brevo (Sendinblue) Transactional Email REST API v3 (`https://api.brevo.com/v3/smtp/email`) with branded dark-themed HTML templates and 6-digit codes.
- **Mobile SMS Verification**: Fast2SMS REST API (`https://www.fast2sms.com/dev/bulkV2`) for Indian (+91) phone numbers.
- 10-minute code expiry and server-side verification cache (`/api/auth/verify-otp`).

### 2. Multi-Agency Government Terminal (10 Authorities)
- Pre-authorized defense & disaster management authority accounts:
  - **BRO HQ (National/Regional)**: `bro.hq@nic.in` | `BRO@Command2026`
  - **NDMA NER (National/Regional)**: `ndma.ner@gov.in` | `NDMA@Emergency2026`
  - **Assam (ASDMA)**: `assam.asdma@gov.in` | `ASDMA@Disaster2026`
  - **Meghalaya (MSDMA)**: `meghalaya.msdma@gov.in` | `MSDMA@Meghalaya2026`
  - **Arunachal Pradesh (APSDMA)**: `arunachal.apsdma@gov.in` | `APSDMA@Itanagar2026`
  - **Nagaland (NSDMA)**: `nagaland.nsdma@gov.in` | `NSDMA@Kohima2026`
  - **Manipur (ManiSDMA)**: `manipur.manisdma@gov.in` | `ManiSDMA@Imphal2026`
  - **Mizoram (DM&R)**: `mizoram.dmr@gov.in` | `DMR@Aizawl2026`
  - **Tripura (TDMA)**: `tripura.tdma@gov.in` | `TDMA@Agartala2026`
  - **Sikkim (SSDMA)**: `sikkim.ssdma@gov.in` | `SSDMA@Gangtok2026`
  - **Public Citizen Demo**: `citizen.demo@example.com` | `Citizen@2026`

---

## Getting Started

### 1. Database Setup
Paste and run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

### 2. Configure Environment
In `frontend/.env.local`:
```env
# Brevo (Sendinblue)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@nersmartlogistics.in
BREVO_SENDER_NAME=NER Smart Logistics Platform

# Fast2SMS
FAST2SMS_API_KEY=your-fast2sms-api-key
```

### 3. Run Development Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
