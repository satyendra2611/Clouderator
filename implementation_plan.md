# Implementation Plan - Clouderator: AI-Driven Cloud Console

Build **Clouderator**, an AI-powered Infrastructure Operating System and Cloud Console matching the provided design specifications and presentation guidelines. Users can describe their requirements in natural language, and Clouderator will recommend optimal architectures, provide cost breakdowns with payment tiers, stream real-time notifications for server health and financial budgets, and generate deployment-ready Infrastructure-as-Code (IaC).

## User Review Required

> [!IMPORTANT]
> **API & Software Requirements**:
> - **Runtime**: Node.js (already verified installed: `v24.19.0`) & npm (`11.17.0`).
> - **AI Integration**: Clouderator will include a **Dual-Mode AI Engine**:
>   1. **Built-in Intelligent Synthesis Engine**: Fully functional immediately without requiring any paid subscriptions or external API keys (handles complex architectures, cost optimization, scaling, and IaC generation).
>   2. **Live LLM Integration (Google Gemini API / OpenAI API)**: Users can optionally paste their Gemini API Key in the Settings page or `.env` file for arbitrary deep natural language reasoning.
> - **Real-Time Engine**: Built using WebSocket (`ws`) and Server-Sent Events to push live server telemetry (CPU, memory, downtime) and financial alerts (budget overruns, cost spikes).

## Key Features & Architecture

```
                                  CLOUDERATOR ARCHITECTURE
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    Frontend (SPA)                                      │
  │  ┌───────────────────────┬────────────────────────────────┬─────────────────────────┐  │
  │  │   Navigation Sidebar  │      AI Conversational Chat    │   Architecture Canvas   │  │
  │  │  - Dashboard          │  - Requirement Analyzer        │  - Route53, CDN, ALB    │  │
  │  │  - Chat + Canvas      │  - Instant Prompts ("-20% cost")│  - Auto Scaling Group  │  │
  │  │  - Cost & Budget      │  - Architecture Explanations   │  - RDS, Redis, S3       │  │
  │  │  - Monitoring         │  - Real-time action buttons    │  - Node Inspector Drawer│  │
  │  │  - AI Doctor          │                                │  - Live Flow Visualizer │  │
  │  │  - Deployment & IaC   ├────────────────────────────────┴─────────────────────────┤  │
  │  │  - Settings (API Key) │       Live Metrics Bar (Cost, Perf, Availability, Sec)   │  │
  │  └───────────────────────┴──────────────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────▲────────────────────────────────────────────┘
                                              │ REST + WebSocket (Live Alerts & Metrics)
  ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
  │                                 Backend (Node.js/Express)                              │
  │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
  │  │ 1. AI Infrastructure Architect & Requirement Analyzer (Dual-Mode: Local + Gemini)│  │
  │  │ 2. Cost Intelligence Engine (AWS/GCP/Azure pricing calculations & budget tracks) │  │
  │  │ 3. Real-Time Telemetry & Financial Alert Daemon (Server spikes, cost overruns)   │  │
  │  │ 4. AI Doctor & Bug Analyzer (Auto-diagnosis & one-click automated remediation)   │  │
  │  │ 5. IaC Generator (Terraform main.tf, Docker Compose, Kubernetes manifests)       │  │
  │  └──────────────────────────────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Project Setup & Configuration

#### [NEW] [package.json](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/package.json)
- Node.js project manifest with `express`, `ws` (WebSockets), `dotenv`, and developer scripts (`npm start`, `npm run dev`).

#### [NEW] [.env.example](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/.env.example)
- Configuration template for server port (`PORT=3000`), optional `GEMINI_API_KEY`, currency, and notification thresholds.

---

### Backend Implementation (`server/`)

#### [NEW] [server.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/server/server.js)
- Express server setup with JSON body parser, static file hosting for frontend, REST API routing, and WebSocket server setup on `/ws`.

#### [NEW] [aiEngine.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/server/aiEngine.js)
- Core reasoning engine:
  - Takes natural language user prompts (e.g., *"Food delivery app for 50k users"*, *"Add real-time tracking"*, *"Reduce cost by 20%"*, *"Scale to 500k users"*).
  - Generates/updates nodes, links, specs, cost adjustments, security ratings, and explanation bullets.
  - Pluggable Gemini 2.5/Flash API handler when `GEMINI_API_KEY` is provided, with graceful fallback to the built-in domain-expert rules engine.

#### [NEW] [costIntelligence.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/server/costIntelligence.js)
- Detailed pricing model for AWS/GCP/Azure services (Compute ECS/EC2/Lambda, RDS PostgreSQL/Aurora, ElastiCache Redis, S3, CloudFront, ALB, NAT Gateway).
- Calculates monthly estimate, provides 3 payment models (On-Demand, 1-Yr Savings Plan, 3-Yr Reserved), and cost-cutting recommendations.

#### [NEW] [realtimeMonitor.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/server/realtimeMonitor.js)
- Simulates and streams live telemetry:
  - **Server Alerts**: High CPU load on App Server 2, memory warning, container health, network latency.
  - **Financial Alerts**: Daily budget pacing alert, idle RDS instance alert, unattached storage alert.
  - Emits real-time events over WebSocket to the frontend.

#### [NEW] [iacGenerator.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/server/iacGenerator.js)
- Translates the active architecture graph into production-grade:
  - **Terraform (`main.tf`)** with VPC, subnets, ALB, ECS cluster, RDS instance, S3 bucket, Redis cache.
  - **Docker Compose (`docker-compose.yml`)** for local development testing.
  - **Kubernetes Manifest (`k8s-deployment.yaml`)**.

#### [NEW] [aiDoctor.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/server/aiDoctor.js)
- Diagnoses infrastructure failures, deployment errors, and anomalous logs with root cause, impact score, and one-click auto-fix actions.

---

### Frontend Implementation (`public/`)

#### [NEW] [index.html](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/public/index.html)
- Main single-page application structure:
  - Header: Logo, project selector, live status, notification bell drawer (Money & Server tabs), action buttons (`Explain`, `Share`, `Export IaC`), user avatar.
  - Sidebar: Navigation items (Dashboard, Chat + Canvas, Cost, Security, Deployment, Monitoring, AI Doctor, Settings).
  - Dual-pane main view: Conversational AI panel + Interactive Architecture Canvas + Bottom Live Metrics bar.
  - Modals and dedicated views for Cost Breakdown, Server Monitoring, AI Doctor console, IaC code exporter, and Settings.

#### [NEW] [styles.css](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/public/styles.css)
- Premium dark-theme stylesheet:
  - Obsidian dark palette (`#0a0e17`, `#111827`, `#1f293d`), glassmorphism backdrop filters, custom scrollbars.
  - Node graph styling with pulsing connection lines, service category color-coding (Networking: purple, Compute: orange, Database: teal, Storage: blue, Caching: red, Messaging: amber).
  - Notification drawer with animated badges, glowing gauges, and responsive flex/grid layouts.

#### [NEW] [canvas.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/public/canvas.js)
- Interactive Architecture Canvas engine:
  - Renders nodes (Route53, CloudFront, ALB, ECS Auto-Scaling Group, RDS Multi-AZ, Read Replica, Redis ElastiCache, S3, WebSocket Gateway) matching the reference mockup.
  - Drag-and-drop node movement, zoom in/out, auto-layout, interactive node inspection on click (displays CPU, memory, monthly cost, and config options).
  - Animated SVG data flow arrows.

#### [NEW] [app.js](file:///c:/Users/Satyendra/Desktop/Projects/Mini%20-Project/Couderator/public/app.js)
- Client-side application controller:
  - Handles chat messages, quick prompt chips, and AI streaming responses.
  - Connects to `/ws` WebSocket for real-time server & financial notifications and updates the notification bell and toasts.
  - Manages view switching (Chat + Canvas, Cost Intelligence, Monitoring Dashboard, AI Doctor, IaC Exporter, Settings).
  - Handles IaC file downloads (`main.tf`, `docker-compose.yml`).

---

## Verification Plan

### Automated Verification
1. **Server Initialization**:
   - Start the server on port 3000 (`node server/server.js`) and ensure clean startup with no errors.
2. **API Endpoint Testing**:
   - Test `POST /api/chat` with commands:
     - *"I want to build a food delivery application for 50,000 daily users"*
     - *"Add real-time order tracking"*
     - *"Reduce cost by 20%"*
   - Test `GET /api/cost/breakdown` to verify accurate pricing math.
   - Test `GET /api/iac/export` to verify valid Terraform and Docker Compose generation.
   - Test `POST /api/ai-doctor/diagnose` to verify automated root cause and fix recommendation.

### Manual Verification
1. **Browser Subagent Walkthrough**:
   - Launch the browser subagent on `http://localhost:3000`.
   - Verify the visual fidelity matches the reference UI image (`WhatsApp Image 2026-07-29 at 10.47.11 AM.jpeg`).
   - Interact with the chat: send commands, click quick action chips.
   - Verify nodes dynamically update on the canvas with animated connections.
   - Open the Notification center: verify real-time server health and financial budget alerts are displayed with timestamps.
   - Open Cost View, Monitoring View, AI Doctor, and IaC Exporter.
   - Verify Settings view allows adding a Gemini API key.
