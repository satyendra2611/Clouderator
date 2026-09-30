// Clouderator Cost Intelligence & Payment Tier Engine

const SERVICE_PRICING = {
  // Networking
  route53: { base: 1.50, unit: 'hosted zone + queries', label: 'Route53 DNS' },
  cloudfront: { base: 18.00, perUserFactor: 0.0002, label: 'CloudFront CDN' },
  alb: { base: 28.50, lcuFactor: 0.008, label: 'Application Load Balancer' },
  apiGatewayWs: { base: 12.00, perConnectionFactor: 0.0003, label: 'WebSocket API Gateway' },

  // Compute
  ecsFargate: { basePerInstance: 48.00, vCpu: 2, ramGb: 4, label: 'ECS / Fargate App Server' },
  lambda: { base: 5.00, invocationFactor: 0.00002, label: 'Serverless Functions' },

  // Database
  rdsPostgresMultiAz: { base: 185.00, storageGb: 100, storageRate: 0.115, label: 'PostgreSQL (RDS Multi-AZ)' },
  rdsReadReplica: { base: 92.50, label: 'PostgreSQL Read Replica (RDS)' },
  dynamodb: { base: 15.00, label: 'DynamoDB NoSQL' },

  // Caching
  elasticacheRedis: { base: 45.00, label: 'Redis (ElastiCache)' },

  // Storage
  s3: { base: 12.00, storageGb: 250, perGbRate: 0.023, label: 'S3 (Media Storage)' }
};

function calculateArchitectureCost(architectureState) {
  const { nodes = [], userScale = 50000, costReductionPct = 0, cloudProvider = 'aws' } = architectureState;

  let breakdown = [];
  let totalBase = 0;

  nodes.forEach(node => {
    let cost = 0;
    let description = '';
    const id = node.id;
    const type = node.type || node.category;

    switch (id) {
      case 'dns':
      case 'route53':
        cost = 0.50 + (userScale / 20000) * 0.40;
        description = 'Route 53 Hosted Zone + Query routing';
        break;
      case 'cdn':
      case 'cloudfront':
        cost = 8.50 + (userScale * 0.00018);
        description = 'CloudFront Edge bandwidth & SSL offload';
        break;
      case 'alb':
      case 'load_balancer':
        cost = 16.00 + (userScale * 0.00015);
        description = 'Application Load Balancer (Layer 7 routing)';
        break;
      case 'ec2':
      case 'compute_instance':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 15.00;
        description = 'Amazon EC2 (t3.micro, Free Tier Eligible)';
        break;
      case 'lambda':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 0.20;
        description = 'AWS Lambda (1M free req/mo)';
        break;
      case 'asg':
      case 'app_servers': {
        const count = node.instanceCount || 3;
        const instanceType = node.instanceType || 'Fargate (2 vCPU, 4GB RAM)';
        const unitCost = node.isGraviton ? 38.00 : 48.00;
        cost = count * unitCost;
        description = `${count}x ${instanceType}`;
        break;
      }
      case 'ecs':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 42.00;
        description = 'Amazon ECS Fargate Container Tasks';
        break;
      case 'eks':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 73.00;
        description = 'Amazon EKS Managed Kubernetes Cluster';
        break;
      case 'websocket':
        cost = 15.00 + (userScale * 0.00018);
        description = 'Active connection hours & message volume';
        break;
      case 'redis':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 18.00;
        description = 'ElastiCache Redis (cache.t3.micro, Free Tier)';
        break;
      case 'rds_primary':
      case 'rds':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 17.50;
        description = 'Amazon RDS (PostgreSQL/MySQL, db.t3.micro Free Tier)';
        break;
      case 'rds_replica':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 92.50;
        description = 'db.r6g.large Read Replica (Single-AZ)';
        break;
      case 'dynamodb':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 0.00;
        description = 'Amazon DynamoDB (25GB Free Tier Always)';
        break;
      case 'aurora':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 45.00;
        description = 'Amazon Aurora Serverless v2 Cluster';
        break;
      case 's3':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 2.50;
        description = 'Amazon S3 Standard (5GB Free Tier)';
        break;
      case 'glacier':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 0.80;
        description = 'S3 Glacier Flexible Cold Archive';
        break;
      case 'sqs':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 0.40;
        description = 'Amazon SQS FIFO/Standard (1M free req/mo)';
        break;
      case 'sns':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 0.50;
        description = 'Amazon SNS Pub/Sub (1M free publishes/mo)';
        break;
      case 'kafka':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 140.00;
        description = 'Apache Kafka (Amazon MSK 3-Broker Cluster)';
        break;
      case 'waf':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 30.00;
        description = 'AWS WAF & Shield Layer 7 Defense';
        break;
      case 'cognito':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 0.00;
        description = 'Amazon Cognito (50,000 MAUs Always Free)';
        break;
      case 'iam':
        cost = 0.00;
        description = 'AWS IAM Role-Based Access Control (100% Free)';
        break;
      case 'secretsmanager':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 1.60;
        description = 'AWS Secrets Manager Encrypted Vault';
        break;
      case 'cloudwatch':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 3.00;
        description = 'Amazon CloudWatch Observability & Alarms';
        break;
      case 'opensearch':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 75.00;
        description = 'Amazon OpenSearch Service Analytics Engine';
        break;
      case 'bedrock':
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 10.00;
        description = 'Amazon Bedrock GenAI Unified Foundation Models';
        break;
      default:
        cost = node.monthlyCost !== undefined ? node.monthlyCost : 20.00;
        description = node.specs || 'Managed cloud service';
        break;
    }

    // Apply cloud provider multipliers
    if (cloudProvider === 'gcp') cost *= 0.96;
    if (cloudProvider === 'azure') cost *= 1.02;

    cost = Math.round(cost * 100) / 100;
    totalBase += cost;

    breakdown.push({
      nodeId: node.id,
      name: node.label || node.name,
      category: node.category,
      monthlyCost: cost,
      description
    });
  });

  // If no nodes exist on the canvas, return clean zero-cost state
  if (!nodes || nodes.length === 0) {
    return {
      currency: 'USD',
      monthlyTotal: 0,
      previousMonthly: 0,
      percentChange: 0,
      breakdown: [],
      hasServices: false,
      activePaymentPlan: architectureState.activePaymentPlan || 'onDemand',
      paymentTiers: {
        onDemand: {
          label: 'Pay As You Go (On-Demand)',
          monthly: 0,
          annual: 0,
          savings: '0%',
          commitment: 'No commitment, cancel anytime'
        },
        oneYearSavings: {
          label: '1-Year Compute Savings Plan (Recommended)',
          monthly: 0,
          annual: 0,
          savings: '22% off On-Demand',
          commitment: '1-year commitment with monthly billing'
        },
        threeYearReserved: {
          label: '3-Year Standard Reserved Plan',
          monthly: 0,
          annual: 0,
          savings: '48% off On-Demand',
          commitment: '3-year commitment for maximum ROI'
        }
      },
      recommendations: []
    };
  }

  // Calculate actual totals from provisioned services
  totalBase = Math.round(totalBase * 100) / 100;
  const reduction = costReductionPct > 0 ? costReductionPct : 0;
  const discountedTotal = reduction > 0 ? Math.round(totalBase * (1 - (reduction / 100)) * 100) / 100 : totalBase;
  const onDemandMonthly = discountedTotal;
  const baseMonthly = totalBase;
  const activePlan = architectureState.activePaymentPlan || 'onDemand';

  // Payment Tiers calculation based on ACTUAL calculated service cost
  const oneYearSavingsMonthly = Math.round(onDemandMonthly * 0.78 * 100) / 100; // 22% discount
  const threeYearReservedMonthly = Math.round(onDemandMonthly * 0.52 * 100) / 100; // 48% discount

  // Dynamically generate recommendations based on active canvas nodes
  const recommendations = [];

  const hasCompute = nodes.some(n => ['ec2', 'asg', 'ecs', 'eks', 'app_servers', 'compute_instance'].includes(n.id) || (n.category === 'compute'));
  if (hasCompute) {
    const computeSavings = Math.max(25, Math.round(totalBase * 0.15));
    recommendations.push({
      id: 'rec_graviton',
      title: 'Migrate Compute to AWS Graviton 3 (ARM64)',
      potentialSavingsMonthly: computeSavings,
      difficulty: 'Low',
      impact: 'Up to 20% better price-performance with zero downtime.'
    });
  }

  const hasS3 = nodes.some(n => n.id === 's3' || n.category === 'storage');
  if (hasS3) {
    const s3Savings = Math.max(12, Math.round(totalBase * 0.06));
    recommendations.push({
      id: 'rec_s3_tiering',
      title: 'Enable S3 Intelligent-Tiering',
      potentialSavingsMonthly: s3Savings,
      difficulty: 'Instant',
      impact: 'Automatically moves older media files to Archive Instant Access.'
    });
  }

  const hasDatabase = nodes.some(n => ['rds', 'rds_primary', 'rds_replica', 'aurora'].includes(n.id) || (n.category === 'database'));
  if (hasDatabase) {
    const dbSavings = Math.max(30, Math.round(totalBase * 0.12));
    recommendations.push({
      id: 'rec_db_scaling',
      title: 'Scale down Read Replica during non-peak hours (12 AM - 6 AM)',
      potentialSavingsMonthly: dbSavings,
      difficulty: 'Medium',
      impact: 'Saves 50% on secondary database instance hours.'
    });
  }

  const hasDynamo = nodes.some(n => n.id === 'dynamodb');
  if (hasDynamo) {
    recommendations.push({
      id: 'rec_dynamo_ondemand',
      title: 'Switch DynamoDB to On-Demand Auto-Scaling',
      potentialSavingsMonthly: 15,
      difficulty: 'Instant',
      impact: 'Eliminates provisioned capacity overpayment during low-traffic periods.'
    });
  }

  const hasCdn = nodes.some(n => ['cdn', 'cloudfront'].includes(n.id) || n.category === 'network');
  if (hasCdn) {
    recommendations.push({
      id: 'rec_cf_compression',
      title: 'Enable CloudFront Brotli/Gzip Edge Compression',
      potentialSavingsMonthly: 18,
      difficulty: 'Low',
      impact: 'Reduces edge egress data transfer fees by 24%.'
    });
  }

  if (recommendations.length === 0 && totalBase > 50) {
    recommendations.push({
      id: 'rec_vpc_endpoints',
      title: 'Consolidate Multi-AZ Egress with AWS VPC Endpoints',
      potentialSavingsMonthly: 28,
      difficulty: 'Medium',
      impact: 'Avoids public internet NAT gateway data processing surcharges.'
    });
  }

  const effectiveMonthlyTotal = activePlan === 'oneYearSavings' ? oneYearSavingsMonthly :
                                activePlan === 'threeYearReserved' ? threeYearReservedMonthly : onDemandMonthly;

  return {
    currency: 'USD',
    monthlyTotal: effectiveMonthlyTotal,
    baseMonthly,
    onDemandMonthly,
    previousMonthly: baseMonthly,
    percentChange: -reduction,
    breakdown,
    hasServices: true,
    activePaymentPlan: activePlan,
    paymentTiers: {
      onDemand: {
        label: 'Pay As You Go (On-Demand)',
        monthly: onDemandMonthly,
        annual: Math.round(onDemandMonthly * 12 * 100) / 100,
        savings: '0%',
        commitment: 'No commitment, cancel anytime',
        isActive: activePlan === 'onDemand'
      },
      oneYearSavings: {
        label: '1-Year Compute Savings Plan (Recommended)',
        monthly: oneYearSavingsMonthly,
        annual: Math.round(oneYearSavingsMonthly * 12 * 100) / 100,
        savings: '22% off On-Demand',
        commitment: '1-year commitment with monthly billing',
        isActive: activePlan === 'oneYearSavings'
      },
      threeYearReserved: {
        label: '3-Year Standard Reserved Plan',
        monthly: threeYearReservedMonthly,
        annual: Math.round(threeYearReservedMonthly * 12 * 100) / 100,
        savings: '48% off On-Demand',
        commitment: '3-year commitment for maximum ROI',
        isActive: activePlan === 'threeYearReserved'
      }
    },
    recommendations
  };
}

module.exports = {
  calculateArchitectureCost,
  SERVICE_PRICING
};
