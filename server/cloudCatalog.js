// Clouderator Comprehensive Cloud Services Catalog
// Complete multi-cloud service definitions with accurate costs and AWS / Cloud Free Tier eligibility

const CLOUD_SERVICES_CATALOG = [
  // ==========================================
  // 1. COMPUTE SERVICES
  // ==========================================
  {
    id: 'ec2',
    name: 'Amazon EC2 Instance',
    canonicalName: 'Amazon Elastic Compute Cloud (EC2)',
    category: 'compute',
    categoryColor: '#f97316',
    icon: '🖥️',
    cost: 15.00,
    isFreeTier: true,
    freeTier: '750 hrs/mo (t2.micro / t3.micro) for 12 Months',
    specs: 't3.micro (1 vCPU, 1 GB RAM, 20% Baseline CPU)',
    sla: '99.99% SLA',
    description: 'Resilient scalable virtual servers for backend APIs, microservices, and monolithic apps.',
    keywords: ['ec2', 'virtual machine', 'vm', 'instance', 'server', 'compute', 't2.micro', 't3.micro', 'vps', 'linux']
  },
  {
    id: 'lambda',
    name: 'AWS Lambda Serverless',
    canonicalName: 'AWS Lambda',
    category: 'compute',
    categoryColor: '#f97316',
    icon: 'λ',
    cost: 0.20,
    isFreeTier: true,
    freeTier: '1,000,000 requests & 3.2M sec compute/mo Always Free',
    specs: 'Event-driven serverless functions (up to 10GB RAM, 15m timeout)',
    sla: '99.95% SLA',
    description: 'Run code on-demand without provisioning or managing servers. Zero cost at idle.',
    keywords: ['lambda', 'serverless', 'function', 'faas', 'serverless function', 'event execution']
  },
  {
    id: 'ecs',
    name: 'Amazon ECS (Fargate)',
    canonicalName: 'Amazon Elastic Container Service (ECS / Fargate)',
    category: 'compute',
    categoryColor: '#f97316',
    icon: '📦',
    cost: 42.00,
    isFreeTier: false,
    freeTier: 'Pay-as-you-go container tasks ($0.04048/vCPU-hr)',
    specs: 'Serverless container orchestration (2 vCPU, 4GB RAM per task)',
    sla: '99.99% SLA',
    description: 'Deploy and scale Dockerized microservices without configuring or managing EC2 VMs.',
    keywords: ['ecs', 'fargate', 'docker', 'container', 'containers', 'microservices']
  },
  {
    id: 'eks',
    name: 'Amazon EKS Kubernetes',
    canonicalName: 'Amazon Elastic Kubernetes Service (EKS)',
    category: 'compute',
    categoryColor: '#f97316',
    icon: '☸️',
    cost: 73.00,
    isFreeTier: false,
    freeTier: 'Control plane $0.10/hr + standard worker nodes',
    specs: 'Enterprise managed Kubernetes cluster with auto-scaling worker nodes',
    sla: '99.95% SLA',
    description: 'Managed Kubernetes control plane certified compatible with standard upstream K8s.',
    keywords: ['eks', 'k8s', 'kubernetes', 'cluster', 'pods', 'helm']
  },
  {
    id: 'lightsail',
    name: 'Amazon Lightsail',
    canonicalName: 'Amazon Lightsail VPS',
    category: 'compute',
    categoryColor: '#f97316',
    icon: '⛵',
    cost: 3.50,
    isFreeTier: true,
    freeTier: '3 Months Free (512MB RAM, 1 vCPU, 20GB SSD)',
    specs: '1 vCPU, 1 GB RAM, 40 GB SSD, 2 TB Data Transfer',
    sla: '99.95% SLA',
    description: 'Simple, predictable bundle with compute, SSD storage, and transfer for starter workloads.',
    keywords: ['lightsail', 'vps', 'simple server', 'low cost compute', 'starter']
  },
  {
    id: 'beanstalk',
    name: 'AWS Elastic Beanstalk',
    canonicalName: 'AWS Elastic Beanstalk (PaaS)',
    category: 'compute',
    categoryColor: '#f97316',
    icon: '🌱',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '100% Free Platform (Pay only for underlying EC2/RDS resources)',
    specs: 'Auto-scaling PaaS orchestration for Node.js, Python, Java, Go, Docker',
    sla: '99.95% SLA',
    description: 'Easy platform-as-a-service to deploy and scale web applications and services.',
    keywords: ['beanstalk', 'paas', 'elastic beanstalk', 'app deployment']
  },

  // ==========================================
  // 2. STORAGE & ARCHIVAL SERVICES
  // ==========================================
  {
    id: 's3',
    name: 'Amazon S3 Bucket',
    canonicalName: 'Amazon Simple Storage Service (S3)',
    category: 'storage',
    categoryColor: '#3b82f6',
    icon: '🪣',
    cost: 2.50,
    isFreeTier: true,
    freeTier: '5 GB Standard Storage, 20k GET & 2k PUT/mo for 12 Months',
    specs: '11 9s Durability (99.999999999%), Lifecycle Rules, Static Web Hosting',
    sla: '99.99% SLA',
    description: 'Industry-leading object storage for static web assets, images, media files, and backups.',
    keywords: ['s3', 'bucket', 'object storage', 'storage', 'blob', 's3 bucket', 'media storage']
  },
  {
    id: 'ebs',
    name: 'Amazon EBS Volume',
    canonicalName: 'Amazon Elastic Block Store (EBS)',
    category: 'storage',
    categoryColor: '#3b82f6',
    icon: '💾',
    cost: 3.00,
    isFreeTier: true,
    freeTier: '30 GB SSD Storage (gp2/gp3) per month for 12 Months',
    specs: 'General Purpose gp3 SSD (3,000 IOPS, 125 MB/s baseline throughput)',
    sla: '99.999% SLA',
    description: 'High-performance persistent block storage volumes designed for mission-critical EC2 tasks.',
    keywords: ['ebs', 'block storage', 'ssd', 'volume', 'disk', 'persistent disk']
  },
  {
    id: 'efs',
    name: 'Amazon EFS File System',
    canonicalName: 'Amazon Elastic File System (EFS)',
    category: 'storage',
    categoryColor: '#3b82f6',
    icon: '📁',
    cost: 6.00,
    isFreeTier: true,
    freeTier: '5 GB Standard Storage per month for 12 Months',
    specs: 'Serverless, fully elastic POSIX-compliant NFS file system',
    sla: '99.99% SLA',
    description: 'Shared file system automatically scaling to petabytes without provisioning storage.',
    keywords: ['efs', 'nfs', 'file system', 'shared storage', 'network file']
  },
  {
    id: 'glacier',
    name: 'Amazon S3 Glacier',
    canonicalName: 'Amazon S3 Glacier Flexible Archive',
    category: 'storage',
    categoryColor: '#3b82f6',
    icon: '🧊',
    cost: 0.80,
    isFreeTier: true,
    freeTier: '10 GB Free Data Retrieval per month Always Free',
    specs: 'Cold Archival Vault ($0.0036/GB/mo), WORM Compliance, 1-5 hr retrieval',
    sla: '99.999999999% SLA',
    description: 'Extremely low-cost cold storage for regulatory archives, legal records, and disaster backups.',
    keywords: ['glacier', 'archive', 'cold storage', 'backup', 'vault', 'deep archive']
  },

  // ==========================================
  // 3. DATABASE & IN-MEMORY CACHE
  // ==========================================
  {
    id: 'rds',
    name: 'Amazon RDS (PostgreSQL/MySQL)',
    canonicalName: 'Amazon Relational Database Service (RDS)',
    category: 'database',
    categoryColor: '#10b981',
    icon: '🐘',
    cost: 17.50,
    isFreeTier: true,
    freeTier: '750 hrs/mo db.t2.micro / db.t3.micro + 20GB SSD for 12 Months',
    specs: 'db.t3.micro, Automated Backups, Read Replica Support, Multi-AZ Option',
    sla: '99.95% SLA',
    description: 'Managed SQL relational database engines (PostgreSQL, MySQL, MariaDB) with automated snapshots.',
    keywords: ['rds', 'relational', 'postgres', 'postgresql', 'mysql', 'sql', 'database', 'mariadb', 'rdbms']
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    canonicalName: 'Amazon DynamoDB NoSQL',
    category: 'database',
    categoryColor: '#10b981',
    icon: '⚡',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '25 GB Storage, 25 WCU & 25 RCU Always Free',
    specs: 'On-Demand Capacity, Single-digit Millisecond Latency, Global Tables',
    sla: '99.999% SLA',
    description: 'Fast and flexible serverless NoSQL database service for low-latency web-scale applications.',
    keywords: ['dynamodb', 'nosql', 'document', 'key-value', 'dynamo', 'non-relational']
  },
  {
    id: 'aurora',
    name: 'Amazon Aurora Serverless',
    canonicalName: 'Amazon Aurora Serverless v2',
    category: 'database',
    categoryColor: '#10b981',
    icon: '🌌',
    cost: 45.00,
    isFreeTier: false,
    freeTier: 'On-demand ACU auto-scaling ($0.12/ACU-hr)',
    specs: 'Auto-scaling from 0.5 to 128 ACUs, 6-way Multi-AZ storage replication',
    sla: '99.99% SLA',
    description: 'Up to 5x throughput of standard MySQL and 3x of PostgreSQL with instant failover.',
    keywords: ['aurora', 'aurora serverless', 'high performance db', 'cluster db']
  },
  {
    id: 'redis',
    name: 'Amazon ElastiCache Redis',
    canonicalName: 'Amazon ElastiCache (In-Memory Redis)',
    category: 'caching',
    categoryColor: '#ef4444',
    icon: '🔴',
    cost: 18.00,
    isFreeTier: true,
    freeTier: '750 hrs/mo (cache.t2.micro / cache.t3.micro) for 12 Months',
    specs: 'cache.t3.micro, Sub-millisecond Response Times, Pub/Sub Engine',
    sla: '99.9% SLA',
    description: 'Ultra-fast in-memory caching cluster for session stores, gaming leaderboards, and query caches.',
    keywords: ['redis', 'elasticache', 'cache', 'caching', 'memcached', 'in-memory']
  },
  {
    id: 'documentdb',
    name: 'Amazon DocumentDB',
    canonicalName: 'Amazon DocumentDB (MongoDB Compatible)',
    category: 'database',
    categoryColor: '#10b981',
    icon: '📄',
    cost: 65.00,
    isFreeTier: true,
    freeTier: '1-Month Free Trial (750 hrs db.t3.medium + 5GB storage)',
    specs: 'JSON Document Store, Managed High Availability, Enterprise Encryption',
    sla: '99.99% SLA',
    description: 'Fully managed JSON document database designed for modern schema-flexible applications.',
    keywords: ['documentdb', 'mongodb', 'mongo', 'json database', 'document store']
  },

  // ==========================================
  // 4. NETWORKING, TRAFFIC & EDGE DELIVERY
  // ==========================================
  {
    id: 'cloudfront',
    name: 'Amazon CloudFront CDN',
    canonicalName: 'Amazon CloudFront (Content Delivery Network)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🌐',
    cost: 8.50,
    isFreeTier: true,
    freeTier: '1 TB Data Transfer-Out & 10,000,000 HTTP/S Requests Always Free',
    specs: '600+ Global Edge Locations, TLS 1.3, Origin Shield, Brotli/Gzip',
    sla: '99.9% SLA',
    description: 'Global content delivery network accelerating website assets, APIs, and live video streaming.',
    keywords: ['cloudfront', 'cdn', 'edge', 'caching network', 'content delivery', 'edge network']
  },
  {
    id: 'route53',
    name: 'Amazon Route 53 DNS',
    canonicalName: 'Amazon Route 53 (Global Cloud DNS)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🗺️',
    cost: 0.50,
    isFreeTier: false,
    freeTier: '$0.50/hosted zone/mo + $0.40 per million queries',
    specs: '100% SLA Global Anycast DNS, Latency & Geo Routing, Automated Health Checks',
    sla: '100% SLA',
    description: 'Highly available and scalable cloud Domain Name System (DNS) web service.',
    keywords: ['route53', 'dns', 'domain', 'nameserver', 'route 53', 'dns routing']
  },
  {
    id: 'alb',
    name: 'Application Load Balancer',
    canonicalName: 'AWS Application Load Balancer (ALB)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '⚖️',
    cost: 16.00,
    isFreeTier: true,
    freeTier: '750 hrs/mo + 15 LCU-hrs per month for 12 Months',
    specs: 'Layer 7 HTTP/HTTPS/gRPC routing, WebSocket persistent proxying, TLS Offloading',
    sla: '99.99% SLA',
    description: 'Distributes incoming application traffic across multiple targets and Availability Zones.',
    keywords: ['alb', 'load balancer', 'elb', 'balancer', 'load-balancer', 'application load balancer']
  },
  {
    id: 'apigateway',
    name: 'Amazon API Gateway',
    canonicalName: 'Amazon API Gateway',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🚪',
    cost: 3.50,
    isFreeTier: true,
    freeTier: '1,000,000 REST & HTTP API calls/mo for 12 Months',
    specs: 'REST & WebSocket Protocol Support, API Key Management, Throttling & Usage Plans',
    sla: '99.95% SLA',
    description: 'Fully managed service that makes it easy for developers to create, publish, and secure APIs.',
    keywords: ['apigateway', 'api gateway', 'api', 'rest api', 'endpoints', 'websocket gateway']
  },
  {
    id: 'vpc',
    name: 'Amazon VPC',
    canonicalName: 'Amazon Virtual Private Cloud (VPC)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🔒',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '100% Free Always (Subnets, Route Tables, Internet Gateways, NACLs)',
    specs: 'Private RFC 1918 CIDR blocks, Multi-AZ Subnets, Security Group Firewalls',
    sla: '99.99% SLA',
    description: 'Provision a logically isolated section of the cloud where you launch resources in your custom network.',
    keywords: ['vpc', 'network', 'subnet', 'cidr', 'virtual private cloud', 'private network']
  },
  {
    id: 'waf',
    name: 'AWS WAF & Shield',
    canonicalName: 'AWS Web Application Firewall (WAF)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🛡️',
    cost: 30.00,
    isFreeTier: false,
    freeTier: '$5.00 per web ACL + $1.00 per rule + $0.60 per 1M requests',
    specs: 'OWASP Top 10 Rule Groups, Rate-based IP Blocking, Bot Control & Managed Rules',
    sla: '99.99% SLA',
    description: 'Protects web applications and APIs from common web exploits and bots that affect availability.',
    keywords: ['waf', 'shield', 'firewall', 'security', 'ddos', 'bot protection']
  },
  {
    id: 'nat',
    name: 'AWS NAT Gateway',
    canonicalName: 'AWS NAT Gateway',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🔀',
    cost: 32.40,
    isFreeTier: false,
    freeTier: '$0.045 per hour + $0.045 per GB data processed',
    specs: 'High Availability Managed NAT (Up to 100 Gbps automated scaling)',
    sla: '99.99% SLA',
    description: 'Enables instances in private subnets to connect to the internet while preventing inbound connections.',
    keywords: ['nat', 'nat gateway', 'outbound gateway', 'network address translation']
  },

  // ==========================================
  // 5. SECURITY, IDENTITY & SECRETS
  // ==========================================
  {
    id: 'iam',
    name: 'AWS IAM',
    canonicalName: 'AWS Identity and Access Management (IAM)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🔑',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '100% Free Always (Roles, Policies, Users, MFA)',
    specs: 'Fine-grained Principle of Least Privilege, Temporary STS Credentials',
    sla: '99.99% SLA',
    description: 'Securely manage identities, roles, and access permissions across all cloud resources.',
    keywords: ['iam', 'access', 'roles', 'permissions', 'auth', 'identity', 'least privilege']
  },
  {
    id: 'cognito',
    name: 'Amazon Cognito',
    canonicalName: 'Amazon Cognito User Pools',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '👤',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '50,000 Monthly Active Users (MAUs) Always Free',
    specs: 'OAuth 2.0 / OIDC flows, MFA, Social Login (Google, Apple, Facebook), Hosted UI',
    sla: '99.9% SLA',
    description: 'Simple, secure customer identity and access management scaling to millions of users.',
    keywords: ['cognito', 'user pool', 'auth', 'authentication', 'login', 'oauth', 'user auth']
  },
  {
    id: 'secretsmanager',
    name: 'AWS Secrets Manager',
    canonicalName: 'AWS Secrets Manager',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🔐',
    cost: 1.60,
    isFreeTier: true,
    freeTier: '30-Day Free Trial per secret ($0.40/secret/mo afterwards)',
    specs: 'AES-256 Encryption, Automated Database Credential Rotation, Fine-grained IAM ACLs',
    sla: '99.9% SLA',
    description: 'Rotate, manage, and retrieve database credentials, API keys, and other secrets throughout their lifecycle.',
    keywords: ['secrets', 'secrets manager', 'vault', 'credentials', 'api keys', 'secret']
  },
  {
    id: 'kms',
    name: 'AWS KMS (Key Management)',
    canonicalName: 'AWS Key Management Service (KMS)',
    category: 'networking',
    categoryColor: '#8b5cf6',
    icon: '🗝️',
    cost: 1.00,
    isFreeTier: true,
    freeTier: '20,000 Requests per month Always Free',
    specs: 'FIPS 140-2 Cryptographic Hardware Modules (HSMs), Envelope Encryption',
    sla: '99.99% SLA',
    description: 'Create and control keys used to encrypt data across all AWS services and custom applications.',
    keywords: ['kms', 'encryption', 'keys', 'cryptography', 'key management']
  },

  // ==========================================
  // 6. MESSAGING & ASYNCHRONOUS INTEGRATION
  // ==========================================
  {
    id: 'sqs',
    name: 'Amazon SQS Queue',
    canonicalName: 'Amazon Simple Queue Service (SQS)',
    category: 'messaging',
    categoryColor: '#eab308',
    icon: '📬',
    cost: 0.40,
    isFreeTier: true,
    freeTier: '1,000,000 Requests per month Always Free',
    specs: 'Standard & FIFO Queues, Dead-Letter Queues (DLQ), 14-day Retention',
    sla: '99.99% SLA',
    description: 'Fully managed message queuing service for decoupling and scaling microservices and distributed systems.',
    keywords: ['sqs', 'queue', 'message queue', 'fifo', 'message', 'messaging queue', 'async queue']
  },
  {
    id: 'sns',
    name: 'Amazon SNS Notifications',
    canonicalName: 'Amazon Simple Notification Service (SNS)',
    category: 'messaging',
    categoryColor: '#eab308',
    icon: '📢',
    cost: 0.50,
    isFreeTier: true,
    freeTier: '1,000,000 Mobile Push Notifications & Publishes Always Free',
    specs: 'Pub/Sub Fan-Out, SMS Messaging, Email Alerts, Direct SQS Integration',
    sla: '99.99% SLA',
    description: 'High-throughput push notification and publish/subscribe messaging service.',
    keywords: ['sns', 'notification', 'pubsub', 'pub/sub', 'topic', 'alert', 'notifications']
  },
  {
    id: 'eventbridge',
    name: 'Amazon EventBridge',
    canonicalName: 'Amazon EventBridge (Serverless Event Bus)',
    category: 'messaging',
    categoryColor: '#eab308',
    icon: '🔀',
    cost: 1.00,
    isFreeTier: true,
    freeTier: '1,000,000 Events per month Always Free',
    specs: 'Schema Registry, Event Routing Rules, Native SaaS Partner Integrations',
    sla: '99.99% SLA',
    description: 'Serverless event bus that connects applications using data from your own apps and integrated SaaS.',
    keywords: ['eventbridge', 'event bus', 'events', 'eda', 'event-driven']
  },
  {
    id: 'kafka',
    name: 'Apache Kafka (MSK)',
    canonicalName: 'Amazon Managed Streaming for Apache Kafka (MSK)',
    category: 'messaging',
    categoryColor: '#eab308',
    icon: '📡',
    cost: 140.00,
    isFreeTier: false,
    freeTier: 'Enterprise 3-broker cluster ($0.065/broker-hr)',
    specs: 'Managed 3-Broker Cluster, High-Throughput Streaming, Multi-AZ Partitioning',
    sla: '99.95% SLA',
    description: 'Fully managed Apache Kafka service for real-time streaming data ingestion and processing.',
    keywords: ['kafka', 'msk', 'streaming', 'stream', 'event log', 'apache kafka']
  },
  {
    id: 'stepfunctions',
    name: 'AWS Step Functions',
    canonicalName: 'AWS Step Functions (Workflows)',
    category: 'messaging',
    categoryColor: '#eab308',
    icon: '🎛️',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '4,000 State Transitions per month Always Free',
    specs: 'Visual Low-Code Workflow Designer, Retry Policies, Error Handling',
    sla: '99.99% SLA',
    description: 'Low-code visual workflow service used to orchestrate AWS services, automate business processes.',
    keywords: ['step functions', 'workflow', 'orchestrator', 'state machine', 'stepfunctions']
  },

  // ==========================================
  // 7. MONITORING, OBSERVABILITY & SEARCH
  // ==========================================
  {
    id: 'cloudwatch',
    name: 'Amazon CloudWatch',
    canonicalName: 'Amazon CloudWatch Monitoring',
    category: 'compute',
    categoryColor: '#0284c7',
    icon: '📊',
    cost: 3.00,
    isFreeTier: true,
    freeTier: '10 Custom Metrics, 5 GB Log Ingestion, 3 Dashboards Always Free',
    specs: 'Real-Time Metrics Collection, Metric Alarms, Composite Insights, Log Groups',
    sla: '99.9% SLA',
    description: 'Observability service providing actionable insights for AWS and on-premises resources and applications.',
    keywords: ['cloudwatch', 'monitoring', 'logs', 'metrics', 'alarms', 'observability']
  },
  {
    id: 'cloudtrail',
    name: 'AWS CloudTrail',
    canonicalName: 'AWS CloudTrail (Audit Log)',
    category: 'networking',
    categoryColor: '#0284c7',
    icon: '📜',
    cost: 0.00,
    isFreeTier: true,
    freeTier: '100% Free Always (Management Event History for 90 Days)',
    specs: 'Immutable Cloud-wide API Audit Trails, Security Forensics, Compliance Logs',
    sla: '99.9% SLA',
    description: 'Track user activity and API usage across your AWS account for compliance and security auditing.',
    keywords: ['cloudtrail', 'audit', 'governance', 'compliance', 'api logging', 'audit log']
  },
  {
    id: 'opensearch',
    name: 'Amazon OpenSearch Service',
    canonicalName: 'Amazon OpenSearch Service (Elasticsearch)',
    category: 'database',
    categoryColor: '#10b981',
    icon: '🔍',
    cost: 75.00,
    isFreeTier: true,
    freeTier: '750 hrs/mo (t2.small.search / t3.small.search + 10GB storage) for 12 Mos',
    specs: 'Full-Text Search Engine, Real-time Log Analytics, OpenSearch Dashboards',
    sla: '99.95% SLA',
    description: 'Secure, cost-effective search, analytics, and visualization of petabytes of structured and unstructured data.',
    keywords: ['opensearch', 'elasticsearch', 'elastic search', 'search', 'kibana', 'log search']
  },

  // ==========================================
  // 8. AI & MACHINE LEARNING
  // ==========================================
  {
    id: 'bedrock',
    name: 'Amazon Bedrock GenAI',
    canonicalName: 'Amazon Bedrock (Generative AI)',
    category: 'compute',
    categoryColor: '#a855f7',
    icon: '🧠',
    cost: 10.00,
    isFreeTier: false,
    freeTier: 'Pay-per-token API access to foundation models (Claude, Llama, Titan)',
    specs: 'Unified Serverless API for LLMs, RAG Knowledge Bases, AI Guardrails',
    sla: '99.9% SLA',
    description: 'Build and scale generative AI applications with top foundation models via a unified API.',
    keywords: ['bedrock', 'ai', 'genai', 'llm', 'generative ai', 'machine learning', 'chatgpt', 'claude']
  },
  {
    id: 'sagemaker',
    name: 'Amazon SageMaker',
    canonicalName: 'Amazon SageMaker (ML Platform)',
    category: 'compute',
    categoryColor: '#a855f7',
    icon: '🔬',
    cost: 48.00,
    isFreeTier: true,
    freeTier: '250 hrs/mo (t2.medium / t3.medium notebook) for First 2 Months',
    specs: 'JupyterLab Studio, Distributed Model Training, Serverless Real-time Endpoints',
    sla: '99.9% SLA',
    description: 'End-to-end machine learning platform to build, train, and deploy models for any use case.',
    keywords: ['sagemaker', 'ml', 'model training', 'inference', 'machine learning platform']
  }
];

// Helper to look up a service from freeform prompt or query
function findServiceByText(queryText) {
  if (!queryText || typeof queryText !== 'string') return null;
  const raw = queryText.toLowerCase().trim();

  // 1. Direct ID match
  const exactId = CLOUD_SERVICES_CATALOG.find(s => s.id === raw);
  if (exactId) return exactId;

  // 2. Specific exact alias heuristics (highest priority)
  if (/\b(ec2|virtual machine|t2\.micro|t3\.micro)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'ec2');
  }
  if (/\b(lambda|serverless function)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'lambda');
  }
  if (/\b(s3|s3 bucket|storage bucket)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 's3');
  }
  if (/\b(rds|postgres|postgresql|mysql)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'rds');
  }
  if (/\b(dynamodb|dynamo|nosql)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'dynamodb');
  }
  if (/\b(cloudfront|cdn)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'cloudfront');
  }
  if (/\b(route53|route 53|dns)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'route53');
  }
  if (/\b(alb|load balancer|elb)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'alb');
  }
  if (/\b(redis|elasticache)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'redis');
  }
  if (/\b(sqs|message queue|queue)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'sqs');
  }
  if (/\b(sns|notification|topic)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'sns');
  }
  if (/\b(kafka|msk)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'kafka');
  }
  if (/\b(waf|firewall|shield)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'waf');
  }
  if (/\b(cognito|user pool)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'cognito');
  }
  if (/\b(iam|role|permissions)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'iam');
  }
  if (/\b(secrets manager|secret manager|vault)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'secretsmanager');
  }
  if (/\b(cloudwatch|monitoring|logs)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'cloudwatch');
  }
  if (/\b(opensearch|elasticsearch)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'opensearch');
  }
  if (/\b(bedrock|genai|llm)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'bedrock');
  }
  if (/\b(eks|kubernetes|k8s)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'eks');
  }
  if (/\b(ecs|fargate)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'ecs');
  }
  if (/\b(aurora)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'aurora');
  }
  if (/\b(glacier)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'glacier');
  }
  if (/\b(vpc)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'vpc');
  }
  if (/\b(nat gateway|nat)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'nat');
  }
  if (/\b(kms)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'kms');
  }
  if (/\b(step functions|stepfunctions)\b/i.test(raw)) {
    return CLOUD_SERVICES_CATALOG.find(s => s.id === 'stepfunctions');
  }

  // 3. Keyword matching loop
  for (const svc of CLOUD_SERVICES_CATALOG) {
    if (raw.includes(svc.name.toLowerCase())) return svc;
    if (raw.includes(svc.canonicalName.toLowerCase())) return svc;
    for (const kw of svc.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(raw)) return svc;
    }
  }

  return null;
}

module.exports = {
  CLOUD_SERVICES_CATALOG,
  findServiceByText
};
