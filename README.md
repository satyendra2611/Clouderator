# Clouderator ☁️⚡

> **AI-Powered Cloud Infrastructure Operating System & Architecture Console**

Clouderator is an intelligent cloud console that allows engineers, architects, and DevOps teams to design, optimize, monitor, and deploy enterprise cloud architectures using natural language and interactive visual canvases.

---

## 🚀 Key Features

- 🧠 **Dual-Mode AI Architecture Engine**:
  - **Local Domain Expert Engine**: Instant, deterministic architectural recommendations, cost calculation, and topology design without requiring an API key.
  - **LLM Reasoning (Groq / Gemini / OpenAI)**: Multi-turn natural language dialogue, continuous architecture refinement, and intelligent trade-off explanations.
- 🎨 **Interactive Architecture Canvas**:
  - Live visual topology with automated dependency linking (Route 53, CloudFront CDN, Application Load Balancers, ECS/EKS clusters, RDS multi-AZ databases, Redis caching, S3 object storage).
  - Component-level inspector drawers with instance sizing, memory allocation, and operational metrics.
- 💰 **FinOps & Cost Intelligence**:
  - Instant pricing calculations across AWS, GCP, and Azure.
  - Three-tier payment model comparisons: On-Demand, 1-Year Savings Plan, and 3-Year Reserved.
  - Real-time cost-saving recommendations and budget overrun warnings.
- 🩺 **AI Doctor & Health Diagnostics**:
  - Automated anomaly detection, crash loop analysis, and root cause diagnosis.
  - One-click automated remediation for common architectural failures.
- 📊 **Real-Time Telemetry & Telemetry Streaming**:
  - Live server telemetry (CPU utilization, memory pressure, network latency, p99 response times) pushed over WebSockets.
  - Proactive financial alerts for idle resources and unexpected cost surges.
- 📦 **Automated Infrastructure-as-Code (IaC)**:
  - Generates production-ready **Terraform** (`main.tf`), **Docker Compose** (`docker-compose.yml`), and **Kubernetes** manifests (`k8s-manifest.yaml`) synced with the active topology.

---

## 🛠️ Architecture Overview

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
  │  │ 1. AI Infrastructure Architect & Requirement Analyzer (Dual-Mode: Local + LLM)   │  │
  │  │ 2. Cost Intelligence Engine (AWS/GCP/Azure pricing calculations & budget tracks) │  │
  │  │ 3. Real-Time Telemetry & Financial Alert Daemon (Server spikes, cost overruns)   │  │
  │  │ 4. AI Doctor & Bug Analyzer (Auto-diagnosis & one-click automated remediation)   │  │
  │  │ 5. IaC Generator (Terraform main.tf, Docker Compose, Kubernetes manifests)       │  │
  │  └──────────────────────────────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/satyendra2611/Clouderator.git
   cd Clouderator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Add your Groq or Gemini API Key to `.env` to enable deep natural language reasoning. If left empty, Clouderator will run seamlessly using its built-in rule engine!

4. **Launch the application**:
   ```bash
   npm start
   ```

5. **Open in Browser**:
   Navigate to `http://localhost:3000` to access the console.

---

## 📂 Project Structure

```
├── deployments/              # Generated Infrastructure as Code templates
│   ├── docker/               # Docker Compose configs
│   ├── k8s/                  # Kubernetes YAML manifests
│   └── terraform/            # HashiCorp Terraform modules
├── public/                   # Frontend SPA files
│   ├── app.js                # Core UI controller & WebSocket client
│   ├── canvas.js             # Interactive architecture graph renderer
│   ├── index.html            # Main console layout
│   └── styles.css            # Dark mode cloud console styling
├── server/                   # Backend services (Node.js & Express)
│   ├── aiDoctor.js           # Diagnostics & root cause engine
│   ├── aiEngine.js           # Multi-provider AI reasoning (Groq / Gemini / Local)
│   ├── cloudCatalog.js       # Cloud provider component specifications
│   ├── cloudConnector.js     # Cloud provider mock sync & discovery
│   ├── costIntelligence.js   # FinOps pricing & budget pacing engine
│   ├── devopsEngine.js       # CI/CD and deployment pipeline orchestrator
│   ├── iacGenerator.js       # Dynamic IaC compiler (Terraform, Docker, K8s)
│   ├── realtimeMonitor.js    # Telemetry streaming daemon via WebSockets
│   ├── server.js             # HTTP/WS server entrypoint
│   └── sessionStore.js       # Architecture session persistence
├── .env.example              # Sample environment configuration
├── .gitignore                # Git ignore rules (node_modules, secrets, etc.)
└── package.json              # Project dependencies & scripts
```

---

## 👥 Authors & Acknowledgments

- **Satyendra Kumar** ([@satyendra2611](https://github.com/satyendra2611))
- **Shivank**
- **Shiv Narayan Yadav**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
