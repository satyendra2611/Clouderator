// Clouderator Interactive Architecture Canvas Engine
// Mathematical tier alignment (Zero Overlap), SVG energetic pulses, interactive filtering, and diagram export

class ArchitectureCanvas {
  constructor(viewportId, svgLayerId, nodesLayerId) {
    this.viewport = document.getElementById(viewportId);
    this.svgLayer = document.getElementById(svgLayerId);
    this.nodesLayer = document.getElementById(nodesLayerId);
    
    this.architecture = null;
    this.selectedNodeId = null;
    this.activeFilterCategory = null;
    this.activeIncidents = new Set();
    this.scale = 1.0;
    this.isDraggingNode = false;
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };
    
    // Background canvas panning state
    this.isPanning = false;
    this.panStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };
    
    this.initEvents();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.render();
    });

    // Handle both node dragging and background canvas panning
    this.viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, select, textarea, .node-inspector, .canvas-legend, .floating-tools, .canvas-header-bar, .empty-prompt-chip')) {
        return;
      }

      const nodeEl = e.target.closest('.canvas-node, .asg-container-node');
      if (nodeEl) {
        this.isDraggingNode = true;
        this.draggedNode = nodeEl;
        const rect = nodeEl.getBoundingClientRect();
        this.dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        e.stopPropagation();
      } else {
        // Canvas background pan
        this.isPanning = true;
        this.panStart = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: this.viewport.scrollLeft,
          scrollTop: this.viewport.scrollTop
        };
        this.viewport.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingNode && this.draggedNode) {
        const viewportRect = this.viewport.getBoundingClientRect();
        let newX = (e.clientX - viewportRect.left + this.viewport.scrollLeft - this.dragOffset.x) / this.scale;
        let newY = (e.clientY - viewportRect.top + this.viewport.scrollTop - this.dragOffset.y) / this.scale;

        const maxW = Math.max(this.viewport.scrollWidth, this.nodesLayer.offsetWidth || 1140);
        const maxH = Math.max(this.viewport.scrollHeight, this.nodesLayer.offsetHeight || 900);

        newX = Math.max(10, Math.min(maxW - 200, newX));
        newY = Math.max(10, Math.min(maxH - 90, newY));

        this.draggedNode.style.left = `${newX}px`;
        this.draggedNode.style.top = `${newY}px`;

        const nodeId = this.draggedNode.dataset.id;
        if (this.architecture) {
          const nodeData = this.architecture.nodes.find(n => n.id === nodeId);
          if (nodeData) {
            nodeData.x = newX;
            nodeData.y = newY;
            nodeData._customPos = true;
          }
        }
        this.renderConnections();
      } else if (this.isPanning) {
        const dx = e.clientX - this.panStart.x;
        const dy = e.clientY - this.panStart.y;
        this.viewport.scrollLeft = this.panStart.scrollLeft - dx;
        this.viewport.scrollTop = this.panStart.scrollTop - dy;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingNode) {
        this.isDraggingNode = false;
        this.draggedNode = null;
      }
      if (this.isPanning) {
        this.isPanning = false;
        this.viewport.style.cursor = 'grab';
      }
    });

    // Node inspector close button
    const closeBtn = document.getElementById('closeInspectorBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('nodeInspector').classList.add('hidden');
        if (this.selectedNodeId) {
          const prev = document.querySelector(`[data-id="${this.selectedNodeId}"]`);
          if (prev) prev.classList.remove('selected');
          this.selectedNodeId = null;
        }
      });
    }
  }

  setArchitecture(arch) {
    this.architecture = arch;
    this.render();
  }

  // Visual mathematical tier calculation with generous breathing room (NO OVERLAP)
  calculateLayoutPositions() {
    const minCanvasWidth = 1140;
    const viewportWidth = Math.max(minCanvasWidth, this.viewport.clientWidth || minCanvasWidth);
    const centerX = viewportWidth / 2;

    // Fixed master coordinate map for standard core infrastructure (180px card width, 320px ASG)
    // Starting y at 80px provides comfortable clearance under the top floating toolbar (58px)
    const baseMap = {
      // Tier 1: Global Ingress, DNS & Identity
      dns: { x: centerX - 90, y: 80 },
      route53: { x: centerX - 90, y: 80 },
      iam: { x: centerX - 310, y: 80 },
      cognito: { x: centerX + 130, y: 80 },

      // Tier 2: Edge Delivery & Perimeter Defense
      waf: { x: centerX - 310, y: 175 },
      cdn: { x: centerX - 90, y: 175 },
      cloudfront: { x: centerX - 90, y: 175 },
      nat: { x: centerX + 130, y: 175 },
      bedrock: { x: centerX + 320, y: 175 },

      // Tier 3: Core Ingress, Routing & Serverless Gateway
      alb: { x: centerX - 90, y: 270 },
      apigateway: { x: centerX - 310, y: 270 },
      apigw: { x: centerX - 310, y: 270 },
      api_gateway: { x: centerX - 310, y: 270 },
      beanstalk: { x: centerX - 160, y: 270 },
      cloudwatch: { x: centerX + 320, y: 270 },

      // Tier 4: Real-time, Compute & Caching Layer
      websocket: { x: centerX - 380, y: 380 },
      asg: { x: centerX - 160, y: 380 },
      ec2: { x: centerX - 160, y: 380 },
      ecs: { x: centerX - 160, y: 380 },
      eks: { x: centerX - 160, y: 380 },
      lightsail: { x: centerX - 160, y: 380 },
      lambda: { x: centerX - 160, y: 380 },
      redis: { x: centerX + 195, y: 380 },
      sqs: { x: centerX - 380, y: 480 },
      sns: { x: centerX - 380, y: 575 },
      eventbridge: { x: centerX - 380, y: 665 },
      stepfunctions: { x: centerX - 380, y: 755 },
      kafka: { x: centerX + 195, y: 480 },
      opensearch: { x: centerX + 195, y: 575 },

      // Tier 5: Persistence & Storage Layer
      rds_replica: { x: centerX - 310, y: 575 },
      rds_primary: { x: centerX - 90, y: 575 },
      rds: { x: centerX - 90, y: 575 },
      aurora: { x: centerX - 90, y: 575 },
      db: { x: centerX - 90, y: 575 },
      documentdb: { x: centerX - 90, y: 675 },
      secretsmanager: { x: centerX - 310, y: 675 },
      dynamodb: { x: centerX + 130, y: 675 },
      s3: { x: centerX + 130, y: 575 },
      ebs: { x: centerX + 320, y: 575 },
      efs: { x: centerX + 320, y: 675 },
      glacier: { x: centerX + 320, y: 765 }
    };

    return { centerX, baseMap, viewportWidth };
  }

  render() {
    const emptyStateEl = document.getElementById('canvasEmptyState');
    if (!this.architecture || !this.architecture.nodes || this.architecture.nodes.length === 0) {
      if (emptyStateEl) emptyStateEl.style.display = 'flex';
      this.nodesLayer.innerHTML = '';
      this.svgLayer.innerHTML = '';
      return;
    }
    if (emptyStateEl) emptyStateEl.style.display = 'none';
    this.renderNodes();
    requestAnimationFrame(() => this.renderConnections());
  }

  renderNodes() {
    this.nodesLayer.innerHTML = '';
    const { centerX, baseMap, viewportWidth } = this.calculateLayoutPositions();

    // Group custom or dynamic nodes that aren't in baseMap
    const unpositionedByCat = {};
    const occupied = new Set();

    let maxX = 0;
    let maxY = 0;

    this.architecture.nodes.forEach(node => {
      let posX = node.x;
      let posY = node.y;

      // Use pre-defined non-overlapping layout if position isn't customized by user
      if (!node._customPos) {
        if (baseMap[node.id]) {
          posX = baseMap[node.id].x;
          posY = baseMap[node.id].y;
        } else {
          // Dynamic category grid tiering with non-overlapping tiers
          const cat = node.category || 'compute';
          if (!unpositionedByCat[cat]) unpositionedByCat[cat] = 0;
          const idx = unpositionedByCat[cat]++;

          if (cat === 'networking') {
            posX = centerX - 330 - (idx * 210);
            posY = 175;
          } else if (cat === 'messaging') {
            posX = centerX - 380;
            posY = 480 + (idx * 95);
          } else if (cat === 'caching') {
            posX = centerX + 195;
            posY = 480 + (idx * 95);
          } else if (cat === 'storage' || cat === 'database') {
            posX = centerX + 130 + (idx * 210);
            posY = 675;
          } else {
            // compute
            posX = centerX - 160 + (idx * 210);
            posY = 380;
          }
        }

        // Anti-collision shifting
        let key = `${Math.round(posX)}_${Math.round(posY)}`;
        let shiftCount = 0;
        while (occupied.has(key) && shiftCount < 10) {
          posX += 210;
          if (posX > viewportWidth - 220) {
            posX = centerX - 310;
            posY += 105;
          }
          key = `${Math.round(posX)}_${Math.round(posY)}`;
          shiftCount++;
        }
        occupied.add(key);

        node.x = posX;
        node.y = posY;
      }

      const nodeWidth = node.isGroup ? 320 : 180;
      const nodeHeight = node.isGroup ? 160 : 80;
      if (posX + nodeWidth > maxX) maxX = posX + nodeWidth;
      if (posY + nodeHeight > maxY) maxY = posY + nodeHeight;

      const hasIncident = this.activeIncidents.has(node.id) || node.hasIncident;

      if (node.isGroup) {
        // Render Auto Scaling Group container
        const groupEl = document.createElement('div');
        groupEl.className = `asg-container-node ${hasIncident ? 'has-incident' : ''}`;
        groupEl.id = `node-${node.id}`;
        groupEl.dataset.id = node.id;
        groupEl.dataset.category = node.category || 'compute';
        groupEl.style.left = `${posX}px`;
        groupEl.style.top = `${posY}px`;
        groupEl.style.width = '320px';

        const childNodes = node.children || [
          { name: 'App Server 1', cpu: '2 vCPU', ram: '4 GB' },
          { name: 'App Server 2', cpu: '2 vCPU', ram: '4 GB' },
          { name: 'App Server 3', cpu: '2 vCPU', ram: '4 GB' }
        ];

        groupEl.innerHTML = `
          ${hasIncident ? `<div class="node-alert-pill">⚠️ High CPU 94%</div>` : ''}
          <div class="asg-header-row">
            <span class="asg-label">⚙ Auto Scaling Group</span>
            <span class="asg-replica-pill">${node.instanceCount || childNodes.length} Replicas</span>
          </div>
          <div class="asg-children-grid">
            ${childNodes.map((child, i) => `
              <div class="canvas-node asg-child" style="min-width: 100px; flex:1;">
                <div class="node-top-row">
                  <div class="node-ping-wrap">
                    <span class="node-ping-wave" style="background:${node.categoryColor || '#f97316'};"></span>
                    <span class="node-ping-core" style="background:${node.categoryColor || '#f97316'};"></span>
                  </div>
                  <span class="node-name" style="font-size:0.75rem;">Pod ${i+1}</span>
                </div>
                <span class="node-subtext">${child.cpu || '2 vCPU'}, ${child.ram || '4 GB'}</span>
              </div>
            `).join('')}
          </div>
        `;

        groupEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectNode(node);
        });

        groupEl.addEventListener('mouseenter', () => this.highlightConnectedEdges(node.id));
        groupEl.addEventListener('mouseleave', () => this.clearEdgeHighlights());

        this.nodesLayer.appendChild(groupEl);
      } else {
        // Regular Node
        const el = document.createElement('div');
        el.className = `canvas-node ${hasIncident ? 'has-incident' : ''}`;
        el.id = `node-${node.id}`;
        el.dataset.id = node.id;
        el.dataset.category = node.category || 'compute';
        el.style.left = `${posX}px`;
        el.style.top = `${posY}px`;

        const catColor = node.categoryColor || '#3b82f6';
        const costVal = node.monthlyCost !== undefined ? Number(node.monthlyCost) : 30;
        const costStr = costVal === 0 ? '$0/mo' : `$${costVal.toFixed(0)}/mo`;
        const metricText = node.sla ? `${costStr} • ${node.sla}` : `${costStr}`;

        el.innerHTML = `
          ${hasIncident ? `<div class="node-alert-pill">⚠️ Incident Active</div>` : ''}
          <div class="node-top-row">
            <div class="node-ping-wrap">
              <span class="node-ping-wave" style="background:${catColor};"></span>
              <span class="node-ping-core" style="background:${catColor};"></span>
            </div>
            <span class="node-name">${node.name}</span>
            <span class="node-metric-chip">${metricText}</span>
          </div>
          <span class="node-subtext" title="${node.specs || 'Managed Cloud Service'}">${node.specs || 'Managed Cloud Service'}</span>
          ${(node.isFreeTier || (node.freeTier && node.freeTier.length > 0)) ? `
            <div class="node-free-tier-chip" title="${node.freeTier || 'AWS Free Tier Eligible'}">
              <span class="ft-dot"></span> Free Tier
            </div>
          ` : ''}
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectNode(node);
        });

        el.addEventListener('mouseenter', () => this.highlightConnectedEdges(node.id));
        el.addEventListener('mouseleave', () => this.clearEdgeHighlights());

        this.nodesLayer.appendChild(el);
      }
    });

    // Expand layers so viewport can scroll naturally in both dimensions with generous padding
    const padBottom = 180;
    const padRight = 80;
    const contentWidth = Math.max(viewportWidth, maxX + padRight);
    const contentHeight = Math.max(this.viewport.clientHeight || 700, maxY + padBottom);

    this.nodesLayer.style.width = `${contentWidth}px`;
    this.nodesLayer.style.height = `${contentHeight}px`;
    this.svgLayer.style.width = `${contentWidth}px`;
    this.svgLayer.style.height = `${contentHeight}px`;
    this.svgLayer.setAttribute('width', contentWidth);
    this.svgLayer.setAttribute('height', contentHeight);
    this.svgLayer.setAttribute('viewBox', `0 0 ${contentWidth} ${contentHeight}`);

    // Reapply filter if active
    if (this.activeFilterCategory) {
      this.filterCategory(this.activeFilterCategory);
    }
  }

  renderConnections() {
    if (!this.architecture || !this.architecture.edges) return;
    const edges = this.architecture.edges;

    let svgHtml = `
      <defs>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
        </marker>
        <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
        </marker>
        <filter id="canvasGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>
    `;

    edges.forEach((edge) => {
      const fromEl = document.getElementById(`node-${edge.from}`);
      const toEl = document.getElementById(`node-${edge.to}`);

      if (!fromEl || !toEl) return;

      // Relative geometry calculation for clean anchor points
      const fromTop = fromEl.offsetTop;
      const fromBottom = fromTop + fromEl.offsetHeight;
      const fromLeft = fromEl.offsetLeft;
      const fromRight = fromLeft + fromEl.offsetWidth;
      const fromCenterX = fromLeft + (fromEl.offsetWidth / 2);
      const fromCenterY = fromTop + (fromEl.offsetHeight / 2);

      const toTop = toEl.offsetTop;
      const toBottom = toTop + toEl.offsetHeight;
      const toLeft = toEl.offsetLeft;
      const toRight = toLeft + toEl.offsetWidth;
      const toCenterX = toLeft + (toEl.offsetWidth / 2);
      const toCenterY = toTop + (toEl.offsetHeight / 2);

      let startX, startY, endX, endY, pathD;
      const dy = Math.abs(fromCenterY - toCenterY);

      if (dy < 65) {
        // Lateral horizontal connection
        const isFromLeft = fromCenterX < toCenterX;
        startX = isFromLeft ? fromRight : fromLeft;
        startY = fromCenterY;
        endX = isFromLeft ? toLeft : toRight;
        endY = toCenterY;
        const midX = (startX + endX) / 2;
        pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      } else if (fromBottom <= toTop + 25) {
        // Standard top-down flow
        startX = fromCenterX;
        startY = fromBottom;
        endX = toCenterX;
        endY = toTop;
        const midY = (startY + endY) / 2;
        pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
      } else if (toBottom <= fromTop + 25) {
        // Upward flow (e.g. replication or feedback)
        startX = fromCenterX;
        startY = fromTop;
        endX = toCenterX;
        endY = toBottom;
        const midY = (startY + endY) / 2;
        pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
      } else {
        // Diagonal / tiered flow
        const isFromLeft = fromCenterX < toCenterX;
        startX = isFromLeft ? fromRight : fromLeft;
        startY = fromCenterY;
        endX = toCenterX;
        endY = fromCenterY < toCenterY ? toTop : toBottom;
        const midX = (startX + endX) / 2;
        pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${endX} ${startY}, ${endX} ${endY}`;
      }

      const strokeColor = edge.dashed ? '#0284c7' : '#2563eb';
      const strokeDash = edge.dashed ? 'stroke-dasharray="6,6"' : 'stroke-dasharray="8,8"';
      const markerId = edge.dashed ? 'url(#arrow-cyan)' : 'url(#arrow-blue)';

      svgHtml += `
        <g class="connection-group" id="edge-${edge.from}-${edge.to}" data-from="${edge.from}" data-to="${edge.to}">
          <!-- Ambient Glow Path -->
          <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="3.5" stroke-opacity="0.22" filter="url(#canvasGlow)"/>
          
          <!-- Animated Traffic Pulse Stream -->
          <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-opacity="0.88" 
                ${strokeDash} marker-end="${markerId}">
            <animate attributeName="stroke-dashoffset" values="32;0" dur="${edge.dashed ? '1.8s' : '1.2s'}" repeatCount="indefinite" />
          </path>
        </g>
      `;
    });

    this.svgLayer.innerHTML = svgHtml;
  }

  highlightConnectedEdges(nodeId) {
    const groups = this.svgLayer.querySelectorAll('.connection-group');
    groups.forEach(g => {
      const from = g.dataset.from;
      const to = g.dataset.to;
      if (from === nodeId || to === nodeId) {
        g.style.opacity = '1';
        g.querySelector('path:first-child')?.setAttribute('stroke-width', '5');
        g.querySelector('path:first-child')?.setAttribute('stroke-opacity', '0.45');
      } else {
        g.style.opacity = '0.2';
      }
    });
  }

  clearEdgeHighlights() {
    const groups = this.svgLayer.querySelectorAll('.connection-group');
    groups.forEach(g => {
      g.style.opacity = '1';
      g.querySelector('path:first-child')?.setAttribute('stroke-width', '3.5');
      g.querySelector('path:first-child')?.setAttribute('stroke-opacity', '0.22');
    });
  }

  selectNode(node) {
    if (this.selectedNodeId) {
      const prev = document.querySelector(`[data-id="${this.selectedNodeId}"]`);
      if (prev) prev.classList.remove('selected');
    }

    this.selectedNodeId = node.id;
    const curr = document.querySelector(`[data-id="${node.id}"]`);
    if (curr) curr.classList.add('selected');

    // Populate Inspector Drawer with Interactive Controls
    const inspector = document.getElementById('nodeInspector');
    if (!inspector) return;

    document.getElementById('inspectCategoryBadge').textContent = (node.category || 'SERVICE').toUpperCase();
    document.getElementById('inspectCategoryBadge').style.color = node.categoryColor || '#2563eb';
    document.getElementById('inspectNodeName').textContent = node.name;
    document.getElementById('inspectNodeId').textContent = `id: ${node.id}`;
    document.getElementById('inspectSla').textContent = node.sla || '99.95% Availability';
    document.getElementById('inspectCost').textContent = `$${(node.monthlyCost || 45).toFixed(2)} / mo`;

    // Populate sizing selector
    const sizingSelect = document.getElementById('inspectSizingSelect');
    if (sizingSelect) {
      if (node.category === 'database') {
        sizingSelect.innerHTML = `
          <option value="db.t4g.medium" ${node.specs?.includes('t4g') ? 'selected' : ''}>db.t4g.medium (2 vCPU, 4 GB) - $68/mo</option>
          <option value="db.r6g.large" ${node.specs?.includes('r6g.large') ? 'selected' : ''}>db.r6g.large Multi-AZ (2 vCPU, 16 GB) - $320/mo</option>
          <option value="db.r6g.xlarge" ${node.specs?.includes('xlarge') ? 'selected' : ''}>db.r6g.xlarge Multi-AZ (4 vCPU, 32 GB) - $640/mo</option>
        `;
      } else if (node.category === 'storage') {
        sizingSelect.innerHTML = `
          <option value="std" selected>Standard Intelligent-Tiering - $45/mo</option>
          <option value="glacier">S3 Glacier Deep Vault - $12/mo</option>
          <option value="replicated">Multi-Region Replication - $90/mo</option>
        `;
      } else {
        sizingSelect.innerHTML = `
          <option value="micro" ${node.specs?.includes('micro') ? 'selected' : ''}>t4g.micro (1 vCPU, 1 GB) - $15/mo</option>
          <option value="medium" ${node.specs?.includes('medium') || !node.specs?.includes('large') ? 'selected' : ''}>t4g.medium (2 vCPU, 4 GB) - $48/mo</option>
          <option value="large" ${node.specs?.includes('xlarge') ? 'selected' : ''}>c6g.xlarge (4 vCPU, 8 GB) - $144/mo</option>
          <option value="2xlarge" ${node.specs?.includes('2xlarge') ? 'selected' : ''}>c6g.2xlarge (8 vCPU, 16 GB) - $288/mo</option>
        `;
      }
    }

    // Replica Slider configuration
    const replicaField = document.getElementById('replicaSliderField');
    const replicaSlider = document.getElementById('inspectReplicaSlider');
    const replicaBadge = document.getElementById('replicaCountBadge');

    if (node.isGroup || node.id === 'asg' || node.id === 'eks') {
      replicaField.style.display = 'block';
      const count = node.instanceCount || 3;
      replicaSlider.value = count;
      replicaBadge.textContent = `${count} Instances`;
    } else {
      replicaField.style.display = 'none';
    }

    // Health indicator
    const healthEl = document.getElementById('inspectHealthStatus');
    if (healthEl) {
      if (this.activeIncidents.has(node.id) || node.hasIncident) {
        healthEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">⚠️ Critical Incident Active</span>`;
      } else {
        healthEl.innerHTML = `<span class="text-emerald">● Healthy & Active (99.98%)</span>`;
      }
    }

    inspector.classList.remove('hidden');
  }

  triggerNodeIncident(nodeId) {
    this.activeIncidents.add(nodeId);
    const nodeData = this.architecture?.nodes?.find(n => n.id === nodeId);
    if (nodeData) nodeData.hasIncident = true;
    this.render();
    if (this.selectedNodeId === nodeId) {
      this.selectNode(nodeData);
    }
  }

  resolveNodeIncident(nodeId) {
    this.activeIncidents.delete(nodeId);
    const nodeData = this.architecture?.nodes?.find(n => n.id === nodeId);
    if (nodeData) nodeData.hasIncident = false;
    this.render();
  }

  filterCategory(category) {
    this.activeFilterCategory = (category === 'all' || !category) ? null : category;

    const allNodes = this.nodesLayer.querySelectorAll('.canvas-node, .asg-container-node');
    allNodes.forEach(el => {
      const nodeCat = el.dataset.category;
      if (!this.activeFilterCategory || nodeCat === this.activeFilterCategory) {
        el.classList.remove('dimmed');
      } else {
        el.classList.add('dimmed');
      }
    });

    // Dim edges not involving category
    const allEdges = this.svgLayer.querySelectorAll('.connection-group');
    allEdges.forEach(edge => {
      if (!this.activeFilterCategory) {
        edge.classList.remove('dimmed');
      } else {
        const fromNode = this.architecture?.nodes?.find(n => n.id === edge.dataset.from);
        const toNode = this.architecture?.nodes?.find(n => n.id === edge.dataset.to);
        const matches = (fromNode?.category === this.activeFilterCategory || toNode?.category === this.activeFilterCategory);
        if (matches) {
          edge.classList.remove('dimmed');
        } else {
          edge.classList.add('dimmed');
        }
      }
    });
  }

  highlightNode(nodeId) {
    const el = document.getElementById(`node-${nodeId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('selected');
      setTimeout(() => el.classList.remove('selected'), 3500);
      const nodeData = this.architecture?.nodes?.find(n => n.id === nodeId);
      if (nodeData) this.selectNode(nodeData);
    }
  }

  scrollToCenter() {
    const contentWidth = this.nodesLayer.offsetWidth || 1140;
    const viewportWidth = this.viewport.clientWidth || 900;
    const targetX = Math.max(0, (contentWidth - viewportWidth) / 2);
    this.viewport.scrollTo({ top: 0, left: targetX, behavior: 'smooth' });
  }

  autoLayout() {
    if (!this.architecture) return;
    // Reset custom positions to adopt mathematical layout
    this.architecture.nodes.forEach(node => {
      delete node._customPos;
    });
    // Server-side topology healing to guarantee zero orphan nodes
    fetch('/api/architecture/heal', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.architecture) {
          this.architecture = data.architecture;
          this.render();
        }
      })
      .catch(() => {});
    this.render();
    this.scrollToCenter();
  }

  setZoom(zoomFactor) {
    this.scale = Math.max(0.6, Math.min(1.4, zoomFactor));
    document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
    this.nodesLayer.style.transform = `scale(${this.scale})`;
    this.nodesLayer.style.transformOrigin = 'center top';
    this.svgLayer.style.transform = `scale(${this.scale})`;
    this.svgLayer.style.transformOrigin = 'center top';
  }

  // Canvas Diagram Exporters
  exportJson() {
    const jsonStr = JSON.stringify(this.architecture, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(this.architecture?.projectName || 'clouderator-architecture').toLowerCase().replace(/\s+/g, '-')}-spec.json`;
    link.click();
  }

  exportSvg() {
    const svgContent = this.svgLayer.outerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clouderator-diagram.svg';
    link.click();
  }

  exportPng() {
    // Generate an image representation using HTML5 Canvas
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 750;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // White clean background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Title & Header banner
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(this.architecture?.projectName || 'Clouderator Cloud Architecture', 40, 50);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`Generated by Clouderator AI Console • Total Cost: $${(this.architecture?.metrics?.monthlyCost || 2340).toLocaleString()}/mo • SLA: 99.99%`, 40, 75);

    // Draw nodes
    (this.architecture?.nodes || []).forEach(node => {
      const x = (node.x || 400) - 200;
      const y = (node.y || 200) + 70;

      // Card
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(x, y, 180, 60, 8);
      ctx.fill();

      // Card border
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Category color strip
      ctx.fillStyle = node.categoryColor || '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(x + 10, y + 15, 8, 8, 4);
      ctx.fill();

      // Node Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(node.name.substring(0, 20), x + 25, y + 23);

      // Specs
      ctx.fillStyle = '#64748b';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText((node.specs || 'Managed Service').substring(0, 26), x + 10, y + 44);
    });

    const link = document.createElement('a');
    link.download = 'clouderator-architecture-diagram.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  highlightNode(nodeId) {
    if (!nodeId) return;
    const target = document.getElementById(`node-${nodeId}`) || document.querySelector(`[data-id="${nodeId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      target.classList.add('node-pulse-highlight');
      setTimeout(() => {
        target.classList.remove('node-pulse-highlight');
      }, 4000);
    }
  }
}

window.ArchitectureCanvas = ArchitectureCanvas;

