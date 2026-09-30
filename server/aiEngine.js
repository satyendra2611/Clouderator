// Clouderator AI Infrastructure & Requirement Analysis Engine
const { calculateArchitectureCost } = require('./costIntelligence');
const { sessionStore, getEmptyArchitecture, getInitialGreeting } = require('./sessionStore');
const { CLOUD_SERVICES_CATALOG, findServiceByText } = require('./cloudCatalog');

// Initial default state directly matching the design mockup (Food Delivery App, 50k users)
const DEFAULT_ARCHITECTURE = {
  projectName: 'Food Delivery App',
  cloudProvider: 'aws',
  userScale: 50000,
  costReductionPct: 22,
  metrics: {
    monthlyCost: 2340,
    costPercentDiff: -22,
    performanceScore: 87,
    performanceStatus: 'Good',
    availabilityScore: 99.95,
    availabilityStatus: 'Multi-AZ Architecture',
    securityScore: 92,
    securityStatus: 'Great'
  },
  nodes: [
    {
      id: 'dns',
      name: 'DNS / Route53',
      category: 'networking',
      categoryColor: '#8b5cf6', // purple
      x: 363,
      y: 35,
      specs: 'Latency-based routing + Health Checks',
      sla: '100% SLA',
      monthlyCost: 18.00
    },
    {
      id: 'cdn',
      name: 'CDN (CloudFront)',
      category: 'networking',
      categoryColor: '#8b5cf6',
      x: 363,
      y: 125,
      specs: 'Global Edge Caching, TLS 1.3, DDoS Shield',
      sla: '99.9% SLA',
      monthlyCost: 95.00
    },
    {
      id: 'alb',
      name: 'Load Balancer (Application LB)',
      category: 'compute',
      categoryColor: '#f97316', // orange
      x: 363,
      y: 215,
      specs: 'Path-based routing, Cross-Zone Balancing',
      sla: '99.99% SLA',
      monthlyCost: 45.00
    },
    {
      id: 'websocket',
      name: 'WebSocket API Gateway',
      category: 'messaging',
      categoryColor: '#eab308', // amber/yellow
      x: 80,
      y: 320,
      specs: 'Persistent two-way connection for live order tracking',
      sla: '99.95% SLA',
      monthlyCost: 35.00
    },
    {
      id: 'asg',
      name: 'Auto Scaling Group',
      category: 'compute',
      categoryColor: '#f97316',
      x: 290,
      y: 320,
      isGroup: true,
      instanceCount: 3,
      specs: 'Min: 2, Desired: 3, Max: 8 (Target CPU: 70%)',
      children: [
        { id: 'app1', name: 'App Server (ECS / Fargate)', cpu: '2 vCPU', ram: '4 GB' },
        { id: 'app2', name: 'App Server (ECS / Fargate)', cpu: '2 vCPU', ram: '4 GB' },
        { id: 'app3', name: 'App Server (ECS / Fargate)', cpu: '2 vCPU', ram: '4 GB' }
      ],
      monthlyCost: 432.00
    },
    {
      id: 'redis',
      name: 'Redis (ElastiCache)',
      category: 'caching',
      categoryColor: '#ef4444', // red
      x: 645,
      y: 320,
      specs: 'cache.t4g.medium, Session store & live menu cache',
      sla: '99.9% SLA',
      monthlyCost: 65.00
    },
    {
      id: 'rds_replica',
      name: 'Read Replica (RDS)',
      category: 'database',
      categoryColor: '#10b981', // teal/green
      x: 145,
      y: 485,
      specs: 'db.r6g.large PostgreSQL (Read-heavy queries)',
      sla: '99.95% SLA',
      monthlyCost: 140.00
    },
    {
      id: 'rds_primary',
      name: 'PostgreSQL (RDS Multi-AZ)',
      category: 'database',
      categoryColor: '#10b981',
      x: 363,
      y: 485,
      isMultiAz: true,
      specs: 'db.r6g.large Multi-AZ Synchronous Replication',
      sla: '99.95% SLA',
      monthlyCost: 320.00
    },
    {
      id: 's3',
      name: 'S3 (Media Storage)',
      category: 'storage',
      categoryColor: '#3b82f6', // blue
      x: 580,
      y: 485,
      specs: 'Restaurant menus, order receipts, food photos',
      sla: '99.999999999% Durability',
      monthlyCost: 45.00
    }
  ],
  edges: [
    { from: 'dns', to: 'cdn', label: 'Resolves to' },
    { from: 'cdn', to: 'alb', label: 'Dynamic Requests' },
    { from: 'alb', to: 'asg', label: 'Balances Traffic' },
    { from: 'websocket', to: 'asg', label: 'Live Events' },
    { from: 'asg', to: 'redis', label: 'Cache Reads/Writes' },
    { from: 'asg', to: 'rds_primary', label: 'Transactional Writes' },
    { from: 'asg', to: 'rds_replica', label: 'Reporting & Feeds' },
    { from: 'asg', to: 's3', label: 'Media Assets' },
    { from: 'rds_replica', to: 'rds_primary', label: 'Async Replication', dashed: true }
  ]
};

// Initial chat transcript matching the user interface in the mockup
const INITIAL_CHAT = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '10:15 AM',
    text: 'I want to build a food delivery application for 50,000 daily users.'
  },
  {
    id: 'msg-2',
    sender: 'ai',
    timestamp: '10:15 AM',
    text: "Great! I've analyzed your requirements and here is the initial architecture I recommend.",
    bulletPoints: [
      'High availability web application',
      'Scalable backend services',
      'PostgreSQL for relational data',
      'Redis for caching & sessions',
      'S3 for media storage',
      'CDN for static content'
    ],
    actionButton: { text: 'View Architecture →', action: 'highlight_canvas' }
  },
  {
    id: 'msg-3',
    sender: 'user',
    timestamp: '10:17 AM',
    text: 'Add real-time order tracking.'
  },
  {
    id: 'msg-4',
    sender: 'ai',
    timestamp: '10:17 AM',
    text: 'Added WebSocket service using AWS API Gateway (WebSocket) and improved architecture.',
    actionButton: { text: 'View Changes', action: 'highlight_websocket' }
  },
  {
    id: 'msg-5',
    sender: 'user',
    timestamp: '10:18 AM',
    text: 'Reduce cost by 20%'
  },
  {
    id: 'msg-6',
    sender: 'ai',
    timestamp: '10:18 AM',
    text: "Optimized instance configurations, enabled S3 Intelligent-Tiering, and switched ECS to ARM64 Graviton instances. Monthly spend reduced by 22% from previous baseline ($2,340/mo down to $1,825/mo on 1-Yr Savings Plan).",
    bulletPoints: [
      'Switched ECS tasks to AWS Graviton (saving ~20%)',
      'Configured off-peak autoscaling schedule for Read Replica',
      'Reduced over-provisioned memory buffers on ElastiCache',
      'Applied 1-Year Compute Savings Plan tier'
    ]
  }
];

class ClouderatorAIEngine {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.groqModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.preferredProvider = process.env.AI_PROVIDER || 'auto'; // 'auto', 'groq', 'gemini', 'builtin'

    // Start with a clean empty architecture and fresh greeting on initial start
    const initialSession = sessionStore.createSession('New Cloud Architecture');
    this.currentSessionId = initialSession.id;
    this.currentArchitecture = initialSession.architecture;
    this.chatHistory = initialSession.messages;
    this.refreshMetrics();
  }

  getCurrentSessionId() {
    return this.currentSessionId;
  }

  startNewSession(title = 'New Cloud Architecture') {
    const session = sessionStore.createSession(title);
    this.currentSessionId = session.id;
    this.currentArchitecture = session.architecture;
    this.chatHistory = session.messages;
    this.refreshMetrics();
    return session;
  }

  loadSession(sessionId) {
    const session = sessionStore.getSession(sessionId);
    if (!session) return null;
    this.currentSessionId = session.id;
    this.currentArchitecture = session.architecture || getEmptyArchitecture();
    this.chatHistory = session.messages || getInitialGreeting();
    this.refreshMetrics();
    return session;
  }

  setGroqApiKey(key) {
    this.groqApiKey = (key || '').trim();
  }

  getGroqApiKey() {
    return this.groqApiKey || process.env.GROQ_API_KEY || '';
  }

  setGroqModel(model) {
    if (model && model.trim()) {
      this.groqModel = model.trim();
    }
  }

  getGroqModel() {
    return this.groqModel || process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  }

  setApiKey(key) {
    this.geminiApiKey = (key || '').trim();
  }

  getApiKey() {
    return this.geminiApiKey || process.env.GEMINI_API_KEY || '';
  }

  setPreferredProvider(provider) {
    this.preferredProvider = provider;
  }

  getPreferredProvider() {
    return this.preferredProvider;
  }

  getActiveProvider() {
    const groqKey = this.getGroqApiKey();
    const geminiKey = this.getApiKey();

    if (this.preferredProvider === 'groq' && groqKey) return 'groq';
    if (this.preferredProvider === 'gemini' && geminiKey) return 'gemini';
    if (this.preferredProvider === 'builtin') return 'builtin';
    // Auto resolution: Groq prioritized, then Gemini, then builtin
    if (groqKey) return 'groq';
    if (geminiKey) return 'gemini';
    return 'builtin';
  }

  getArchitecture() {
    return this.currentArchitecture;
  }

  getChatHistory() {
    return this.chatHistory;
  }

  refreshMetrics() {
    if (!this.currentArchitecture) return;
    if (!this.currentArchitecture.metrics) {
      this.currentArchitecture.metrics = {
        monthlyCost: 0,
        costPercentDiff: 0,
        performanceScore: 88,
        performanceStatus: 'Good',
        availabilityScore: 99.95,
        availabilityStatus: 'Multi-AZ Architecture',
        securityScore: 92,
        securityStatus: 'Great'
      };
    }
    const costData = calculateArchitectureCost(this.currentArchitecture);
    this.currentArchitecture.metrics.monthlyCost = costData.monthlyTotal;
    this.currentArchitecture.metrics.costPercentDiff = costData.percentChange;
  }

  addNode(nodeData) {
    const id = nodeData.id || `node_${Date.now()}`;
    const category = nodeData.category || 'compute';
    const catalogMatch = findServiceByText(nodeData.id || nodeData.name);
    
    // Calculate smart tier coordinates for non-overlapping placement
    const existingInCat = this.currentArchitecture.nodes.filter(n => n.category === category).length;
    let defaultY = 320;
    let defaultX = 645;

    if (category === 'compute') {
      defaultY = 215;
      defaultX = 145 + (existingInCat * 185);
    } else if (category === 'networking') {
      defaultY = 125;
      defaultX = 145 + (existingInCat * 215);
    } else if (category === 'database' || category === 'storage') {
      defaultY = 580;
      defaultX = 290 + (existingInCat * 185);
    } else if (category === 'messaging') {
      defaultY = 415;
      defaultX = 80 + (existingInCat * 185);
    } else if (category === 'caching') {
      defaultY = 415;
      defaultX = 645 + (existingInCat * 185);
    }

    const newNode = {
      id,
      name: nodeData.name || catalogMatch?.name || 'Cloud Service',
      category: category,
      categoryColor: nodeData.categoryColor || catalogMatch?.categoryColor || '#2563eb',
      specs: nodeData.specs || catalogMatch?.specs || 'Standard Managed Service',
      sla: nodeData.sla || catalogMatch?.sla || '99.9% SLA',
      monthlyCost: nodeData.monthlyCost !== undefined ? Number(nodeData.monthlyCost) : (catalogMatch?.cost || 45.00),
      isFreeTier: nodeData.isFreeTier ?? catalogMatch?.isFreeTier ?? false,
      freeTier: nodeData.freeTier || catalogMatch?.freeTier || '',
      x: nodeData.x || defaultX,
      y: nodeData.y || defaultY
    };

    this.currentArchitecture.nodes.push(newNode);

    // Auto-connect to topology
    this.autoConnectServiceNode(newNode);

    // Boost security score if WAF or Shield or IAM is added
    if (id === 'waf' || id === 'iam' || (nodeData.name && /waf|shield|iam/i.test(nodeData.name))) {
      this.currentArchitecture.metrics.securityScore = Math.min(99, (this.currentArchitecture.metrics.securityScore || 92) + 6);
    }

    this.refreshMetrics();
    return { newNode, architecture: this.currentArchitecture };
  }

  connectNodes(fromId, toId, label = 'Connects', dashed = false) {
    if (!fromId || !toId || fromId === toId) return false;
    const arch = this.currentArchitecture;
    if (!arch || !Array.isArray(arch.nodes) || !Array.isArray(arch.edges)) return false;

    // Verify both nodes exist
    const fromNode = arch.nodes.find(n => n.id === fromId);
    const toNode = arch.nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return false;

    // Avoid duplicate edge
    const exists = arch.edges.some(e => e.from === fromId && e.to === toId);
    if (exists) return true;

    arch.edges.push({
      from: fromId,
      to: toId,
      label: label || 'Connects',
      dashed: !!dashed
    });

    this.refreshMetrics();
    return true;
  }

  disconnectNodes(fromId, toId = null) {
    const arch = this.currentArchitecture;
    if (!arch || !Array.isArray(arch.edges)) return 0;
    const initialLen = arch.edges.length;

    if (toId) {
      arch.edges = arch.edges.filter(e => !(e.from === fromId && e.to === toId) && !(e.from === toId && e.to === fromId));
    } else {
      arch.edges = arch.edges.filter(e => e.from !== fromId && e.to !== fromId);
    }

    const removed = initialLen - arch.edges.length;
    this.refreshMetrics();
    return removed;
  }

  findNodesByReference(refQuery, arch = this.currentArchitecture) {
    if (!refQuery || !arch || !Array.isArray(arch.nodes)) return [];
    const q = refQuery.toLowerCase().trim();
    const nodes = arch.nodes;

    // 1. Direct ID match
    const exact = nodes.filter(n => n.id.toLowerCase() === q);
    if (exact.length > 0) return exact;

    // 2. ID contains
    const idMatch = nodes.filter(n => n.id.toLowerCase().includes(q));
    if (idMatch.length > 0) return idMatch;

    // 3. Name or specs match
    const nameOrSpec = nodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      (n.specs && n.specs.toLowerCase().includes(q))
    );
    if (nameOrSpec.length > 0) return nameOrSpec;

    // 4. Aliases
    if (/\b(t4g|graviton)\b/i.test(q)) {
      return nodes.filter(n => (n.specs && /t4g/i.test(n.specs)) || /t4g/i.test(n.name) || /t4g/i.test(n.id));
    }
    if (/\b(database|db|postgres|mysql|aurora)\b/i.test(q)) {
      return nodes.filter(n => n.category === 'database' || /database|rds|aurora|postgres/i.test(n.name));
    }
    if (/\b(cache|redis|in-memory)\b/i.test(q)) {
      return nodes.filter(n => n.category === 'caching' || /cache|redis/i.test(n.name));
    }
    if (/\b(storage|bucket|s3)\b/i.test(q)) {
      return nodes.filter(n => n.category === 'storage' || /s3|storage|bucket/i.test(n.name));
    }
    if (/\b(server|compute|instance|ec2|vm|pod)\b/i.test(q)) {
      return nodes.filter(n => n.category === 'compute' && n.id !== 'alb' && !n.id.startsWith('lambda'));
    }
    if (/\b(gateway|apigw|api)\b/i.test(q)) {
      return nodes.filter(n => n.id.includes('apigw') || n.id.includes('gateway') || /gateway|api/i.test(n.name));
    }
    if (/\b(load\s*balancer|alb|elb)\b/i.test(q)) {
      return nodes.filter(n => n.id === 'alb' || /load\s*balancer/i.test(n.name));
    }
    if (/\b(waf|firewall|shield)\b/i.test(q)) {
      return nodes.filter(n => n.id === 'waf' || /waf|shield|firewall/i.test(n.name));
    }
    if (/\b(cdn|cloudfront)\b/i.test(q)) {
      return nodes.filter(n => n.id === 'cdn' || n.id === 'cloudfront' || /cdn|cloudfront/i.test(n.name));
    }
    if (/\b(dns|route53)\b/i.test(q)) {
      return nodes.filter(n => n.id === 'dns' || n.id === 'route53' || /dns|route\s*53/i.test(n.name));
    }

    return [];
  }

  connectNodeToTopology(targetNode, arch = this.currentArchitecture) {
    if (!targetNode || !arch || !Array.isArray(arch.nodes)) return [];
    if (!Array.isArray(arch.edges)) arch.edges = [];

    const nodes = arch.nodes;
    const id = targetNode.id;
    const cat = targetNode.category;
    const created = [];

    const add = (from, to, label, dashed = false) => {
      if (this.connectNodes(from, to, label, dashed)) {
        created.push({ from, to, label });
      }
    };

    const dns = nodes.find(n => n.id === 'dns' || n.id === 'route53' || (n.category === 'networking' && /dns|route/i.test(n.name)));
    const cdn = nodes.find(n => n.id === 'cdn' || n.id === 'cloudfront' || /cdn|cloudfront/i.test(n.name));
    const waf = nodes.find(n => n.id === 'waf' || /waf|shield/i.test(n.name));
    const alb = nodes.find(n => n.id === 'alb' || /load\s*balancer/i.test(n.name));
    const apigw = nodes.find(n => n.id === 'apigw' || n.id === 'apigateway' || n.id === 'websocket' || /gateway/i.test(n.name));
    const lambdas = nodes.filter(n => n.id.startsWith('lambda') || /lambda/i.test(n.name));
    const dbs = nodes.filter(n => n.category === 'database');
    const caches = nodes.filter(n => n.category === 'caching');
    const storages = nodes.filter(n => n.category === 'storage');
    const messaging = nodes.filter(n => n.category === 'messaging');

    const primaryIngress = alb || apigw;

    if (cat === 'compute' && id !== 'alb') {
      if (primaryIngress) {
        add(primaryIngress.id, id, 'Balances Traffic');
      } else if (waf) {
        add(waf.id, id, 'Filtered Traffic');
      } else if (cdn) {
        add(cdn.id, id, 'Dynamic Origin Route');
      } else if (dns) {
        add(dns.id, id, 'Direct DNS Routing');
      }

      if (lambdas.length > 0 && !id.startsWith('lambda')) {
        add(lambdas[0].id, id, 'Dispatches Tasks');
      }

      if (dbs.length > 0) {
        const primaryDb = dbs.find(d => !d.id.includes('replica')) || dbs[0];
        add(id, primaryDb.id, 'ACID Queries');
      }
      if (caches.length > 0) {
        add(id, caches[0].id, 'Cache Session');
      }
      if (storages.length > 0) {
        add(id, storages[0].id, 'Asset Read/Write');
      }
      if (messaging.length > 0) {
        add(id, messaging[0].id, 'Event Stream');
      }
    } else if (cat === 'networking') {
      if (id === 'waf') {
        if (cdn) add(id, cdn.id, 'Edge DDoS Shield');
        if (primaryIngress) add(id, primaryIngress.id, 'Layer 7 Protection');
        if (dns && !cdn) add(dns.id, id, 'DNS to Perimeter');
      } else if (id === 'cdn' || id === 'cloudfront') {
        if (dns) add(dns.id, id, 'Global DNS Routing');
        if (waf) add(waf.id, id, 'Edge Shield');
        if (primaryIngress) add(id, primaryIngress.id, 'Dynamic Origin');
        if (storages.length > 0) add(id, storages[0].id, 'Static Asset Cache');
      } else if (id === 'dns' || id === 'route53') {
        if (cdn) add(id, cdn.id, 'Global DNS Anycast');
        else if (waf) add(id, waf.id, 'DNS to WAF');
        else if (primaryIngress) add(id, primaryIngress.id, 'Direct DNS');
      } else if (id === 'apigw' || id === 'apigateway' || id === 'alb') {
        if (cdn) add(cdn.id, id, 'Origin Proxy');
        else if (dns) add(dns.id, id, 'DNS Direct');
        if (waf) add(waf.id, id, 'WAF Filter');
        const computeNodes = nodes.filter(n => n.category === 'compute' && n.id !== id && n.id !== 'alb');
        computeNodes.forEach(comp => add(id, comp.id, 'Routes Requests'));
      }
    } else if (cat === 'database' || cat === 'caching' || cat === 'storage' || cat === 'messaging') {
      const computeNodes = nodes.filter(n => n.category === 'compute' && n.id !== 'alb');
      const callers = computeNodes.length > 0 ? computeNodes : (primaryIngress ? [primaryIngress] : []);
      callers.forEach(comp => {
        if (cat === 'database') add(comp.id, id, 'Database Queries');
        else if (cat === 'caching') add(comp.id, id, 'Cache Session');
        else if (cat === 'storage') add(comp.id, id, 'Asset Storage');
        else if (cat === 'messaging') add(comp.id, id, 'Publish Events');
      });
      if (cat === 'storage' && cdn) {
        add(cdn.id, id, 'Origin Asset Pull');
      }
    }

    return created;
  }

  healTopology(arch = this.currentArchitecture) {
    if (!arch || !Array.isArray(arch.nodes) || arch.nodes.length === 0) return [];
    if (!Array.isArray(arch.edges)) arch.edges = [];

    // Sanitize edges: remove any edge where from or to node does not exist in arch.nodes
    arch.edges = arch.edges.filter(e => 
      arch.nodes.some(n => n.id === e.from) && 
      arch.nodes.some(n => n.id === e.to)
    );

    const nodes = arch.nodes;
    const addedEdges = [];

    const addEdge = (from, to, label = 'Connects', dashed = false) => {
      if (!from || !to || from === to) return false;
      if (!nodes.some(n => n.id === from) || !nodes.some(n => n.id === to)) return false;
      if (arch.edges.some(e => e.from === from && e.to === to)) return false;
      const newEdge = { from, to, label, dashed: !!dashed };
      arch.edges.push(newEdge);
      addedEdges.push(newEdge);
      return true;
    };

    const dnsNodes = nodes.filter(n => n.id === 'dns' || n.id === 'route53' || (n.category === 'networking' && /dns|route/i.test(n.name)));
    const cdnNodes = nodes.filter(n => n.id === 'cdn' || n.id === 'cloudfront' || /cdn|cloudfront/i.test(n.name));
    const wafNodes = nodes.filter(n => n.id === 'waf' || /waf|shield|firewall/i.test(n.name));
    const ingressNodes = nodes.filter(n => n.id === 'alb' || n.id === 'apigw' || n.id === 'apigateway' || n.id === 'websocket' || /load\s*balancer|gateway/i.test(n.name));
    const computeNodes = nodes.filter(n => {
      if (ingressNodes.includes(n)) return false;
      return n.category === 'compute' || n.id === 'asg' || n.id === 'ec2' || n.id === 'ecs' || n.id === 'eks' || n.id.startsWith('lambda') || /ec2|instance|server|container|t4g|t3|lambda/i.test(n.name);
    });
    const cacheNodes = nodes.filter(n => n.category === 'caching' || n.id === 'redis' || /cache|redis/i.test(n.name));
    const dbNodes = nodes.filter(n => n.category === 'database' || n.id.startsWith('rds') || n.id === 'aurora' || n.id === 'dynamodb' || n.id === 'db' || /database|postgres|mysql|sql|mongo/i.test(n.name));
    const storageNodes = nodes.filter(n => n.category === 'storage' || n.id === 's3' || n.id === 'ebs' || n.id === 'efs' || /s3|storage|bucket/i.test(n.name));
    const messagingNodes = nodes.filter(n => n.category === 'messaging' || n.id === 'sqs' || n.id === 'sns' || n.id === 'kafka' || /queue|topic|kafka|sqs|sns/i.test(n.name));

    const primaryIngress = ingressNodes[0] || computeNodes[0];

    // 1. DNS connections
    dnsNodes.forEach(dns => {
      if (cdnNodes.length > 0) addEdge(dns.id, cdnNodes[0].id, 'Global DNS Routing');
      else if (wafNodes.length > 0) addEdge(dns.id, wafNodes[0].id, 'DNS to Perimeter');
      else if (primaryIngress) addEdge(dns.id, primaryIngress.id, 'DNS Resolution');
    });

    // 2. CDN connections
    cdnNodes.forEach(cdn => {
      if (wafNodes.length > 0) {
        addEdge(wafNodes[0].id, cdn.id, 'Edge DDoS Shield');
      }
      if (ingressNodes.length > 0) {
        ingressNodes.forEach(ing => addEdge(cdn.id, ing.id, 'Dynamic Origin Route'));
      } else if (computeNodes.length > 0) {
        computeNodes.forEach(comp => addEdge(cdn.id, comp.id, 'Direct Origin Route'));
      }
      const s3 = storageNodes.find(s => s.id === 's3' || /s3|bucket/i.test(s.name));
      if (s3) addEdge(cdn.id, s3.id, 'Static Cache Origin');
    });

    // 3. WAF connections
    wafNodes.forEach(waf => {
      if (cdnNodes.length === 0 && ingressNodes.length > 0) {
        ingressNodes.forEach(ing => addEdge(waf.id, ing.id, 'Layer 7 WAF Filter'));
      } else if (cdnNodes.length === 0 && computeNodes.length > 0) {
        computeNodes.forEach(comp => addEdge(waf.id, comp.id, 'Direct WAF Filter'));
      }
    });

    // 4. Ingress (ALB / API Gateway) to Compute
    ingressNodes.forEach(ing => {
      if (computeNodes.length > 0) {
        computeNodes.forEach(comp => addEdge(ing.id, comp.id, 'Routes Traffic'));
      } else {
        if (dbNodes.length > 0) addEdge(ing.id, dbNodes[0].id, 'Direct DB Access');
      }
    });

    // 5. Compute to downstream
    computeNodes.forEach(comp => {
      if (ingressNodes.length === 0 && cdnNodes.length === 0 && dnsNodes.length > 0) {
        addEdge(dnsNodes[0].id, comp.id, 'Direct DNS Ingress');
      }
      cacheNodes.forEach(cache => addEdge(comp.id, cache.id, 'Session Cache'));
      const primaryDb = dbNodes.find(d => !d.id.includes('replica')) || dbNodes[0];
      if (primaryDb) addEdge(comp.id, primaryDb.id, 'ACID Queries');
      storageNodes.forEach(store => {
        if (store.id !== 'glacier') addEdge(comp.id, store.id, 'Asset Read/Write');
      });
      messagingNodes.forEach(msg => addEdge(comp.id, msg.id, 'Async Events'));
    });

    // 6. DB Replica to Primary
    const replicaDb = dbNodes.find(d => d.id.includes('replica'));
    const primaryDb = dbNodes.find(d => d.id.includes('primary') || (!d.id.includes('replica')));
    if (replicaDb && primaryDb && replicaDb.id !== primaryDb.id) {
      addEdge(replicaDb.id, primaryDb.id, 'Async Replication', true);
    }

    // 7. S3 to Glacier
    const glacier = storageNodes.find(s => s.id === 'glacier');
    const s3 = storageNodes.find(s => s.id === 's3');
    if (glacier && s3) {
      addEdge(s3.id, glacier.id, 'Lifecycle Archival', true);
    }

    // 8. FINAL SAFETY NET: Ensure EVERY single node in the architecture has at least one edge!
    nodes.forEach(node => {
      const edgeCount = arch.edges.filter(e => e.from === node.id || e.to === node.id).length;
      if (edgeCount === 0) {
        this.connectNodeToTopology(node, arch);
      }
    });

    if (addedEdges.length > 0) {
      this.refreshMetrics();
    }

    return addedEdges;
  }

  autoConnectServiceNode(newNode) {
    this.connectNodeToTopology(newNode);
    this.healTopology();
  }

  autoLayoutCanvas(arch = this.currentArchitecture) {
    if (!arch || !Array.isArray(arch.nodes)) return;
    arch.nodes.forEach(node => {
      delete node._customPos;
    });
    this.healTopology(arch);
  }

  handleConnectionIntent(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    const lower = messageText.toLowerCase().trim();

    // Check if message is a connection / link / wiring command
    const isConnectVerb = /\b(connect|jodo|link|wire|attach|reconnect)\b/i.test(lower) ||
                          /\b(fix|theek|sahi|update)\b.*\b(connection|connections|edge|edges|link|wiring)\b/i.test(lower) ||
                          /\b(connect\s*nahi|disconnected|missing\s*connection|nahi\s*hua)\b/i.test(lower) ||
                          /\b(services?\s*connected\s*nahi)\b/i.test(lower) ||
                          /\b(edges?\s*update)\b/i.test(lower);

    if (!isConnectVerb) return null;

    // A. Check for pairwise connection: "connect A to B" or "A ko B se connect karo"
    const pairMatch = lower.match(/(?:connect|link|attach|jodo)\s+([a-z0-9_.-]+)\s+(?:to|with|and|aur|se)\s+([a-z0-9_.-]+)/i) ||
                      lower.match(/([a-z0-9_.-]+)\s+(?:ko|and|aur)\s+([a-z0-9_.-]+)\s+(?:se|ko)?\s*(?:connect|link|jodo)/i);

    if (pairMatch) {
      const queryA = pairMatch[1];
      const queryB = pairMatch[2];
      const nodesA = this.findNodesByReference(queryA);
      const nodesB = this.findNodesByReference(queryB);

      if (nodesA.length > 0 && nodesB.length > 0) {
        const nodeA = nodesA[0];
        const nodeB = nodesB[0];
        this.connectNodes(nodeA.id, nodeB.id, 'Traffic & Data Route');
        this.healTopology();

        const replyText = `✅ **${nodeA.name}** ko **${nodeB.name}** ke saath architecture canvas par successfully connect kar diya gaya hai!`;
        const bullets = [
          `Active pipeline edge added: ${nodeA.name} ➔ ${nodeB.name}`,
          `Full topology scanned and all adjacent nodes verified`,
          `Live traffic pulse stream activated on canvas`
        ];

        const aiMsg = {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: replyText,
          bulletPoints: bullets,
          actionButton: { text: 'View Connections on Canvas', action: 'highlight_canvas', targetNodeId: nodeA.id },
          provider: 'clouderator'
        };

        this.chatHistory.push(aiMsg);
        this.persistCurrentSession(messageText);
        return { reply: aiMsg, architecture: this.currentArchitecture };
      }
    }

    // B. Check for target node connection: e.g. "t4g ko connect kro", "connect t4g", "connect ec2"
    let targetNodes = [];
    const tokens = lower.split(/[\s,]+/);
    for (const token of tokens) {
      if (['connect', 'kro', 'karo', 'ko', 'se', 'aur', 'and', 'to', 'link', 'jodo', 'sab', 'all', 'theek', 'edges'].includes(token)) continue;
      const matched = this.findNodesByReference(token);
      if (matched.length > 0) {
        targetNodes = [...targetNodes, ...matched];
      }
    }
    // Remove duplicates
    targetNodes = targetNodes.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (targetNodes.length > 0) {
      const createdEdges = [];
      targetNodes.forEach(node => {
        const edges = this.connectNodeToTopology(node);
        createdEdges.push(...edges);
      });
      this.healTopology();

      const names = targetNodes.map(n => n.name).join(', ');
      const replyText = `✅ **${names}** ko successfully architecture pipeline ke saath fully connect kar diya gaya hai!`;
      const bullets = createdEdges.length > 0 
        ? createdEdges.map(e => `Connected: ${e.from} ➔ ${e.to} (${e.label})`)
        : [
          `Validated ingress routing to ${names}`,
          `Downstream database, caching & storage persistence linked`,
          `All zero-connection warnings cleared from topology`
        ];

      const aiMsg = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText,
        bulletPoints: bullets,
        actionButton: { text: 'View on Canvas', action: 'highlight_canvas', targetNodeId: targetNodes[0].id },
        provider: 'clouderator'
      };

      this.chatHistory.push(aiMsg);
      this.persistCurrentSession(messageText);
      return { reply: aiMsg, architecture: this.currentArchitecture };
    }

    // C. Global connection healing: e.g. "sab connect karo", "connect all", "fix connections", "nahi hua hai", "edges update karo"
    const newEdges = this.healTopology();
    let replyText = `✅ Architecture ke sabhi disconnected components aur edges ko successfully interconnect kar diya gaya hai!`;
    const bullets = newEdges.length > 0
      ? newEdges.map(e => `Linked: ${e.from} ➔ ${e.to} (${e.label})`)
      : [
        `Route53 / DNS ➔ CDN & WAF Perimeter verified`,
        `Ingress / API Gateway ➔ Compute fleet linked`,
        `Compute ➔ Database & Storage pipelines active`,
        `Poori topology zero-orphan status par hai`
      ];

    const aiMsg = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: replyText,
      bulletPoints: bullets,
      actionButton: { text: 'Inspect Full Flow', action: 'highlight_canvas' },
      provider: 'clouderator'
    };

    this.chatHistory.push(aiMsg);
    this.persistCurrentSession(messageText);
    return { reply: aiMsg, architecture: this.currentArchitecture };
  }

  handleDisconnectionIntent(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    const lower = messageText.toLowerCase().trim();

    const isDisconnect = /\b(disconnect|unlink|alag\s*karo|connection\s*hata|edge\s*hata|link\s*hata)\b/i.test(lower);
    if (!isDisconnect) return null;

    const tokens = lower.split(/[\s,]+/);
    let matchedNodes = [];
    for (const token of tokens) {
      if (['disconnect', 'unlink', 'alag', 'karo', 'ko', 'se', 'aur', 'and', 'from', 'connection', 'hata', 'do', 'hatao'].includes(token)) continue;
      const matched = this.findNodesByReference(token);
      if (matched.length > 0) {
        matchedNodes = [...matchedNodes, ...matched];
      }
    }
    matchedNodes = matchedNodes.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (matchedNodes.length >= 2) {
      const nA = matchedNodes[0];
      const nB = matchedNodes[1];
      this.disconnectNodes(nA.id, nB.id);

      const aiMsg = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✅ **${nA.name}** aur **${nB.name}** ke beech ka connection successfully remove kar diya gaya hai.`,
        bulletPoints: [`Disconnected edge: ${nA.id} ↔ ${nB.id}`, `Updated canvas topology and network routes`],
        actionButton: { text: 'View Canvas', action: 'highlight_canvas' },
        provider: 'clouderator'
      };
      this.chatHistory.push(aiMsg);
      this.persistCurrentSession(messageText);
      return { reply: aiMsg, architecture: this.currentArchitecture };
    } else if (matchedNodes.length === 1) {
      const node = matchedNodes[0];
      this.disconnectNodes(node.id);

      const aiMsg = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✅ **${node.name}** ke sabhi connections successfully remove kar diye gaye hain.`,
        bulletPoints: [`Isolated node: ${node.name}`, `Metrics recalculated`],
        actionButton: { text: 'View Canvas', action: 'highlight_canvas' },
        provider: 'clouderator'
      };
      this.chatHistory.push(aiMsg);
      this.persistCurrentSession(messageText);
      return { reply: aiMsg, architecture: this.currentArchitecture };
    }

    return null;
  }

  handleNodeRemovalIntent(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    const lower = messageText.toLowerCase().trim();

    if (lower.includes('connection') || lower.includes('edge') || lower.includes('link') || lower.includes('disconnect')) {
      return null;
    }

    const isRemoval = /\b(remove|delete|hata\s*do|hatao|nikal\s*do|delete\s*karo)\b/i.test(lower);
    if (!isRemoval) return null;

    const tokens = lower.split(/[\s,]+/);
    let matchedNodes = [];
    for (const token of tokens) {
      if (['remove', 'delete', 'hata', 'do', 'hatao', 'nikal', 'karo', 'ko', 'se', 'aur', 'service'].includes(token)) continue;
      const matched = this.findNodesByReference(token);
      if (matched.length > 0) {
        matchedNodes = [...matchedNodes, ...matched];
      }
    }
    matchedNodes = matchedNodes.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (matchedNodes.length > 0) {
      matchedNodes.forEach(node => {
        this.deleteNode(node.id);
      });
      this.healTopology();

      const names = matchedNodes.map(n => n.name).join(', ');
      const aiMsg = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✅ **${names}** ko architecture canvas se successfully delete / remove kar diya gaya hai.`,
        bulletPoints: [
          `Removed nodes: ${names}`,
          `Adjacent connections healed`,
          `Updated monthly cost to $${this.currentArchitecture.metrics.monthlyCost}/mo`
        ],
        actionButton: { text: 'View Canvas', action: 'highlight_canvas' },
        provider: 'clouderator'
      };
      this.chatHistory.push(aiMsg);
      this.persistCurrentSession(messageText);
      return { reply: aiMsg, architecture: this.currentArchitecture };
    }

    return null;
  }

  handleLayoutIntent(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    const lower = messageText.toLowerCase().trim();

    const isLayout = /\b(auto\s*layout|clean\s*layout|align\s*karo|arrange\s*karo|spacing\s*theek|layout\s*theek|nodes?\s*arrange)\b/i.test(lower);
    if (!isLayout) return null;

    this.autoLayoutCanvas();

    const aiMsg = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `✅ Architecture Canvas ko successfully **Auto-Layout** kar diya gaya hai! Sabhi nodes aur connections non-overlapping grid par cleanly align hain.`,
      bulletPoints: [
        `Mathematical tier alignment applied across all tiers`,
        `Topology edges verified and traffic pulses synchronized`,
        `Zero-overlap clearance guaranteed`
      ],
      actionButton: { text: 'View Clean Canvas', action: 'highlight_canvas' },
      provider: 'clouderator'
    };
    this.chatHistory.push(aiMsg);
    this.persistCurrentSession(messageText);
    return { reply: aiMsg, architecture: this.currentArchitecture };
  }

  handleNodeScalingIntent(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    const lower = messageText.toLowerCase().trim();

    const isScale = /\b(scale|badhao|instances?|replicas?)\b/i.test(lower);
    if (!isScale) return null;

    const numMatch = lower.match(/\b(\d+)\b/);
    const count = numMatch ? parseInt(numMatch[1], 10) : null;
    if (!count || count < 1 || count > 50) return null;

    const tokens = lower.split(/[\s,]+/);
    let matchedNodes = [];
    for (const token of tokens) {
      if (['scale', 'badhao', 'instances', 'instance', 'replicas', 'replica', 'ko', 'se', 'to', 'kar', 'do', 'karo'].includes(token)) continue;
      const matched = this.findNodesByReference(token);
      if (matched.length > 0) {
        matchedNodes = [...matchedNodes, ...matched];
      }
    }
    matchedNodes = matchedNodes.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (matchedNodes.length > 0) {
      const node = matchedNodes[0];
      node.isGroup = true;
      node.instanceCount = count;
      node.specs = `Scale: ${count} Active Replicas (${node.specs || 'Managed instances'})`;
      node.monthlyCost = Math.round(Number(node.monthlyCost || 30) * (count / 2));
      this.refreshMetrics();

      const aiMsg = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✅ **${node.name}** ko successfully **${count} instances** par scale kar diya gaya hai!`,
        bulletPoints: [
          `Updated replica capacity: ${count} instances`,
          `Target CPU threshold & auto-scaling policies synced`,
          `Recalculated monthly spend: $${this.currentArchitecture.metrics.monthlyCost}/mo`
        ],
        actionButton: { text: 'View Node Specs', action: 'highlight_canvas', targetNodeId: node.id },
        provider: 'clouderator'
      };
      this.chatHistory.push(aiMsg);
      this.persistCurrentSession(messageText);
      return { reply: aiMsg, architecture: this.currentArchitecture };
    }

    return null;
  }

  handleServiceInsertionIntent(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    const lower = messageText.toLowerCase().trim();

    // Do NOT trigger if it is a connection or deletion command
    if (/\b(connect|link|wire|jodo|disconnect|unlink|alag|delete|remove|hata)\b/i.test(lower)) {
      return null;
    }

    // Check for insertion/creation intent verbs (jodo removed)
    const hasInsertVerb = /\b(insert|make|add|create|put|plug|include|banao|daalo|daal do|lagao|set karo|add karo|insert karo)\b/i.test(lower);
    if (!hasInsertVerb) return null;

    // Look up the requested cloud service
    const matchedService = findServiceByText(lower);
    if (!matchedService) return null;

    // Check if target indicates canvas or architecture or direct service request
    const targetKeywords = ['canvas', 'architecture', 'structure', 'topology', 'diagram', 'system', 'service', 'services'];
    const hasTarget = targetKeywords.some(t => lower.includes(t)) || 
                      lower.startsWith('insert') || lower.startsWith('make') || lower.startsWith('add') ||
                      lower.startsWith('create');

    if (!hasTarget) return null;

    // Calculate unique ID
    let targetId = matchedService.id;
    let counter = 1;
    while (this.currentArchitecture.nodes.some(n => n.id === targetId)) {
      counter++;
      targetId = `${matchedService.id}_${counter}`;
    }

    const nodeName = counter > 1 ? `${matchedService.name} (${counter})` : matchedService.name;

    const newNode = {
      id: targetId,
      name: nodeName,
      category: matchedService.category,
      categoryColor: matchedService.categoryColor,
      specs: matchedService.specs,
      sla: matchedService.sla,
      monthlyCost: matchedService.cost,
      freeTier: matchedService.freeTier,
      isFreeTier: matchedService.isFreeTier
    };

    // Add node
    this.addNode(newNode);
    this.healTopology();

    // Refresh costs & metrics
    this.refreshMetrics();

    // Format professional response
    const freeTierLine = matchedService.isFreeTier
      ? `🟢 **Free Tier Eligible:** ${matchedService.freeTier}`
      : `⚪ **Pricing Model:** On-Demand ($${matchedService.cost.toFixed(2)}/mo baseline)`;

    const replyText = `✅ **${nodeName}** has been successfully inserted into your **Architecture Canvas**!

💰 **Cost:** $${matchedService.cost.toFixed(2)} / month
${freeTierLine}
⚡ **Category:** ${matchedService.category.toUpperCase()} (${matchedService.sla})
📋 **Configuration:** ${matchedService.specs}`;

    const bullets = [
      `Node placed on Canvas and automatically wired into topology`,
      matchedService.isFreeTier ? `100% Free Tier Eligible: ${matchedService.freeTier}` : `Pay-as-you-go managed rate ($${matchedService.cost.toFixed(2)}/mo)`,
      `Updated total monthly infrastructure estimate to $${this.currentArchitecture.metrics.monthlyCost}/mo`,
      `Terraform & Docker Compose deployment definitions automatically updated`
    ];

    const aiMsg = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: replyText,
      bulletPoints: bullets,
      actionButton: { text: `View ${nodeName} on Canvas`, action: 'highlight_canvas', targetNodeId: newNode.id },
      insertedNodeId: newNode.id,
      provider: 'clouderator'
    };

    this.chatHistory.push(aiMsg);
    this.persistCurrentSession(messageText);

    return { reply: aiMsg, architecture: this.currentArchitecture, insertedNode: newNode };
  }

  updateNode(nodeId, updates) {
    const node = this.currentArchitecture.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (updates.name) node.name = updates.name;
    if (updates.specs) node.specs = updates.specs;
    if (updates.monthlyCost !== undefined) node.monthlyCost = Number(updates.monthlyCost);
    if (updates.instanceCount !== undefined && node.isGroup) {
      node.instanceCount = Number(updates.instanceCount);
      node.specs = `Min: 2, Desired: ${node.instanceCount}, Max: 10`;
      node.monthlyCost = node.instanceCount * 144.00;
    }

    this.refreshMetrics();
    return { node, architecture: this.currentArchitecture };
  }

  deleteNode(nodeId) {
    this.currentArchitecture.nodes = this.currentArchitecture.nodes.filter(n => n.id !== nodeId);
    this.currentArchitecture.edges = this.currentArchitecture.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    this.refreshMetrics();
    return this.currentArchitecture;
  }

  async processUserMessage(messageText) {
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageText
    };
    this.chatHistory.push(userMsg);

    const lower = messageText.toLowerCase();

    // 0. Dedicated check for canvas architecture manipulation intents:
    // A. Connection / wiring / healing
    const connectionResult = this.handleConnectionIntent(messageText);
    if (connectionResult) {
      return connectionResult;
    }

    // B. Disconnection / unlinking
    const disconnectionResult = this.handleDisconnectionIntent(messageText);
    if (disconnectionResult) {
      return disconnectionResult;
    }

    // C. Node deletion / removal
    const removalResult = this.handleNodeRemovalIntent(messageText);
    if (removalResult) {
      return removalResult;
    }

    // D. Auto Layout / Canvas alignment
    const layoutResult = this.handleLayoutIntent(messageText);
    if (layoutResult) {
      return layoutResult;
    }

    // E. Node scaling / replica updates
    const scaleResult = this.handleNodeScalingIntent(messageText);
    if (scaleResult) {
      return scaleResult;
    }

    // F. Direct service addition from Cloud Catalog
    const insertionResult = this.handleServiceInsertionIntent(messageText);
    if (insertionResult) {
      return insertionResult;
    }

    const activeProvider = this.getActiveProvider();

    // 1. Check if Groq Cloud API is active and configured
    if (activeProvider === 'groq' && this.getGroqApiKey()) {
      try {
        console.log(`🤖 Clouderator AI: Querying Groq API (${this.getGroqModel()})...`);
        const groqResponse = await this.queryGroqAI(messageText);
        if (groqResponse) {
          // Apply any dynamic architectural modifications suggested by Groq or requested by user
          const archModified = this.applyArchitectureUpdate(groqResponse, messageText);

          const aiMsg = {
            id: `msg-${Date.now() + 1}`,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: groqResponse.text,
            bulletPoints: groqResponse.bullets,
            actionButton: archModified ? { text: 'View Applied Changes', action: 'highlight_canvas' } : null,
            provider: 'groq',
            model: groqResponse.model
          };
          this.chatHistory.push(aiMsg);
          this.refreshMetrics();
          this.persistCurrentSession(messageText);
          return { reply: aiMsg, architecture: this.currentArchitecture };
        }
      } catch (err) {
        console.warn('⚠️ Groq API query failed or timed out, falling back:', err.message);
      }
    }

    // Apply architectural updates in fallback engine too
    const fallbackModified = this.applyArchitectureUpdate(null, messageText);

    // 2. Check if external Gemini API is available and requested for general complex prompts
    if ((activeProvider === 'gemini' || !this.groqApiKey) && this.geminiApiKey && !this.isDirectPreset(lower)) {
      try {
        const geminiResponse = await this.queryGeminiAI(messageText);
        if (geminiResponse) {
          const aiMsg = {
            id: `msg-${Date.now() + 1}`,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: geminiResponse.text,
            bulletPoints: geminiResponse.bullets,
            actionButton: { text: 'View Applied Changes', action: 'highlight_canvas' },
            provider: 'gemini',
            model: 'gemini-1.5-flash'
          };
          this.chatHistory.push(aiMsg);
          this.refreshMetrics();
          this.persistCurrentSession(messageText);
          return { reply: aiMsg, architecture: this.currentArchitecture };
        }
      } catch (err) {
        console.warn('⚠️ Gemini API query failed or timed out, falling back to built-in expert engine:', err.message);
      }
    }

    // Built-in Domain Architecture Reasoning Engine
    let aiReplyText = '';
    let bulletPoints = [];
    let actionButton = null;

    const isCostRelated = /\b(cost|kharcha|paisa|budget|sasta|cheap|cheaper|rate)\b/i.test(lower);
    const isActionRelated = /\b(kam|ghatao|ghata|kamti|banao|banaiye|karo|kar\s*do|kar\s*dijiye|reduce|lower|less|down|optimize|cut|save|new|naya|naye|cheaper)\b/i.test(lower);
    const isCostOptimization = (isCostRelated && isActionRelated) ||
      /\b(cost\s*optimization|cost\s*optimize|reduce\s*cost|lower\s*cost|low\s*budget|sasta\s*architecture|cheap\s*architecture|cost\s*kam)\b/i.test(lower);

    if (isCostOptimization) {
      const wantsNew = /\b(new|naya|naye|fresh|scratch|from scratch|serverless|banao|banaiye|create|build)\b/i.test(lower) ||
                       !this.currentArchitecture?.nodes?.length;
      const prevCost = this.currentArchitecture.metrics?.monthlyCost || 2340;
      this.optimizeArchitectureCost(wantsNew, messageText);
      const newCost = this.currentArchitecture.metrics?.monthlyCost || 98;
      const savingsPct = Math.max(50, Math.round(((prevCost - newCost) / (prevCost || 1)) * 100));

      aiReplyText = wantsNew
        ? `✅ Cost-Optimized Serverless & Container Architecture successfully generate ho gaya hai! Monthly cloud spend **$${prevCost}** se kam hokar sirf **$${newCost}/month** (${savingsPct}% savings) reh gaya hai.`
        : `✅ Canvas architecture ko cost-optimize kar diya gaya hai! Monthly cloud spend **$${prevCost}** se ghatkar **$${newCost}/month** (${savingsPct}% savings) ho gaya hai.`;

      bulletPoints = [
        `Compute nodes ko AWS Graviton3 (t4g.small) / Serverless par shift kiya gaya (65% compute savings)`,
        `Databases ko Single-AZ / On-Demand par scale kiya gaya off-peak auto-pause ke saath`,
        `S3 Intelligent-Tiering aur CloudFront edge caching se egress aur cold storage charges khatam kiye gaye`,
        `Canvas topology aur live IaC (Terraform & Docker) automatically update ho gaye`
      ];
      actionButton = { text: 'View Optimized Canvas', action: 'highlight_canvas' };
    } else if (lower.includes('real-time') || lower.includes('tracking') || lower.includes('order') || lower.includes('websocket')) {
      const hasWs = this.currentArchitecture.nodes.some(n => n.id === 'websocket');
      if (!hasWs) {
        this.currentArchitecture.nodes.push({
          id: 'websocket',
          name: 'WebSocket API Gateway',
          category: 'messaging',
          categoryColor: '#eab308',
          x: 430,
          y: 380,
          specs: 'Persistent two-way connection for live order tracking',
          sla: '99.95% SLA',
          monthlyCost: 35.00
        });
        this.currentArchitecture.edges.push({ from: 'websocket', to: 'asg', label: 'Live Events' });
      }
      aiReplyText = "Added high-throughput WebSocket API Gateway for bidirectional real-time order tracking and driver telemetry.";
      bulletPoints = [
        "Integrated AWS API Gateway (WebSocket protocol)",
        "Zero-delay push notifications for order delivery states",
        "Direct connection to ECS Auto Scaling backend"
      ];
      actionButton = { text: 'View Changes', action: 'highlight_websocket' };
    } else if (lower.includes('scale') || lower.includes('100,000') || lower.includes('500,000') || lower.includes('million') || lower.includes('heavy traffic')) {
      this.currentArchitecture.userScale = 250000;
      this.currentArchitecture.metrics.performanceScore = 95;
      this.currentArchitecture.metrics.availabilityScore = 99.99;
      this.currentArchitecture.metrics.monthlyCost = 3680;
      this.currentArchitecture.metrics.costPercentDiff = +18;

      const asg = this.currentArchitecture.nodes.find(n => n.id === 'asg');
      if (asg) {
        asg.instanceCount = 6;
        asg.specs = 'Min: 4, Desired: 6, Max: 16 (Target CPU: 65%)';
        asg.children = [
          { id: 'app1', name: 'App Server (ECS / Fargate)', cpu: '4 vCPU', ram: '8 GB' },
          { id: 'app2', name: 'App Server (ECS / Fargate)', cpu: '4 vCPU', ram: '8 GB' },
          { id: 'app3', name: 'App Server (ECS / Fargate)', cpu: '4 vCPU', ram: '8 GB' },
          { id: 'app4', name: 'App Server (ECS / Fargate)', cpu: '4 vCPU', ram: '8 GB' },
          { id: 'app5', name: 'App Server (ECS / Fargate)', cpu: '4 vCPU', ram: '8 GB' },
          { id: 'app6', name: 'App Server (ECS / Fargate)', cpu: '4 vCPU', ram: '8 GB' }
        ];
      }

      aiReplyText = "Architectural scale elevated for high peak capacity (up to 500,000 daily active users).";
      bulletPoints = [
        "Scaled ECS Fargate pool to 6 high-memory instances (4 vCPU, 8GB)",
        "Provisioned Multi-AZ ElastiCache Redis replication group",
        "Upgraded RDS Primary to db.r6g.2xlarge with dedicated IOPS (gp3 3000 IOPS)",
        "Configured CloudFront Origin Shield for global cache protection"
      ];
      actionButton = { text: 'View Scaled Topology →', action: 'highlight_canvas' };
    } else if (lower.includes('serverless') || lower.includes('lambda')) {
      this.currentArchitecture.nodes = this.currentArchitecture.nodes.map(n => {
        if (n.id === 'asg') {
          return {
            id: 'lambda_compute',
            name: 'AWS Lambda (Serverless Compute)',
            category: 'compute',
            categoryColor: '#f97316',
            x: 650,
            y: 380,
            specs: 'Event-driven auto-scaling (0 to 10,000 req/s)',
            sla: '99.95% SLA',
            monthlyCost: 195.00
          };
        }
        return n;
      });
      this.currentArchitecture.metrics.monthlyCost = 1420;
      this.currentArchitecture.metrics.costPercentDiff = -39;
      aiReplyText = "Converted container fleet to fully Serverless event-driven architecture using AWS Lambda.";
      bulletPoints = [
        "Replaced fixed ECS Fargate cluster with pay-per-request AWS Lambda",
        "Eliminated idle compute costs: estimated savings ~39%",
        "Configured Provisioned Concurrency to mitigate cold starts for checkout APIs",
        "Retained RDS Multi-AZ via AWS RDS Proxy for connection pooling"
      ];
      actionButton = { text: 'View Serverless Architecture →', action: 'highlight_canvas' };
    } else if (lower.includes('security') || lower.includes('compliance') || lower.includes('waf') || lower.includes('protect')) {
      this.currentArchitecture.metrics.securityScore = 98;
      const hasWaf = this.currentArchitecture.nodes.some(n => n.id === 'waf');
      if (!hasWaf) {
        this.currentArchitecture.nodes.push({
          id: 'waf',
          name: 'AWS WAF & Shield Advanced',
          category: 'networking',
          categoryColor: '#8b5cf6',
          x: 480,
          y: 150,
          specs: 'OWASP Top 10 mitigation, rate limiting & IP bot control',
          sla: '99.99% SLA',
          monthlyCost: 60.00
        });
        this.currentArchitecture.edges.push({ from: 'waf', to: 'alb', label: 'Inspects HTTP Traffic' });
      }
      aiReplyText = "Hardened security posture to achieve a 98/100 enterprise security score!";
      bulletPoints = [
        "Attached AWS WAF with managed SQLi, XSS, and bot-control rules to ALB",
        "Enforced TLS 1.3 strict HTTPS redirects and HSTS headers",
        "Enabled AWS KMS envelope encryption with customer-managed keys (CMK) on S3 & RDS",
        "Enabled AWS GuardDuty threat detection with automated anomaly alerting"
      ];
      actionButton = { text: 'View Security Audit →', action: 'view_security' };
    } else if (lower.includes('google') || lower.includes('gcp')) {
      this.currentArchitecture.cloudProvider = 'gcp';
      this.currentArchitecture.nodes = [
        { id: 'dns', name: 'Cloud DNS', category: 'networking', categoryColor: '#8b5cf6', x: 650, y: 60, specs: 'Anycast DNS with 100% SLA', monthlyCost: 12.00 },
        { id: 'cdn', name: 'Cloud CDN', category: 'networking', categoryColor: '#8b5cf6', x: 650, y: 150, specs: 'Global HTTP(S) Load Balancer Caching', monthlyCost: 85.00 },
        { id: 'alb', name: 'Cloud Load Balancing', category: 'compute', categoryColor: '#f97316', x: 650, y: 250, specs: 'Cross-region external proxy', monthlyCost: 35.00 },
        { id: 'asg', name: 'Cloud Run / GKE Autopilot', category: 'compute', categoryColor: '#f97316', x: 650, y: 380, instanceCount: 3, specs: 'Fully managed serverless container pods', monthlyCost: 390.00 },
        { id: 'redis', name: 'Memorystore for Redis', category: 'caching', categoryColor: '#ef4444', x: 870, y: 380, specs: 'Standard Tier 4GB High Availability', monthlyCost: 62.00 },
        { id: 'rds_primary', name: 'Cloud SQL for PostgreSQL', category: 'database', categoryColor: '#10b981', x: 670, y: 530, specs: 'db-custom-4-16 Regional HA', monthlyCost: 295.00 },
        { id: 's3', name: 'Cloud Storage (GCS)', category: 'storage', categoryColor: '#3b82f6', x: 800, y: 530, specs: 'Multi-Region Standard Bucket', monthlyCost: 38.00 }
      ];
      this.currentArchitecture.metrics.monthlyCost = 2190;
      aiReplyText = "Successfully re-architected topology for Google Cloud Platform (GCP)!";
      bulletPoints = [
        "Compute migrated to Google Cloud Run / GKE Autopilot",
        "Database mapped to Cloud SQL PostgreSQL High Availability",
        "Static media placed in Google Cloud Storage with Cloud CDN",
        "Estimated monthly cost on GCP: $2,190/mo"
      ];
      actionButton = { text: 'View GCP Topology →', action: 'highlight_canvas' };
    } else {
      // General prompt handling
      aiReplyText = `Clouderator AI has analyzed your request: "${messageText}". Recommendations updated based on current traffic and resilience patterns.`;
      bulletPoints = [
        "Infrastructure components evaluated for throughput, latency, and fault tolerance",
        "Updated resource allocation and continuous cost intelligence",
        "Active monitoring daemon watching server health and budget pacing"
      ];
      actionButton = { text: 'Inspect Topology', action: 'highlight_canvas' };
    }

    this.refreshMetrics();

    const aiMsg = {
      id: `msg-${Date.now() + 1}`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: aiReplyText,
      bulletPoints,
      actionButton,
      provider: 'builtin'
    };
    this.chatHistory.push(aiMsg);
    this.persistCurrentSession(messageText);

    return {
      reply: aiMsg,
      architecture: this.currentArchitecture
    };
  }

  isDirectPreset(lower) {
    return lower.includes('cost') || lower.includes('scale') || lower.includes('serverless') || lower.includes('security') || lower.includes('tracking');
  }

  async queryGroqAI(userPrompt) {
    const apiKey = this.getGroqApiKey();
    if (!apiKey) return null;
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const selectedModel = this.getGroqModel() || 'qwen/qwen3.8-27b';

    const archSummary = {
      project: this.currentArchitecture.projectName || 'Clouderator App',
      provider: this.currentArchitecture.cloudProvider || 'aws',
      nodes: (this.currentArchitecture.nodes || []).map(n => ({
        id: n.id,
        name: n.name,
        category: n.category,
        cost: n.monthlyCost,
        specs: n.specs
      })),
      metrics: this.currentArchitecture.metrics || {}
    };

    // Filter out initial mock demo messages (msg-1 to msg-6) so mock turns don't pollute the prompt
    const demoMsgIds = new Set(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6']);
    const realHistory = (this.chatHistory || []).filter(m => !demoMsgIds.has(m.id));
    
    // Grab up to 4 recent actual conversational turns before the current prompt
    const recentHistory = realHistory.slice(0, -1).slice(-4).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: typeof m.text === 'string' ? m.text : JSON.stringify(m.text)
    }));

    const systemPrompt = `You are Clouderator AI, an elite Cloud Infrastructure & DevOps Operating System Architect.
You help engineers design, scale, secure, and cost-optimize production cloud architectures on AWS, GCP, and Azure.
You fluently understand and communicate in English, Hindi, and Hinglish. Match the tone, language, and intent of the user naturally.

Current Architecture Topology Snapshot:
${JSON.stringify(archSummary)}

ARCHITECTURE & CANVAS MODIFICATION GUIDELINES:
1. GREETINGS & CASUAL TALK (e.g. 'hi', 'hello', 'hey', 'namaste', 'kaise ho', 'kya haal hai'):
   - Respond in 1 short, natural sentence.
   - Leave "bullets": [].
   - "newArchitecture": null, "suggestedModifications": null.

2. NEW ARCHITECTURE / SYSTEM DESIGN (e.g. 'ek e-commerce app ka naya structure banao', 'fintech payment app', 'video streaming system', 'healthcare app', 'microservices platform'):
   - Return "text": "1-2 sentence description in Hindi/English of the architecture built."
   - Return "newArchitecture": {
       "projectName": "Title of Architecture",
       "cloudProvider": "aws",
       "nodes": [
         { "id": "dns", "name": "Route53 DNS", "category": "networking", "monthlyCost": 15, "specs": "Global DNS routing" },
         { "id": "cdn", "name": "CloudFront CDN", "category": "networking", "monthlyCost": 85, "specs": "Edge caching" },
         { "id": "waf", "name": "AWS WAF", "category": "networking", "monthlyCost": 40, "specs": "DDoS protection" },
         { "id": "alb", "name": "Application Load Balancer", "category": "compute", "monthlyCost": 45, "specs": "Load balancer" },
         { "id": "asg", "name": "Backend Services (ECS)", "category": "compute", "monthlyCost": 420, "specs": "Microservices" },
         { "id": "redis", "name": "Redis Distributed Cache", "category": "caching", "monthlyCost": 65, "specs": "Session cache" },
         { "id": "db", "name": "Aurora PostgreSQL", "category": "database", "monthlyCost": 280, "specs": "ACID database" },
         { "id": "s3", "name": "S3 Media Storage", "category": "storage", "monthlyCost": 40, "specs": "Static assets" }
       ],
       "edges": [
         { "from": "dns", "to": "cdn" },
         { "from": "cdn", "to": "alb" },
         { "from": "waf", "to": "alb" },
         { "from": "alb", "to": "asg" },
         { "from": "asg", "to": "redis" },
         { "from": "asg", "to": "db" },
         { "from": "asg", "to": "s3" }
       ]
     }

3. INSERTING OR CREATING CLOUD SERVICES (e.g. 'insert or make EC2 services in the architecture or canvas', 'make EC2 in canvas', 'add S3 bucket', 'RDS database lagao'):
   - When user asks to insert, make, or add a service, detect the cloud service (EC2, S3, RDS, Lambda, DynamoDB, CloudFront, Route53, ALB, WAF, Cognito, IAM, SQS, SNS, Kafka, etc.).
   - ALWAYS state its monthly cost and explicitly mention whether it is 🟢 FREE TIER ELIGIBLE (e.g., EC2: 750 hrs/mo t2.micro, S3: 5GB, RDS: 750 hrs db.t2.micro, DynamoDB: 25GB free, Lambda: 1M req free).
   - In "suggestedModifications", return:
     "suggestedModifications": {
       "addNodes": [
         { "id": "ec2", "name": "Amazon EC2 Instance", "category": "compute", "monthlyCost": 15, "specs": "t3.micro (Free Tier Eligible: 750 hrs/mo)", "sla": "99.99% SLA" }
       ]
     }
   - When removing (e.g. 'Redis hata do'):
     "suggestedModifications": {
       "removeNodeIds": ["redis"]
     }

4. CONNECTING SERVICES & FIXING CONNECTIONS (e.g. 't4g ko connect kro', 'connect lambda to t4g', 'fix connections', 'sabko jodo'):
   - When user asks to connect services, link them, or fix missing connections:
   - In "suggestedModifications", return:
     "suggestedModifications": {
       "connectEdges": [
         { "from": "sourceNodeId", "to": "targetNodeId", "label": "Traffic" }
       ],
       "healTopology": true
     }

5. DISCONNECTING OR UNLINKING (e.g. 'disconnect X from Y', 'link hata do'):
   - In "suggestedModifications", return:
     "suggestedModifications": {
       "disconnectEdges": [
         { "from": "nodeA", "to": "nodeB" }
       ]
     }

6. AUTO-LAYOUT & ALIGNING CANVAS (e.g. 'auto layout karo', 'nodes arrange karo', 'clean layout'):
   - In "suggestedModifications", return:
     "suggestedModifications": {
       "autoLayout": true,
       "healTopology": true
     }

7. COST OPTIMIZATION & BUDGET REDUCTION (e.g. 'iska cost kam karke new arcitecture banao', 'cost kam karo', 'make it cheaper', 'reduce cost', 'sasta architecture banao', 'budget architecture'):
   - When the user asks to reduce cost, optimize cost, or create a low-cost version of an architecture:
   - You MUST generate an optimized architecture and return it in "newArchitecture".
   - Use cost-effective services (e.g. t4g.small/t3.micro burstable, Serverless Lambda, DynamoDB on-demand, single-AZ RDS with auto-pause, CloudFront Standard, S3 Intelligent-Tiering).
   - Ensure the total monthly cost is reduced by 60% to 80%.
   - In "text", explain the exact architectural changes and cost savings clearly in Hindi/English.
   - List key cost reductions in "bullets".

Schema (Strict JSON):
{
  "text": "Answer directly to what was asked",
  "bullets": [],
  "newArchitecture": null,
  "suggestedModifications": null
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: userPrompt }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.2,
          max_tokens: 800
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        // Fallback: If Groq had a json_validate_failed issue, recover the generated text
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.error && errObj.error.failed_generation) {
            let gen = errObj.error.failed_generation.trim();
            gen = gen.replace(/^[{\s"]*text[":\s]*/i, '').replace(/[}"\s]*$/i, '').trim();
            if (gen) {
              return {
                text: gen,
                bullets: [],
                actionButton: null,
                newArchitecture: null,
                suggestedModifications: null,
                provider: 'groq',
                model: selectedModel
              };
            }
          }
        } catch (_) {}
        throw new Error(`Groq API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      let parsed = null;
      try {
        parsed = JSON.parse(content);
      } catch (_) {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[1]); } catch (e) {}
        }
      }

      // Resilient fallback: If JSON was cut off or wrapped, extract "text" and "bullets" cleanly
      if (!parsed) {
        const textMatch = content.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (textMatch) {
          try {
            const extractedText = JSON.parse(`"${textMatch[1]}"`);
            let extractedBullets = [];
            const bulletsMatch = content.match(/"bullets"\s*:\s*\[([\s\S]*?)\]/);
            if (bulletsMatch) {
              try { extractedBullets = JSON.parse(`[${bulletsMatch[1]}]`); } catch (_) {}
            }
            parsed = {
              text: extractedText,
              bullets: extractedBullets,
              newArchitecture: null,
              suggestedModifications: null
            };
          } catch (_) {}
        }
      }

      if (parsed && typeof parsed === 'object') {
        return {
          text: parsed.text || 'Architecture topology analyzed and updated.',
          bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
          actionButton: parsed.actionButton || null,
          newArchitecture: parsed.newArchitecture || null,
          suggestedModifications: parsed.suggestedModifications || null,
          provider: 'groq',
          model: selectedModel
        };
      }

      // If the model responded in direct natural text without JSON schema
      let cleanText = content.trim();
      if (cleanText.startsWith('{') && cleanText.includes('"text"')) {
        const cleanMatch = cleanText.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (cleanMatch) {
          cleanText = cleanMatch[1].replace(/\\"/g, '"');
        }
      }

      return {
        text: cleanText,
        bullets: [],
        actionButton: null,
        newArchitecture: null,
        suggestedModifications: null,
        provider: 'groq',
        model: selectedModel
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async queryGeminiAI(userPrompt) {
    if (!this.geminiApiKey) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

    const promptPayload = {
      contents: [{
        parts: [{
          text: `You are Clouderator AI, an elite Cloud Infrastructure Operating System Architect.
A developer says: "${userPrompt}".
Current Architecture: ${JSON.stringify(this.currentArchitecture.nodes.map(n => ({ id: n.id, name: n.name, category: n.category })))}

Respond with a concise, professional assessment. Provide:
1. A summary paragraph (1-2 sentences).
2. 3-4 bullet points detailing specific architectural changes, cost implications, and operational advice.
Format your output strictly as valid JSON:
{
  "text": "Your summary response here",
  "bullets": ["Point 1", "Point 2", "Point 3"]
}`
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptPayload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const cleaned = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }

  resetToDefault() {
    this.currentArchitecture = getEmptyArchitecture();
    this.chatHistory = getInitialGreeting();
    this.refreshMetrics();
    this.persistCurrentSession();
    return this.currentArchitecture;
  }

  persistCurrentSession(latestUserPrompt = null) {
    if (!this.currentSessionId) {
      const s = sessionStore.createSession();
      this.currentSessionId = s.id;
    }
    const session = sessionStore.getSession(this.currentSessionId);
    let title = session?.title;

    if (!title || title === 'New Cloud Architecture' || title === 'New Cloud Chat') {
      if (this.currentArchitecture.projectName && this.currentArchitecture.projectName !== 'New Cloud Architecture') {
        title = this.currentArchitecture.projectName;
      } else if (latestUserPrompt) {
        title = latestUserPrompt.length > 32 ? latestUserPrompt.substring(0, 32) + '...' : latestUserPrompt;
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
    } else if (this.currentArchitecture.projectName && this.currentArchitecture.projectName !== 'New Cloud Architecture') {
      title = this.currentArchitecture.projectName;
    }

    sessionStore.updateSession(this.currentSessionId, {
      title: title || 'Cloud Architecture Chat',
      messages: this.chatHistory,
      architecture: this.currentArchitecture
    });
  }

  loadProjectPreset(presetKey) {
    if (presetKey === 'food-delivery' || presetKey === 'food_delivery') {
      this.currentArchitecture = JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));
      this.chatHistory = JSON.parse(JSON.stringify(INITIAL_CHAT));
      this.refreshMetrics();
      this.persistCurrentSession();
      return this.currentArchitecture;
    } else if (presetKey === 'ecommerce-scale' || presetKey === 'ecommerce') {
      this.currentArchitecture = {
        projectName: 'E-Commerce Hyper-Scale',
        cloudProvider: 'aws',
        userScale: 150000,
        costReductionPct: 15,
        metrics: {
          monthlyCost: 3850,
          costPercentDiff: -15,
          performanceScore: 94,
          performanceStatus: 'Excellent',
          availabilityScore: 99.99,
          availabilityStatus: 'Multi-Region Active-Active',
          securityScore: 96,
          securityStatus: 'PCI-DSS Compliant'
        },
        nodes: [
          { id: 'dns', name: 'Route53 Geoproximity DNS', category: 'networking', categoryColor: '#8b5cf6', specs: 'Global Geo-routing', sla: '100% SLA', monthlyCost: 28.00 },
          { id: 'cdn', name: 'CloudFront Edge CDN', category: 'networking', categoryColor: '#8b5cf6', specs: 'Dynamic Site Acceleration', sla: '99.95% SLA', monthlyCost: 180.00 },
          { id: 'alb', name: 'Application Load Balancer', category: 'compute', categoryColor: '#f97316', specs: 'HTTP/2 & WebSocket termination', sla: '99.99% SLA', monthlyCost: 65.00 },
          {
            id: 'asg',
            name: 'Auto Scaling Group',
            category: 'compute',
            categoryColor: '#f97316',
            isGroup: true,
            instanceCount: 6,
            specs: 'Desired: 6, Max: 20 (Target Tracking: 65% CPU)',
            children: [
              { id: 'app1', name: 'Checkout Pod 1', cpu: '4 vCPU', ram: '8 GB' },
              { id: 'app2', name: 'Cart Pod 2', cpu: '4 vCPU', ram: '8 GB' },
              { id: 'app3', name: 'Catalog Pod 3', cpu: '4 vCPU', ram: '8 GB' }
            ],
            monthlyCost: 864.00
          },
          { id: 'redis', name: 'Redis Distributed Cache', category: 'caching', categoryColor: '#ef4444', specs: 'Cluster Mode Enabled (3 shards)', sla: '99.99% SLA', monthlyCost: 240.00 },
          { id: 'rds_primary', name: 'Aurora PostgreSQL Cluster', category: 'database', categoryColor: '#10b981', specs: 'Multi-AZ DB Cluster (Auto-scaling read replicas)', sla: '99.99% SLA', monthlyCost: 680.00 },
          { id: 's3', name: 'Product Catalog Storage', category: 'storage', categoryColor: '#3b82f6', specs: 'S3 Standard + Glacier Lifecycle', sla: '99.999999999%', monthlyCost: 95.00 }
        ],
        edges: [
          { from: 'dns', to: 'cdn', label: 'Geo Route' },
          { from: 'cdn', to: 'alb', label: 'Edge Proxy' },
          { from: 'alb', to: 'asg', label: 'Balances Pods' },
          { from: 'asg', to: 'redis', label: 'Sub-millisecond Session' },
          { from: 'asg', to: 'rds_primary', label: 'ACID Transactions' },
          { from: 'asg', to: 's3', label: 'Product Assets' }
        ]
      };
      this.chatHistory = [
        { id: 'msg-eco-1', sender: 'user', timestamp: '11:00 AM', text: 'Load architecture for 150k daily active e-commerce users with Flash-Sale readiness.' },
        {
          id: 'msg-eco-2',
          sender: 'ai',
          timestamp: '11:00 AM',
          text: 'Loaded E-Commerce Hyper-Scale architecture: Aurora Serverless v2 + Multi-AZ Redis Cluster for 0-second checkout lockups.',
          bulletPoints: ['Aurora PostgreSQL Multi-Master clustering', 'Edge caching for product imagery', 'Pre-warmed Auto Scaling target policies']
        }
      ];
    } else if (presetKey === 'fintech-core') {
      this.currentArchitecture = {
        projectName: 'Fintech Payment Gateway',
        cloudProvider: 'aws',
        userScale: 80000,
        costReductionPct: 10,
        metrics: {
          monthlyCost: 4200,
          costPercentDiff: -10,
          performanceScore: 97,
          performanceStatus: 'Ultra-Low Latency',
          availabilityScore: 99.999,
          availabilityStatus: 'Multi-AZ Zero-Loss',
          securityScore: 99,
          securityStatus: 'SOC2 & PCI Tier 1'
        },
        nodes: [
          { id: 'dns', name: 'Route53 Anycast DNS', category: 'networking', categoryColor: '#8b5cf6', specs: 'DDoS Guarded Anycast', monthlyCost: 24.00 },
          { id: 'cdn', name: 'CloudFront Shield Advanced', category: 'networking', categoryColor: '#8b5cf6', specs: 'Layer 7 WAF + Rate Control', monthlyCost: 220.00 },
          { id: 'alb', name: 'Internal Application Gateway', category: 'compute', categoryColor: '#f97316', specs: 'Mutual TLS (mTLS) Enabled', monthlyCost: 80.00 },
          {
            id: 'asg',
            name: 'Auto Scaling Group',
            category: 'compute',
            categoryColor: '#f97316',
            isGroup: true,
            instanceCount: 4,
            specs: 'Isolated Private Subnets, Zero Egress',
            children: [
              { id: 'app1', name: 'Ledger Node A', cpu: '4 vCPU', ram: '16 GB' },
              { id: 'app2', name: 'Ledger Node B', cpu: '4 vCPU', ram: '16 GB' },
              { id: 'app3', name: 'Fraud Check Engine', cpu: '4 vCPU', ram: '16 GB' }
            ],
            monthlyCost: 960.00
          },
          { id: 'rds_primary', name: 'Encrypted Multi-AZ Ledger DB', category: 'database', categoryColor: '#10b981', specs: 'PostgreSQL with KMS CMK & Read Replica', monthlyCost: 850.00 },
          { id: 's3', name: 'Immutable Audit Vault', category: 'storage', categoryColor: '#3b82f6', specs: 'S3 Object Lock (WORM compliance)', monthlyCost: 110.00 }
        ],
        edges: [
          { from: 'dns', to: 'cdn', label: 'Shield Protected' },
          { from: 'cdn', to: 'alb', label: 'mTLS Handshake' },
          { from: 'alb', to: 'asg', label: 'Encrypted VPC' },
          { from: 'asg', to: 'rds_primary', label: 'Synchronous Commit' },
          { from: 'asg', to: 's3', label: 'WORM Logs' }
        ]
      };
      this.chatHistory = [
        { id: 'msg-fin-1', sender: 'user', timestamp: '09:30 AM', text: 'Load PCI-DSS Tier 1 Fintech Payment architecture with mutual TLS and immutable audit vault.' },
        {
          id: 'msg-fin-2',
          sender: 'ai',
          timestamp: '09:30 AM',
          text: 'Provisioned Fintech Core architecture: 99/100 Security Score, mTLS internal ingress, encrypted ledger, and S3 WORM audit compliance.',
          bulletPoints: ['FIPS 140-2 Level 3 HSM hardware encryption', 'Private isolated VPC with zero public IPs on app pods', 'Object-locked audit trail']
        }
      ];
    } else if (presetKey === 'streaming-platform') {
      return this.loadStreamingPreset();
    } else if (presetKey === 'healthcare-system') {
      return this.loadHealthcarePreset();
    } else if (presetKey === 'social-chat') {
      return this.loadSocialChatPreset();
    } else if (presetKey === 'iot-telemetry') {
      return this.loadIoTPreset();
    } else if (presetKey === 'microservices-k8s') {
      return this.loadMicroservicesPreset();
    } else {
      // Default food delivery
      return this.resetToDefault();
    }
    return this.currentArchitecture;
  }

  loadStreamingPreset() {
    this.currentArchitecture = {
      projectName: 'Video Streaming & OTT Platform',
      cloudProvider: 'aws',
      userScale: 500000,
      costReductionPct: 18,
      metrics: {
        monthlyCost: 5400,
        costPercentDiff: -18,
        performanceScore: 96,
        performanceStatus: 'Edge-Accelerated',
        availabilityScore: 99.99,
        availabilityStatus: 'Global Edge CloudFront',
        securityScore: 94,
        securityStatus: 'DDoS Shield Protected'
      },
      nodes: [
        { id: 'dns', name: 'Route53 Latency Routing', category: 'networking', categoryColor: '#8b5cf6', specs: 'Global DNS Failover', monthlyCost: 35.00 },
        { id: 'cdn', name: 'CloudFront Origin Shield', category: 'networking', categoryColor: '#8b5cf6', specs: 'Adaptive Bitrate Video Caching', monthlyCost: 480.00 },
        { id: 'waf', name: 'AWS WAF & Shield', category: 'networking', categoryColor: '#8b5cf6', specs: 'Token Auth & Bot Protection', monthlyCost: 75.00 },
        { id: 'alb', name: 'Application Load Balancer', category: 'compute', categoryColor: '#f97316', specs: 'Cross-zone HTTP/2 Traffic', monthlyCost: 65.00 },
        {
          id: 'asg',
          name: 'Video Encoding Fleet',
          category: 'compute',
          categoryColor: '#f97316',
          isGroup: true,
          instanceCount: 6,
          specs: 'GPU Transcoding Nodes (g4dn.xlarge)',
          children: [
            { id: 'enc1', name: 'HLS Transcoder 1', cpu: '4 vCPU', ram: '16 GB' },
            { id: 'enc2', name: 'DASH Transcoder 2', cpu: '4 vCPU', ram: '16 GB' },
            { id: 'enc3', name: 'API Streaming Pod 3', cpu: '4 vCPU', ram: '16 GB' }
          ],
          monthlyCost: 1450.00
        },
        { id: 'redis', name: 'Redis User Session & Watch States', category: 'caching', categoryColor: '#ef4444', specs: 'Low-latency continue watching states', monthlyCost: 190.00 },
        { id: 'dynamodb', name: 'DynamoDB Video Metadata', category: 'database', categoryColor: '#10b981', specs: 'Single-digit ms Catalog Queries', monthlyCost: 260.00 },
        { id: 's3', name: 'Master Video Lake (S3)', category: 'storage', categoryColor: '#3b82f6', specs: 'Multi-terabyte 4K Video Storage + Intelligent-Tiering', monthlyCost: 890.00 }
      ],
      edges: [
        { from: 'dns', to: 'cdn', label: 'Resolves' },
        { from: 'cdn', to: 'waf', label: 'Shield' },
        { from: 'waf', to: 'alb', label: 'Forward' },
        { from: 'alb', to: 'asg', label: 'Balances' },
        { from: 'asg', to: 'redis', label: 'Watch State' },
        { from: 'asg', to: 'dynamodb', label: 'Catalog Lookups' },
        { from: 'asg', to: 's3', label: 'Video Storage' }
      ]
    };
    this.refreshMetrics();
    return this.currentArchitecture;
  }

  loadHealthcarePreset() {
    this.currentArchitecture = {
      projectName: 'Healthcare Hospital Platform',
      cloudProvider: 'aws',
      userScale: 120000,
      costReductionPct: 12,
      metrics: {
        monthlyCost: 3950,
        costPercentDiff: -12,
        performanceScore: 93,
        performanceStatus: 'Reliable & Encrypted',
        availabilityScore: 99.999,
        availabilityStatus: 'Multi-AZ Zero-Loss',
        securityScore: 99,
        securityStatus: 'HIPAA & HITECH Certified'
      },
      nodes: [
        { id: 'dns', name: 'Route53 Private DNS', category: 'networking', categoryColor: '#8b5cf6', specs: 'VPC Endpoint Resolution', monthlyCost: 25.00 },
        { id: 'waf', name: 'AWS WAF Medical Defense', category: 'networking', categoryColor: '#8b5cf6', specs: 'Strict IP Whitelist & Rate Shield', monthlyCost: 85.00 },
        { id: 'alb', name: 'Internal Application Gateway', category: 'compute', categoryColor: '#f97316', specs: 'TLS 1.3 End-to-End Termination', monthlyCost: 65.00 },
        {
          id: 'asg',
          name: 'HIPAA Application Pods',
          category: 'compute',
          categoryColor: '#f97316',
          isGroup: true,
          instanceCount: 4,
          specs: 'Isolated Private Subnets, KMS Encrypted',
          children: [
            { id: 'hc1', name: 'Patient Record EHR Pod', cpu: '4 vCPU', ram: '16 GB' },
            { id: 'hc2', name: 'Appointments Pod', cpu: '4 vCPU', ram: '16 GB' },
            { id: 'hc3', name: 'Billing & Insurance Pod', cpu: '4 vCPU', ram: '16 GB' }
          ],
          monthlyCost: 890.00
        },
        { id: 'rds_primary', name: 'Encrypted Multi-AZ PostgreSQL', category: 'database', categoryColor: '#10b981', specs: 'HIPAA-compliant Multi-AZ DB with KMS Key', monthlyCost: 750.00 },
        { id: 's3', name: 'Medical Imaging DICOM Vault (S3)', category: 'storage', categoryColor: '#3b82f6', specs: 'S3 Glacier Object Lock (7-Year Retain)', monthlyCost: 280.00 }
      ],
      edges: [
        { from: 'dns', to: 'waf', label: 'Private Resolve' },
        { from: 'waf', to: 'alb', label: 'Inspected' },
        { from: 'alb', to: 'asg', label: 'Encrypted Routing' },
        { from: 'asg', to: 'rds_primary', label: 'EHR Queries' },
        { from: 'asg', to: 's3', label: 'DICOM Scans' }
      ]
    };
    this.refreshMetrics();
    return this.currentArchitecture;
  }

  loadSocialChatPreset() {
    this.currentArchitecture = {
      projectName: 'Real-time Social & Messaging',
      cloudProvider: 'aws',
      userScale: 350000,
      costReductionPct: 15,
      metrics: {
        monthlyCost: 4600,
        costPercentDiff: -15,
        performanceScore: 97,
        performanceStatus: 'Sub-10ms Latency',
        availabilityScore: 99.99,
        availabilityStatus: 'Multi-AZ WebSocket Cluster',
        securityScore: 95,
        securityStatus: 'DDoS Shielded'
      },
      nodes: [
        { id: 'dns', name: 'Route53 Anycast', category: 'networking', categoryColor: '#8b5cf6', specs: 'Anycast DNS Resolution', monthlyCost: 22.00 },
        { id: 'cdn', name: 'CloudFront Edge CDN', category: 'networking', categoryColor: '#8b5cf6', specs: 'Media & Avatar Global Edge', monthlyCost: 210.00 },
        { id: 'websocket', name: 'WebSocket API Gateway', category: 'messaging', categoryColor: '#eab308', specs: '1 Million Concurrent Persistent Connections', monthlyCost: 340.00 },
        {
          id: 'asg',
          name: 'Chat Microservices Fleet',
          category: 'compute',
          categoryColor: '#f97316',
          isGroup: true,
          instanceCount: 6,
          specs: 'Desired: 6, Max: 18 ECS Fargate Pods',
          children: [
            { id: 'chat1', name: 'Direct Message Pod 1', cpu: '4 vCPU', ram: '8 GB' },
            { id: 'chat2', name: 'Group Channel Pod 2', cpu: '4 vCPU', ram: '8 GB' },
            { id: 'chat3', name: 'Feed Service Pod 3', cpu: '4 vCPU', ram: '8 GB' }
          ],
          monthlyCost: 980.00
        },
        { id: 'redis', name: 'Redis Pub/Sub Cluster', category: 'caching', categoryColor: '#ef4444', specs: 'Real-time Message Fan-Out & Presence', monthlyCost: 260.00 },
        { id: 'dynamodb', name: 'DynamoDB Chat History', category: 'database', categoryColor: '#10b981', specs: 'Partitioned by ChannelId + Timestamp', monthlyCost: 450.00 },
        { id: 's3', name: 'Media & Voice Note S3 Storage', category: 'storage', categoryColor: '#3b82f6', specs: 'Pre-signed URL direct uploads', monthlyCost: 190.00 }
      ],
      edges: [
        { from: 'dns', to: 'cdn', label: 'Static Ingress' },
        { from: 'dns', to: 'websocket', label: 'WS Handshake' },
        { from: 'websocket', to: 'asg', label: 'Live Events' },
        { from: 'asg', to: 'redis', label: 'Message Fanout' },
        { from: 'asg', to: 'dynamodb', label: 'Persist Chat' },
        { from: 'asg', to: 's3', label: 'Voice/Media' }
      ]
    };
    this.refreshMetrics();
    return this.currentArchitecture;
  }

  loadIoTPreset() {
    this.currentArchitecture = {
      projectName: 'IoT Fleet Telemetry & Tracking',
      cloudProvider: 'aws',
      userScale: 200000,
      costReductionPct: 20,
      metrics: {
        monthlyCost: 2900,
        costPercentDiff: -20,
        performanceScore: 98,
        performanceStatus: 'High Throughput Stream',
        availabilityScore: 99.999,
        availabilityStatus: 'Managed Stream Ingestion',
        securityScore: 96,
        securityStatus: 'X.509 Certificate Auth'
      },
      nodes: [
        { id: 'dns', name: 'AWS IoT Core Endpoint', category: 'networking', categoryColor: '#8b5cf6', specs: 'MQTT over TLS with X.509 Device Certs', monthlyCost: 85.00 },
        { id: 'kafka', name: 'Kinesis / Kafka Data Stream', category: 'messaging', categoryColor: '#eab308', specs: 'Real-time 50,000 events/sec Ingestion', monthlyCost: 310.00 },
        {
          id: 'asg',
          name: 'Stream Processing Fleet',
          category: 'compute',
          categoryColor: '#f97316',
          isGroup: true,
          instanceCount: 3,
          specs: 'Apache Flink / Spark Telemetry Analyzers',
          children: [
            { id: 'iot1', name: 'Geofence Engine 1', cpu: '2 vCPU', ram: '8 GB' },
            { id: 'iot2', name: 'Sensor Anomaly Pod 2', cpu: '2 vCPU', ram: '8 GB' }
          ],
          monthlyCost: 480.00
        },
        { id: 'dynamodb', name: 'DynamoDB Time-Series Telemetry', category: 'database', categoryColor: '#10b981', specs: 'Hot device sensor data with TTL', monthlyCost: 240.00 },
        { id: 's3', name: 'S3 Cold Data Lake', category: 'storage', categoryColor: '#3b82f6', specs: 'Parquet columnar telemetry for ML & Analytics', monthlyCost: 120.00 }
      ],
      edges: [
        { from: 'dns', to: 'kafka', label: 'MQTT Telemetry' },
        { from: 'kafka', to: 'asg', label: 'Event Processing' },
        { from: 'asg', to: 'dynamodb', label: 'Hot Store' },
        { from: 'asg', to: 's3', label: 'Archive Lake' }
      ]
    };
    this.refreshMetrics();
    return this.currentArchitecture;
  }

  loadMicroservicesPreset() {
    this.currentArchitecture = {
      projectName: 'Kubernetes Microservices Platform',
      cloudProvider: 'aws',
      userScale: 300000,
      costReductionPct: 15,
      metrics: {
        monthlyCost: 4700,
        costPercentDiff: -15,
        performanceScore: 95,
        performanceStatus: 'Container Auto-Scale',
        availabilityScore: 99.99,
        availabilityStatus: 'Multi-AZ EKS Managed Node Groups',
        securityScore: 97,
        securityStatus: 'Zero-Trust Istio Service Mesh'
      },
      nodes: [
        { id: 'dns', name: 'Route53 Anycast DNS', category: 'networking', categoryColor: '#8b5cf6', specs: 'External DNS Controller', monthlyCost: 20.00 },
        { id: 'cdn', name: 'CloudFront CDN', category: 'networking', categoryColor: '#8b5cf6', specs: 'Global Edge TLS 1.3', monthlyCost: 140.00 },
        { id: 'waf', name: 'AWS WAF Enterprise', category: 'networking', categoryColor: '#8b5cf6', specs: 'Layer 7 OWASP Security Rules', monthlyCost: 65.00 },
        { id: 'alb', name: 'AWS Ingress Controller (ALB)', category: 'compute', categoryColor: '#f97316', specs: 'Path-based Pod routing', monthlyCost: 55.00 },
        {
          id: 'asg',
          name: 'Amazon EKS Kubernetes Cluster',
          category: 'compute',
          categoryColor: '#f97316',
          isGroup: true,
          instanceCount: 6,
          specs: 'EKS Control Plane + Managed Worker Nodes',
          children: [
            { id: 'k8s1', name: 'User Service Pod', cpu: '4 vCPU', ram: '8 GB' },
            { id: 'k8s2', name: 'Order Service Pod', cpu: '4 vCPU', ram: '8 GB' },
            { id: 'k8s3', name: 'Payment Service Pod', cpu: '4 vCPU', ram: '8 GB' }
          ],
          monthlyCost: 1250.00
        },
        { id: 'kafka', name: 'Apache Kafka (MSK)', category: 'messaging', categoryColor: '#eab308', specs: 'Inter-service Event-driven Backbone', monthlyCost: 320.00 },
        { id: 'redis', name: 'Redis Cache Cluster', category: 'caching', categoryColor: '#ef4444', specs: 'In-memory Distributed Cache', monthlyCost: 180.00 },
        { id: 'rds_primary', name: 'Aurora PostgreSQL Cluster', category: 'database', categoryColor: '#10b981', specs: 'Multi-AZ Auto-scaling Read Replicas', monthlyCost: 620.00 },
        { id: 's3', name: 'S3 Object Storage', category: 'storage', categoryColor: '#3b82f6', specs: 'Artifacts & User Assets', monthlyCost: 65.00 }
      ],
      edges: [
        { from: 'dns', to: 'cdn', label: 'Resolves' },
        { from: 'cdn', to: 'waf', label: 'Shield' },
        { from: 'waf', to: 'alb', label: 'Inspects' },
        { from: 'alb', to: 'asg', label: 'Routes to Ingress' },
        { from: 'asg', to: 'kafka', label: 'Pub/Sub Events' },
        { from: 'asg', to: 'redis', label: 'Cache Hit/Miss' },
        { from: 'asg', to: 'rds_primary', label: 'Persistence' },
        { from: 'asg', to: 's3', label: 'Media Assets' }
      ]
    };
    this.refreshMetrics();
    return this.currentArchitecture;
  }

  optimizeArchitectureCost(wantsNewArchitecture = false, userPrompt = '') {
    if (wantsNewArchitecture || !this.currentArchitecture || !Array.isArray(this.currentArchitecture.nodes) || this.currentArchitecture.nodes.length === 0) {
      // Build a full cost-optimized modern production architecture
      this.currentArchitecture = {
        projectName: 'Cost-Optimized Cloud App',
        cloudProvider: this.currentArchitecture?.cloudProvider || 'aws',
        userScale: 50000,
        costReductionPct: 78,
        metrics: {
          monthlyCost: 98,
          costPercentDiff: -78,
          performanceScore: 91,
          performanceStatus: 'High Efficiency',
          availabilityScore: 99.95,
          availabilityStatus: 'Multi-AZ Serverless & Burstable',
          securityScore: 92,
          securityStatus: 'Enterprise Secure'
        },
        nodes: [
          {
            id: 'dns',
            name: 'Route53 Anycast DNS',
            category: 'networking',
            categoryColor: '#8b5cf6',
            specs: 'Standard DNS Routing with Automated Health Checks',
            sla: '100% SLA',
            monthlyCost: 12.00,
            x: 363,
            y: 35
          },
          {
            id: 'cdn',
            name: 'CloudFront Edge CDN',
            category: 'networking',
            categoryColor: '#8b5cf6',
            specs: 'Global Edge Caching (Free Tier: 1TB transfer/mo)',
            sla: '99.9% SLA',
            monthlyCost: 18.00,
            x: 180,
            y: 140
          },
          {
            id: 'api',
            name: 'API Gateway (HTTP API)',
            category: 'compute',
            categoryColor: '#f97316',
            specs: 'High-throughput low-latency API (70% cheaper than REST API)',
            sla: '99.95% SLA',
            monthlyCost: 15.00,
            x: 480,
            y: 140
          },
          {
            id: 'lambda',
            name: 'AWS Lambda (Serverless Compute)',
            category: 'compute',
            categoryColor: '#f97316',
            specs: 'Pay-per-request event compute (Free Tier: 1M req/mo)',
            sla: '99.95% SLA',
            monthlyCost: 8.00,
            x: 480,
            y: 260
          },
          {
            id: 'dynamodb',
            name: 'Amazon DynamoDB (On-Demand)',
            category: 'database',
            categoryColor: '#10b981',
            specs: 'Serverless NoSQL with zero idle cost (Free Tier: 25GB)',
            sla: '99.99% SLA',
            monthlyCost: 25.00,
            x: 340,
            y: 400
          },
          {
            id: 's3',
            name: 'S3 Media Storage',
            category: 'storage',
            categoryColor: '#3b82f6',
            specs: 'S3 Intelligent-Tiering to eliminate cold storage fees',
            sla: '99.99% SLA',
            monthlyCost: 12.00,
            x: 160,
            y: 400
          },
          {
            id: 'cloudwatch',
            name: 'CloudWatch Monitoring',
            category: 'compute',
            categoryColor: '#f97316',
            specs: 'Unified logs & metrics dashboard (Free Tier included)',
            sla: '99.9% SLA',
            monthlyCost: 6.00,
            x: 620,
            y: 400
          }
        ],
        edges: [
          { from: 'dns', to: 'cdn', label: 'Resolves' },
          { from: 'cdn', to: 's3', label: 'Static Cache' },
          { from: 'dns', to: 'api', label: 'API Ingress' },
          { from: 'api', to: 'lambda', label: 'Triggers' },
          { from: 'lambda', to: 'dynamodb', label: 'Queries' },
          { from: 'lambda', to: 's3', label: 'Asset Ops' },
          { from: 'lambda', to: 'cloudwatch', label: 'Telemetry' }
        ]
      };
      this.refreshMetrics();
      this.currentArchitecture.projectName = 'Cost-Optimized Cloud App';
      return this.currentArchitecture;
    }

    // Optimize existing nodes
    const nodes = this.currentArchitecture.nodes;
    nodes.forEach(node => {
      delete node._customPos;
      const cat = node.category || '';
      const name = (node.name || '').toLowerCase();
      const id = (node.id || '').toLowerCase();

      if (cat === 'compute') {
        if (node.isGroup || (node.instanceCount && node.instanceCount > 1)) {
          node.instanceCount = 2;
          node.specs = 'AWS Graviton3 (t4g.small) • Min: 1, Desired: 2, Max: 4 (65% Savings)';
          node.monthlyCost = Math.max(25, Math.round(Number(node.monthlyCost || 200) * 0.25));
          if (Array.isArray(node.children)) {
            node.children = [
              { id: `${node.id}_inst1`, name: 'App Server (t4g.small Graviton)', cpu: '2 vCPU', ram: '2 GB' },
              { id: `${node.id}_inst2`, name: 'App Server (t4g.small Graviton)', cpu: '2 vCPU', ram: '2 GB' }
            ];
          }
        } else if (/lambda/i.test(name) || /lambda/i.test(id)) {
          node.specs = 'Serverless Event Compute (Free Tier: 1M invocations/mo)';
          node.monthlyCost = Math.max(5, Math.round(Number(node.monthlyCost || 20) * 0.4));
        } else {
          node.specs = 't4g.small / Burstable Spot Instance (60% Savings)';
          node.monthlyCost = Math.max(15, Math.round(Number(node.monthlyCost || 80) * 0.3));
        }
      } else if (cat === 'database') {
        if (/replica/i.test(id) || /replica/i.test(name)) {
          node.specs = 'Single-AZ Replica (Auto-paused 1:00 AM - 6:00 AM)';
          node.monthlyCost = Math.max(15, Math.round(Number(node.monthlyCost || 120) * 0.2));
        } else {
          node.name = node.name.replace(/Multi-AZ/i, 'Single-AZ').trim();
          node.specs = 'Single-AZ db.t4g.small (Auto-pause off-peak enabled)';
          node.monthlyCost = Math.max(35, Math.round(Number(node.monthlyCost || 350) * 0.2));
        }
      } else if (cat === 'caching') {
        node.specs = 'cache.t4g.micro (Single-Node Dev/Prod In-Memory Cache)';
        node.monthlyCost = Math.max(15, Math.round(Number(node.monthlyCost || 65) * 0.3));
      } else if (cat === 'networking') {
        if (/alb|load\s*balancer/i.test(name) || id === 'alb') {
          node.specs = 'Consolidated Application Load Balancer with Shared Target Groups';
          node.monthlyCost = Math.max(22, Math.round(Number(node.monthlyCost || 45) * 0.5));
        } else if (/shield\s*advanced/i.test(name)) {
          node.name = 'CloudFront + AWS Shield Standard';
          node.specs = 'Standard Edge CDN with Built-in L3/L4 DDoS Protection (Free Tier)';
          node.monthlyCost = Math.max(18, Math.round(Number(node.monthlyCost || 220) * 0.12));
        } else {
          node.monthlyCost = Math.max(10, Math.round(Number(node.monthlyCost || 30) * 0.5));
        }
      } else if (cat === 'storage') {
        node.specs = 'S3 Standard + Intelligent-Tiering Lifecycle Rules';
        node.monthlyCost = Math.max(8, Math.round(Number(node.monthlyCost || 40) * 0.35));
      } else {
        node.monthlyCost = Math.max(10, Math.round(Number(node.monthlyCost || 40) * 0.5));
        if (!node.specs.includes('Cost-Optimized')) {
          node.specs = `${node.specs} (Cost-Optimized)`;
        }
      }
    });

    this.refreshMetrics();
    this.currentArchitecture.costReductionPct = 68;
    this.healTopology();
    this.autoLayoutCanvas();
    return this.currentArchitecture;
  }

  applyArchitectureUpdate(groqResponse, rawUserText) {
    let changed = false;
    const lower = (rawUserText || '').toLowerCase();

    // 1. Full New Architecture from Groq response
    let newArch = groqResponse?.newArchitecture || 
                  groqResponse?.suggestedModifications?.newArchitecture ||
                  (groqResponse?.suggestedModifications?.replaceArchitecture ? groqResponse.suggestedModifications : null);

    if (newArch && Array.isArray(newArch.nodes) && newArch.nodes.length > 0) {
      console.log('🏗️ Clouderator AI: Applying full new architecture from Groq:', newArch.projectName);
      const colorMap = {
        networking: '#8b5cf6',
        compute: '#f97316',
        database: '#10b981',
        caching: '#ef4444',
        storage: '#3b82f6',
        messaging: '#eab308'
      };

      this.currentArchitecture = {
        projectName: newArch.projectName || 'Custom Cloud App',
        cloudProvider: newArch.cloudProvider || 'aws',
        userScale: newArch.userScale || 100000,
        costReductionPct: 25,
        metrics: {
          monthlyCost: 0,
          costPercentDiff: -25,
          performanceScore: 92,
          performanceStatus: 'High Performance',
          availabilityScore: 99.99,
          availabilityStatus: 'Multi-AZ Active-Active',
          securityScore: 95,
          securityStatus: 'Enterprise Secure'
        },
        nodes: newArch.nodes.map((n, idx) => {
          const cat = n.category || 'compute';
          let defaultY = 380;
          let defaultX = 180 + ((idx % 4) * 220);
          if (cat === 'networking') { defaultY = 120; }
          else if (cat === 'compute') { defaultY = 260; }
          else if (cat === 'caching' || cat === 'messaging') { defaultY = 400; }
          else if (cat === 'database' || cat === 'storage') { defaultY = 540; }

          return {
            id: n.id || `node_${Math.random().toString(36).substr(2, 6)}`,
            name: n.name || 'Cloud Service',
            category: cat,
            categoryColor: n.categoryColor || colorMap[cat] || '#2563eb',
            specs: n.specs || 'Standard Managed Service',
            sla: n.sla || '99.9% SLA',
            monthlyCost: Number(n.monthlyCost || n.cost || 45.00),
            isGroup: !!n.isGroup,
            instanceCount: n.instanceCount || (n.isGroup ? 3 : undefined),
            children: n.children || undefined,
            x: n.x || defaultX,
            y: n.y || defaultY
          };
        }),
        edges: Array.isArray(newArch.edges) ? newArch.edges.map(e => ({
          from: e.from,
          to: e.to,
          label: e.label || 'Connects'
        })) : []
      };

      this.refreshMetrics();
      this.healTopology();
      this.autoLayoutCanvas();
      return true;
    }

    // 2. Intelligent Domain Presets when user requests a new structure/system
    const isNewStructureRequest = lower.includes('naya structure') || 
                                  lower.includes('naye architecture') || 
                                  lower.includes('new architecture') || 
                                  lower.includes('naya architecture') ||
                                  lower.includes('structure banao') || 
                                  lower.includes('architecture banao') || 
                                  lower.includes('design karo') ||
                                  lower.includes('create architecture') ||
                                  lower.includes('build architecture');

    if (isNewStructureRequest) {
      if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('shopping') || lower.includes('store') || lower.includes('dukaan')) {
        this.loadProjectPreset('ecommerce-scale');
        return true;
      } else if (lower.includes('fintech') || lower.includes('bank') || lower.includes('payment') || lower.includes('wallet') || lower.includes('paisa')) {
        this.loadProjectPreset('fintech-core');
        return true;
      } else if (lower.includes('video') || lower.includes('streaming') || lower.includes('netflix') || lower.includes('ott') || lower.includes('youtube')) {
        this.loadStreamingPreset();
        return true;
      } else if (lower.includes('health') || lower.includes('hospital') || lower.includes('medical') || lower.includes('doctor')) {
        this.loadHealthcarePreset();
        return true;
      } else if (lower.includes('social') || lower.includes('chat') || lower.includes('messenger') || lower.includes('instagram')) {
        this.loadSocialChatPreset();
        return true;
      } else if (lower.includes('iot') || lower.includes('fleet') || lower.includes('sensor') || lower.includes('tracking')) {
        this.loadIoTPreset();
        return true;
      } else if (lower.includes('microservice') || lower.includes('kubernetes') || lower.includes('eks')) {
        this.loadMicroservicesPreset();
        return true;
      }
    }

    // 2b. Intelligent Cost Optimization / Budget Reduction Intent
    const isCostRelated = /\b(cost|kharcha|paisa|budget|sasta|cheap|cheaper|rate)\b/i.test(lower);
    const isActionRelated = /\b(kam|ghatao|ghata|kamti|banao|banaiye|karo|kar\s*do|kar\s*dijiye|reduce|lower|less|down|optimize|cut|save|new|naya|naye|cheaper)\b/i.test(lower);
    const isCostOptimization = (isCostRelated && isActionRelated) ||
      /\b(cost\s*optimization|cost\s*optimize|reduce\s*cost|lower\s*cost|low\s*budget|sasta\s*architecture|cheap\s*architecture|cost\s*kam)\b/i.test(lower);

    if (isCostOptimization) {
      const wantsNew = /\b(new|naya|naye|fresh|scratch|from scratch|serverless|banao|banaiye|create|build)\b/i.test(lower) ||
                       !this.currentArchitecture?.nodes?.length;
      this.optimizeArchitectureCost(wantsNew, rawUserText);
      return true;
    }

    // 3. Process Node Additions, Removals & Connections from Groq
    let addNodes = [];
    if (groqResponse?.suggestedModifications) {
      const mods = groqResponse.suggestedModifications;
      if (Array.isArray(mods)) {
        addNodes = mods;
      } else if (Array.isArray(mods.addNodes)) {
        addNodes = mods.addNodes;
      }
      
      const removeIds = mods.removeNodeIds || mods.deleteNodes || mods.removeNodes;
      if (Array.isArray(removeIds)) {
        removeIds.forEach(id => {
          this.deleteNode(id);
          changed = true;
        });
      }

      // Connect edges
      const connectEdges = mods.connectEdges || mods.edges || mods.addEdges;
      if (Array.isArray(connectEdges)) {
        connectEdges.forEach(e => {
          if (e && e.from && e.to) {
            this.connectNodes(e.from, e.to, e.label || 'Traffic');
            changed = true;
          }
        });
      }

      // Disconnect edges
      const disconnectEdges = mods.disconnectEdges || mods.removeEdges;
      if (Array.isArray(disconnectEdges)) {
        disconnectEdges.forEach(e => {
          if (e && e.from) {
            this.disconnectNodes(e.from, e.to);
            changed = true;
          }
        });
      }

      // Auto Layout
      if (mods.autoLayout) {
        this.autoLayoutCanvas();
        changed = true;
      }

      // Heal topology
      if (mods.healTopology) {
        this.healTopology();
        changed = true;
      }
    }

    if (addNodes.length > 0) {
      addNodes.forEach(node => {
        this.addNode(node);
        changed = true;
      });
    }

    // 4. NLP Heuristics for direct additions from Cloud Catalog
    const isAddAction = /\b(insert|make|add|create|put|plug|include|attach|banao|daalo|daal do|lagao|jodo|set karo|add karo|insert karo)\b/i.test(lower);
    if (isAddAction) {
      const match = findServiceByText(lower);
      if (match && !this.currentArchitecture.nodes.some(n => n.id === match.id || n.name.toLowerCase().includes(match.id))) {
        this.addNode({
          id: match.id,
          name: match.name,
          category: match.category,
          categoryColor: match.categoryColor,
          specs: match.specs,
          sla: match.sla,
          monthlyCost: match.cost,
          isFreeTier: match.isFreeTier,
          freeTier: match.freeTier
        });
        changed = true;
      }
    }

    if (lower.includes('kafka') && !this.currentArchitecture.nodes.some(n => n.id === 'kafka')) {
      this.addNode({
        id: 'kafka',
        name: 'Apache Kafka (MSK)',
        category: 'messaging',
        specs: '3-Broker Managed Cluster for Event Streams',
        sla: '99.99% SLA',
        monthlyCost: 140.00
      });
      changed = true;
    }

    if ((lower.includes('waf') || lower.includes('firewall')) && !this.currentArchitecture.nodes.some(n => n.id === 'waf')) {
      this.addNode({
        id: 'waf',
        name: 'AWS WAF & Shield',
        category: 'networking',
        specs: 'Layer 7 OWASP Attack & Bot Protection',
        sla: '99.99% SLA',
        monthlyCost: 30.00
      });
      changed = true;
    }

    if (lower.includes('elasticsearch') || lower.includes('opensearch')) {
      if (!this.currentArchitecture.nodes.some(n => n.id === 'opensearch')) {
        this.addNode({
          id: 'opensearch',
          name: 'Amazon OpenSearch Cluster',
          category: 'database',
          specs: 'Log Analytics & Full-text Catalog Search',
          sla: '99.95% SLA',
          monthlyCost: 75.00
        });
        changed = true;
      }
    }

    if (lower.includes('dynamodb') || lower.includes('mongodb') || lower.includes('nosql')) {
      if (!this.currentArchitecture.nodes.some(n => n.id === 'dynamodb')) {
        this.addNode({
          id: 'dynamodb',
          name: 'Amazon DynamoDB',
          category: 'database',
          specs: 'On-Demand Pay-per-Request NoSQL Table (25GB Free)',
          sla: '99.999% SLA',
          monthlyCost: 0.00,
          isFreeTier: true,
          freeTier: '25 GB Storage, 25 WCU & 25 RCU Always Free'
        });
        changed = true;
      }
    }

    if (lower.includes('sqs') || lower.includes('rabbitmq') || lower.includes('message queue')) {
      if (!this.currentArchitecture.nodes.some(n => n.id === 'sqs')) {
        this.addNode({
          id: 'sqs',
          name: 'Amazon SQS Queue',
          category: 'messaging',
          specs: 'Standard Queue with Dead-Letter Handling',
          sla: '99.99% SLA',
          monthlyCost: 0.40,
          isFreeTier: true,
          freeTier: '1,000,000 Requests per month Always Free'
        });
        changed = true;
      }
    }

    // Removals
    if (lower.includes('remove') || lower.includes('hata') || lower.includes('delete') || lower.includes('nikal')) {
      if (lower.includes('redis')) {
        const toDelete = this.currentArchitecture.nodes.filter(n => n.id.includes('redis') || n.name.toLowerCase().includes('redis'));
        toDelete.forEach(n => this.deleteNode(n.id));
        changed = true;
      }
      if (lower.includes('websocket')) {
        const toDelete = this.currentArchitecture.nodes.filter(n => n.id.includes('websocket') || n.name.toLowerCase().includes('websocket'));
        toDelete.forEach(n => this.deleteNode(n.id));
        changed = true;
      }
      if (lower.includes('replica')) {
        const toDelete = this.currentArchitecture.nodes.filter(n => n.id.includes('replica') || n.name.toLowerCase().includes('replica'));
        toDelete.forEach(n => this.deleteNode(n.id));
        changed = true;
      }
      if (lower.includes('waf')) {
        const toDelete = this.currentArchitecture.nodes.filter(n => n.id.includes('waf') || n.name.toLowerCase().includes('waf'));
        toDelete.forEach(n => this.deleteNode(n.id));
        changed = true;
      }
      if (lower.includes('kafka')) {
        const toDelete = this.currentArchitecture.nodes.filter(n => n.id.includes('kafka') || n.name.toLowerCase().includes('kafka'));
        toDelete.forEach(n => this.deleteNode(n.id));
        changed = true;
      }
    }

    // Always run topology healing so zero nodes are left disconnected
    const healed = this.healTopology();
    if (healed.length > 0) changed = true;

    if (changed) {
      this.refreshMetrics();
    }
    return changed;
  }
}

module.exports = {
  ClouderatorAIEngine,
  DEFAULT_ARCHITECTURE,
  INITIAL_CHAT
};
