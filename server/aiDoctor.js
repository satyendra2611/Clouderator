// Clouderator AI Infrastructure Doctor & Failure Analyzer
// Dynamically analyzes active architecture topologies, diagnoses bottlenecks & SPOFs, and executes 1-click auto-remediations

class AIDoctor {
  constructor() {
    this.simulatedIncidents = new Map();
    this.resolvedIncidents = new Map();
  }

  // Clear all cached incidents when starting a fresh session/canvas
  reset() {
    this.simulatedIncidents.clear();
    this.resolvedIncidents.clear();
  }

  // Analyzes the current live architecture and returns intelligent diagnostic insights
  diagnoseArchitecture(arch) {
    if (!arch || !arch.nodes || arch.nodes.length === 0) {
      return {
        hasArchitecture: false,
        nodesCount: 0,
        incidents: [],
        serviceHealthChecks: [],
        summary: {
          overallHealth: 'Idle',
          healthScore: 100,
          statusMessage: 'No Infrastructure Deployed',
          activeIncidents: 0,
          resolved24h: 0,
          meanTimeToDetect: '--',
          meanTimeToResolve: '--',
          isIdle: true
        }
      };
    }

    const nodes = arch.nodes;
    const nodeIds = new Set(nodes.map(n => n.id));
    const diagnosedIncidents = [];

    // 1. Check for User-Simulated / Chaos Incidents on existing nodes
    for (const [id, inc] of this.simulatedIncidents.entries()) {
      if (nodeIds.has(inc.nodeId) || inc.nodeId === 'all' || !inc.nodeId) {
        diagnosedIncidents.push(inc);
      }
    }

    // 2. Check for Single Point of Failure (SPOF) in Database Tier
    const dbNodes = nodes.filter(n => n.category === 'database' || ['rds', 'aurora', 'documentdb', 'mysql', 'postgres', 'rds_primary'].includes(n.id));
    const hasDbReplica = nodes.some(n => n.id === 'rds_replica' || (n.specs || '').toLowerCase().includes('multi-az') || (n.specs || '').toLowerCase().includes('replica') || n.id === 'dynamodb');
    
    if (dbNodes.length > 0 && !hasDbReplica) {
      const primaryDb = dbNodes[0];
      const incId = `spof-db-${primaryDb.id}`;
      const isResolved = this.resolvedIncidents.has(incId);
      
      diagnosedIncidents.push({
        id: incId,
        nodeId: primaryDb.id,
        title: `Single Point of Failure: ${primaryDb.name} Lacks Multi-AZ Replica`,
        severity: 'high',
        status: isResolved ? 'resolved' : 'active',
        resolved: isResolved,
        timestamp: isResolved ? 'Resolved' : 'Detected 3m ago',
        service: primaryDb.name,
        symptom: 'Database is running on a standalone single Availability Zone without automatic standby failover.',
        rootCause: 'Unsynchronized primary node risk. In the event of an AZ hardware degradation, database downtime can reach 20-40 minutes.',
        suggestedFix: 'Attach an asynchronous Aurora/RDS read replica or enable Multi-AZ synchronous failover.',
        remediationAction: 'add_db_replica',
        remediationLabel: 'Attach Multi-AZ Read Replica',
        confidenceScore: 98,
        actionTaken: 'Provisioned PostgreSQL Read Replica with automated DNS failover in secondary AZ.'
      });
    }

    // 3. Check for Ingress Perimeter Security (WAF)
    const hasIngress = nodes.some(n => ['alb', 'apigateway', 'cloudfront', 'cdn'].includes(n.id) || n.category === 'networking');
    const hasWaf = nodes.some(n => n.id === 'waf');
    
    if (hasIngress && !hasWaf) {
      const incId = 'sec-waf-missing';
      const isResolved = this.resolvedIncidents.has(incId);

      diagnosedIncidents.push({
        id: incId,
        nodeId: 'waf',
        title: 'Perimeter Risk: Public Ingress Gateway Missing AWS WAF',
        severity: 'medium',
        status: isResolved ? 'resolved' : 'active',
        resolved: isResolved,
        timestamp: isResolved ? 'Resolved' : 'Detected 5m ago',
        service: 'Application Load Balancer / API Gateway',
        symptom: 'Ingress traffic is directly accepting connections without layer-7 OWASP inspection or bot mitigation.',
        rootCause: 'No Web Application Firewall attached to filter SQLi, XSS, and layer-7 application DDoS floods.',
        suggestedFix: 'Attach AWS WAF WebACL with AWS Managed Core Rule Set and automated rate-limiting rules.',
        remediationAction: 'add_waf',
        remediationLabel: 'Deploy AWS WAF Shield',
        confidenceScore: 96,
        actionTaken: 'Deployed AWS WAF WebACL with Rate Limiting (2000 req/5min) and SQLi/XSS filters.'
      });
    }

    // 4. Check for Caching Bottleneck
    const hasHeavyDb = dbNodes.length > 0;
    const hasCache = nodes.some(n => n.id === 'redis' || n.category === 'caching');
    const hasCompute = nodes.some(n => n.category === 'compute' || ['asg', 'ec2', 'ecs', 'eks', 'lambda'].includes(n.id));

    if (hasHeavyDb && hasCompute && !hasCache) {
      const incId = 'perf-cache-missing';
      const isResolved = this.resolvedIncidents.has(incId);

      diagnosedIncidents.push({
        id: incId,
        nodeId: 'redis',
        title: 'Performance Opportunity: Database Query IOPS Hotspots (No Cache)',
        severity: 'low',
        status: isResolved ? 'resolved' : 'active',
        resolved: isResolved,
        timestamp: isResolved ? 'Resolved' : 'Detected 8m ago',
        service: 'Database Query Pipeline',
        symptom: 'Read query latency p95 is 72ms with repeated read operations hitting relational tables directly.',
        rootCause: 'Lack of in-memory caching layer results in excessive database IOPS and cache-miss overhead.',
        suggestedFix: 'Provision a sub-millisecond Redis ElastiCache cluster to cache sessions and hot database queries.',
        remediationAction: 'add_redis',
        remediationLabel: 'Provision Redis ElastiCache',
        confidenceScore: 92,
        actionTaken: 'Provisioned Redis ElastiCache cluster with 15k IOPS throughput; read latency reduced to 1.8ms.'
      });
    }

    // 5. Check for Standalone Compute Without Auto-Scaling
    const standaloneCompute = nodes.find(n => n.id === 'ec2' && !nodes.some(g => g.isGroup || g.id === 'asg'));
    if (standaloneCompute) {
      const incId = 'res-ec2-standalone';
      const isResolved = this.resolvedIncidents.has(incId);

      diagnosedIncidents.push({
        id: incId,
        nodeId: standaloneCompute.id,
        title: `Resilience Risk: Standalone Compute Instance (${standaloneCompute.name})`,
        severity: 'medium',
        status: isResolved ? 'resolved' : 'active',
        resolved: isResolved,
        timestamp: isResolved ? 'Resolved' : 'Detected 12m ago',
        service: standaloneCompute.name,
        symptom: 'Single compute instance without auto-healing or horizontal scaling policies.',
        rootCause: 'If traffic surges or the instance crashes, system has zero redundant capacity.',
        suggestedFix: 'Convert compute instance into an Auto Scaling Group with minimum 2 replicas.',
        remediationAction: 'scale_compute',
        remediationLabel: 'Attach Auto Scaling Fleet',
        confidenceScore: 95,
        actionTaken: 'Upgraded standalone compute into an Auto Scaling Group with Multi-AZ replicas.'
      });
    }

    // 6. Generate detailed live service health audit for every provisioned node
    const serviceHealthChecks = nodes.map(node => {
      let status = 'HEALTHY';
      let assessment = 'All health checks passing across active availability zones.';
      let sla = node.sla || '99.95% SLA';
      const nid = (node.id || '').toLowerCase();
      const ncat = (node.category || '').toLowerCase();

      // Check if this node has an active incident
      const hasNodeIncident = diagnosedIncidents.some(i => i.nodeId === node.id && !i.resolved);
      if (hasNodeIncident) {
        status = 'DEGRADED';
        assessment = 'Elevated latency / CPU threshold warning detected by AI Doctor.';
      } else if (nid.includes('replica')) {
        assessment = 'Asynchronous standby replication active; replication lag <10ms.';
      } else if (nid.includes('rds') || nid.includes('postgres') || nid.includes('mysql') || nid.includes('aurora')) {
        assessment = 'Relational ACID storage verified. Automated snapshots & Multi-AZ standby active.';
      } else if (nid.includes('asg') || node.isGroup) {
        assessment = 'Auto Scaling fleet operational (min 2, max 10 instances). Dynamic CPU scaling active.';
      } else if (nid.includes('redis') || ncat.includes('caching')) {
        assessment = 'In-memory cache operational. Sub-1ms query latency, memory utilization stable.';
      } else if (nid.includes('waf')) {
        assessment = 'Layer-7 Web Application Firewall active with OWASP Top 10 automated rules.';
      } else if (nid.includes('alb') || nid.includes('load_balancer')) {
        assessment = 'Application Load Balancer healthy. Cross-zone load balancing distributing traffic.';
      } else if (nid.includes('cdn') || nid.includes('cloudfront')) {
        assessment = 'Edge CDN points of presence active. Static asset cache hit ratio >94%.';
      } else if (nid.includes('dns') || nid.includes('route53')) {
        assessment = 'Authoritative DNS resolution active with 100% SLA global anycast routing.';
      } else if (nid.includes('s3')) {
        assessment = 'Object store operational with 99.999999999% durability and SSE-S3 encryption.';
      } else if (nid.includes('kafka')) {
        assessment = '3-broker MSK cluster active. Partitions synchronized with zero consumer lag.';
      } else if (nid.includes('lambda')) {
        assessment = 'Event-driven serverless executor ready. Concurrency headroom at 1,000 workers.';
      } else if (nid.includes('dynamodb')) {
        assessment = 'On-demand NoSQL tables online. Single-digit millisecond latency across partitions.';
      } else if (nid.includes('opensearch')) {
        assessment = 'Search & analytics cluster healthy. Index shard allocation balanced.';
      } else if (nid.includes('websocket')) {
        assessment = 'Persistent duplex WebSocket connections established and monitored.';
      }

      return {
        id: node.id,
        name: node.name,
        category: node.category,
        categoryColor: node.categoryColor || '#3b82f6',
        specs: node.specs || 'Cloud Managed Service',
        sla,
        status,
        assessment
      };
    });

    // Calculate dynamic health metrics based on active findings
    const activeList = diagnosedIncidents.filter(i => !i.resolved);
    const resolvedList = diagnosedIncidents.filter(i => i.resolved);

    let penalty = 0;
    activeList.forEach(inc => {
      if (inc.severity === 'critical') penalty += 20;
      else if (inc.severity === 'high') penalty += 12;
      else if (inc.severity === 'medium') penalty += 6;
      else penalty += 3;
    });

    const healthScore = Math.max(65, 100 - penalty);
    let overallHealth = 'Optimal';
    if (healthScore < 75) overallHealth = 'Critical';
    else if (healthScore < 85) overallHealth = 'Degraded';
    else if (healthScore < 95) overallHealth = 'Healthy';

    return {
      hasArchitecture: true,
      nodesCount: nodes.length,
      incidents: diagnosedIncidents,
      serviceHealthChecks,
      summary: {
        overallHealth,
        healthScore,
        activeIncidents: activeList.length,
        resolved24h: resolvedList.length,
        monitoredServicesCount: nodes.length,
        meanTimeToDetect: '8 seconds (AI Real-time)',
        meanTimeToResolve: '45 seconds (Auto-Healed)',
        isIdle: false
      }
    };
  }

  // Register a user-simulated incident (e.g. from canvas node "Stress / Incident" button)
  registerSimulatedIncident(incident) {
    this.simulatedIncidents.set(incident.id, incident);
  }

  // Trigger a realistic Chaos Engineering Test
  triggerChaosTest(testType = 'latency_spike', arch) {
    const nodes = (arch && arch.nodes) || [];
    if (nodes.length === 0) {
      throw new Error('Cannot run chaos test: No services on architecture canvas.');
    }

    const targetNode = nodes.find(n => n.id === 'asg' || n.category === 'compute') ||
                       nodes.find(n => n.id.includes('rds') || n.category === 'database') ||
                       nodes[0];

    const incidentId = `chaos-${Date.now()}`;
    let title, symptom, rootCause, suggestedFix, actionTaken;

    if (testType === 'az_failover') {
      title = `Simulated AZ Partition: us-east-1a Failure on ${targetNode.name}`;
      symptom = `Availability Zone us-east-1a packet drop rate spiked to 88%. Standby failover initiated.`;
      rootCause = `Simulated primary AZ network partition for disaster recovery readiness.`;
      suggestedFix = `Evacuate ingress traffic from us-east-1a to us-east-1b & us-east-1c and scale standby compute.`;
      actionTaken = `Traffic evacuated from us-east-1a; re-routed to healthy AZs with zero packet loss.`;
    } else if (testType === 'db_pool') {
      title = `Connection Pool Saturation: High Traffic Contention on Database`;
      symptom = `Max connections pool reached 96% with waiting client queue rising.`;
      rootCause = `Sudden surge of unpooled queries exhausting database process table.`;
      suggestedFix = `Attach RDS Proxy with connection pooling & query multiplexing.`;
      actionTaken = `Recycled connection pool and enabled automated RDS connection multiplexing.`;
    } else {
      title = `Critical Latency Spike: 10x Load Surge on ${targetNode.name}`;
      symptom = `P99 response time elevated to 890ms; CPU saturation at 94% with memory pressure.`;
      rootCause = `High concurrent connection pool exhaustion under sudden traffic surge.`;
      suggestedFix = `Scale cluster replicas by +2 and recycle thread pools with circuit breaker fallback.`;
      actionTaken = `Scaled ${targetNode.name} replicas and recycled worker connection pool. Latency normalized to 14ms.`;
    }

    const incident = {
      id: incidentId,
      nodeId: targetNode.id,
      title,
      severity: 'critical',
      status: 'active',
      resolved: false,
      timestamp: 'Just now',
      service: targetNode.name,
      symptom,
      rootCause,
      suggestedFix,
      remediationAction: 'recycle_connection_pool',
      remediationLabel: 'Auto-Scale & Recycle Pools',
      confidenceScore: 99,
      actionTaken
    };

    this.simulatedIncidents.set(incidentId, incident);
    return incident;
  }

  // Execute remediation action
  remediate(incidentId, arch, aiEngine) {
    // If it's a simulated or chaos incident
    const simInc = this.simulatedIncidents.get(incidentId);
    if (simInc) {
      simInc.resolved = true;
      simInc.status = 'resolved';
      this.simulatedIncidents.delete(incidentId);
      this.resolvedIncidents.set(incidentId, simInc);
      return {
        success: true,
        incident: simInc,
        actionTaken: simInc.actionTaken || `Remediated incident on ${simInc.nodeId}`
      };
    }

    // If it's an architectural remediation (e.g., add_waf, add_db_replica, add_redis)
    let actionTaken = 'Remediation completed successfully.';
    if (incidentId === 'sec-waf-missing' && aiEngine) {
      aiEngine.addNode({
        id: 'waf',
        name: 'AWS WAF Shield',
        category: 'networking',
        specs: 'Managed WebACL Rules & IP Rate Limiting',
        monthlyCost: 25,
        isFreeTier: false
      });
      actionTaken = 'Attached AWS WAF Shield with Managed Rules to ingress path.';
    } else if (incidentId.startsWith('spof-db-') && aiEngine) {
      aiEngine.addNode({
        id: 'rds_replica',
        name: 'PostgreSQL Read Replica',
        category: 'database',
        specs: 'Multi-AZ Standby Sync (db.t4g.medium)',
        monthlyCost: 65,
        isFreeTier: false
      });
      actionTaken = 'Attached Multi-AZ synchronous read replica with automated failover.';
    } else if (incidentId === 'perf-cache-missing' && aiEngine) {
      aiEngine.addNode({
        id: 'redis',
        name: 'ElastiCache Redis',
        category: 'caching',
        specs: 'In-Memory Sub-ms Cluster (cache.t4g.medium)',
        monthlyCost: 35,
        isFreeTier: false
      });
      actionTaken = 'Provisioned in-memory Redis ElastiCache cluster; database load reduced by 78%.';
    } else if (incidentId === 'res-ec2-standalone' && aiEngine) {
      const ec2Node = arch.nodes.find(n => n.id === 'ec2');
      if (ec2Node) {
        ec2Node.name = 'Auto Scaling Group';
        ec2Node.isGroup = true;
        ec2Node.specs = 'Multi-AZ Fleet with Auto Scaling (2-10 instances)';
      }
      actionTaken = 'Converted standalone compute instance into an Auto Scaling Group.';
    }

    this.resolvedIncidents.set(incidentId, { id: incidentId, resolved: true, timestamp: 'Just now' });

    return {
      success: true,
      actionTaken
    };
  }

  analyzeLogEntry(logSnippet) {
    return {
      severity: logSnippet.toLowerCase().includes('error') ? 'high' : 'info',
      detectedError: 'Anomalous event analyzed by Clouderator Doctor',
      plainEnglishExplanation: 'Log analysis shows normal service operations with occasional transient retries handled by ALB exponential backoff.',
      recommendation: 'No immediate architectural intervention needed.'
    };
  }
}

module.exports = { AIDoctor };
