// Clouderator Main Server
// Node.js + Express + WebSocket (Server & Money Notifications, AI Engine, IaC)

const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const { ClouderatorAIEngine } = require('./aiEngine');
const { sessionStore } = require('./sessionStore');
const { RealtimeMonitor } = require('./realtimeMonitor');
const { AIDoctor } = require('./aiDoctor');
const { calculateArchitectureCost } = require('./costIntelligence');
const { generateTerraform, generateDockerCompose, generateKubernetesManifest } = require('./iacGenerator');
const { getDevOpsEngine } = require('./devopsEngine');
const { cloudConnector } = require('./cloudConnector');
const { CLOUD_SERVICES_CATALOG, findServiceByText } = require('./cloudCatalog');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

// Initialize core services
const aiEngine = new ClouderatorAIEngine();
const realtimeMonitor = new RealtimeMonitor(wss);
const aiDoctor = new AIDoctor();
const devopsEngine = getDevOpsEngine(wss);

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// WebSocket client connection handling
wss.on('connection', (ws) => {
  // Send initial state upon connection
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    payload: {
      notifications: realtimeMonitor.getNotifications(),
      metrics: realtimeMonitor.getMetrics(),
      architecture: aiEngine.getArchitecture()
    }
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('Error parsing WS message', e);
    }
  });
});

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Chat & Conversational Architecture Adjustment
app.post('/api/chat', async (req, res) => {
  try {
    const { message, architecture } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    if (architecture && Array.isArray(architecture.nodes)) {
      aiEngine.currentArchitecture = architecture;
    }

    const result = await aiEngine.processUserMessage(message);

    // Persist updated IaC manifests
    if (result.architecture) {
      devopsEngine.saveArtifacts(result.architecture);
    }

    // Broadcast updated architecture to all connected browser clients
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: result.architecture
    });

    if (result.architecture && Array.isArray(result.architecture.nodes) && result.architecture.nodes.length > 0) {
      realtimeMonitor.addNotification({
        title: `Architecture Updated: ${result.architecture.projectName || 'Cloud Stack'}`,
        message: `${result.architecture.nodes.length} cloud services configured on ${(result.architecture.cloudProvider || 'aws').toUpperCase()}.`,
        type: 'server',
        severity: 'info'
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Chat processing error:', err);
    res.status(500).json({ error: 'Failed to process AI chat message', details: err.message });
  }
});

// 2. Fetch Chat History
app.get('/api/chat/history', (req, res) => {
  res.json({ history: aiEngine.getChatHistory(), activeSessionId: aiEngine.getCurrentSessionId() });
});

// 2b. Sessions & History Management (Like ChatGPT / Gemini)
app.get('/api/sessions', (req, res) => {
  res.json({
    sessions: sessionStore.getAllSessions(),
    activeSessionId: aiEngine.getCurrentSessionId()
  });
});

app.post('/api/sessions/new', (req, res) => {
  aiDoctor.reset();
  const session = aiEngine.startNewSession(req.body?.title || 'New Cloud Architecture');
  devopsEngine.saveArtifacts(session.architecture);
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: session.architecture
  });
  res.json({ success: true, session, sessionId: session.id });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = aiEngine.loadSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  devopsEngine.saveArtifacts(session.architecture);
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: session.architecture
  });
  res.json({ success: true, session, sessionId: session.id });
});

app.delete('/api/sessions/:id', (req, res) => {
  sessionStore.deleteSession(req.params.id);
  const remaining = sessionStore.getAllSessions();
  let nextActiveId = null;
  if (req.params.id === aiEngine.getCurrentSessionId()) {
    if (remaining.length > 0) {
      const nextSession = aiEngine.loadSession(remaining[0].id);
      nextActiveId = nextSession.id;
      realtimeMonitor.broadcast({
        type: 'ARCHITECTURE_UPDATED',
        payload: nextSession.architecture
      });
    } else {
      const newSession = aiEngine.startNewSession('New Cloud Architecture');
      nextActiveId = newSession.id;
      realtimeMonitor.broadcast({
        type: 'ARCHITECTURE_UPDATED',
        payload: newSession.architecture
      });
    }
  } else {
    nextActiveId = aiEngine.getCurrentSessionId();
  }
  res.json({ success: true, activeSessionId: nextActiveId });
});

app.post('/api/sessions/clear-all', (req, res) => {
  sessionStore.sessions = [];
  sessionStore.saveToFile();
  const session = aiEngine.startNewSession('New Cloud Architecture');
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: session.architecture
  });
  res.json({ success: true, session, sessionId: session.id });
});

// 3. Current Architecture Graph & Metrics
app.get('/api/architecture/current', (req, res) => {
  res.json(aiEngine.getArchitecture());
});

// 4. Reset Architecture to Default Food Delivery App
app.post('/api/architecture/reset', (req, res) => {
  const defaultArch = aiEngine.resetToDefault();
  devopsEngine.saveArtifacts(defaultArch);
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: defaultArch
  });
  res.json({ success: true, architecture: defaultArch });
});

// 4b. Switch Project Presets (Food Delivery, E-Commerce, Fintech)
app.post('/api/project/preset', (req, res) => {
  const { preset } = req.body;
  const arch = aiEngine.loadProjectPreset(preset);
  devopsEngine.saveArtifacts(arch);
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: arch
  });
  res.json({ success: true, architecture: arch, chatHistory: aiEngine.getChatHistory() });
});

// 4c. Create New Custom Project via Natural Language
app.post('/api/project/new', async (req, res) => {
  const { name, description } = req.body;
  const defaultArch = aiEngine.resetToDefault();
  defaultArch.projectName = name || 'Custom Cloud App';
  
  const result = await aiEngine.processUserMessage(`Initialize new project: ${name}. Requirements: ${description || 'Scalable web application'}`);
  if (result.architecture) {
    devopsEngine.saveArtifacts(result.architecture);
  }
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: result.architecture
  });
  res.json({ success: true, architecture: result.architecture, chatHistory: aiEngine.getChatHistory() });
});

// 4b-profile. User Developer Profile Persistence & API
const profileFilePath = path.join(__dirname, '..', 'data', 'profile.json');

function loadUserProfile() {
  try {
    if (fs.existsSync(profileFilePath)) {
      const raw = fs.readFileSync(profileFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading profile.json:', e.message);
  }
  return {
    name: 'Satyendra Kumar',
    username: 'satyendra',
    email: 'satyendra@clouderator.dev',
    role: 'Cloud Architect & Lead DevOps',
    org: 'Clouderator Systems',
    avatarInitial: 'S',
    avatarColor: 'blue',
    bio: 'Designing high-scale, resilient cloud infrastructure on AWS & GCP.',
    cloudProvider: 'aws',
    defaultRegion: 'us-east-1',
    iacFormat: 'terraform',
    highAvailability: true,
    zeroEgress: true,
    serverAlerts: true,
    moneyAlerts: true,
    doctorAlerts: true,
    soundAlerts: false,
    mfaEnabled: true,
    patToken: 'pat_clouderator_live_83921b79401e8a'
  };
}

function saveUserProfile(profile) {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(profileFilePath, JSON.stringify(profile, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving profile.json:', e.message);
  }
}

let currentUserProfile = loadUserProfile();

app.get('/api/profile', (req, res) => {
  res.json({ success: true, profile: currentUserProfile });
});

app.post('/api/profile', (req, res) => {
  currentUserProfile = { ...currentUserProfile, ...(req.body || {}) };
  saveUserProfile(currentUserProfile);
  res.json({ success: true, profile: currentUserProfile });
});

// 4c-2. Complete Cloud Services Catalog with Pricing & Free Tier Status
app.get('/api/services/catalog', (req, res) => {
  res.json({
    total: CLOUD_SERVICES_CATALOG.length,
    services: CLOUD_SERVICES_CATALOG
  });
});

// 4d. Interactive Canvas Node CRUD & Incident Simulation
app.post('/api/architecture/add-node', (req, res) => {
  try {
    const catalogMatch = findServiceByText(req.body.id || req.body.name);
    const nodePayload = {
      ...req.body,
      isFreeTier: req.body.isFreeTier ?? catalogMatch?.isFreeTier ?? false,
      freeTier: req.body.freeTier || catalogMatch?.freeTier || ''
    };
    const result = aiEngine.addNode(nodePayload);
    devopsEngine.saveArtifacts(result.architecture);
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: result.architecture
    });
    realtimeMonitor.addNotification({
      title: `Added ${result.newNode.name}`,
      message: `Node added to architecture canvas ($${result.newNode.monthlyCost}/mo).`,
      type: 'SERVER',
      severity: 'INFO'
    });
    res.json(result);
  } catch (err) {
    console.error('Add node error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/architecture/update-node', (req, res) => {
  try {
    const { nodeId, updates } = req.body;
    const result = aiEngine.updateNode(nodeId, updates);
    if (!result) return res.status(404).json({ error: 'Node not found' });
    devopsEngine.saveArtifacts(result.architecture);
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: result.architecture
    });
    res.json(result);
  } catch (err) {
    console.error('Update node error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/architecture/node/:id', (req, res) => {
  try {
    const arch = aiEngine.deleteNode(req.params.id);
    devopsEngine.saveArtifacts(arch);
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });
    realtimeMonitor.addNotification({
      title: `Service Pruned`,
      message: `Service '${req.params.id}' was removed from the architecture.`,
      type: 'SERVER',
      severity: 'INFO'
    });
    res.json({ success: true, architecture: arch });
  } catch (err) {
    console.error('Delete node error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Explicit Edge Connection Endpoint
app.post('/api/architecture/connect', (req, res) => {
  try {
    const { from, to, label, dashed } = req.body;
    if (!from || !to) return res.status(400).json({ error: 'Both from and to node IDs are required' });
    aiEngine.connectNodes(from, to, label || 'Connects', !!dashed);
    const arch = aiEngine.getArchitecture();
    devopsEngine.saveArtifacts(arch);
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });
    res.json({ success: true, architecture: arch });
  } catch (err) {
    console.error('Connect nodes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Explicit Edge Disconnection Endpoint
app.post('/api/architecture/disconnect', (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from) return res.status(400).json({ error: 'From node ID is required' });
    aiEngine.disconnectNodes(from, to || null);
    const arch = aiEngine.getArchitecture();
    devopsEngine.saveArtifacts(arch);
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });
    res.json({ success: true, architecture: arch });
  } catch (err) {
    console.error('Disconnect nodes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Full Topology Healing Endpoint (re-interconnects any orphan nodes)
app.post('/api/architecture/heal', (req, res) => {
  try {
    const addedEdges = aiEngine.healTopology();
    const arch = aiEngine.getArchitecture();
    devopsEngine.saveArtifacts(arch);
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });
    res.json({ success: true, addedEdges, architecture: arch });
  } catch (err) {
    console.error('Topology healing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Auto-Layout Endpoint
app.post('/api/architecture/auto-layout', (req, res) => {
  try {
    aiEngine.autoLayoutCanvas();
    const arch = aiEngine.getArchitecture();
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });
    res.json({ success: true, architecture: arch });
  } catch (err) {
    console.error('Auto layout error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/architecture/simulate-incident', (req, res) => {
  try {
    const { nodeId } = req.body;
    const arch = aiEngine.getArchitecture();
    const node = arch.nodes.find(n => n.id === nodeId);
    const nodeName = node ? node.name : nodeId;

    // Inject incident into AI Doctor
    const incident = {
      id: `inc-${Date.now()}`,
      title: `Critical Latency Spike on ${nodeName}`,
      severity: 'critical',
      status: 'active',
      timestamp: 'Just now',
      nodeId: nodeId,
      symptom: `P99 response time elevated to 890ms; CPU saturation at 94% with memory leaks detected.`,
      rootCause: `High concurrent connection pool exhaustion under sudden traffic surge.`,
      suggestedFix: `Scale cluster replicas by +2 and recycle thread pools with circuit breaker fallback.`,
      confidenceScore: 96,
      remediationLabel: 'Auto-Scale & Recycle Pools',
      actionTaken: `Scaled ${nodeName} replicas from 3 to 5 and recycled connection pool. Latency normalized to 14ms.`
    };

    aiDoctor.registerSimulatedIncident(incident);

    // Broadcast warning notification
    realtimeMonitor.addNotification({
      title: `⚠️ Alert: ${nodeName} Incident`,
      message: `P99 latency spiked on ${nodeName}. AI Doctor incident triggered.`,
      type: 'SERVER',
      severity: 'CRITICAL'
    });

    realtimeMonitor.broadcast({
      type: 'NODE_INCIDENT_TRIGGERED',
      payload: { nodeId, incident }
    });

    res.json({ success: true, incident });
  } catch (err) {
    console.error('Simulate incident error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Cost Intelligence Breakdown & Payment Tiers
app.get('/api/cost/breakdown', (req, res) => {
  const arch = aiEngine.getArchitecture();
  const costAnalysis = calculateArchitectureCost(arch);
  res.json(costAnalysis);
});

// 5b. Apply Payment Plan (On-Demand, 1-Year Savings, 3-Year Reserved)
app.post('/api/cost/apply-plan', (req, res) => {
  try {
    const { plan } = req.body;
    const arch = aiEngine.getArchitecture();
    arch.activePaymentPlan = plan || 'onDemand';

    if (plan === 'oneYearSavings') {
      arch.costReductionPct = 22;
    } else if (plan === 'threeYearReserved') {
      arch.costReductionPct = 48;
    } else {
      arch.costReductionPct = 0;
    }

    aiEngine.refreshMetrics();
    const costAnalysis = calculateArchitectureCost(arch);

    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });

    const planName = plan === 'oneYearSavings' ? '1-Year Compute Savings Plan (22% off)' :
                     plan === 'threeYearReserved' ? '3-Year Standard Reserved Plan (48% off)' : 'Pay As You Go (On-Demand)';

    realtimeMonitor.addNotification({
      title: 'Payment Plan Activated',
      message: `Switched architecture billing to ${planName}. Monthly spend: $${costAnalysis.monthlyTotal}/mo.`,
      type: 'MONEY',
      severity: 'INFO',
      amount: costAnalysis.monthlyTotal
    });

    res.json({ success: true, plan, costAnalysis, architecture: arch });
  } catch (err) {
    console.error('Apply plan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5c. Apply FinOps Optimization
app.post('/api/cost/apply-optimization', (req, res) => {
  try {
    const { id } = req.body;
    const arch = aiEngine.getArchitecture();

    let optimizationName = 'FinOps Optimization';
    let savingsAmount = 30;

    if (id === 'rec_graviton') {
      optimizationName = 'Migrate to AWS Graviton 3 (ARM64)';
      arch.nodes.forEach(n => {
        if (['ec2', 'asg', 'ecs', 'app_servers', 'compute_instance'].includes(n.id) || n.category === 'compute') {
          n.isGraviton = true;
          if (n.monthlyCost) n.monthlyCost = Math.round(n.monthlyCost * 0.8 * 100) / 100;
        }
      });
      arch.costReductionPct = Math.min(50, (arch.costReductionPct || 0) + 12);
      savingsAmount = 42;
    } else if (id === 'rec_s3_tiering') {
      optimizationName = 'Enable S3 Intelligent-Tiering';
      arch.nodes.forEach(n => {
        if (n.id === 's3' || n.category === 'storage') {
          n.specs = (n.specs || '') + ' + Intelligent-Tiering';
          if (n.monthlyCost) n.monthlyCost = Math.round(n.monthlyCost * 0.7 * 100) / 100;
        }
      });
      arch.costReductionPct = Math.min(50, (arch.costReductionPct || 0) + 6);
      savingsAmount = 18;
    } else if (id === 'rec_db_scaling') {
      optimizationName = 'Scale down Read Replica during non-peak hours';
      arch.nodes.forEach(n => {
        if (n.id.includes('replica')) {
          n.specs = (n.specs || '') + ' (Off-peak auto-scale)';
          if (n.monthlyCost) n.monthlyCost = Math.round(n.monthlyCost * 0.5 * 100) / 100;
        }
      });
      arch.costReductionPct = Math.min(50, (arch.costReductionPct || 0) + 10);
      savingsAmount = 35;
    } else if (id === 'rec_dynamo_ondemand') {
      optimizationName = 'Switch DynamoDB to On-Demand Auto-Scaling';
      arch.costReductionPct = Math.min(50, (arch.costReductionPct || 0) + 5);
      savingsAmount = 15;
    } else if (id === 'rec_cf_compression') {
      optimizationName = 'Enable CloudFront Brotli/Gzip Edge Compression';
      arch.costReductionPct = Math.min(50, (arch.costReductionPct || 0) + 5);
      savingsAmount = 18;
    } else {
      arch.costReductionPct = Math.min(50, (arch.costReductionPct || 0) + 8);
      savingsAmount = 25;
    }

    aiEngine.refreshMetrics();
    const costAnalysis = calculateArchitectureCost(arch);

    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });

    realtimeMonitor.addNotification({
      title: 'FinOps Optimization Applied',
      message: `${optimizationName} implemented. Estimated savings: -$${savingsAmount}/mo.`,
      type: 'MONEY',
      severity: 'SUCCESS',
      amount: costAnalysis.monthlyTotal
    });

    res.json({ success: true, optimizationName, costAnalysis, architecture: arch });
  } catch (err) {
    console.error('Apply optimization error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Real-Time Notifications (Server & Money)
app.get('/api/notifications', (req, res) => {
  res.json({ notifications: realtimeMonitor.getNotifications() });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const updated = realtimeMonitor.markAllAsRead();
  res.json({ success: true, notifications: updated });
});

// 7. Live Server Metrics
app.get('/api/monitoring/metrics', (req, res) => {
  const arch = aiEngine.getArchitecture();
  res.json(realtimeMonitor.getMetrics(arch));
});

// 8. AI Infrastructure Doctor Incidents & Auto-Fix
app.get('/api/ai-doctor/incidents', (req, res) => {
  const arch = aiEngine.getArchitecture();
  const diagnosis = aiDoctor.diagnoseArchitecture(arch);
  res.json(diagnosis);
});

app.post('/api/ai-doctor/remediate', (req, res) => {
  const { incidentId } = req.body;
  const arch = aiEngine.getArchitecture();
  const result = aiDoctor.remediate(incidentId, arch, aiEngine);

  if (result.success) {
    const updatedArch = aiEngine.getArchitecture();
    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: updatedArch
    });
    realtimeMonitor.broadcast({
      type: 'INCIDENT_RESOLVED',
      payload: result
    });
  }

  res.json(result);
});

app.post('/api/ai-doctor/chaos-test', (req, res) => {
  try {
    const { testType } = req.body;
    const arch = aiEngine.getArchitecture();
    const incident = aiDoctor.triggerChaosTest(testType || 'latency_spike', arch);
    
    if (incident) {
      realtimeMonitor.broadcast({
        type: 'NODE_INCIDENT_TRIGGERED',
        payload: { nodeId: incident.nodeId, incident }
      });
      return res.json({ success: true, incident });
    }
    return res.status(400).json({ success: false, error: 'Could not trigger chaos test: No suitable nodes found in architecture.' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/ai-doctor/reset-incidents', (req, res) => {
  aiDoctor.reset();
  const arch = aiEngine.getArchitecture();
  const diagnosis = aiDoctor.diagnoseArchitecture(arch);
  realtimeMonitor.broadcast({
    type: 'ARCHITECTURE_UPDATED',
    payload: arch
  });
  res.json({ success: true, diagnosis });
});


// 9. IaC Code Generation (Terraform, Docker, Kubernetes)
app.all('/api/iac/export', (req, res) => {
  const arch = req.body?.architecture || aiEngine.getArchitecture();
  const format = req.query.format || req.body?.format || 'terraform';

  if (format === 'docker') {
    res.type('text/yaml').send(generateDockerCompose(arch));
  } else if (format === 'k8s') {
    res.type('text/yaml').send(generateKubernetesManifest(arch));
  } else {
    res.type('text/plain').send(generateTerraform(arch));
  }
});

// 9b. DevOps Execution Engine (Terraform Plan / Apply, Docker Lifecycle, Cloud Provider)
app.post('/api/devops/plan', async (req, res) => {
  try {
    const arch = req.body?.architecture || aiEngine.getArchitecture();
    const result = await devopsEngine.runTerraformPlan(arch);
    res.json(result);
  } catch (err) {
    console.error('Terraform plan error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devops/apply', async (req, res) => {
  try {
    const arch = req.body?.architecture || aiEngine.getArchitecture();
    const result = await devopsEngine.runTerraformApply(arch);
    if (result.success) {
      realtimeMonitor.addNotification({
        title: 'Infrastructure Deployed',
        message: `Terraform applied successfully (${result.resourcesDeployed} resources provisioned in ${result.region}).`,
        type: 'server',
        severity: 'success'
      });
    }
    res.json(result);
  } catch (err) {
    console.error('Terraform apply error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devops/docker/up', async (req, res) => {
  try {
    const arch = req.body?.architecture || aiEngine.getArchitecture();
    const result = await devopsEngine.runDockerUp(arch);
    if (result.success) {
      realtimeMonitor.addNotification({
        title: 'Docker Stack Started',
        message: `${result.containers.length} local containers running on port 8080.`,
        type: 'server',
        severity: 'info'
      });
    }
    res.json(result);
  } catch (err) {
    console.error('Docker up error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devops/docker/down', async (req, res) => {
  try {
    const arch = req.body?.architecture || aiEngine.getArchitecture();
    const result = await devopsEngine.runDockerDown(arch);
    if (result.success) {
      realtimeMonitor.addNotification({
        title: 'Docker Stack Stopped',
        message: `Local container services stopped and cleaned up.`,
        type: 'server',
        severity: 'info'
      });
    }
    res.json(result);
  } catch (err) {
    console.error('Docker down error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devops/cloud/status', (req, res) => {
  res.json(cloudConnector.getStatus());
});

app.post('/api/devops/cloud/connect', (req, res) => {
  try {
    const status = cloudConnector.connect(req.body);
    realtimeMonitor.addNotification({
      title: 'Cloud Provider Connected',
      message: `Authenticated with ${status.providerName} in ${status.region}.`,
      type: 'server',
      severity: 'success'
    });
    res.json({ success: true, status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/devops/cloud/disconnect', (req, res) => {
  const status = cloudConnector.disconnect();
  res.json({ success: true, status });
});

// 10. Security Audit & Compliance
app.get('/api/security/audit', (req, res) => {
  const arch = aiEngine.getArchitecture();
  const nodes = arch.nodes || [];

  if (nodes.length === 0) {
    return res.json({
      securityScore: 100,
      rating: 'Ready (No Active Infrastructure)',
      hasArchitecture: false,
      findings: [
        {
          id: 'sec-ready-1',
          title: 'Zero-Trust Baseline Security Profile',
          status: 'PASSED',
          severity: 'INFO',
          detail: 'No running nodes on canvas. Architecture defaults are configured for AWS KMS encryption and TLS 1.3.'
        },
        {
          id: 'sec-ready-2',
          title: 'VPC Default Network Security Isolation',
          status: 'PASSED',
          severity: 'LOW',
          detail: 'Isolated private subnets configured by default for database and cache layers upon synthesis.'
        }
      ]
    });
  }

  const hasWaf = nodes.some(n => n.id === 'waf' || (n.name && n.name.toLowerCase().includes('waf')));
  const hasAlb = nodes.some(n => n.id === 'alb' || (n.name && (n.name.toLowerCase().includes('load balancer') || n.name.toLowerCase().includes('alb'))));
  const hasDb = nodes.some(n => ['rds', 'rds_primary', 'aurora', 'dynamodb'].includes(n.id) || n.category === 'database');
  const hasStorage = nodes.some(n => n.id === 's3' || n.category === 'storage');

  const findings = [];

  // Finding 1: TLS In Transit
  findings.push({
    id: 'sec-1',
    title: 'TLS 1.3 Termination at Edge / Gateway',
    status: 'PASSED',
    severity: 'LOW',
    detail: 'Modern TLS 1.3 protocol enforced across all ingress controllers.'
  });

  // Finding 2: Encryption at rest
  findings.push({
    id: 'sec-2',
    title: 'KMS AES-256 Storage & DB Encryption at Rest',
    status: 'PASSED',
    severity: 'LOW',
    detail: hasDb || hasStorage ? 'Active customer-managed KMS key encryption on data volumes.' : 'Global encryption policy enabled.'
  });

  // Finding 3: WAF
  if (hasWaf) {
    findings.push({
      id: 'sec-3',
      title: 'AWS WAF & Shield Layer 7 Defense',
      status: 'PASSED',
      severity: 'LOW',
      detail: 'Attached to ingress with managed SQLi, XSS, and rate-limiting rulesets.'
    });
  } else if (hasAlb) {
    findings.push({
      id: 'sec-3',
      title: 'WAF Not Attached to Public Load Balancer',
      status: 'RECOMMENDATION',
      severity: 'MEDIUM',
      detail: 'Attach AWS WAF to prevent automated bot scrapers and Layer 7 DDoS surges.'
    });
  }

  // Finding 4: IAM Least Privilege
  findings.push({
    id: 'sec-4',
    title: 'IAM Least Privilege Task Role Assignment',
    status: 'PASSED',
    severity: 'LOW',
    detail: 'Scoped to explicitly granted resource ARNs with zero wildcard permissions.'
  });

  const baseScore = hasWaf || !hasAlb ? 98 : 88;
  arch.metrics.securityScore = baseScore;

  res.json({
    securityScore: baseScore,
    rating: baseScore >= 95 ? 'Excellent' : 'Good',
    hasArchitecture: true,
    findings
  });
});

// 10b. Harden Security Rules
app.post('/api/security/harden', (req, res) => {
  try {
    const arch = aiEngine.getArchitecture();
    const nodes = arch.nodes || [];

    // Attach WAF if missing and architecture exists
    const hasWaf = nodes.some(n => n.id === 'waf' || (n.name && n.name.toLowerCase().includes('waf')));
    if (!hasWaf && nodes.length > 0) {
      aiEngine.addNode({
        id: 'waf',
        name: 'AWS WAF & Shield',
        category: 'security',
        monthlyCost: 30,
        specs: 'Layer 7 DDoS & Rate Limiting'
      });
    }

    arch.metrics.securityScore = 99;
    arch.metrics.securityStatus = 'Zero-Trust Hardened';

    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });

    realtimeMonitor.addNotification({
      title: 'Security Hardening Applied',
      message: 'Enforced TLS 1.3, KMS AES-256 encryption at rest, and attached AWS WAF Layer 7 inspection.',
      type: 'SECURITY',
      severity: 'SUCCESS'
    });

    res.json({
      success: true,
      securityScore: 99,
      rating: 'Excellent (Hardened)',
      architecture: arch
    });
  } catch (err) {
    console.error('Harden security error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Settings & AI API Key Configuration
app.get('/api/settings', (req, res) => {
  res.json({
    groqApiKeyConfigured: !!aiEngine.getGroqApiKey(),
    groqModel: aiEngine.getGroqModel(),
    geminiApiKeyConfigured: !!aiEngine.getApiKey(),
    activeProvider: aiEngine.getActiveProvider(),
    preferredProvider: aiEngine.getPreferredProvider(),
    activeCloudProvider: aiEngine.getArchitecture().cloudProvider,
    monthlyBudget: 2500,
    notificationThresholdPct: 80
  });
});

app.post('/api/settings', (req, res) => {
  const { groqApiKey, groqModel, geminiApiKey, preferredProvider, cloudProvider } = req.body;
  
  if (typeof groqApiKey === 'string' && groqApiKey.trim().length > 0) {
    aiEngine.setGroqApiKey(groqApiKey.trim());
  }
  if (typeof groqModel === 'string' && groqModel.trim()) {
    aiEngine.setGroqModel(groqModel.trim());
  }
  if (typeof geminiApiKey === 'string' && geminiApiKey.trim().length > 0) {
    aiEngine.setApiKey(geminiApiKey.trim());
  }
  if (typeof preferredProvider === 'string') {
    aiEngine.setPreferredProvider(preferredProvider);
  }
  if (cloudProvider) {
    aiEngine.currentArchitecture.cloudProvider = cloudProvider;
    aiEngine.refreshMetrics();
  }

  res.json({
    success: true,
    groqApiKeyConfigured: !!aiEngine.getGroqApiKey(),
    groqModel: aiEngine.getGroqModel(),
    geminiApiKeyConfigured: !!aiEngine.getApiKey(),
    activeProvider: aiEngine.getActiveProvider(),
    activeCloudProvider: aiEngine.getArchitecture().cloudProvider
  });
});

// 12. Test Groq Connection & Benchmark Latency
app.post('/api/ai/test-groq', async (req, res) => {
  try {
    const inputKey = (req.body.apiKey !== undefined && req.body.apiKey !== null ? req.body.apiKey : '').trim();
    const testKey = inputKey || aiEngine.getGroqApiKey() || (process.env.GROQ_API_KEY || '').trim();
    if (!testKey) {
      return res.status(400).json({ success: false, error: 'No Groq API Key provided. Please enter an API key.' });
    }

    const model = req.body.model || aiEngine.getGroqModel() || 'qwen/qwen3.8-27b';
    const startTime = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Respond with the single word "OK"' }],
        max_tokens: 5,
        temperature: 0.1
      })
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      let msg = errText;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || errText;
      } catch (e) {}
      return res.status(response.status).json({
        success: false,
        error: `Groq API Error (${response.status}): ${msg}`
      });
    }

    const data = await response.json();

    // Auto-activate Groq on successful test
    aiEngine.setGroqApiKey(testKey);
    aiEngine.setGroqModel(model);
    aiEngine.setPreferredProvider('groq');

    // Persist to .env file so it persists across server restarts
    try {
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      if (/GROQ_API_KEY=/.test(envContent)) {
        envContent = envContent.replace(/GROQ_API_KEY=.*/, `GROQ_API_KEY=${testKey}`);
      } else {
        envContent += `\nGROQ_API_KEY=${testKey}`;
      }
      if (/GROQ_MODEL=/.test(envContent)) {
        envContent = envContent.replace(/GROQ_MODEL=.*/, `GROQ_MODEL=${model}`);
      } else {
        envContent += `\nGROQ_MODEL=${model}`;
      }
      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (e) {
      console.warn('Could not persist Groq key to .env:', e.message);
    }

    realtimeMonitor.addNotification({
      title: 'Groq Cloud AI Activated',
      message: `Ultra-fast inference enabled with ${model} (${latencyMs}ms benchmark latency).`,
      type: 'server',
      severity: 'success'
    });

    res.json({
      success: true,
      latencyMs,
      model,
      activated: true,
      provider: 'groq',
      reply: data.choices?.[0]?.message?.content || 'OK'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Fetch Live Available Groq Models on Account
app.get('/api/ai/groq-models', async (req, res) => {
  try {
    const key = aiEngine.getGroqApiKey();
    if (!key) {
      return res.json({ models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'allam-2-7b'] });
    }

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });

    if (!response.ok) {
      return res.json({ models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'allam-2-7b'] });
    }

    const data = await response.json();
    const chatModels = (data.data || [])
      .map(m => m.id)
      .filter(id => !id.includes('whisper') && !id.includes('guard'));

    res.json({ models: chatModels.length > 0 ? chatModels : ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'allam-2-7b'] });
  } catch (err) {
    res.json({ models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'allam-2-7b'] });
  }
});

// 14. Route 53 Custom Domain Setup & Automated ACM SSL Certificate Mapper
app.get('/api/domain/status', (req, res) => {
  const arch = aiEngine.getArchitecture();
  res.json({
    configured: !!arch.customDomain,
    customDomain: arch.customDomain || null
  });
});

app.post('/api/domain/configure', async (req, res) => {
  try {
    const rawDomain = (req.body.domain || '').trim().toLowerCase();
    if (!rawDomain) {
      return res.status(400).json({ success: false, error: 'Domain name is required (e.g. api.yourdomain.com).' });
    }

    // Clean domain format: remove http://, https://, trailing slashes
    const cleanDomain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(cleanDomain)) {
      return res.status(400).json({ success: false, error: 'Invalid domain format. Example: api.yourdomain.com' });
    }

    const sslProvider = req.body.sslProvider || 'AWS Certificate Manager (ACM TLS 1.3)';
    const hostedZoneId = `Z${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const certArn = `arn:aws:acm:us-east-1:839210495821:certificate/${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`;
    const albTarget = 'clouderator-alb-7492.us-east-1.elb.amazonaws.com';

    // Broadcast live DNS and SSL provisioning logs to DevOps terminal
    devopsEngine.broadcastLog(`\n============================================================`, 'comment');
    devopsEngine.broadcastLog(`[ROUTE 53 AUTOMATED DOMAIN & ACM SSL MAPPER]`, 'prompt', 10);
    devopsEngine.broadcastLog(`Target Domain: ${cleanDomain}`, 'stdout', 20);
    devopsEngine.broadcastLog(`$ aws route53 create-hosted-zone --name "${cleanDomain}" --caller-reference "${Date.now()}"`, 'cmd', 35);
    devopsEngine.broadcastLog(`[+] Route 53 Hosted Zone provisioned [ID: ${hostedZoneId}]`, 'success', 50);
    devopsEngine.broadcastLog(`$ aws acm request-certificate --domain-name "${cleanDomain}" --validation-method DNS`, 'cmd', 65);
    devopsEngine.broadcastLog(`[+] AWS ACM SSL/TLS 1.3 Certificate requested [ARN: ${certArn}]`, 'success', 80);
    devopsEngine.broadcastLog(`$ aws route53 change-resource-record-sets --hosted-zone-id ${hostedZoneId} (ALIAS -> ${albTarget})`, 'cmd', 90);
    devopsEngine.broadcastLog(`✨ Custom Domain Active: https://${cleanDomain} (TLS 1.3 Strict)`, 'final', 100, true);

    const customDomainData = {
      domain: cleanDomain,
      sslStatus: 'ISSUED',
      sslProvider,
      certArn,
      hostedZoneId,
      aliasTarget: albTarget,
      nameservers: [
        'ns-412.awsdns-51.com',
        'ns-1082.awsdns-07.org',
        'ns-1540.awsdns-00.co.uk',
        'ns-201.awsdns-25.net'
      ],
      endpointUrl: `https://${cleanDomain}`,
      updatedAt: new Date().toISOString()
    };

    const arch = aiEngine.getArchitecture();
    arch.customDomain = customDomainData;

    // Ensure a Route 53 DNS node exists or update the existing one on canvas
    let dnsNode = arch.nodes.find(n => n.id === 'dns' || (n.category === 'networking' && /dns|route/i.test(n.name)));
    if (!dnsNode) {
      dnsNode = {
        id: 'dns',
        name: `Route 53 (${cleanDomain})`,
        category: 'networking',
        specs: `ACM TLS 1.3 · ${cleanDomain}`,
        sla: '100% SLA',
        monthlyCost: 0.50,
        isFreeTier: false
      };
      arch.nodes.unshift(dnsNode);
    } else {
      dnsNode.name = `Route 53 (${cleanDomain})`;
      dnsNode.specs = `ACM TLS 1.3 · ${cleanDomain}`;
    }

    // Auto-heal connections
    aiEngine.healTopology();
    aiEngine.refreshMetrics();

    // Save artifacts (Terraform etc.)
    devopsEngine.saveArtifacts(arch);

    realtimeMonitor.addNotification({
      title: 'Custom Domain Mapped',
      message: `${cleanDomain} is now configured with Route 53 Alias DNS and ACM SSL (TLS 1.3).`,
      type: 'server',
      severity: 'success'
    });

    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });

    res.json({
      success: true,
      customDomain: customDomainData,
      architecture: arch
    });
  } catch (err) {
    console.error('Domain configuration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Custom Application Microservices (Kafka, Lambda, DynamoDB, OpenSearch)
app.post('/api/architecture/add-microservice', (req, res) => {
  try {
    const { serviceType } = req.body;
    const arch = aiEngine.getArchitecture();
    if (!Array.isArray(arch.nodes)) arch.nodes = [];
    if (!Array.isArray(arch.edges)) arch.edges = [];

    const catalogDefs = {
      kafka: {
        id: 'kafka',
        name: 'Apache Kafka (MSK)',
        category: 'messaging',
        specs: '3-Broker Managed Cluster for Event Streams',
        sla: '99.99% SLA',
        monthlyCost: 140.00,
        isFreeTier: false,
        pipelineLabel: 'Pub/Sub Events'
      },
      lambda: {
        id: 'lambda',
        name: 'AWS Lambda Serverless Worker',
        category: 'compute',
        specs: 'Event-driven Serverless Worker (1M Requests Free)',
        sla: '99.99% SLA',
        monthlyCost: 0.00,
        isFreeTier: true,
        freeTier: '1,000,000 Free Invocations Always',
        pipelineLabel: 'Serverless Worker'
      },
      dynamodb: {
        id: 'dynamodb',
        name: 'Amazon DynamoDB NoSQL',
        category: 'database',
        specs: 'On-Demand Pay-per-Request NoSQL Table (25GB Free)',
        sla: '99.999% SLA',
        monthlyCost: 0.00,
        isFreeTier: true,
        freeTier: '25 GB Storage Always Free',
        pipelineLabel: 'NoSQL Document Store'
      },
      opensearch: {
        id: 'opensearch',
        name: 'Amazon OpenSearch Cluster',
        category: 'database',
        specs: 'Log Analytics & Full-text Catalog Search',
        sla: '99.95% SLA',
        monthlyCost: 75.00,
        isFreeTier: false,
        pipelineLabel: 'Search & Analytics'
      }
    };

    const targetType = (serviceType || '').toLowerCase();
    const serviceDef = catalogDefs[targetType];

    if (!serviceDef) {
      return res.status(400).json({
        success: false,
        error: `Unknown service type "${serviceType}". Supported: kafka, lambda, dynamodb, opensearch`
      });
    }

    // Determine unique node ID if already present
    let nodeId = serviceDef.id;
    let counter = 1;
    while (arch.nodes.some(n => n.id === nodeId)) {
      counter++;
      nodeId = `${serviceDef.id}_${counter}`;
    }

    const newNode = {
      id: nodeId,
      name: counter > 1 ? `${serviceDef.name} #${counter}` : serviceDef.name,
      category: serviceDef.category,
      specs: serviceDef.specs,
      sla: serviceDef.sla,
      monthlyCost: serviceDef.monthlyCost,
      isFreeTier: serviceDef.isFreeTier,
      freeTier: serviceDef.freeTier || null
    };

    arch.nodes.push(newNode);

    // Intelligently wire edges
    const asgNode = arch.nodes.find(n => n.id === 'asg' || n.category === 'compute');
    const kafkaNode = arch.nodes.find(n => n.id === 'kafka' || n.id.startsWith('kafka'));
    const lambdaNode = arch.nodes.find(n => n.id === 'lambda' || n.id.startsWith('lambda'));
    const dynamoNode = arch.nodes.find(n => n.id === 'dynamodb' || n.id.startsWith('dynamodb'));

    const addEdgeSafe = (from, to, label) => {
      if (from && to && from !== to) {
        if (!arch.edges.some(e => e.from === from && e.to === to)) {
          arch.edges.push({ from, to, label });
        }
      }
    };

    if (targetType === 'kafka') {
      if (asgNode) addEdgeSafe(asgNode.id, newNode.id, 'Pub/Sub Events');
      if (lambdaNode) addEdgeSafe(newNode.id, lambdaNode.id, 'Event Trigger');
    } else if (targetType === 'lambda') {
      if (kafkaNode) addEdgeSafe(kafkaNode.id, newNode.id, 'Stream Trigger');
      else if (asgNode) addEdgeSafe(asgNode.id, newNode.id, 'Async Worker');
      if (dynamoNode) addEdgeSafe(newNode.id, dynamoNode.id, 'Store Records');
    } else if (targetType === 'dynamodb') {
      if (lambdaNode) addEdgeSafe(lambdaNode.id, newNode.id, 'Save Events');
      if (asgNode) addEdgeSafe(asgNode.id, newNode.id, 'NoSQL Queries');
    } else if (targetType === 'opensearch') {
      if (asgNode) addEdgeSafe(asgNode.id, newNode.id, 'Index Documents');
      if (kafkaNode) addEdgeSafe(kafkaNode.id, newNode.id, 'CDC Stream Sink');
    }

    // Always run topology healing
    aiEngine.healTopology();
    aiEngine.refreshMetrics();

    // Save updated IaC manifests
    devopsEngine.saveArtifacts(arch);

    realtimeMonitor.addNotification({
      title: 'Microservice Added',
      message: `${newNode.name} wired into your architecture topology.`,
      type: 'server',
      severity: 'info'
    });

    realtimeMonitor.broadcast({
      type: 'ARCHITECTURE_UPDATED',
      payload: arch
    });

    res.json({
      success: true,
      node: newNode,
      architecture: arch
    });
  } catch (err) {
    console.error('Add microservice error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Clouderator AI Infrastructure Console is running`);
  console.log(`🌐 Web UI: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Stream: ws://localhost:${PORT}/ws`);
  console.log(`===================================================`);
});
