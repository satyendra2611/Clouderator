// Clouderator Infrastructure as Code (IaC) Generator
// Produces production-grade, syntactically valid Terraform (main.tf), Docker Compose (docker-compose.yml), and Kubernetes Manifests (k8s-manifest.yaml)
// Supports multi-cloud providers (AWS, GCP, Azure) and comprehensive service detection.

function detectServices(nodes = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      hasAny: false,
      hasCompute: false,
      hasDns: false,
      hasCdn: false,
      hasWaf: false,
      hasAlb: false,
      hasEks: false,
      hasEc2: false,
      hasEcs: false,
      hasLambda: false,
      hasRds: false,
      hasAurora: false,
      hasDynamo: false,
      hasRedis: false,
      hasS3: false,
      hasEfs: false,
      hasKafka: false,
      hasSqs: false,
      hasSns: false,
      hasEventBridge: false,
      hasWebSocket: false,
      hasApiGateway: false,
      hasOpenSearch: false,
      hasCognito: false,
      hasSecretsManager: false,
      hasKms: false,
      hasCloudWatch: false,
      hasCloudTrail: false,
      hasNat: false
    };
  }

  const textMatches = (regex) => nodes.some(n => {
    const raw = `${n.id || ''} ${n.name || ''} ${n.category || ''} ${n.type || ''} ${n.service || ''} ${n.specs || ''} ${n.description || ''}`;
    const text = raw.toLowerCase().replace(/[_.-]+/g, ' ');
    return regex.test(text);
  });

  const hasEks = textMatches(/\b(eks|kubernetes|k8s)\b/i) || nodes.some(n => n.id === 'eks' || n.type === 'eks');
  const hasEc2 = textMatches(/\b(ec2|virtual machine|instance|vm|lightsail|asg)\b/i) || nodes.some(n => n.id === 'ec2' || n.id?.startsWith('ec2') || n.type === 'ec2');
  const hasEcs = textMatches(/\b(ecs|fargate|container|docker)\b/i) || nodes.some(n => n.id === 'ecs' || n.id?.startsWith('ecs') || n.type === 'ecs');
  const hasLambda = textMatches(/\b(lambda|serverless|faas|function|worker)\b/i) || nodes.some(n => n.id === 'lambda' || n.id?.startsWith('lambda') || n.type === 'lambda');
  const hasOtherCompute = nodes.some(n => n.category === 'compute' && !hasEks && !hasEc2 && !hasEcs && !hasLambda);
  const effectiveEcs = hasEcs || hasOtherCompute;
  const hasCompute = hasEks || hasEc2 || effectiveEcs || hasLambda;

  const hasAlb = textMatches(/\b(alb|load\s*balancer|elb|ingress)\b/i) || nodes.some(n => n.id === 'alb');
  const hasDns = textMatches(/\b(dns|route\s*53|domain)\b/i) || nodes.some(n => n.id === 'dns' || n.id === 'route53');
  const hasCdn = textMatches(/\b(cdn|cloudfront|edge)\b/i) || nodes.some(n => n.id === 'cdn' || n.id === 'cloudfront');
  const hasWaf = textMatches(/\b(waf|shield|firewall)\b/i) || nodes.some(n => n.id === 'waf');

  const hasRds = (textMatches(/\b(rds|postgres|postgresql|mysql|mariadb|db_primary|sql|database)\b/i) && !textMatches(/\b(dynamo|nosql)\b/i)) || nodes.some(n => n.id === 'rds' || n.id === 'rds_primary' || n.id === 'db_primary' || n.id === 'aurora');
  const hasAurora = textMatches(/\baurora\b/i) || nodes.some(n => n.id === 'aurora');
  const hasDynamo = textMatches(/\b(dynamodb|dynamo|nosql|documentdb)\b/i) || nodes.some(n => n.id === 'dynamodb');
  const hasRedis = textMatches(/\b(redis|elasticache|caching|cache|memcached)\b/i) || nodes.some(n => n.id === 'redis' || n.category === 'caching');
  const hasS3 = textMatches(/\b(s3|bucket|storage|blob|glacier)\b/i) || nodes.some(n => n.id === 's3' || n.category === 'storage');
  const hasEfs = textMatches(/\b(efs|file\s*system|nfs)\b/i) || nodes.some(n => n.id === 'efs');

  const hasKafka = textMatches(/\b(kafka|msk|kinesis|event\s*stream|stream)\b/i) || nodes.some(n => n.id === 'kafka');
  const hasSqs = textMatches(/\b(sqs|queue|deadletter)\b/i) || nodes.some(n => n.id === 'sqs');
  const hasSns = textMatches(/\b(sns|notification|topic|pubsub|fanout)\b/i) || nodes.some(n => n.id === 'sns');
  const hasEventBridge = textMatches(/\b(eventbridge|events|bus)\b/i) || nodes.some(n => n.id === 'eventbridge');
  const hasWebSocket = textMatches(/\b(websocket|ws\b|live\s*tracking|telemetry)\b/i) || nodes.some(n => n.id === 'websocket');
  const hasApiGateway = textMatches(/\b(apigateway|api\s*gateway|rest\s*api|apigw)\b/i) || nodes.some(n => n.id === 'apigateway' || n.id === 'apigw');

  const hasOpenSearch = textMatches(/\b(opensearch|elasticsearch|elastic|search)\b/i) || nodes.some(n => n.id === 'opensearch');
  const hasCognito = textMatches(/\b(cognito|auth|identity|user\s*pool)\b/i) || nodes.some(n => n.id === 'cognito' || n.id === 'iam');
  const hasSecretsManager = textMatches(/\b(secretsmanager|secret|vault)\b/i) || nodes.some(n => n.id === 'secretsmanager');
  const hasKms = textMatches(/\b(kms|encryption|key|cmk)\b/i) || nodes.some(n => n.id === 'kms');
  const hasCloudWatch = textMatches(/\b(cloudwatch|monitoring|alarm|metric|logs)\b/i) || nodes.some(n => n.id === 'cloudwatch');
  const hasCloudTrail = textMatches(/\b(cloudtrail|audit\s*log|compliance)\b/i) || nodes.some(n => n.id === 'cloudtrail');
  const hasNat = textMatches(/\b(nat|nat\s*gateway|egress)\b/i) || nodes.some(n => n.id === 'nat');
  const hasAsg = (hasEc2 && hasAlb) || textMatches(/\b(asg|autoscaling|auto\s*scaling)\b/i) || nodes.some(n => n.id === 'asg' || n.type === 'asg');

  return {
    hasAny: true,
    hasCompute,
    hasDns,
    hasCdn,
    hasWaf,
    hasAlb,
    hasEks,
    hasEc2,
    hasAsg,
    hasEcs: effectiveEcs,
    hasLambda,
    hasRds,
    hasAurora,
    hasDynamo,
    hasRedis,
    hasS3,
    hasEfs,
    hasKafka,
    hasSqs,
    hasSns,
    hasEventBridge,
    hasWebSocket,
    hasApiGateway,
    hasOpenSearch,
    hasCognito,
    hasSecretsManager,
    hasKms,
    hasCloudWatch,
    hasCloudTrail,
    hasNat
  };
}

// -----------------------------------------------------------------------------
// 1. TERRAFORM GENERATOR (main.tf)
// -----------------------------------------------------------------------------
function generateTerraform(architecture) {
  const { projectName = 'Clouderator App', nodes = [], cloudProvider = 'aws' } = architecture || {};
  if (!nodes || nodes.length === 0) {
    return `# ==============================================================================
# No Architecture Provided
# Status: The canvas is currently empty (0 cloud services).
# ==============================================================================
# Please design or build your architecture on the Canvas or ask Clouderator AI
# in the Chat (e.g. "Build an e-commerce platform with ECS, RDS, and Redis").
# Clouderator will generate the exact Terraform (main.tf) code for your architecture.
`;
  }

  const provider = (cloudProvider || 'aws').toLowerCase();
  if (provider === 'gcp') {
    return generateGcpTerraform(architecture);
  } else if (provider === 'azure') {
    return generateAzureTerraform(architecture);
  } else {
    return generateAwsTerraform(architecture);
  }
}

// -----------------------------------------------------------------------------
// AWS TERRAFORM GENERATOR
// -----------------------------------------------------------------------------
function generateAwsTerraform(architecture) {
  const { projectName = 'Clouderator App', nodes = [] } = architecture || {};
  const cleanProj = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clouderator-app';
  const customDomain = architecture.customDomain;
  const svc = detectServices(nodes);

  return `# ==============================================================================
# Terraform Configuration generated by Clouderator AI Infrastructure OS
# Project: ${projectName}
# Provider: AWS (Multi-AZ High Availability Architecture)
# Generated At: ${new Date().toISOString()}
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# --- Input Variables ---
variable "aws_region" {
  description = "Target AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment stage environment"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name tag and naming prefix"
  type        = string
  default     = "${cleanProj}"
}

variable "domain_name" {
  description = "Public domain name (leave blank to associate .internal as a VPC private hosted zone)"
  type        = string
  default     = "${customDomain ? customDomain.domain : ""}"
}

# --- Provider Configuration ---
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      ManagedBy   = "Clouderator-AI"
      Project     = var.project_name
      Environment = var.environment
    }
  }
}

# ==============================================================================
# VPC & CORE NETWORKING INFRASTRUCTURE
# ==============================================================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project_name}-igw"
  }
}

resource "aws_subnet" "public_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "\${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-1a"
    Tier = "public"
  }
}

resource "aws_subnet" "public_1b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "\${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-1b"
    Tier = "public"
  }
}

resource "aws_subnet" "private_1a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "\${var.aws_region}a"

  tags = {
    Name = "\${var.project_name}-private-1a"
    Tier = "private"
  }
}

resource "aws_subnet" "private_1b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "\${var.aws_region}b"

  tags = {
    Name = "\${var.project_name}-private-1b"
    Tier = "private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "\${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_1a" {
  subnet_id      = aws_subnet.public_1a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_1b" {
  subnet_id      = aws_subnet.public_1b.id
  route_table_id = aws_route_table.public.id
}
${svc.hasNat ? `
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "\${var.project_name}-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1a.id

  tags = {
    Name = "\${var.project_name}-nat-gw"
  }
  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "\${var.project_name}-private-rt"
  }
}

resource "aws_route_table_association" "private_1a" {
  subnet_id      = aws_subnet.private_1a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_1b" {
  subnet_id      = aws_subnet.private_1b.id
  route_table_id = aws_route_table.private.id
}
` : ''}
# ==============================================================================
# SECURITY GROUPS (ZERO-TRUST NETWORK ISOLATION)
# ==============================================================================
${svc.hasAlb ? `
resource "aws_security_group" "alb_sg" {
  name        = "\${var.project_name}-alb-sg"
  description = "Security group for public Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-alb-sg"
  }
}
` : ''}${svc.hasCompute ? `
resource "aws_security_group" "compute_sg" {
  name        = "\${var.project_name}-compute-sg"
  description = "Security group for backend compute tier"
  vpc_id      = aws_vpc.main.id
${svc.hasAlb ? `
  ingress {
    description     = "Allow traffic from ALB on port 8080"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }
` : `
  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Allow app port 8080"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Allow SSH management"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
`}
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-compute-sg"
  }
}
` : ''}${svc.hasRds ? `
resource "aws_security_group" "db_sg" {
  name        = "\${var.project_name}-db-sg"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow database connections from application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    ${svc.hasCompute ? 'security_groups = [aws_security_group.compute_sg.id]' : 'cidr_blocks = [aws_vpc.main.cidr_block]'}
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-db-sg"
  }
}
` : ''}${svc.hasRedis ? `
resource "aws_security_group" "redis_sg" {
  name        = "\${var.project_name}-redis-sg"
  description = "Security group for Redis cache tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow Redis from application tier"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    ${svc.hasCompute ? 'security_groups = [aws_security_group.compute_sg.id]' : 'cidr_blocks = [aws_vpc.main.cidr_block]'}
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-redis-sg"
  }
}
` : ''}
${svc.hasEcs || svc.hasEks || svc.hasLambda ? `
# ==============================================================================
# IAM ROLES & POLICIES
# ==============================================================================

resource "aws_iam_role" "ecs_execution_role" {
  name = "\${var.project_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "ecs-tasks.amazonaws.com",
            "lambda.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = {
    Name = "\${var.project_name}-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
` : ''}
${svc.hasAlb ? `
# ==============================================================================
# APPLICATION LOAD BALANCER & INGRESS
# ==============================================================================

resource "aws_lb" "app_alb" {
  name               = "\${substr(var.project_name, 0, 28)}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1a.id, aws_subnet.public_1b.id]

  tags = {
    Name = "\${var.project_name}-alb"
  }
}
${svc.hasCompute ? `
resource "aws_lb_target_group" "ecs_tg" {
  name        = "\${substr(var.project_name, 0, 25)}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "${svc.hasEc2 ? 'instance' : 'ip'}"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200-299"
  }

  tags = {
    Name = "\${var.project_name}-compute-tg"
  }
}

# Default HTTP Listener (Port 80)
resource "aws_lb_listener" "http_80" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "${customDomain ? 'redirect' : 'forward'}"
    ${customDomain ? `redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }` : 'target_group_arn = aws_lb_target_group.ecs_tg.arn'}
  }
}
` : ''}
${customDomain ? `
# --- Route 53 Custom Domain & ACM SSL Certificate (${customDomain.domain}) ---
resource "aws_route53_zone" "primary" {
  name    = "${customDomain.domain}"
  comment = "Automated Custom Domain by Clouderator AI"
}

resource "aws_acm_certificate" "cert" {
  domain_name       = "${customDomain.domain}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "domain_alias" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "${customDomain.domain}"
  type    = "A"

  alias {
    name                   = aws_lb.app_alb.dns_name
    zone_id                = aws_lb.app_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_lb_listener" "https_443" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs_tg.arn
  }
}
` : (!customDomain && svc.hasDns ? `
# --- Route 53 DNS Hosted Zone (VPC Private Zone for .internal) ---
resource "aws_route53_zone" "primary" {
  name    = var.domain_name != "" ? var.domain_name : "\${var.project_name}.internal"
  comment = "DNS Zone managed by Clouderator AI"

  dynamic "vpc" {
    for_each = var.domain_name == "" ? [1] : []
    content {
      vpc_id = aws_vpc.main.id
    }
  }
}

resource "aws_route53_record" "app_record" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = var.domain_name != "" ? "app.\${var.domain_name}" : "app.\${aws_route53_zone.primary.name}"
  type    = "A"

  alias {
    name                   = aws_lb.app_alb.dns_name
    zone_id                = aws_lb.app_alb.zone_id
    evaluate_target_health = true
  }
}
` : '')}
` : (!svc.hasAlb && (customDomain || svc.hasDns) && svc.hasEc2 ? `
# --- Route 53 DNS Record to EC2 Instance ---
resource "aws_route53_zone" "primary" {
  name    = var.domain_name != "" ? var.domain_name : "\${var.project_name}.internal"
  comment = "DNS Zone managed by Clouderator AI"

  dynamic "vpc" {
    for_each = var.domain_name == "" ? [1] : []
    content {
      vpc_id = aws_vpc.main.id
    }
  }
}

resource "aws_route53_record" "app_record" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = var.domain_name != "" ? "app.\${var.domain_name}" : "app.\${var.project_name}.internal"
  type    = "A"
  ttl     = 300
  records = [aws_instance.app_server.public_ip]
}
` : '')}
# ==============================================================================
# COMPUTE TIER
# ==============================================================================
${svc.hasEks ? `
# --- Amazon EKS Managed Kubernetes Cluster ---
resource "aws_iam_role" "eks_cluster_role" {
  name = "\${var.project_name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "main" {
  name     = "\${var.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "standard-workers"
  node_role_arn   = aws_iam_role.ecs_execution_role.arn
  subnet_ids      = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]

  scaling_config {
    desired_size = 3
    max_size     = 6
    min_size     = 2
  }

  instance_types = ["t3.medium"]
}
` : (svc.hasEc2 ? (svc.hasAlb ? `
# --- EC2 Auto Scaling Group Fleet with ALB Target Group ---
resource "aws_launch_template" "app_lt" {
  name_prefix   = "\${var.project_name}-lt-"
  image_id      = "ami-0c7217cdde317cfec" # Amazon Linux 2023
  instance_type = "t3.medium"

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.compute_sg.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -e
              dnf update -y
              dnf install -y nodejs npm

              # Setup Application Directory
              mkdir -p /opt/app
              cat << 'APP_EOF' > /opt/app/server.js
              const http = require('http');
              const port = 8080;

              const server = http.createServer((req, res) => {
                if (req.url === '/health' || req.url === '/healthz') {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  service: 'clouderator-app',
                  status: 'running',
                  environment: process.env.NODE_ENV || 'production',
                  timestamp: new Date().toISOString()
                }));
              });

              server.listen(port, '0.0.0.0', () => {
                console.log('Production server listening on port ' + port);
              });
              APP_EOF

              # Systemd Service Definition
              cat << 'SERVICE_EOF' > /etc/systemd/system/clouderator-app.service
              [Unit]
              Description=Clouderator Production Application Service
              After=network.target

              [Service]
              Type=simple
              User=ec2-user
              WorkingDirectory=/opt/app
              ExecStart=/usr/bin/node /opt/app/server.js
              Restart=always
              RestartSec=5
              Environment=NODE_ENV=production
              Environment=PORT=8080

              [Install]
              WantedBy=multi-user.target
              SERVICE_EOF

              chown -R ec2-user:ec2-user /opt/app
              systemctl daemon-reload
              systemctl enable clouderator-app.service
              systemctl start clouderator-app.service
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = { Name = "\${var.project_name}-instance" }
  }
}

resource "aws_autoscaling_group" "app_asg" {
  desired_capacity    = 3
  max_size            = 8
  min_size            = 2
  target_group_arns   = [aws_lb_target_group.ecs_tg.arn]
  vpc_zone_identifier = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]

  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }
}
` : `
# --- Standalone Amazon EC2 Instance ---
resource "aws_instance" "app_server" {
  ami                         = "ami-0c7217cdde317cfec" # Amazon Linux 2023
  instance_type               = "t3.medium"
  subnet_id                   = aws_subnet.public_1a.id
  vpc_security_group_ids      = [aws_security_group.compute_sg.id]
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              set -e
              dnf update -y
              dnf install -y nodejs npm

              mkdir -p /opt/app
              cat << 'APP_EOF' > /opt/app/server.js
              const http = require('http');
              const port = 8080;

              const server = http.createServer((req, res) => {
                if (req.url === '/health' || req.url === '/healthz') {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  service: 'clouderator-app',
                  status: 'running',
                  timestamp: new Date().toISOString()
                }));
              });

              server.listen(port, '0.0.0.0', () => {
                console.log('Server listening on port ' + port);
              });
              APP_EOF

              cat << 'SERVICE_EOF' > /etc/systemd/system/clouderator-app.service
              [Unit]
              Description=Clouderator Standalone Application Service
              After=network.target

              [Service]
              Type=simple
              User=ec2-user
              WorkingDirectory=/opt/app
              ExecStart=/usr/bin/node /opt/app/server.js
              Restart=always
              RestartSec=5
              Environment=PORT=8080

              [Install]
              WantedBy=multi-user.target
              SERVICE_EOF

              chown -R ec2-user:ec2-user /opt/app
              systemctl daemon-reload
              systemctl enable clouderator-app.service
              systemctl start clouderator-app.service
              EOF

  tags = {
    Name = "\${var.project_name}-ec2"
  }
}
`) : (svc.hasEcs ? `
# --- ECS Cluster & Auto Scaling Fargate Service ---
resource "aws_ecs_cluster" "app_cluster" {
  name = "\${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app_task" {
  family                   = "\${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "2048" # 2 vCPU
  memory                   = "4096" # 4 GB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([{
    name      = "app"
    image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest"
    essential = true
    portMappings = [{ containerPort = 8080, hostPort = 8080 }]
    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "PORT", value = "8080" }
    ]
  }])
}

resource "aws_ecs_service" "app_service" {
  name            = "\${var.project_name}-service"
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]
    security_groups = [aws_security_group.compute_sg.id]
  }
${svc.hasAlb ? `
  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_tg.arn
    container_name   = "app"
    container_port   = 8080
  }
` : ''}
}
` : ''))}
${svc.hasLambda ? `
# --- AWS Lambda Serverless Worker ---
resource "aws_lambda_function" "worker" {
  function_name = "\${var.project_name}-serverless-worker"
  role          = aws_iam_role.ecs_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 30

  environment {
    variables = {
      NODE_ENV = var.environment
    }
  }
}
` : ''}
# ==============================================================================
# DATABASE & CACHING TIER
# ==============================================================================
${svc.hasRds ? `
# --- Amazon RDS PostgreSQL / MySQL Multi-AZ ---
resource "aws_db_subnet_group" "db_subnet" {
  name       = "\${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]

  tags = {
    Name = "\${var.project_name}-db-subnet"
  }
}

# Cryptographically Secure Master Password
resource "random_password" "db_password" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# AWS Secrets Manager Secret for DB Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "\${var.project_name}-db-credentials-\${var.environment}"
  description             = "Database master credentials managed securely by Clouderator AI"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_credentials_val" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    engine   = "postgres"
    host     = aws_db_instance.postgres_primary.address
    port     = aws_db_instance.postgres_primary.port
    username = aws_db_instance.postgres_primary.username
    password = random_password.db_password.result
    database = aws_db_instance.postgres_primary.db_name
  })
}

resource "aws_db_instance" "postgres_primary" {
  identifier             = "\${var.project_name}-rds-primary"
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.r6g.large"
  allocated_storage      = 100
  max_allocated_storage  = 500
  storage_type           = "gp3"
  multi_az               = true
  db_name                = "app_production_db"
  username               = "db_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = false
  deletion_protection    = true
}
` : ''}
${svc.hasDynamo ? `
# --- Amazon DynamoDB NoSQL Table ---
resource "aws_dynamodb_table" "app_table" {
  name         = "\${var.project_name}-records"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "\${var.project_name}-records"
  }
}
` : ''}
${svc.hasRedis ? `
# --- Amazon ElastiCache Redis High Availability Replication Group ---
resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "\${var.project_name}-redis-subnet"
  subnet_ids = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "\${substr(var.project_name, 0, 16)}-redis"
  description                = "High Availability Multi-AZ Redis Replication Group"
  node_type                  = "cache.t4g.medium"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet.name
  security_group_ids         = [aws_security_group.redis_sg.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false
  apply_immediately          = true
}
` : ''}
# ==============================================================================
# OBJECT STORAGE & FILE SYSTEMS
# ==============================================================================
${svc.hasS3 ? `
# --- Amazon S3 Object Storage Bucket ---
resource "aws_s3_bucket" "media_bucket" {
  bucket        = "\${var.project_name}-assets-\${var.environment}"
  force_destroy = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encrypt" {
  bucket = aws_s3_bucket.media_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media_block" {
  bucket = aws_s3_bucket.media_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
` : ''}
# ==============================================================================
# MESSAGING, STREAMING & ASYNC PIPELINES
# ==============================================================================
${svc.hasKafka ? `
# --- Apache Kafka (Amazon MSK 3-Broker Cluster) ---
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "\${var.project_name}-msk"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.large"
    client_subnets  = [aws_subnet.private_1a.id, aws_subnet.private_1b.id]
    security_groups = [aws_security_group.ecs_sg.id]
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
    }
  }
}
` : ''}
${svc.hasSqs ? `
# --- Amazon SQS Message Queue ---
resource "aws_sqs_queue" "app_dlq" {
  name                      = "\${var.project_name}-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "app_queue" {
  name                      = "\${var.project_name}-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.app_dlq.arn
    maxReceiveCount     = 3
  })
}
` : ''}
${svc.hasSns ? `
# --- Amazon SNS Notification Topic ---
resource "aws_sns_topic" "app_topic" {
  name = "\${var.project_name}-notifications"
}
` : ''}
${svc.hasWebSocket ? `
# --- AWS API Gateway WebSocket for Real-Time Telemetry ---
resource "aws_apigatewayv2_api" "websocket_api" {
  name                       = "\${var.project_name}-websocket-gw"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}
` : ''}
${svc.hasApiGateway ? `
# --- Amazon API Gateway REST API ---
resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "\${var.project_name}-rest-api"
  description = "Managed REST API Gateway for microservices routing"
}
` : ''}
# ==============================================================================
# EDGE ACCELERATION, SECURITY & OBSERVABILITY
# ==============================================================================
${svc.hasCdn ? `
# --- Amazon CloudFront Global Edge CDN ---
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Global CDN acceleration for \${var.project_name}"
  default_root_object = "index.html"

  origin {
    domain_name = ${svc.hasAlb ? 'aws_lb.app_alb.dns_name' : (svc.hasS3 ? 'aws_s3_bucket.media_bucket.bucket_regional_domain_name' : '"origin.internal"')}
    origin_id   = "${svc.hasAlb ? 'ALBOrigin' : (svc.hasS3 ? 'S3Origin' : 'CustomOrigin')}"

    ${svc.hasAlb ? `custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "${customDomain ? 'https-only' : 'http-only'}"
      origin_ssl_protocols   = ["TLSv1.2"]
    }` : (svc.hasS3 ? `custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }` : `custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "${customDomain ? 'https-only' : 'http-only'}"
      origin_ssl_protocols   = ["TLSv1.2"]
    }`)}
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${svc.hasAlb ? 'ALBOrigin' : (svc.hasS3 ? 'S3Origin' : 'CustomOrigin')}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
${svc.hasAlb ? `
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALBOrigin"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
` : ''}
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
` : ''}
${svc.hasWaf ? `
# --- AWS WAFv2 Web ACL (OWASP Top 10 & DDoS Protection) ---
resource "aws_wafv2_web_acl" "main_waf" {
  name        = "\${var.project_name}-waf"
  description = "Layer 7 security inspection rules"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRulesMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitPerIP"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitPerIPMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "MainWAFMetric"
    sampled_requests_enabled   = true
  }
}

${svc.hasAlb ? `
resource "aws_wafv2_web_acl_association" "alb_waf" {
  resource_arn = aws_lb.app_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.main_waf.arn
}
` : ''}
` : ''}
${svc.hasCognito ? `
# --- Amazon Cognito User Pool ---
resource "aws_cognito_user_pool" "users" {
  name = "\${var.project_name}-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "\${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.users.id
  generate_secret = false
}
` : ''}
${svc.hasSecretsManager && !svc.hasRds ? `
# --- AWS Secrets Manager ---
resource "random_password" "app_secret_token" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name = "\${var.project_name}-app-secrets-\${var.environment}"
}

resource "aws_secretsmanager_secret_version" "app_secrets_val" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    app_key = random_password.app_secret_token.result
  })
}
` : ''}
${svc.hasKms ? `
# --- AWS Key Management Service (KMS) ---
resource "aws_kms_key" "app_key" {
  description             = "KMS key for \${var.project_name} envelope encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}
` : ''}
${svc.hasOpenSearch ? `
# --- Amazon OpenSearch Managed Cluster ---
resource "aws_opensearch_domain" "search" {
  domain_name    = "\${substr(var.project_name, 0, 20)}-search"
  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = "t3.medium.search"
    instance_count = 2
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 20
    volume_type = "gp3"
  }
}
` : ''}
${svc.hasCloudWatch ? `
# --- Amazon CloudWatch Observability & Automated Alarms ---
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/clouderator/\${var.project_name}"
  retention_in_days = 30
}

${svc.hasAsg ? `
resource "aws_cloudwatch_metric_alarm" "asg_cpu_high" {
  alarm_name          = "\${var.project_name}-asg-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when EC2 ASG average CPU utilization exceeds 80%"
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_asg.name
  }
}
` : ''}${svc.hasEc2 && !svc.hasAsg ? `
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "\${var.project_name}-ec2-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when EC2 instance CPU utilization exceeds 80%"
  dimensions = {
    InstanceId = aws_instance.app_server.id
  }
}
` : ''}${svc.hasEcs ? `
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "\${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when ECS task CPU exceeds 80% for 2 consecutive minutes"
  dimensions = {
    ClusterName = aws_ecs_cluster.app_cluster.name
    ServiceName = aws_ecs_service.app_service.name
  }
}
` : ''}${svc.hasAlb ? `
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "\${var.project_name}-alb-high-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alarm when target group returns more than 10 5XX errors within 1 minute"
  dimensions = {
    LoadBalancer = aws_lb.app_alb.arn_suffix
    TargetGroup  = aws_lb_target_group.ecs_tg.arn_suffix
  }
}
` : ''}${svc.hasRds ? `
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "\${var.project_name}-rds-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when RDS primary CPU utilization exceeds 80%"
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres_primary.identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "\${var.project_name}-rds-storage-low"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5000000000 # 5 GB in bytes
  alarm_description   = "Alarm when RDS free storage drops below 5GB"
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres_primary.identifier
  }
}
` : ''}${!svc.hasAsg && !svc.hasEc2 && !svc.hasEcs && !svc.hasAlb && !svc.hasRds ? `
resource "aws_cloudwatch_metric_alarm" "general_logs_spike" {
  alarm_name          = "\${var.project_name}-logs-spike"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "IncomingLogEvents"
  namespace           = "AWS/Logs"
  period              = 60
  statistic           = "Sum"
  threshold           = 50000
  alarm_description   = "Alarm on unexpected surge of incoming log volume"
}
` : ''}
` : ''}
# ==============================================================================
# TERRAFORM OUTPUTS
# ==============================================================================

output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = aws_vpc.main.id
}
${svc.hasAlb ? `
output "load_balancer_dns" {
  description = "Public URL endpoint of Application Load Balancer"
  value       = "http://\${aws_lb.app_alb.dns_name}"
}
` : ''}${svc.hasEc2 && !svc.hasAlb ? `
output "ec2_public_ip" {
  description = "Public IP address of the primary EC2 instance"
  value       = aws_instance.app_server.public_ip
}
` : ''}${svc.hasLambda ? `
output "lambda_worker_arn" {
  description = "ARN of the Lambda serverless worker function"
  value       = aws_lambda_function.worker.arn
}
` : ''}${svc.hasS3 ? `
output "s3_bucket_name" {
  description = "The name of the primary S3 storage bucket"
  value       = aws_s3_bucket.media_bucket.id
}
` : ''}${svc.hasRds ? `
output "database_endpoint" {
  description = "Endpoint address of the primary PostgreSQL RDS instance"
  value       = aws_db_instance.postgres_primary.endpoint
}

output "database_secret_arn" {
  description = "AWS Secrets Manager ARN storing database master credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
` : ''}${svc.hasRedis ? `
output "redis_cache_endpoint" {
  description = "Redis cluster primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}
` : ''}${svc.hasKafka ? `
output "kafka_bootstrap_brokers" {
  description = "Bootstrap brokers for Amazon MSK Kafka cluster"
  value       = aws_msk_cluster.kafka.bootstrap_brokers
}
` : ''}${svc.hasCdn ? `
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}
` : ''}`;
}

// -----------------------------------------------------------------------------
// GCP TERRAFORM GENERATOR
// -----------------------------------------------------------------------------
function generateGcpTerraform(architecture) {
  const { projectName = 'Clouderator App', nodes = [] } = architecture || {};
  const cleanProj = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clouderator-app';
  const svc = detectServices(nodes);

  return `# ==============================================================================
# Terraform Configuration generated by Clouderator AI Infrastructure OS
# Project: ${projectName}
# Provider: Google Cloud Platform (GCP)
# Generated At: ${new Date().toISOString()}
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "gcp_project" {
  description = "GCP Project ID"
  type        = string
  default     = "${cleanProj}-gcp"
}

variable "gcp_region" {
  description = "Primary GCP region"
  type        = string
  default     = "us-central1"
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

# --- VPC & Subnetwork ---
resource "google_compute_network" "vpc" {
  name                    = "${cleanProj}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${cleanProj}-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.gcp_region
  network       = google_compute_network.vpc.id
}

# --- Cloud Run Serverless Microservice ---
resource "google_cloud_run_service" "app" {
  name     = "${cleanProj}-service"
  location = var.gcp_region

  template {
    spec {
      containers {
        image = "gcr.io/\${var.gcp_project}/app:latest"
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_service.app.location
  service  = google_cloud_run_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
${svc.hasRds ? `
# --- Cloud SQL PostgreSQL ---
resource "google_sql_database_instance" "postgres" {
  name             = "${cleanProj}-db"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL"
  }
}
` : ''}${svc.hasRedis ? `
# --- Google Cloud Memorystore (Redis) ---
resource "google_redis_instance" "cache" {
  name           = "${cleanProj}-cache"
  tier           = "STANDARD_HA"
  memory_size_gb = 5
  region         = var.gcp_region
}
` : ''}${svc.hasS3 ? `
# --- Google Cloud Storage (GCS) Bucket ---
resource "google_storage_bucket" "bucket" {
  name          = "\${var.gcp_project}-assets"
  location      = "US"
  force_destroy = false
}
` : ''}
output "service_url" {
  value = google_cloud_run_service.app.status[0].url
}
`;
}

// -----------------------------------------------------------------------------
// AZURE TERRAFORM GENERATOR
// -----------------------------------------------------------------------------
function generateAzureTerraform(architecture) {
  const { projectName = 'Clouderator App', nodes = [] } = architecture || {};
  const cleanProj = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clouderator-app';
  const svc = detectServices(nodes);

  return `# ==============================================================================
# Terraform Configuration generated by Clouderator AI Infrastructure OS
# Project: ${projectName}
# Provider: Microsoft Azure
# Generated At: ${new Date().toISOString()}
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "azure_location" {
  type    = string
  default = "East US"
}

resource "azurerm_resource_group" "rg" {
  name     = "${cleanProj}-rg"
  location = var.azure_location
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${cleanProj}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "${cleanProj}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# --- Azure App Service Plan & Container Web App ---
resource "azurerm_service_plan" "plan" {
  name                = "${cleanProj}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "P1v2"
}

resource "azurerm_linux_web_app" "app" {
  name                = "${cleanProj}-webapp"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_service_plan.plan.location
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    always_on = true
  }
}
${svc.hasRds ? `
# --- Azure Database for PostgreSQL Flexible Server ---
resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "${cleanProj}-psql"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "15"
  administrator_login    = "psqladmin"
  administrator_password = "ClouderatorAzure2026!"
  zone                   = "1"
  storage_mb             = 32768
  sku_name               = "GP_Standard_D2s_v3"
}
` : ''}${svc.hasRedis ? `
# --- Azure Cache for Redis ---
resource "azurerm_redis_cache" "cache" {
  name                = "${cleanProj}-redis"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  capacity            = 2
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
}
` : ''}${svc.hasS3 ? `
# --- Azure Blob Storage Account ---
resource "azurerm_storage_account" "storage" {
  name                     = "${cleanProj.replace(/-/g, '').slice(0, 20)}store"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
}
` : ''}
output "webapp_url" {
  value = "https://\${azurerm_linux_web_app.app.default_hostname}"
}
`;
}

// -----------------------------------------------------------------------------
// 2. DOCKER COMPOSE GENERATOR (docker-compose.yml)
// -----------------------------------------------------------------------------
function generateDockerCompose(architecture) {
  const { projectName = 'Clouderator App', nodes = [] } = architecture || {};
  if (!nodes || nodes.length === 0) {
    return `# ==============================================================================
# No Architecture Provided
# Status: The canvas is currently empty (0 cloud services).
# ==============================================================================
# Please add services to your architecture canvas to generate a docker-compose.yml file.
`;
  }
  const svc = detectServices(nodes);

  // Dynamically compute dependencies and env vars based on actual architecture
  const dependsOn = [];
  if (svc.hasRds || svc.hasAurora) dependsOn.push('postgres');
  if (svc.hasRedis) dependsOn.push('redis');
  if (svc.hasS3) dependsOn.push('localstack');
  if (svc.hasKafka) dependsOn.push('kafka');
  if (svc.hasDynamo) dependsOn.push('dynamodb-local');

  const envVars = ['PORT=8080'];
  if (svc.hasRds || svc.hasAurora) envVars.push('DATABASE_URL=postgres://clouderator:secret123@postgres:5432/app_db');
  if (svc.hasRedis) envVars.push('REDIS_URL=redis://redis:6379');
  if (svc.hasS3) envVars.push('S3_ENDPOINT=http://localstack:4566');
  if (svc.hasKafka) envVars.push('KAFKA_BROKERS=kafka:9092');
  if (svc.hasDynamo) envVars.push('DYNAMODB_ENDPOINT=http://dynamodb-local:8000');

  let servicesYaml = '';

  if (svc.hasCompute || nodes.length > 0) {
    servicesYaml += `  app-server-1:
    image: node:20-alpine
    container_name: clouderator-app-1
    working_dir: /usr/src/app
    command: npm start
    ports:
      - "8081:8080"
    environment:
${envVars.map(e => `      - ${e}`).join('\n')}
${dependsOn.length > 0 ? `    depends_on:
${dependsOn.map(d => `      - ${d}`).join('\n')}` : ''}
`;
    if (svc.hasAlb) {
      servicesYaml += `
  app-server-2:
    image: node:20-alpine
    container_name: clouderator-app-2
    working_dir: /usr/src/app
    command: npm start
    ports:
      - "8082:8080"
    environment:
${envVars.map(e => `      - ${e}`).join('\n')}
${dependsOn.length > 0 ? `    depends_on:
${dependsOn.map(d => `      - ${d}`).join('\n')}` : ''}

  nginx-lb:
    image: nginx:alpine
    container_name: clouderator-load-balancer
    ports:
      - "80:80"
    depends_on:
      - app-server-1
      - app-server-2
`;
    }
  }

  if (svc.hasRds || svc.hasAurora) {
    servicesYaml += `
  postgres:
    image: postgres:16-alpine
    container_name: clouderator-postgres
    environment:
      POSTGRES_USER: clouderator
      POSTGRES_PASSWORD: secret123
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
`;
  }

  if (svc.hasRedis) {
    servicesYaml += `
  redis:
    image: redis:7-alpine
    container_name: clouderator-redis
    ports:
      - "6379:6379"
`;
  }

  if (svc.hasS3) {
    servicesYaml += `
  localstack:
    image: localstack/localstack:latest
    container_name: clouderator-localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3
`;
  }

  if (svc.hasKafka) {
    servicesYaml += `
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: clouderator-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: clouderator-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
`;
  }

  if (svc.hasDynamo) {
    servicesYaml += `
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: clouderator-dynamodb
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb"
`;
  }

  if (svc.hasLambda) {
    servicesYaml += `
  lambda-worker:
    image: node:20-alpine
    container_name: clouderator-lambda-worker
    command: node -e "setInterval(() => console.log('Lambda worker listening for event streams...'), 5000)"
`;
  }

  const hasVolumes = svc.hasRds || svc.hasAurora;

  return `# ==============================================================================
# Local Sandbox Environment generated by Clouderator AI
# Project: ${projectName}
# Services on Canvas: ${nodes.map(n => n.name || n.id).join(', ')}
# Run with: docker compose up -d
# ==============================================================================

version: '3.8'

services:
${servicesYaml}${hasVolumes ? `
volumes:
  postgres_data:
` : ''}`;
}

// -----------------------------------------------------------------------------
// 3. KUBERNETES MANIFEST GENERATOR (k8s-manifest.yaml)
// -----------------------------------------------------------------------------
function generateKubernetesManifest(architecture) {
  const { projectName = 'Clouderator App', nodes = [] } = architecture || {};
  if (!nodes || nodes.length === 0) {
    return `# ==============================================================================
# No Architecture Provided
# Status: The canvas is currently empty (0 cloud services).
# ==============================================================================
# Please add services to your architecture canvas to generate Kubernetes manifests.
`;
  }
  const cleanProj = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clouderator';
  const customDomain = architecture.customDomain;
  const svc = detectServices(nodes);

  let manifests = [];

  if (svc.hasCompute || nodes.length > 0) {
    manifests.push(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanProj}-deployment
  labels:
    app: ${cleanProj}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${cleanProj}
  template:
    metadata:
      labels:
        app: ${cleanProj}
    spec:
      containers:
      - name: backend
        image: ${cleanProj}/backend:v1.0.0
        resources:
          limits:
            cpu: "2000m"
            memory: "4096Mi"
          requests:
            cpu: "500m"
            memory: "1024Mi"
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10`);

    manifests.push(`apiVersion: v1
kind: Service
metadata:
  name: ${cleanProj}-service
spec:
  type: ${svc.hasAlb ? 'NodePort' : 'LoadBalancer'}
  selector:
    app: ${cleanProj}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080`);
  }

  if (svc.hasAlb || customDomain || svc.hasDns) {
    manifests.push(`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${cleanProj}-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    kubernetes.io/ingress.class: "nginx"
spec:
  tls:
  - hosts:
    - ${customDomain ? customDomain.domain : `${cleanProj}.internal`}
    secretName: ${cleanProj}-tls-cert
  rules:
  - host: ${customDomain ? customDomain.domain : `${cleanProj}.internal`}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${cleanProj}-service
            port:
              number: 80}`);
  }

  if (svc.hasKafka) {
    manifests.push(`apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka-broker
spec:
  serviceName: "kafka"
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
      - name: kafka
        image: confluentinc/cp-kafka:7.5.0
        ports:
        - containerPort: 9092`);
  }

  if (svc.hasRedis) {
    manifests.push(`apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cache
spec:
  serviceName: "redis"
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379`);
  }

  return `# ==============================================================================
# Kubernetes Manifests generated by Clouderator AI
# Project: ${projectName}
# Services on Canvas: ${nodes.map(n => n.name || n.id).join(', ')}
# ==============================================================================

${manifests.join('\n---\n')}
`;
}

module.exports = {
  detectServices,
  generateTerraform,
  generateDockerCompose,
  generateKubernetesManifest
};
