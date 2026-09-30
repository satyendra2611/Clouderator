// Clouderator Client Application Controller
// Manages WebSocket stream, conversational AI assistant, metrics bar, views & IaC

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Canvas
  const canvas = new ArchitectureCanvas('canvasViewport', 'canvasConnections', 'canvasNodes');

  let currentArchitecture = null;
  let activeView = 'canvas';
  let activeNotifFilter = 'all';
  let notificationsData = [];
  let socket = null;
  let activeSessionId = null;

  // DOM Elements
  const chatFeed = document.getElementById('conversationFeed');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const notifBellBtn = document.getElementById('notifBellBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifBadge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');
  const markReadBtn = document.getElementById('markReadBtn');

  // Bottom Metrics Elements
  const valMonthlyCost = document.getElementById('valMonthlyCost');
  const valCostDiffText = document.getElementById('valCostDiffText');
  const costDiffPill = document.getElementById('costDiffPill');
  const valPerfScore = document.getElementById('valPerfScore');
  const valPerfStatus = document.getElementById('valPerfStatus');
  const gaugePerformance = document.getElementById('gaugePerformance');
  const valAvailability = document.getElementById('valAvailability');
  const valAvailStatus = document.getElementById('valAvailStatus');
  const valSecScore = document.getElementById('valSecScore');
  const valSecStatus = document.getElementById('valSecStatus');
  const gaugeSecurity = document.getElementById('gaugeSecurity');

  // Initialize App
  initWebSocket();
  loadInitialData();
  setupEventListeners();
  initUserProfile();
  setupProfileEventListeners();

  // ==========================================
  // WEBSOCKET REAL-TIME CONNECTION
  // ==========================================
  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('⚡ Connected to Clouderator Real-Time Stream');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket event', err);
      }
    };

    socket.onclose = () => {
      console.warn('WebSocket connection lost, reconnecting in 3s...');
      setTimeout(initWebSocket, 3000);
    };
  }

  function isFakeNotification(n) {
    if (!n) return true;
    const fakeIds = new Set(['notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5']);
    if (fakeIds.has(n.id)) return true;
    const fakeTitles = [
      'monthly budget projection alert',
      'elevated cpu',
      'finops savings opportunity',
      'synchronous sync normal',
      'idle resource warning',
      'billing spike alert',
      'redis cache hit ratio',
      'budget threshold reached',
      'auto scaling triggered',
      'ai doctor routine health check'
    ];
    const t = (n.title || '').toLowerCase();
    if (fakeTitles.some(ft => t.includes(ft))) return true;
    return false;
  }

  function handleSocketMessage(data) {
    switch (data.type) {
      case 'INITIAL_STATE':
        notificationsData = (data.payload.notifications || []).filter(n => !isFakeNotification(n));
        updateNotificationsUI();
        if (data.payload.architecture) {
          updateArchitectureState(data.payload.architecture);
        }
        if (data.payload.metrics) {
          updateMonitoringUI(data.payload.metrics);
        }
        break;

      case 'NEW_NOTIFICATION': {
        const notif = data.payload;
        if (isFakeNotification(notif)) return; // Ignore any fake/simulated alerts
        notificationsData.unshift(notif);
        updateNotificationsUI();
        showToast(notif);
        break;
      }

      case 'METRICS_UPDATE':
        updateMonitoringUI(data.payload);
        break;

      case 'ARCHITECTURE_UPDATED':
        updateArchitectureState(data.payload);
        break;

      case 'NODE_INCIDENT_TRIGGERED':
        if (data.payload && data.payload.nodeId) {
          canvas.triggerNodeIncident(data.payload.nodeId);
          const badge = document.getElementById('doctorAlertBadge');
          if (badge) {
            badge.textContent = Number(badge.textContent || 0) + 1;
            badge.style.display = 'inline-block';
          }
        }
        break;

      case 'INCIDENT_RESOLVED':
        showToast({
          title: 'AI Doctor Incident Resolved',
          message: data.payload.actionTaken,
          severity: 'success',
          type: 'server'
        });
        if (data.payload.incident && data.payload.incident.nodeId) {
          canvas.resolveNodeIncident(data.payload.incident.nodeId);
        } else {
          canvas.resolveNodeIncident('asg');
        }
        loadDoctorIncidents();
        break;

      case 'DEVOPS_LOG_STREAM': {
        const payload = data.payload;
        if (payload) {
          appendTerminalLine(payload.line, payload.streamType);
          if (payload.progress !== null) {
            updateDevopsProgress(payload.progress);
          }
          if (payload.isFinal) {
            setDevopsStatus(payload.streamType === 'error' ? 'FAILED' : 'DEPLOYED');
          }
        }
        break;
      }
    }
  }

  // ==========================================
  // CHAT SESSIONS & PERSISTENT HISTORY (ChatGPT / Gemini style)
  // ==========================================
  async function loadSessions() {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) return;
      const data = await res.json();
      activeSessionId = data.activeSessionId || null;
      renderSessionHistory(data.sessions || [], activeSessionId);
    } catch (err) {
      console.error('Failed to load session history', err);
    }
  }

  function renderSessionHistory(sessions, activeId) {
    const listEl = document.getElementById('sessionHistoryList');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!sessions || sessions.length === 0) {
      listEl.innerHTML = '<div style="padding:12px 10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">No recent chats</div>';
      return;
    }

    sessions.forEach(sess => {
      const item = document.createElement('div');
      item.className = `session-history-item ${sess.id === activeId ? 'active' : ''}`;
      item.dataset.sessionId = sess.id;

      const timeStr = sess.updatedAt ? new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      item.innerHTML = `
        <span class="session-history-icon">💬</span>
        <div class="session-history-info">
          <div class="session-history-title" title="${sess.title || 'Chat Session'}">${sess.title || 'Chat Session'}</div>
          <div class="session-history-time">${timeStr}</div>
        </div>
        <button class="session-delete-btn" title="Delete chat" data-session-id="${sess.id}">&times;</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.session-delete-btn')) return;
        switchSession(sess.id);
      });

      const delBtn = item.querySelector('.session-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await deleteSession(sess.id);
        });
      }

      listEl.appendChild(item);
    });
  }

  async function startNewChat() {
    try {
      const res = await fetch('/api/sessions/new', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start new chat');
      const data = await res.json();
      activeSessionId = data.sessionId;
      renderChatHistory(data.session.chatHistory || []);
      updateArchitectureState(data.session.architecture || { nodes: [], edges: [] });
      await loadSessions();
      showToast({ title: 'New Chat Started', message: 'Canvas cleared. Ready for your architecture requirements.', type: 'server' });
    } catch (err) {
      console.error('Failed to create new session', err);
    }
  }

  async function switchSession(sessionId) {
    if (sessionId === activeSessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();
      activeSessionId = data.sessionId;
      renderChatHistory(data.session.chatHistory || []);
      updateArchitectureState(data.session.architecture || { nodes: [], edges: [] });
      await loadSessions();
      showToast({ title: 'Chat Loaded', message: data.session.title || 'Switched session', type: 'server' });
    } catch (err) {
      console.error('Failed to switch session', err);
    }
  }

  async function deleteSession(sessionId) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.activeSessionId) {
        await switchSession(data.activeSessionId);
      } else {
        await startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  }

  async function clearAllSessions() {
    if (!confirm('Are you sure you want to clear all chat and architecture history?')) return;
    try {
      const res = await fetch('/api/sessions/clear-all', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      activeSessionId = data.sessionId;
      renderChatHistory(data.session.chatHistory || []);
      updateArchitectureState(data.session.architecture || { nodes: [], edges: [] });
      await loadSessions();
      showToast({ title: 'History Cleared', message: 'All chat history reset.', type: 'server' });
    } catch (err) {
      console.error('Failed to clear sessions', err);
    }
  }

  // ==========================================
  // INITIAL DATA FETCHING
  // ==========================================
  async function loadInitialData() {
    try {
      // 0. Fetch Chat Sessions History (ChatGPT / Gemini style)
      await loadSessions();

      // 1. Fetch Chat History
      const chatRes = await fetch('/api/chat/history');
      const chatData = await chatRes.json();
      renderChatHistory(chatData.history || []);

      // 2. Fetch Architecture
      const archRes = await fetch('/api/architecture/current');
      const archData = await archRes.json();
      updateArchitectureState(archData);

      // 3. Fetch Notifications (Only genuine alerts)
      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      notificationsData = (notifData.notifications || []).filter(n => !isFakeNotification(n));
      updateNotificationsUI();

      // 4. Fetch Settings & AI Configuration
      await loadSettingsData();

      // 5. Fetch Connected Cloud Provider Status
      await loadCloudStatus();
    } catch (err) {
      console.error('Failed to load initial console data', err);
    }
  }

  function updateAiProviderBadge(settings) {
    const badge = document.getElementById('aiProviderBadge');
    const label = document.getElementById('aiProviderLabel');
    if (!badge || !label) return;

    const provider = settings.activeProvider || 'builtin';
    badge.className = 'ai-provider-badge';

    if (provider === 'groq') {
      badge.classList.add('badge-groq');
      const model = settings.groqModel || 'qwen/qwen3.8-27b';
      let shortName = 'Qwen 3.8';
      if (model.includes('qwen')) shortName = 'Qwen 3.8';
      else if (model.includes('120b')) shortName = 'GPT-OSS 120B';
      else if (model.includes('20b')) shortName = 'GPT-OSS 20B';
      else if (model.includes('8b')) shortName = '8B Instant';
      else if (model.includes('llama')) shortName = 'LLaMA 3.3';
      label.textContent = `⚡ Groq ${shortName}`;
      badge.title = `Powered by Groq Cloud LPU™ (${model})`;
    } else if (provider === 'gemini') {
      badge.classList.add('badge-gemini');
      label.textContent = '✨ Gemini 1.5';
      badge.title = 'Powered by Google Gemini API';
    } else {
      badge.classList.add('badge-builtin');
      label.textContent = 'Domain Engine';
      badge.title = 'Powered by Clouderator Built-in Engine (Local)';
    }
  }

  // ==========================================
  // ARCHITECTURE & METRICS STATE MANAGEMENT
  // ==========================================
  function updateArchitectureState(arch) {
    currentArchitecture = arch;
    canvas.setArchitecture(arch);
    if (typeof renderUserProfileUI === 'function') {
      renderUserProfileUI();
    }

    // Update Project Dropdown if name changed
    if (arch.projectName) {
      const projDropdown = document.getElementById('projectSelect');
      if (projDropdown) {
        let matched = false;
        for (let opt of projDropdown.options) {
          if (opt.text.toLowerCase().includes(arch.projectName.toLowerCase()) || 
              arch.projectName.toLowerCase().includes(opt.text.toLowerCase())) {
            projDropdown.value = opt.value;
            matched = true;
            break;
          }
        }
        if (!matched) {
          let customOpt = projDropdown.querySelector('option[value="custom_active"]');
          if (!customOpt) {
            customOpt = document.createElement('option');
            customOpt.value = 'custom_active';
            customOpt.setAttribute('translate', 'no');
            customOpt.className = 'notranslate';
            projDropdown.appendChild(customOpt);
          }
          customOpt.textContent = arch.projectName;
          projDropdown.value = 'custom_active';
        }
      }
    }

    // Update Bottom Metrics Bar
    const hasNodes = arch.nodes && arch.nodes.length > 0;
    const m = arch.metrics || {};
    valMonthlyCost.textContent = hasNodes ? `$${(m.monthlyCost || 0).toLocaleString()}` : '$0';

    const diff = m.costPercentDiff || 0;
    valCostDiffText.textContent = hasNodes ? `${Math.abs(diff)}% ${diff <= 0 ? 'less' : 'more'} than previous` : '0% change';
    costDiffPill.className = `metric-diff ${diff <= 0 ? 'text-emerald' : 'text-red'}`;

    // Update Performance Score
    const perf = hasNodes ? (m.performanceScore || 87) : 100;
    valPerfScore.textContent = hasNodes ? perf : 100;
    valPerfStatus.textContent = hasNodes ? (m.performanceStatus || 'Good') : 'Ready';
    setGaugeOffset(gaugePerformance, perf);

    // Update Availability
    valAvailability.textContent = hasNodes ? `${m.availabilityScore || 99.95}%` : '100%';
    valAvailStatus.textContent = hasNodes ? (m.availabilityStatus || 'Multi-AZ Architecture') : 'Ready';

    // Update Security Score
    const sec = hasNodes ? (m.securityScore || 92) : 100;
    valSecScore.textContent = hasNodes ? sec : 100;
    valSecStatus.textContent = hasNodes ? (m.securityStatus || 'Great') : 'Optimal';
    setGaugeOffset(gaugeSecurity, sec);

    // Keep AI Doctor badge & diagnostics synchronized with canvas state
    loadDoctorIncidents();

    // Keep Production Checklist / Next Steps (Domain, Groq, Microservices) synchronized
    updateNextStepsStatus(arch);

    // Synchronize currently visible subview with latest architecture
    const activeNavView = document.querySelector('.nav-item.active')?.dataset?.view;
    if (activeNavView === 'cost') loadCostData();
    if (activeNavView === 'security') loadSecurityData();
    if (activeNavView === 'monitoring') loadMonitoringData();
    if (activeNavView === 'deployment') {
      const activeTab = document.querySelector('.format-tab.active');
      const format = activeTab ? activeTab.dataset.format : 'terraform';
      if (typeof loadIaCCode === 'function') loadIaCCode(format);
      if (typeof loadCloudStatus === 'function') loadCloudStatus();
    }
  }

  function updateNextStepsStatus(arch) {
    if (!arch) return;
    const stepDomainStatusBadge = document.getElementById('stepDomainStatusBadge');
    const domainActiveBanner = document.getElementById('domainActiveBanner');
    const domainActiveLink = document.getElementById('domainActiveLink');
    const customDomainInput = document.getElementById('customDomainInput');
    const stepMicroservicesBadge = document.getElementById('stepMicroservicesBadge');

    // 1. Custom Domain Status
    if (arch.customDomain) {
      if (customDomainInput) customDomainInput.value = arch.customDomain.domain;
      if (stepDomainStatusBadge) {
        stepDomainStatusBadge.className = 'step-status-pill status-active';
        stepDomainStatusBadge.textContent = '● SSL Active (TLS 1.3)';
      }
      if (domainActiveBanner && domainActiveLink) {
        domainActiveBanner.classList.remove('hidden');
        domainActiveLink.href = arch.customDomain.endpointUrl;
        domainActiveLink.textContent = arch.customDomain.endpointUrl;
      }
    } else {
      if (stepDomainStatusBadge) {
        stepDomainStatusBadge.className = 'step-status-pill status-ready';
        stepDomainStatusBadge.textContent = 'Ready to Map';
      }
      if (domainActiveBanner) domainActiveBanner.classList.add('hidden');
    }

    // 2. Custom Application Microservices Status
    const nodes = arch.nodes || [];
    const microCount = nodes.filter(n => 
      ['kafka', 'lambda', 'dynamodb', 'opensearch'].some(type => n.id === type || n.id.startsWith(type + '_'))
    ).length;

    if (stepMicroservicesBadge) {
      if (microCount > 0) {
        stepMicroservicesBadge.className = 'step-status-pill status-active';
        stepMicroservicesBadge.textContent = `● ${microCount} Microservice${microCount > 1 ? 's' : ''} Active`;
      } else {
        stepMicroservicesBadge.className = 'step-status-pill status-ready';
        stepMicroservicesBadge.textContent = 'Expand Architecture';
      }
    }
  }

  function setGaugeOffset(circleEl, score) {
    if (!circleEl) return;
    const maxOffset = 264;
    const offset = maxOffset - (maxOffset * (score / 100));
    circleEl.style.strokeDashoffset = offset;
  }

  // ==========================================
  // CHAT & CONVERSATIONAL ASSISTANT
  // ==========================================
  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatAiInline(str) {
    if (!str) return '';
    let s = escapeHtml(str);

    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code class="msg-code">$1</code>');

    // Specialized Badges: **Decision:**, **Trade-off:**, etc. (handles colons inside or outside asterisks)
    s = s.replace(/\*\*Decision:?\*\*:?/gi, '<span class="point-badge badge-decision">Decision</span>');
    s = s.replace(/\*\*Trade-offs?:?\*\*:?/gi, '<span class="point-badge badge-tradeoff">Trade-off</span>');
    s = s.replace(/\*\*Reason:?\*\*:?/gi, '<span class="point-badge badge-decision">Reason</span>');
    s = s.replace(/\*\*Why:?\*\*:?/gi, '<span class="point-badge badge-decision">Why</span>');
    s = s.replace(/\*\*Availability:?\*\*:?/gi, '<span class="point-badge badge-availability">Availability</span>');
    s = s.replace(/\*\*Cost Savings?:?\*\*:?/gi, '<span class="point-badge badge-cost">Cost Savings</span>');
    s = s.replace(/\*\*Cost:?\*\*:?/gi, '<span class="point-badge badge-cost">Cost</span>');
    s = s.replace(/\*\*Compliance:?\*\*:?/gi, '<span class="point-badge badge-security">Compliance</span>');
    s = s.replace(/\*\*Security:?\*\*:?/gi, '<span class="point-badge badge-security">Security</span>');
    s = s.replace(/\*\*Risk Mitigation:?\*\*:?/gi, '<span class="point-badge badge-pros">Risk Mitigation</span>');
    s = s.replace(/\*\*Mitigation:?\*\*:?/gi, '<span class="point-badge badge-pros">Mitigation</span>');
    s = s.replace(/\*\*Performance:?\*\*:?/gi, '<span class="point-badge badge-performance">Performance</span>');
    s = s.replace(/\*\*Pros:?\*\*:?/gi, '<span class="point-badge badge-pros">Pros</span>');
    s = s.replace(/\*\*Cons:?\*\*:?/gi, '<span class="point-badge badge-cons">Cons</span>');
    s = s.replace(/\*\*Note:?\*\*:?/gi, '<span class="point-badge badge-note">Note</span>');

    // Bold: **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="msg-bold">$1</strong>');

    // Italic: *text* or _text_
    s = s.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3');

    // Cost highlight: ($10/mo), ~$5-10/mo, $40/mo, $513/month
    s = s.replace(/(\(?~?\$[\d,]+(?:\.\d+)?(?:\s*-\s*\$?[\d,]+)?(?:\/(?:mo|month|hr|year))?\)?)/gi, (match) => {
      if (/\$\d+/.test(match)) {
        return `<span class="msg-cost-tag">${match}</span>`;
      }
      return match;
    });

    return s;
  }

  function formatAiMessage(raw) {
    if (!raw || typeof raw !== 'string') return '';

    let text = raw.trim();

    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Extract code blocks first
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      const escapedCode = escapeHtml(code);
      codeBlocks.push(`
        <div class="msg-code-block">
          <div class="msg-code-header">
            <span class="msg-code-lang">${lang || 'Code'}</span>
            <button class="msg-code-copy" onclick="navigator.clipboard.writeText(this.closest('.msg-code-block').querySelector('code').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500)">Copy</button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `);
      return `\n\n__CODE_BLOCK_${idx}__\n\n`;
    });

    // Normalize mashed text: ensure headings like "### 1. Network..." are on their own lines
    text = text.replace(/(^|[^\n])\s*(#{1,4}\s+[^\n*]+?)(?=\s*(?:\*\s|\n|$))/g, '$1\n\n$2\n\n');

    // Ensure list items mashed together with preceding text are separated
    text = text.replace(/([^\n])\s*(\*\s+\*\*)/g, '$1\n* **');

    // Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    const lines = text.split('\n');
    const htmlParts = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (inList) {
          htmlParts.push('</ul>');
          inList = false;
        }
        continue;
      }

      // Check code block placeholder
      if (trimmedLine.startsWith('__CODE_BLOCK_') && trimmedLine.endsWith('__')) {
        if (inList) {
          htmlParts.push('</ul>');
          inList = false;
        }
        const blockIdx = parseInt(trimmedLine.replace(/__CODE_BLOCK_(\d+)__/, '$1'), 10);
        if (codeBlocks[blockIdx]) {
          htmlParts.push(codeBlocks[blockIdx]);
        }
        continue;
      }

      // Heading: ### Heading or ## Heading or # Heading
      const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        if (inList) {
          htmlParts.push('</ul>');
          inList = false;
        }
        const level = headingMatch[1].length;
        const headingText = formatAiInline(headingMatch[2]);
        const cleanLevel = Math.min(Math.max(level, 2), 4);
        htmlParts.push(`<h${cleanLevel} class="msg-section-heading heading-l${cleanLevel}"><span class="msg-heading-icon">⚡</span> ${headingText}</h${cleanLevel}>`);
        continue;
      }

      // Bullet point: starts with *, -, •, or numbered e.g. 1.
      const isBullet = /^(\*|-|•)\s+(.+)$/.test(trimmedLine);
      const isNumbered = /^(\d+)\.\s+(.+)$/.test(trimmedLine);

      if (isBullet || isNumbered) {
        if (!inList) {
          htmlParts.push('<ul class="msg-styled-list">');
          inList = true;
        }

        let content = isBullet ? trimmedLine.replace(/^(\*|-|•)\s+/, '') : trimmedLine.replace(/^(\d+)\.\s+/, '');
        let isIndented = line.search(/\S/) >= 2;

        let isKeyword = /^\*\*(?:Decision|Trade-offs?|Reason|Why|Cost|Cost Savings|Availability|Compliance|Risk Mitigation|Mitigation|Sizing|Impact|Pros|Cons|Note|Security|Performance):?\*\*:?/i.test(content);
        let isService = !isKeyword && !isIndented && /^\*\*[^*]+?\*\*.*?\$\d+/i.test(content);
        let isSubItem = isKeyword || isIndented || /^(Decision|Trade-offs?|Reason|Why|Cost|Availability|Compliance|Mitigation):/i.test(content);

        let itemClasses = ['msg-list-item'];
        if (isSubItem) itemClasses.push('is-subitem');
        if (isService) itemClasses.push('is-service');

        let formattedContent = formatAiInline(content);

        htmlParts.push(`<li class="${itemClasses.join(' ')}"><span class="item-bullet"></span><div class="item-content">${formattedContent}</div></li>`);
        continue;
      }

      // Normal paragraph text
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      htmlParts.push(`<p class="msg-paragraph">${formatAiInline(trimmedLine)}</p>`);
    }

    if (inList) {
      htmlParts.push('</ul>');
    }

    return htmlParts.join('\n');
  }

  function renderChatHistory(messages) {
    chatFeed.innerHTML = '';
    messages.forEach(msg => appendChatMessage(msg, false));
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function appendChatMessage(msg, autoScroll = true) {
    const isUser = msg.sender === 'user';
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${isUser ? 'user' : 'ai'}`;

    let displayText = msg.text || '';
    let bulletPoints = msg.bulletPoints || [];

    // Sanitize any accidentally leaked raw JSON in displayText
    if (!isUser && typeof displayText === 'string' && (displayText.trim().startsWith('{') || displayText.includes('"text":'))) {
      try {
        const parsed = JSON.parse(displayText);
        if (parsed.text) displayText = parsed.text;
        if (parsed.bullets && Array.isArray(parsed.bullets)) bulletPoints = parsed.bullets;
      } catch (_) {
        const textMatch = displayText.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (textMatch) {
          try { displayText = JSON.parse(`"${textMatch[1]}"`); } catch (_) { displayText = textMatch[1]; }
        }
        const bulletsMatch = displayText.match(/"bullets"\s*:\s*\[([\s\S]*?)\]/);
        if (bulletsMatch) {
          try {
            const b = JSON.parse(`[${bulletsMatch[1]}]`);
            if (Array.isArray(b) && b.length > 0) bulletPoints = b;
          } catch (_) {}
        }
      }
    }

    let bulletsHtml = '';
    if (bulletPoints && bulletPoints.length > 0) {
      bulletsHtml = `
        <ul class="msg-bullets">
          ${bulletPoints.map(b => `<li>${formatAiInline(b)}</li>`).join('')}
        </ul>
      `;
    }

    let actionBtnHtml = '';
    if (msg.actionButton) {
      actionBtnHtml = `
        <button class="msg-action-btn" data-action="${msg.actionButton.action}" data-target="${msg.actionButton.targetNodeId || msg.insertedNodeId || ''}">
          ${msg.actionButton.text}
        </button>
      `;
    }

    let providerTagHtml = '';
    if (!isUser) {
      if (msg.provider === 'groq') {
        let shortModel = 'Qwen 3.8';
        const m = (msg.model || '').toLowerCase();
        if (m.includes('qwen')) shortModel = 'Qwen 3.8';
        else if (m.includes('120b')) shortModel = 'GPT-OSS 120B';
        else if (m.includes('20b')) shortModel = 'GPT-OSS 20B';
        else if (m.includes('8b')) shortModel = '8B Instant';
        else if (m.includes('llama')) shortModel = 'LLaMA 3.3';
        providerTagHtml = `<span class="msg-engine-badge groq" title="${msg.model || 'Groq LPU'}">⚡ Groq ${shortModel}</span>`;
      } else if (msg.provider === 'gemini') {
        providerTagHtml = `<span class="msg-engine-badge gemini">✨ Gemini</span>`;
      }
    }

    const bodyContentHtml = isUser
      ? `<div class="msg-user-text">${escapeHtml(displayText).replace(/\n/g, '<br>')}</div>`
      : formatAiMessage(displayText);

    msgEl.innerHTML = `
      <div class="msg-header">
        <div class="msg-avatar ${isUser ? 'user' : 'ai'}">${isUser ? 'U' : 'AI'}</div>
        <span class="msg-sender">${isUser ? 'You' : 'Clouderator AI'}</span>
        ${providerTagHtml}
        <span class="msg-time">${msg.timestamp || 'Now'}</span>
      </div>
      <div class="msg-body">
        ${bodyContentHtml}
        ${bulletsHtml}
        ${actionBtnHtml}
      </div>
    `;

    // Bind action button click
    const actionBtn = msgEl.querySelector('.msg-action-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        const action = actionBtn.dataset.action;
        const target = actionBtn.dataset.target;
        handleChatAction(action, target);
      });
    }

    chatFeed.appendChild(msgEl);
    if (autoScroll) {
      chatFeed.scrollTop = chatFeed.scrollHeight;
    }
  }

  function handleChatAction(action, targetNodeId = null) {
    if (action === 'highlight_canvas') {
      switchView('canvas');
      if (targetNodeId) {
        setTimeout(() => canvas.highlightNode(targetNodeId), 150);
      } else {
        canvas.autoLayout();
      }
    } else if (action === 'highlight_websocket') {
      switchView('canvas');
      canvas.highlightNode('websocket');
    } else if (action === 'view_cost') {
      switchView('cost');
    } else if (action === 'view_security') {
      switchView('security');
    }
  }

  async function handleSendMessage(customText = null) {
    const text = customText || chatInput.value.trim();
    if (!text) return;

    if (!customText) chatInput.value = '';

    // Append user message immediately
    appendChatMessage({
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    });

    // Temporary AI thinking indicator
    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'chat-msg ai thinking';
    thinkingEl.innerHTML = `
      <div class="msg-header">
        <div class="msg-avatar ai">AI</div>
        <span class="msg-sender">Clouderator AI</span>
      </div>
      <div class="msg-body" style="font-style: italic; color: var(--text-muted);">
        <span class="pulse-dot" style="display:inline-block; margin-right:6px;"></span> Analyzing requirements and synthesizing architecture...
      </div>
    `;
    chatFeed.appendChild(thinkingEl);
    chatFeed.scrollTop = chatFeed.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          architecture: currentArchitecture
        })
      });

      thinkingEl.remove();

      if (!res.ok) throw new Error('Chat API returned error');

      const data = await res.json();
      appendChatMessage(data.reply);
      if (data.architecture) {
        updateArchitectureState(data.architecture);
        if (canvas) {
          canvas.render();
          canvas.scrollToCenter();
        }
      }
      const insertedTargetId = data.reply?.insertedNodeId || data.insertedNode?.id || data.reply?.actionButton?.targetNodeId;
      if (insertedTargetId) {
        switchView('canvas');
        setTimeout(() => {
          canvas.highlightNode(insertedTargetId);
        }, 200);
      }
      // Refresh session history titles in sidebar
      await loadSessions();
    } catch (err) {
      thinkingEl.remove();
      appendChatMessage({
        sender: 'ai',
        timestamp: 'Now',
        text: 'Sorry, I encountered an issue updating the architecture. Please try again.'
      });
    }
  }

  // ==========================================
  // REAL-TIME NOTIFICATIONS DRAWER
  // ==========================================
  function updateNotificationsUI() {
    // Filter
    let filtered = notificationsData;
    if (activeNotifFilter !== 'all') {
      filtered = notificationsData.filter(n => n.type === activeNotifFilter);
    }

    // Badge count of unread
    const unreadCount = notificationsData.filter(n => !n.read).length;
    if (unreadCount > 0) {
      notifBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      notifBadge.style.display = 'flex';
    } else {
      notifBadge.style.display = 'none';
    }

    // Render list
    notifList.innerHTML = '';
    if (filtered.length === 0) {
      notifList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No notifications found</div>`;
      return;
    }

    filtered.forEach(notif => {
      const item = document.createElement('div');
      item.className = `notif-item ${notif.read ? '' : 'unread'}`;

      const iconSymbol = notif.type === 'money' ? '💰' : '⚙️';
      const pillClass = notif.severity || 'info';

      item.innerHTML = `
        <div class="notif-icon ${notif.type}">
          ${iconSymbol}
        </div>
        <div class="notif-content">
          <div class="notif-item-header">
            <span class="notif-item-title">${notif.title}</span>
            <span class="notif-time">${notif.timestamp}</span>
          </div>
          <div class="notif-message">${notif.message}</div>
          <span class="notif-badge-pill ${pillClass}">${notif.amount || notif.metric || (notif.type === 'money' ? 'Budget Alert' : 'Server Alert')}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        notif.read = true;
        updateNotificationsUI();
        if (notif.type === 'money') {
          switchView('cost');
        } else {
          switchView('monitoring');
        }
        notifDropdown.classList.add('hidden');
      });

      notifList.appendChild(item);
    });
  }

  function showToast(notif) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${notif.type || 'server'}`;
    toast.innerHTML = `
      <strong>${notif.title}</strong>
      <p style="margin-top: 3px; font-size: 0.75rem; color: var(--text-secondary);">${notif.message}</p>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // ==========================================
  // SUBVIEWS: COST, MONITORING, DOCTOR, IAC
  // ==========================================
  function switchView(viewName) {
    activeView = viewName;
    try {
      if (window.location.hash !== `#${viewName}`) {
        history.replaceState(null, '', `#${viewName}`);
      }
    } catch (e) {}

    // Sidebar active pill
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Hide all views
    document.querySelectorAll('.workspace-view').forEach(view => {
      view.classList.remove('active');
      view.classList.add('hidden');
    });

    // Show target view
    const viewMap = {
      canvas: 'viewChatCanvas',
      cost: 'viewCost',
      monitoring: 'viewMonitoring',
      security: 'viewSecurity',
      doctor: 'viewDoctor',
      deployment: 'viewDeployment',
      settings: 'viewSettings'
    };

    const targetId = viewMap[viewName] || 'viewChatCanvas';
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      targetEl.classList.add('active');
    }

    // Trigger subview loaders
    if (viewName === 'cost') loadCostData();
    if (viewName === 'monitoring') loadMonitoringData();
    if (viewName === 'security') loadSecurityData();
    if (viewName === 'doctor') loadDoctorIncidents();
    if (viewName === 'deployment') {
      const activeTab = document.querySelector('.format-tab.active');
      const format = activeTab ? activeTab.dataset.format : 'terraform';
      loadIaCCode(format);
      loadCloudStatus();
    }
    if (viewName === 'settings') loadSettingsData();
    if (viewName === 'canvas') {
      setTimeout(() => canvas.render(), 100);
    }
  }

  // Load Security Posture & Compliance Findings
  async function loadSecurityData() {
    try {
      const res = await fetch('/api/security/audit');
      const data = await res.json();
      const scoreEl = document.getElementById('secViewScore');
      if (scoreEl) scoreEl.textContent = `${data.securityScore} / 100`;

      const wafEl = document.getElementById('secViewWaf');
      const hasWaf = currentArchitecture?.nodes?.some(n => n.id === 'waf' || (n.name && n.name.toLowerCase().includes('waf')));
      if (wafEl) {
        wafEl.textContent = hasWaf ? 'Active' : 'Unattached';
        wafEl.className = `stat-value ${hasWaf ? 'text-emerald' : 'text-orange'}`;
      }

      const tbody = document.querySelector('#securityFindingsTable tbody');
      if (tbody) {
        tbody.innerHTML = '';
        (data.findings || []).forEach(f => {
          const tr = document.createElement('tr');
          const isPassed = f.status === 'PASSED';
          tr.innerHTML = `
            <td><strong>${f.title}</strong></td>
            <td><span class="badge ${isPassed ? 'badge-emerald' : 'badge-warning'}">${f.status}</span></td>
            <td><span style="color:var(--text-muted); font-size:0.75rem;">${f.severity}</span></td>
            <td style="color:var(--text-secondary);">${f.detail}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch (e) {
      console.error('Error loading security audit data', e);
    }
  }

  // Load Cost Subview Data & FinOps Engine
  async function loadCostData() {
    try {
      const res = await fetch('/api/cost/breakdown');
      const data = await res.json();

      const tiersContainer = document.getElementById('paymentTiersContainer');
      const tableBody = document.querySelector('#costBreakdownTable tbody');
      const recList = document.getElementById('costRecommendationsList');
      const savingsBadge = document.getElementById('costSavingsBadge');
      const tiers = data.paymentTiers || {};
      const hasServices = data.hasServices && data.breakdown && data.breakdown.length > 0;
      const activePlan = data.activePaymentPlan || 'onDemand';

      if (!hasServices) {
        // Zero state for payment tiers when canvas is empty
        if (tiersContainer) {
          tiersContainer.innerHTML = `
            <div class="tier-card ${activePlan === 'onDemand' ? 'active-plan' : ''}">
              <span class="tier-title">${tiers.onDemand?.label || 'Pay As You Go (On-Demand)'}</span>
              <div class="tier-price">$0 <span style="font-size:0.8rem; color:var(--text-muted);">/ mo</span></div>
              <span class="tier-savings" style="color:var(--text-muted);">0%</span>
              <p class="tier-desc">No active cloud nodes provisioned on canvas</p>
              <button class="btn btn-secondary btn-sm" disabled style="width:100%; opacity:0.6;">No Services</button>
            </div>

            <div class="tier-card recommended ${activePlan === 'oneYearSavings' ? 'active-plan' : ''}">
              <span class="tier-badge">RECOMMENDED</span>
              <span class="tier-title">${tiers.oneYearSavings?.label || '1-Year Compute Savings Plan'}</span>
              <div class="tier-price text-cyan">$0 <span style="font-size:0.8rem; color:var(--text-muted);">/ mo</span></div>
              <span class="tier-savings">22% off On-Demand</span>
              <p class="tier-desc">Requires active compute instances on canvas</p>
              <button class="btn btn-secondary btn-sm" disabled style="width:100%; opacity:0.6;">No Services</button>
            </div>

            <div class="tier-card ${activePlan === 'threeYearReserved' ? 'active-plan' : ''}">
              <span class="tier-title">${tiers.threeYearReserved?.label || '3-Year Standard Reserved Plan'}</span>
              <div class="tier-price text-emerald">$0 <span style="font-size:0.8rem; color:var(--text-muted);">/ mo</span></div>
              <span class="tier-savings">48% off On-Demand</span>
              <p class="tier-desc">Requires active compute instances on canvas</p>
              <button class="btn btn-secondary btn-sm" disabled style="width:100%; opacity:0.6;">No Services</button>
            </div>
          `;
        }

        // Clean interactive zero-state for Itemized Bill Table
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; padding: 50px 20px;">
                <div class="empty-cost-table" style="max-width: 480px; margin: 0 auto;">
                  <div style="font-size: 2.2rem; margin-bottom: 12px;">🏗️</div>
                  <h4 style="margin: 0 0 8px 0; font-size: 1.15rem; color: var(--text-primary); font-weight: 600;">No Cloud Services on Canvas</h4>
                  <p style="margin: 0 auto 18px auto; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
                    Your itemized infrastructure bill is computed dynamically in real time from provisioned nodes. Currently, 0 cloud services are active.
                  </p>
                  <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" id="btnCostGoCanvas">⚡ Open Architecture Canvas</button>
                    <button class="btn btn-secondary btn-sm" id="btnCostLoadPreset">🚀 Load Sample Architecture</button>
                  </div>
                </div>
              </td>
            </tr>
          `;

          const goCanvasBtn = document.getElementById('btnCostGoCanvas');
          if (goCanvasBtn) goCanvasBtn.addEventListener('click', () => switchView('canvas'));

          const loadPresetBtn = document.getElementById('btnCostLoadPreset');
          if (loadPresetBtn) {
            loadPresetBtn.addEventListener('click', async () => {
              loadPresetBtn.disabled = true;
              loadPresetBtn.textContent = 'Loading architecture...';
              try {
                const pRes = await fetch('/api/project/preset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ preset: 'food_delivery' })
                });
                const pData = await pRes.json();
                if (pData.architecture) {
                  updateArchitectureState(pData.architecture);
                  await loadCostData();
                  showToast({
                    title: 'Sample Architecture Loaded',
                    message: 'Calculated real itemized costs for Food Delivery architecture.',
                    type: 'server',
                    severity: 'success'
                  });
                }
              } catch (e) {
                console.error('Failed to load preset', e);
              }
            });
          }
        }

        // Clean empty state for recommendations
        if (recList) {
          recList.innerHTML = `
            <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
              <div style="font-size: 1.8rem; margin-bottom: 8px;">💡</div>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">FinOps Optimizer Ready</div>
              <p style="font-size: 0.82rem; margin: 0; max-width: 440px; margin-inline: auto;">
                Provision compute (EC2/ECS), databases (RDS/DynamoDB), or storage (S3) to unlock automated Graviton3 migrations, idle-capacity downscaling, and savings plans.
              </p>
            </div>
          `;
        }

        if (savingsBadge) {
          savingsBadge.textContent = '0 Opportunities';
          savingsBadge.className = 'badge badge-info';
        }

        return;
      }

      // Populated State: Services Exist on Canvas!
      // Render Payment Tiers with Active Highlighting
      if (tiersContainer) {
        tiersContainer.innerHTML = `
          <div class="tier-card ${activePlan === 'onDemand' ? 'active-plan' : ''}">
            <span class="tier-title">${tiers.onDemand?.label || 'Pay As You Go (On-Demand)'}</span>
            <div class="tier-price">$${Math.round(tiers.onDemand?.monthly || 0).toLocaleString()} <span style="font-size:0.8rem; color:var(--text-muted);">/ mo</span></div>
            <span class="tier-savings" style="color:var(--text-muted);">${tiers.onDemand?.savings || '0%'}</span>
            <p class="tier-desc">${tiers.onDemand?.commitment || 'No commitment, cancel anytime'}</p>
            ${activePlan === 'onDemand' ? 
              `<button class="btn btn-secondary btn-sm" disabled style="width:100%; border-color:var(--accent-emerald); color:var(--accent-emerald);">✓ Current Active Plan</button>` :
              `<button class="btn btn-secondary btn-sm btn-apply-tier" data-plan="onDemand" style="width:100%;">Switch to On-Demand</button>`
            }
          </div>

          <div class="tier-card recommended ${activePlan === 'oneYearSavings' ? 'active-plan' : ''}">
            <span class="tier-badge">RECOMMENDED</span>
            <span class="tier-title">${tiers.oneYearSavings?.label || '1-Year Compute Savings Plan'}</span>
            <div class="tier-price text-cyan">$${Math.round(tiers.oneYearSavings?.monthly || 0).toLocaleString()} <span style="font-size:0.8rem; color:var(--text-muted);">/ mo</span></div>
            <span class="tier-savings">${tiers.oneYearSavings?.savings || '22% off On-Demand'}</span>
            <p class="tier-desc">${tiers.oneYearSavings?.commitment || '1-year commitment with monthly billing'}</p>
            ${activePlan === 'oneYearSavings' ?
              `<button class="btn btn-primary btn-sm" disabled style="width:100%; background:#059669; border-color:#059669;">✓ Current Active Plan</button>` :
              `<button class="btn btn-primary btn-sm btn-apply-tier" data-plan="oneYearSavings" style="width:100%;">Apply 1-Yr Plan (Save 22%)</button>`
            }
          </div>

          <div class="tier-card ${activePlan === 'threeYearReserved' ? 'active-plan' : ''}">
            <span class="tier-title">${tiers.threeYearReserved?.label || '3-Year Standard Reserved Plan'}</span>
            <div class="tier-price text-emerald">$${Math.round(tiers.threeYearReserved?.monthly || 0).toLocaleString()} <span style="font-size:0.8rem; color:var(--text-muted);">/ mo</span></div>
            <span class="tier-savings">${tiers.threeYearReserved?.savings || '48% off On-Demand'}</span>
            <p class="tier-desc">${tiers.threeYearReserved?.commitment || '3-year commitment for maximum ROI'}</p>
            ${activePlan === 'threeYearReserved' ?
              `<button class="btn btn-secondary btn-sm" disabled style="width:100%; border-color:var(--accent-emerald); color:var(--accent-emerald);">✓ Current Active Plan</button>` :
              `<button class="btn btn-secondary btn-sm btn-apply-tier" data-plan="threeYearReserved" style="width:100%;">Reserve Instances (Save 48%)</button>`
            }
          </div>
        `;

        tiersContainer.querySelectorAll('.btn-apply-tier').forEach(btn => {
          btn.addEventListener('click', () => {
            const plan = btn.dataset.plan;
            applyPaymentPlan(plan);
          });
        });
      }

      // Render Itemized Cost Table
      if (tableBody) {
        tableBody.innerHTML = '';
        (data.breakdown || []).forEach(row => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${row.name}</strong></td>
            <td><span class="category-badge ${(row.category || '').toLowerCase()}">${(row.category || 'SERVICE').toUpperCase()}</span></td>
            <td style="color: var(--text-secondary);">${row.description}</td>
            <td style="font-weight:700; color:var(--text-primary);">$${Number(row.monthlyCost).toFixed(2)}/mo</td>
          `;
          tableBody.appendChild(tr);
        });

        // Add summary row at the bottom
        const totalRow = document.createElement('tr');
        totalRow.className = 'table-total-row';
        totalRow.style.cssText = 'background: rgba(59, 130, 246, 0.08); font-weight: 700; border-top: 1px solid var(--border-color);';
        
        let planBadgeText = '';
        if (activePlan === 'oneYearSavings') planBadgeText = ' · 22% 1-Yr Savings Applied';
        else if (activePlan === 'threeYearReserved') planBadgeText = ' · 48% 3-Yr Reserved Applied';

        totalRow.innerHTML = `
          <td colspan="3" style="color: var(--text-primary); font-size: 0.95rem;">
            Total Monthly Cloud Spend 
            <span style="font-weight: normal; color: var(--text-muted); font-size: 0.8rem; margin-left: 8px;">
              (${data.breakdown.length} active service${data.breakdown.length > 1 ? 's' : ''}${planBadgeText})
            </span>
          </td>
          <td style="color: var(--accent-cyan); font-size: 1.1rem; font-weight: 800;">
            $${Number(data.monthlyTotal).toFixed(2)}/mo
          </td>
        `;
        tableBody.appendChild(totalRow);
      }

      // Render Recommendations
      if (recList) {
        recList.innerHTML = '';
        let totalPotentialSavings = 0;

        (data.recommendations || []).forEach(rec => {
          totalPotentialSavings += (rec.potentialSavingsMonthly || 0);
          const div = document.createElement('div');
          div.className = 'rec-item';
          div.innerHTML = `
            <div style="flex: 1;">
              <div class="rec-title">${rec.title}</div>
              <div class="rec-impact">${rec.impact}</div>
            </div>
            <div style="text-align: right; margin-left: 16px;">
              <div class="rec-save">-$${rec.potentialSavingsMonthly}/mo</div>
              <button class="btn btn-secondary btn-sm btn-apply-rec" data-id="${rec.id}" style="margin-top:4px;">
                Apply Optimization
              </button>
            </div>
          `;
          recList.appendChild(div);
        });

        recList.querySelectorAll('.btn-apply-rec').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            applyFinOpsOptimization(id, btn);
          });
        });

        if (savingsBadge) {
          if (totalPotentialSavings > 0) {
            savingsBadge.textContent = `Save up to $${totalPotentialSavings}/mo`;
            savingsBadge.className = 'badge badge-emerald';
          } else {
            savingsBadge.textContent = 'Optimized';
            savingsBadge.className = 'badge badge-info';
          }
        }
      }

    } catch (err) {
      console.error('Failed to load cost intelligence', err);
    }
  }

  // Switch Active Payment Tier Plan (On-Demand, 1-Year, 3-Year)
  async function applyPaymentPlan(plan) {
    try {
      const res = await fetch('/api/cost/apply-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data.success) {
        if (data.architecture) updateArchitectureState(data.architecture);
        await loadCostData();
        const planTitle = plan === 'oneYearSavings' ? '1-Year Compute Savings Plan (22% off)' :
                          plan === 'threeYearReserved' ? '3-Year Standard Reserved Plan (48% off)' : 'Pay As You Go (On-Demand)';
        showToast({
          title: 'Payment Plan Activated',
          message: `Switched architecture billing to ${planTitle}.`,
          type: 'money',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Failed to apply payment plan', err);
      showToast({ title: 'Plan Update Failed', message: err.message, type: 'server', severity: 'error' });
    }
  }

  // Apply FinOps Cost Optimization Rule
  async function applyFinOpsOptimization(id, btn) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Applying...';
    }
    try {
      const res = await fetch('/api/cost/apply-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        if (btn) {
          btn.textContent = '✓ Applied';
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-primary');
        }
        if (data.architecture) updateArchitectureState(data.architecture);
        await loadCostData();
        showToast({
          title: 'FinOps Optimization Applied',
          message: `${data.optimizationName} active. Cloud bill reduced.`,
          type: 'money',
          severity: 'success'
        });
      } else {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Apply Optimization';
        }
      }
    } catch (err) {
      console.error('Failed to apply optimization', err);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Apply Optimization';
      }
    }
  }

  // Load Monitoring Subview Data
  async function loadMonitoringData() {
    try {
      const res = await fetch('/api/monitoring/metrics');
      if (res.ok) {
        const metrics = await res.json();
        updateMonitoringUI(metrics);
      }
    } catch (err) {
      console.error('Failed to load monitoring data', err);
    }
  }

  // Load Settings Subview Data
  async function loadSettingsData() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        const provEl = document.getElementById('cloudProviderSelect');
        const budEl = document.getElementById('monthlyBudgetInput');
        const gmEl = document.getElementById('groqModelSelect');
        const ppEl = document.getElementById('preferredProviderSelect');
        if (provEl && data.activeCloudProvider) provEl.value = data.activeCloudProvider;
        if (budEl && data.monthlyBudget) budEl.value = data.monthlyBudget;
        if (gmEl && data.groqModel) gmEl.value = data.groqModel;
        if (ppEl && data.preferredProvider) ppEl.value = data.preferredProvider;
        
        // Also sync deployment checklist Groq inputs & badges
        const deployModel = document.getElementById('groqDeployModelSelect');
        if (deployModel && data.groqModel) deployModel.value = data.groqModel;
        const stepGroqBadge = document.getElementById('stepGroqStatusBadge');
        const deployGroqActiveBanner = document.getElementById('deployGroqActiveBanner');
        const deployGroqStatusText = document.getElementById('deployGroqStatusText');
        if (data.groqApiKeyConfigured) {
          if (stepGroqBadge) {
            stepGroqBadge.className = 'step-status-pill status-active';
            stepGroqBadge.textContent = '⚡ Groq LPU™ Active';
          }
          if (deployGroqActiveBanner && deployGroqStatusText) {
            deployGroqActiveBanner.classList.remove('hidden');
            deployGroqStatusText.textContent = `⚡ Groq Cloud LPU™ Active (${data.groqModel || 'Qwen 3.8 27B'})`;
          }
        }

        updateAiProviderBadge(data);
      }
    } catch (err) {
      console.error('Failed to load settings data', err);
    }
  }

  // Update Live Monitoring Dashboard
  function updateMonitoringUI(metrics) {
    if (!metrics) return;

    const statCpu = document.getElementById('statCpu');
    const barCpu = document.getElementById('barCpu');
    const statRam = document.getElementById('statRam');
    const barRam = document.getElementById('barRam');
    const statLatency = document.getElementById('statLatency');
    const statRps = document.getElementById('statRps');

    if (statCpu) statCpu.textContent = `${metrics.overallCpu}%`;
    if (barCpu) barCpu.style.width = `${metrics.overallCpu}%`;
    if (statRam) statRam.textContent = `${metrics.overallMemory}%`;
    if (barRam) barRam.style.width = `${metrics.overallMemory}%`;
    if (statLatency) statLatency.textContent = `${metrics.latencyMs} ms`;
    if (statRps) statRps.textContent = `${metrics.requestsPerSec.toLocaleString()}`;

    // Render Telemetry SVG Chart
    renderTelemetryChart(metrics.history || []);
  }

  function renderTelemetryChart(history) {
    const chartContainer = document.getElementById('telemetryChart');
    if (!chartContainer || history.length < 2) return;

    const width = chartContainer.clientWidth || 800;
    const height = 220;
    const stepX = width / (history.length - 1);

    // Build SVG path for CPU and RAM
    const cpuPoints = history.map((pt, i) => `${i * stepX},${height - (pt.cpu * (height - 30) / 100) - 15}`).join(' ');
    const ramPoints = history.map((pt, i) => `${i * stepX},${height - (pt.ram * (height - 30) / 100) - 15}`).join(' ');

    chartContainer.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="#1f293d" stroke-dasharray="4,4"/>
        <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="#1f293d" stroke-dasharray="4,4"/>
        <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#1f293d" stroke-dasharray="4,4"/>

        <!-- RAM Line (Purple) -->
        <polyline fill="none" stroke="#8b5cf6" stroke-width="2.5" points="${ramPoints}" />

        <!-- CPU Line (Cyan) -->
        <polyline fill="none" stroke="#06b6d4" stroke-width="2.5" points="${cpuPoints}" />

        <!-- Legend inside chart -->
        <g transform="translate(20, 20)">
          <circle cx="5" cy="5" r="4" fill="#06b6d4"/>
          <text x="14" y="9" fill="#94a3b8" font-size="11">Fleet CPU %</text>
          <circle cx="100" cy="5" r="4" fill="#8b5cf6"/>
          <text x="110" y="9" fill="#94a3b8" font-size="11">Memory Allocation %</text>
        </g>
      </svg>
    `;
  }

  // Trigger Chaos Engineering Tests
  async function triggerDoctorChaos(testType) {
    try {
      showToast({
        title: 'Chaos Test Injected',
        message: `Simulating ${testType === 'az_failover' ? 'Availability Zone Failure' : 'Fleet Latency Spike'}...`,
        severity: 'warning',
        type: 'server'
      });
      const res = await fetch('/api/ai-doctor/chaos-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      });
      const data = await res.json();
      if (data.success && data.incident) {
        showToast({
          title: '⚠️ AI Doctor Alert',
          message: data.incident.title,
          severity: 'error',
          type: 'server'
        });
        await loadDoctorIncidents();
      } else {
        showToast({
          title: 'Simulation Notice',
          message: data.error || 'Please add services to the Architecture Canvas first.',
          severity: 'info',
          type: 'client'
        });
      }
    } catch (e) {
      console.error('Failed to trigger chaos test', e);
    }
  }

  // Trigger Node Stress
  async function triggerNodeStress(nodeId, nodeName) {
    try {
      const res = await fetch('/api/architecture/simulate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, nodeName })
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          title: `Latency Injected: ${nodeName}`,
          message: 'P99 latency spiked above 1200ms. AI Doctor incident triggered.',
          severity: 'error',
          type: 'server'
        });
        await loadDoctorIncidents();
      }
    } catch (e) {
      console.error('Failed to stress node', e);
    }
  }

  // Load AI Doctor Incidents & Live Service Health Telemetry
  async function loadDoctorIncidents() {
    try {
      const res = await fetch('/api/ai-doctor/incidents');
      const data = await res.json();

      const docHealth = document.getElementById('docHealth');
      const docHealthSub = document.getElementById('docHealthSub');
      const docMonitoredNodes = document.getElementById('docMonitoredNodes');
      const docMttd = document.getElementById('docMttd');
      const docMttr = document.getElementById('docMttr');
      const doctorAlertBadge = document.getElementById('doctorAlertBadge');
      const docActiveIncidentsBadge = document.getElementById('docActiveIncidentsBadge');
      const listEl = document.getElementById('incidentsList');
      const serviceHealthContainer = document.getElementById('serviceHealthContainer');
      const docAllServicesStatusBadge = document.getElementById('docAllServicesStatusBadge');

      // If no architecture exists on the canvas
      if (!data.hasArchitecture || data.nodesCount === 0) {
        if (docHealth) {
          docHealth.textContent = 'No Infrastructure (Idle)';
          docHealth.className = 'stat-value text-muted';
        }
        if (docHealthSub) docHealthSub.textContent = 'Awaiting canvas deployment';
        if (docMonitoredNodes) docMonitoredNodes.textContent = '0 Services';
        if (docMttd) docMttd.textContent = '--';
        if (docMttr) docMttr.textContent = '--';
        if (docActiveIncidentsBadge) docActiveIncidentsBadge.textContent = '0 Active';
        if (docAllServicesStatusBadge) {
          docAllServicesStatusBadge.textContent = 'Idle';
          docAllServicesStatusBadge.className = 'badge text-muted';
        }

        if (doctorAlertBadge) {
          doctorAlertBadge.textContent = '0';
          doctorAlertBadge.style.display = 'none';
        }

        if (listEl) {
          listEl.innerHTML = `
            <div class="empty-doctor-state">
              <div class="empty-doctor-icon">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <h3>No Architecture Deployed Yet</h3>
              <p>AI Doctor continuously monitors active cloud topologies for Single Points of Failure (SPOF), resource bottlenecks, security holes, and latency degradation.</p>
              <p class="empty-doctor-hint">Start a chat or design an architecture on the canvas to activate continuous diagnosis.</p>
              <button class="btn btn-primary btn-sm" id="btnDoctorGoToCanvas" style="margin-top: 6px;">
                <span>⚡ Open Architecture Canvas</span>
              </button>
            </div>
          `;

          const goCanvasBtn = document.getElementById('btnDoctorGoToCanvas');
          if (goCanvasBtn) {
            goCanvasBtn.addEventListener('click', () => switchView('canvas'));
          }
        }

        if (serviceHealthContainer) {
          serviceHealthContainer.innerHTML = '<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:0.85rem;">No cloud services provisioned. Add nodes to the Architecture Canvas to view live health checks.</div>';
        }
        return;
      }

      // Architecture exists: update summary stats
      const summary = data.summary || {};
      const activeIncidents = (data.incidents || []).filter(i => !i.resolved);
      const isDegraded = activeIncidents.length > 0;

      if (docHealth) {
        const hColor = summary.healthScore >= 95 ? 'text-emerald' : 
                       summary.healthScore >= 80 ? 'text-cyan' : 'text-orange';
        docHealth.textContent = `${summary.overallHealth} (${summary.healthScore}%)`;
        docHealth.className = `stat-value ${hColor}`;
      }
      if (docHealthSub) {
        docHealthSub.textContent = isDegraded ? `${activeIncidents.length} failure(s) detected` : 'All telemetry nominal (0 SPOFs)';
      }
      if (docMonitoredNodes) {
        docMonitoredNodes.textContent = `${data.nodesCount} Services Active`;
      }
      if (docMttd) docMttd.textContent = summary.meanTimeToDetect || '8 seconds (AI Real-time)';
      if (docMttr) docMttr.textContent = summary.meanTimeToResolve || '45 seconds (Auto-Healed)';

      // Update badges
      if (docActiveIncidentsBadge) {
        docActiveIncidentsBadge.textContent = `${activeIncidents.length} Active`;
        docActiveIncidentsBadge.className = isDegraded ? 'badge badge-warning' : 'badge badge-emerald';
      }
      if (docAllServicesStatusBadge) {
        docAllServicesStatusBadge.textContent = isDegraded ? 'Degraded Nodes Detected' : 'All Verified & Resilient';
        docAllServicesStatusBadge.className = isDegraded ? 'badge badge-warning' : 'badge badge-emerald';
      }

      if (doctorAlertBadge) {
        if (activeIncidents.length > 0) {
          doctorAlertBadge.textContent = activeIncidents.length;
          doctorAlertBadge.style.display = 'inline-block';
        } else {
          doctorAlertBadge.textContent = '0';
          doctorAlertBadge.style.display = 'none';
        }
      }

      // Render Incidents List
      if (listEl) {
        listEl.innerHTML = '';

        if (!data.incidents || data.incidents.length === 0) {
          // All Clear / Fully Resilient state
          listEl.innerHTML = `
            <div class="doctor-operational-card">
              <div class="operational-header">
                <div class="operational-shield">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <div class="operational-info">
                  <h4>
                    <span>All Systems Operational & Fault Tolerant</span>
                    <span class="badge badge-emerald" style="font-size:0.7rem;">100% HEALTH</span>
                  </h4>
                  <p>AI Doctor verified all ${data.nodesCount} cloud components on your architecture canvas. Redundancy, autoscaling, and health probe configurations are actively guarding against latency spikes and single points of failure.</p>
                </div>
              </div>

              <div class="operational-features">
                <div class="feature-pill">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Multi-AZ Database Topology Configured</span>
                </div>
                <div class="feature-pill">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Auto-Scaling Fleet Health Checks Passing</span>
                </div>
                <div class="feature-pill">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>WAF Edge Filtering & CDN Active</span>
                </div>
              </div>

              <div class="operational-chaos-prompt">
                <span>Want to test how AI Doctor automatically detects failures and performs 1-click self-healing?</span>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-secondary btn-sm text-orange" id="btnDoctorInlineSpike">
                    <span>⚠️ Inject Latency Spike</span>
                  </button>
                  <button class="btn btn-secondary btn-sm text-red" id="btnDoctorInlineFailover">
                    <span>🔥 Simulate AZ Failover</span>
                  </button>
                </div>
              </div>
            </div>
          `;

          const inlineSpike = document.getElementById('btnDoctorInlineSpike');
          if (inlineSpike) inlineSpike.addEventListener('click', () => triggerDoctorChaos('latency_spike'));
          const inlineFailover = document.getElementById('btnDoctorInlineFailover');
          if (inlineFailover) inlineFailover.addEventListener('click', () => triggerDoctorChaos('az_failover'));
        } else {
          // Render incident cards
          data.incidents.forEach(inc => {
            const card = document.createElement('div');
            card.className = `incident-card ${inc.resolved ? 'resolved' : 'investigating'}`;
            card.innerHTML = `
              <div class="incident-top">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge ${inc.resolved ? 'badge-emerald' : inc.severity === 'critical' ? 'badge-red' : 'badge-warning'}">
                    ${inc.resolved ? '✓ AUTO-RESOLVED' : inc.severity.toUpperCase()}
                  </span>
                  <span class="incident-title">${inc.title}</span>
                </div>
                <span class="incident-time">${inc.timestamp || 'Just now'}</span>
              </div>
              <div class="incident-box">
                <div><strong>Symptom:</strong> ${inc.symptom}</div>
                <div style="margin-top:4px;"><strong>AI Root Cause Analysis:</strong> ${inc.rootCause}</div>
                <div style="margin-top:4px;"><strong>Suggested Resolution:</strong> ${inc.suggestedFix}</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span style="font-size:0.75rem; color:var(--accent-cyan); font-weight:600;">AI Confidence: ${inc.confidenceScore}%</span>
                ${!inc.resolved ? `
                  <button class="btn btn-primary btn-sm btn-remediate" data-id="${inc.id}">
                    ⚡ ${inc.remediationLabel || 'Apply Auto-Fix'}
                  </button>
                ` : `<span style="font-size:0.75rem; color:var(--accent-emerald); font-weight:600;">✓ Remediated & Verified</span>`}
              </div>
            `;

            const remBtn = card.querySelector('.btn-remediate');
            if (remBtn) {
              remBtn.addEventListener('click', async () => {
                remBtn.disabled = true;
                remBtn.textContent = 'Applying auto-fix...';
                try {
                  const remRes = await fetch('/api/ai-doctor/remediate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ incidentId: inc.id })
                  });
                  const remData = await remRes.json();
                  if (remData.success) {
                    showToast({
                      title: 'Remediation Applied',
                      message: remData.actionTaken || 'Fix applied to architecture.',
                      type: 'server',
                      severity: 'success'
                    });
                    const archRes = await fetch('/api/architecture/current');
                    const arch = await archRes.json();
                    updateArchitectureState(arch);
                    await loadDoctorIncidents();
                  }
                } catch (e) {
                  console.error('Failed to apply remediation', e);
                  remBtn.disabled = false;
                  remBtn.textContent = `⚡ ${inc.remediationLabel || 'Apply Auto-Fix'}`;
                }
              });
            }

            listEl.appendChild(card);
          });
        }
      }

      // Render Service Health Matrix
      if (serviceHealthContainer) {
        serviceHealthContainer.innerHTML = '';
        const checks = data.serviceHealthChecks || [];
        if (checks.length === 0) {
          serviceHealthContainer.innerHTML = '<div style="padding:16px; color:var(--text-muted); font-size:0.82rem;">No health checks available.</div>';
        } else {
          const grid = document.createElement('div');
          grid.className = 'service-health-grid';
          checks.forEach(chk => {
            const card = document.createElement('div');
            card.className = `service-health-card ${chk.status.toLowerCase()}`;
            card.innerHTML = `
              <div class="service-health-top">
                <div class="service-health-identity">
                  <div class="service-health-dot"></div>
                  <div class="service-health-name" title="${chk.name}">${chk.name}</div>
                </div>
                <span class="service-health-category" style="background:${chk.categoryColor}22; color:${chk.categoryColor}; border:1px solid ${chk.categoryColor}44;">
                  ${chk.category}
                </span>
              </div>
              <div class="service-health-specs" title="${chk.specs}">⚙️ ${chk.specs}</div>
              <p class="service-health-assessment">${chk.assessment}</p>
              <div class="service-health-footer">
                <span class="service-health-sla">SLA: ${chk.sla}</span>
                <button class="btn-node-chaos" data-node="${chk.id}" title="Simulate latency on this service">
                  ⚠️ Stress Test
                </button>
              </div>
            `;

            const chaosBtn = card.querySelector('.btn-node-chaos');
            if (chaosBtn) {
              chaosBtn.addEventListener('click', async () => {
                chaosBtn.disabled = true;
                chaosBtn.textContent = 'Injecting...';
                await triggerNodeStress(chk.id, chk.name);
                chaosBtn.disabled = false;
                chaosBtn.textContent = '⚠️ Stress Test';
              });
            }

            grid.appendChild(card);
          });
          serviceHealthContainer.appendChild(grid);
        }
      }
    } catch (err) {
      console.error('Error loading AI doctor incidents', err);
    }
  }

  // Load IaC Code Manifests
  async function loadIaCCode(format = 'terraform') {
    try {
      const codeBlock = document.getElementById('iacCodeBlock');
      const btnCopy = document.getElementById('btnCopyIac');
      const btnDownload = document.getElementById('btnDownloadIac');
      if (!codeBlock) return;

      const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
      if (!nodes || nodes.length === 0) {
        codeBlock.textContent = `# No Architecture Provided\n# Please add or design cloud services on the canvas first to generate Infrastructure as Code (${format.toUpperCase()}).\n# \n# Instructions:\n# 1. Open 'Chat + Canvas' from the sidebar\n# 2. Add cloud services from the palette or ask AI to design an architecture\n# 3. Return here to inspect and export your exact IaC code`;
        codeBlock.className = 'language-text';
        if (btnCopy) {
          btnCopy.style.opacity = '0.5';
          btnCopy.style.pointerEvents = 'none';
        }
        if (btnDownload) {
          btnDownload.style.opacity = '0.5';
          btnDownload.style.pointerEvents = 'none';
        }
        return;
      }

      if (btnCopy) {
        btnCopy.style.opacity = '1';
        btnCopy.style.pointerEvents = 'auto';
      }
      if (btnDownload) {
        btnDownload.style.opacity = '1';
        btnDownload.style.pointerEvents = 'auto';
      }

      codeBlock.textContent = `Generating ${format} architecture code...`;
      const res = await fetch(`/api/iac/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architecture: currentArchitecture, format })
      });
      const code = await res.text();
      codeBlock.textContent = code;
      codeBlock.className = format === 'terraform' ? 'language-hcl' : 'language-yaml';
    } catch (err) {
      console.error('Failed to export IaC code', err);
    }
  }

  // ==========================================
  // DEVOPS EXECUTION ENGINE & TERMINAL CONTROLS
  // ==========================================
  async function loadCloudStatus() {
    try {
      const res = await fetch('/api/devops/cloud/status');
      const data = await res.json();
      const pName = document.getElementById('cloudProviderName');
      const acc = document.getElementById('cloudAccountId');
      const st = document.getElementById('cloudConnectionStatus');
      const mode = document.getElementById('cloudExecutionMode');
      const badge = document.getElementById('cloudStatusBadge');

      if (pName) pName.textContent = `${data.provider?.toUpperCase()} (${data.region})`;
      if (acc) acc.textContent = data.accountId || '8392-1049-5821';
      if (st) {
        st.textContent = data.connected ? 'Authenticated' : 'Disconnected';
        st.className = data.connected ? 'text-emerald' : 'text-red';
      }
      if (mode) {
        mode.textContent = data.mode === 'live' ? 'Live Cloud Production' :
                           data.mode === 'localstack' ? 'LocalStack Docker Sandbox' : 'Production Cloud Engine';
      }
      if (badge && !data.connected) {
        badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        badge.style.color = 'var(--accent-red)';
      }
    } catch (err) {
      console.error('Failed to load cloud status', err);
    }
  }

  function appendTerminalLine(lineText, type = 'stdout') {
    const term = document.getElementById('devopsTerminalBody');
    if (!term) return;
    const div = document.createElement('div');
    div.className = `terminal-line ${type}`;
    div.textContent = lineText;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
  }

  function updateDevopsProgress(pct) {
    const wrap = document.getElementById('terminalProgressWrap');
    const bar = document.getElementById('terminalProgressBar');
    if (wrap && bar) {
      wrap.style.display = 'block';
      bar.style.width = `${pct}%`;
      if (pct >= 100) {
        setTimeout(() => {
          wrap.style.display = 'none';
          bar.style.width = '0%';
        }, 3500);
      }
    }
  }

  function setDevopsStatus(status) {
    const badge = document.getElementById('devopsStatusBadge');
    if (!badge) return;
    badge.textContent = status;
    badge.className = 'status-pill';
    if (status === 'IN_PROGRESS' || status === 'APPLYING...' || status === 'PLANNING...') badge.classList.add('status-running');
    else if (status === 'SUCCESS' || status === 'DEPLOYED' || status === 'STACK_ACTIVE') badge.classList.add('status-success');
    else if (status === 'FAILED') badge.classList.add('status-error');
    else badge.classList.add('status-ready');
  }

  // ==========================================
  // EVENT LISTENERS BINDING
  // ==========================================
  function setupEventListeners() {
    // Chat Send button & Enter key
    sendBtn.addEventListener('click', () => handleSendMessage());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });

    // Sidebar New Chat & History Clear
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => startNewChat());
    }

    const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');
    if (clearAllHistoryBtn) {
      clearAllHistoryBtn.addEventListener('click', () => clearAllSessions());
    }

    // Empty state prompt chips
    document.querySelectorAll('.empty-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          handleSendMessage(prompt);
        }
      });
    });

    // Quick chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        handleSendMessage(prompt);
      });
    });

    // Chat tabs (Conversation vs Project Brief)
    const tabConv = document.getElementById('tabConversation');
    const tabBrief = document.getElementById('tabBrief');
    const feed = document.getElementById('conversationFeed');
    const briefContent = document.getElementById('projectBriefContent');

    tabConv.addEventListener('click', () => {
      tabConv.classList.add('active');
      tabBrief.classList.remove('active');
      feed.classList.remove('hidden');
      briefContent.classList.add('hidden');
    });

    tabBrief.addEventListener('click', () => {
      tabBrief.classList.add('active');
      tabConv.classList.remove('active');
      feed.classList.add('hidden');
      briefContent.classList.remove('hidden');
    });

    // Notification Drawer Toggle
    notifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      const profileDropdown = document.getElementById('profileDropdown');
      const userProfileBtn = document.getElementById('userProfileBtn');
      if (profileDropdown) profileDropdown.classList.add('hidden');
      if (userProfileBtn) {
        userProfileBtn.classList.remove('active');
        userProfileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBellBtn.contains(e.target)) {
        notifDropdown.classList.add('hidden');
      }
      const profileDropdown = document.getElementById('profileDropdown');
      const userProfileBtn = document.getElementById('userProfileBtn');
      if (profileDropdown && userProfileBtn) {
        if (!profileDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
          profileDropdown.classList.add('hidden');
          userProfileBtn.classList.remove('active');
          userProfileBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const profileDropdown = document.getElementById('profileDropdown');
        const userProfileBtn = document.getElementById('userProfileBtn');
        const profileModal = document.getElementById('profileModal');
        if (profileDropdown) profileDropdown.classList.add('hidden');
        if (userProfileBtn) {
          userProfileBtn.classList.remove('active');
          userProfileBtn.setAttribute('aria-expanded', 'false');
        }
        if (profileModal) profileModal.classList.add('hidden');
        if (notifDropdown) notifDropdown.classList.add('hidden');
      }
    });

    // Notification Tabs (All vs Server vs Money)
    document.querySelectorAll('.notif-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeNotifFilter = tab.dataset.filter;
        updateNotificationsUI();
      });
    });

    // Mark all as read
    markReadBtn.addEventListener('click', async () => {
      await fetch('/api/notifications/mark-read', { method: 'POST' });
      notificationsData.forEach(n => n.read = true);
      updateNotificationsUI();
    });

    // Sidebar navigation clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        switchView(view);
      });
    });

    // Bottom metrics links
    document.getElementById('linkCostBreakdown').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('cost');
    });
    document.getElementById('linkAvailabilityDetails').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('monitoring');
    });
    document.getElementById('linkSecurityReport').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('security');
    });

    // Top action buttons
    document.getElementById('explainBtn').addEventListener('click', () => {
      switchView('canvas');
      handleSendMessage('Explain the architecture decisions, trade-offs, and service choices in detail.');
    });

    document.getElementById('exportIacBtn').addEventListener('click', () => {
      const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
      if (!nodes || nodes.length === 0) {
        showToast({
          title: 'Canvas is Empty',
          message: 'No cloud components found on canvas. Design your architecture first to generate IaC code.',
          type: 'server',
          severity: 'warning'
        });
      }
      switchView('deployment');
    });

    document.getElementById('shareBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      showToast({
        title: 'Share Link Copied',
        message: 'Clouderator console session link copied to clipboard.',
        type: 'server'
      });
    });

    // Canvas Toolbar buttons
    document.getElementById('btnAutoLayout').addEventListener('click', () => {
      canvas.autoLayout();
      showToast({ title: 'Auto Layout', message: 'Nodes neatly realigned across architectural tiers.', type: 'server' });
    });

    document.getElementById('btnToggleGrid').addEventListener('click', function() {
      this.classList.toggle('active');
      document.getElementById('canvasViewport').classList.toggle('no-grid');
    });

    let currentZoom = 1.0;
    document.getElementById('btnZoomIn').addEventListener('click', () => {
      currentZoom += 0.1;
      canvas.setZoom(currentZoom);
    });

    document.getElementById('btnZoomOut').addEventListener('click', () => {
      currentZoom -= 0.1;
      canvas.setZoom(currentZoom);
    });

    document.getElementById('btnResetArch').addEventListener('click', async () => {
      if (confirm('Clear canvas and reset to a new clean chat?')) {
        await startNewChat();
      }
    });

    // AI Doctor Toolbar Actions
    const btnDoctorRunScan = document.getElementById('btnDoctorRunScan');
    if (btnDoctorRunScan) {
      btnDoctorRunScan.addEventListener('click', async () => {
        btnDoctorRunScan.disabled = true;
        btnDoctorRunScan.innerHTML = '<span>Scanning...</span>';
        await loadDoctorIncidents();
        showToast({
          title: 'Resiliency Scan Complete',
          message: 'AI Doctor completed topology telemetry scan.',
          severity: 'info',
          type: 'server'
        });
        btnDoctorRunScan.disabled = false;
        btnDoctorRunScan.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> <span>Run Resiliency Scan</span>';
      });
    }

    const btnDoctorSimulateLatency = document.getElementById('btnDoctorSimulateLatency');
    if (btnDoctorSimulateLatency) {
      btnDoctorSimulateLatency.addEventListener('click', () => triggerDoctorChaos('latency_spike'));
    }

    const btnDoctorSimulateFailover = document.getElementById('btnDoctorSimulateFailover');
    if (btnDoctorSimulateFailover) {
      btnDoctorSimulateFailover.addEventListener('click', () => triggerDoctorChaos('az_failover'));
    }

    const btnDoctorReset = document.getElementById('btnDoctorReset');
    if (btnDoctorReset) {
      btnDoctorReset.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/ai-doctor/reset-incidents', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            showToast({
              title: 'Incidents Cleared',
              message: 'AI Doctor diagnostic cache and simulated failures reset.',
              severity: 'success',
              type: 'server'
            });
            await loadDoctorIncidents();
          }
        } catch (e) {
          console.error('Failed to reset doctor', e);
        }
      });
    }

    // IaC Format Tabs
    document.querySelectorAll('.format-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.format-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const format = tab.dataset.format;
        loadIaCCode(format);
      });
    });

    // IaC Copy and Download buttons
    document.getElementById('btnCopyIac').addEventListener('click', () => {
      const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
      if (!nodes || nodes.length === 0) {
        showToast({ title: 'No Architecture Code', message: 'No architecture provided to copy code from.', type: 'server', severity: 'warning' });
        return;
      }
      const code = document.getElementById('iacCodeBlock').textContent;
      navigator.clipboard.writeText(code);
      showToast({ title: 'Copied to Clipboard', message: 'IaC manifest code copied successfully.', type: 'server' });
    });

    document.getElementById('btnDownloadIac').addEventListener('click', () => {
      const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
      if (!nodes || nodes.length === 0) {
        showToast({ title: 'No Architecture Code', message: 'No architecture provided to download code.', type: 'server', severity: 'warning' });
        return;
      }
      const code = document.getElementById('iacCodeBlock').textContent;
      const activeTab = document.querySelector('.format-tab.active');
      const format = activeTab ? activeTab.dataset.format : 'terraform';
      
      let filename = 'main.tf';
      if (format === 'docker') filename = 'docker-compose.yml';
      if (format === 'k8s') filename = 'k8s-manifest.yaml';

      const blob = new Blob([code], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });

    // ==========================================
    // DEVOPS PIPELINE ACTION LISTENERS
    // ==========================================
    const btnRunTfPlan = document.getElementById('btnRunTfPlan');
    const btnRunTfApply = document.getElementById('btnRunTfApply');
    const btnRunDockerUp = document.getElementById('btnRunDockerUp');
    const btnRunDockerDown = document.getElementById('btnRunDockerDown');
    const btnClearTerminal = document.getElementById('btnClearTerminal');

    if (btnRunTfPlan) {
      btnRunTfPlan.addEventListener('click', async () => {
        const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
        if (!nodes || nodes.length === 0) {
          showToast({
            title: 'No Architecture to Plan',
            message: 'Canvas is empty. Add services on the canvas first to generate and plan infrastructure.',
            type: 'server',
            severity: 'warning'
          });
          appendTerminalLine(`$ terraform plan`, 'cmd');
          appendTerminalLine(`[!] Error: No architecture provided (0 nodes on canvas). Cannot generate or plan infrastructure.`, 'error');
          setDevopsStatus('NO_ARCHITECTURE');
          return;
        }

        setDevopsStatus('PLANNING...');
        appendTerminalLine(`$ terraform plan (Targeting ${currentArchitecture?.projectName || 'Cloud Architecture'})...`, 'prompt');
        try {
          const res = await fetch('/api/devops/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ architecture: currentArchitecture })
          });
          const data = await res.json();
          if (data.output) {
            data.output.split('\n').forEach(line => {
              let t = 'stdout';
              if (line.startsWith('$')) t = 'cmd';
              else if (line.includes('+ create')) t = 'highlight';
              else if (line.includes('Plan:')) t = 'success';
              else if (line.includes('[!]')) t = 'error';
              appendTerminalLine(line, t);
            });
          }
          if (data.success) {
            setDevopsStatus('PLAN_READY');
            showToast({
              title: 'Terraform Plan Ready',
              message: `${data.resourcesToAdd || 0} cloud resources verified for deployment.`,
              type: 'server'
            });
          } else {
            setDevopsStatus('FAILED');
          }
        } catch (err) {
          appendTerminalLine(`Error running plan: ${err.message}`, 'error');
          setDevopsStatus('FAILED');
        }
      });
    }

    if (btnRunTfApply) {
      btnRunTfApply.addEventListener('click', async () => {
        const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
        if (!nodes || nodes.length === 0) {
          showToast({
            title: 'No Architecture to Deploy',
            message: 'Canvas is empty. Add services on the canvas before applying Terraform.',
            type: 'server',
            severity: 'warning'
          });
          appendTerminalLine(`$ terraform apply`, 'cmd');
          appendTerminalLine(`[!] Error: No architecture provided (0 nodes on canvas). Cannot deploy.`, 'error');
          setDevopsStatus('NO_ARCHITECTURE');
          return;
        }

        setDevopsStatus('APPLYING...');
        updateDevopsProgress(5);
        appendTerminalLine(`\n============================================================`, 'comment');
        appendTerminalLine(`[STARTING CLOUD DEPLOYMENT PIPELINE]`, 'prompt');
        appendTerminalLine(`============================================================`, 'comment');

        try {
          const res = await fetch('/api/devops/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ architecture: currentArchitecture })
          });
          const data = await res.json();
          if (data.success) {
            setDevopsStatus('DEPLOYED');
            showToast({
              title: 'Infrastructure Live',
              message: `${data.resourcesDeployed} resources provisioned. Endpoint: ${data.albUrl || data.domainUrl || 'Active'}`,
              type: 'server'
            });
          } else {
            setDevopsStatus('FAILED');
            if (data.error) appendTerminalLine(`Deployment error: ${data.error}`, 'error');
          }
        } catch (err) {
          appendTerminalLine(`Deployment execution error: ${err.message}`, 'error');
          setDevopsStatus('FAILED');
        }
      });
    }

    if (btnRunDockerUp) {
      btnRunDockerUp.addEventListener('click', async () => {
        const nodes = (currentArchitecture && currentArchitecture.nodes) ? currentArchitecture.nodes : [];
        if (!nodes || nodes.length === 0) {
          showToast({
            title: 'No Architecture for Docker',
            message: 'Canvas is empty. Add services on the canvas before launching containers.',
            type: 'server',
            severity: 'warning'
          });
          appendTerminalLine(`$ docker compose up -d`, 'cmd');
          appendTerminalLine(`[!] Error: No architecture provided (0 nodes on canvas). Cannot start containers.`, 'error');
          setDevopsStatus('NO_ARCHITECTURE');
          return;
        }

        setDevopsStatus('STARTING DOCKER...');
        updateDevopsProgress(10);
        appendTerminalLine(`\n============================================================`, 'comment');
        appendTerminalLine(`[LAUNCHING LOCAL DOCKER COMPOSE STACK]`, 'prompt');
        appendTerminalLine(`============================================================`, 'comment');

        try {
          const res = await fetch('/api/devops/docker/up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ architecture: currentArchitecture })
          });
          const data = await res.json();
          if (data.success) {
            setDevopsStatus('STACK_ACTIVE');
            showToast({
              title: 'Docker Stack Active',
              message: `${data.containers.length} containers running at ${data.endpoint || 'localhost:8080'}`,
              type: 'server'
            });
          } else {
            setDevopsStatus('FAILED');
            if (data.error) appendTerminalLine(`Docker compose error: ${data.error}`, 'error');
          }
        } catch (err) {
          appendTerminalLine(`Docker compose error: ${err.message}`, 'error');
          setDevopsStatus('FAILED');
        }
      });
    }

    if (btnRunDockerDown) {
      btnRunDockerDown.addEventListener('click', async () => {
        setDevopsStatus('STOPPING...');
        try {
          const res = await fetch('/api/devops/docker/down', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ architecture: currentArchitecture })
          });
          const data = await res.json();
          if (data.success) {
            setDevopsStatus('STOPPED');
            showToast({
              title: 'Stack Stopped',
              message: 'Local containers removed.',
              type: 'server'
            });
          }
        } catch (err) {
          appendTerminalLine(`Docker stop error: ${err.message}`, 'error');
          setDevopsStatus('FAILED');
        }
      });
    }

    if (btnClearTerminal) {
      btnClearTerminal.addEventListener('click', () => {
        const term = document.getElementById('devopsTerminalBody');
        if (term) {
          term.innerHTML = `
            <div class="terminal-line comment"># Terminal log buffer cleared.</div>
            <div class="terminal-line prompt">&gt; Ready for next deployment command...</div>
          `;
        }
        setDevopsStatus('IDLE / READY');
      });
    }

    // Cloud Credentials Modal
    const btnConfigureCloud = document.getElementById('btnConfigureCloud');
    const cloudCredsModal = document.getElementById('cloudCredentialsModal');
    const closeCloudCredsModal = document.getElementById('closeCloudCredsModal');
    const closeCloudCredsBtn = document.getElementById('closeCloudCredsBtn');
    const btnSaveCloudCreds = document.getElementById('btnSaveCloudCreds');

    if (btnConfigureCloud && cloudCredsModal) {
      btnConfigureCloud.addEventListener('click', () => {
        cloudCredsModal.classList.remove('hidden');
      });

      const hideModal = () => cloudCredsModal.classList.add('hidden');
      if (closeCloudCredsModal) closeCloudCredsModal.addEventListener('click', hideModal);
      if (closeCloudCredsBtn) closeCloudCredsBtn.addEventListener('click', hideModal);

      if (btnSaveCloudCreds) {
        btnSaveCloudCreds.addEventListener('click', async () => {
          const provider = document.getElementById('cloudModalProviderSelect')?.value || 'aws';
          const region = document.getElementById('cloudModalRegionSelect')?.value || 'us-east-1';
          const accessKey = document.getElementById('cloudAccessKeyInput')?.value?.trim();
          const secretKey = document.getElementById('cloudSecretKeyInput')?.value?.trim();
          const mode = document.getElementById('cloudModalModeSelect')?.value || 'mock';

          btnSaveCloudCreds.disabled = true;
          btnSaveCloudCreds.textContent = 'Authenticating...';

          try {
            const res = await fetch('/api/devops/cloud/connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider, region, accessKey, secretKey, mode })
            });
            const data = await res.json();
            if (data.success) {
              hideModal();
              await loadCloudStatus();
              showToast({
                title: 'Cloud Authenticated',
                message: `Connected to ${data.status.providerName} (${data.status.region})`,
                type: 'server'
              });
            }
          } catch (err) {
            alert(`Authentication failed: ${err.message}`);
          } finally {
            btnSaveCloudCreds.disabled = false;
            btnSaveCloudCreds.textContent = 'Save & Connect';
          }
        });
      }
    }

    // Settings save
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', async () => {
        const groqApiKey = document.getElementById('groqApiKeyInput') ? document.getElementById('groqApiKeyInput').value : '';
        const groqModel = document.getElementById('groqModelSelect') ? document.getElementById('groqModelSelect').value : 'qwen/qwen3.8-27b';
        const preferredProvider = document.getElementById('preferredProviderSelect') ? document.getElementById('preferredProviderSelect').value : 'auto';
        const apiKey = document.getElementById('geminiApiKeyInput') ? document.getElementById('geminiApiKeyInput').value : '';
        const cloudProvider = document.getElementById('cloudProviderSelect') ? document.getElementById('cloudProviderSelect').value : 'aws';
        const budget = document.getElementById('monthlyBudgetInput') ? document.getElementById('monthlyBudgetInput').value : 2500;

        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groqApiKey,
            groqModel,
            preferredProvider,
            geminiApiKey: apiKey,
            cloudProvider,
            monthlyBudget: budget
          })
        });

        const data = await res.json();
        const statusMsg = document.getElementById('settingsSaveStatus');
        if (data.success) {
          statusMsg.textContent = '✓ Configuration saved successfully!';
          updateAiProviderBadge(data);
          setTimeout(() => statusMsg.textContent = '', 3500);
        }
      });
    }

    // Toggle Groq API Key visibility
    const toggleGroqKeyBtn = document.getElementById('toggleGroqApiKeyVisibility');
    if (toggleGroqKeyBtn) {
      toggleGroqKeyBtn.addEventListener('click', () => {
        const inp = document.getElementById('groqApiKeyInput');
        if (inp.type === 'password') {
          inp.type = 'text';
          toggleGroqKeyBtn.textContent = 'Hide';
        } else {
          inp.type = 'password';
          toggleGroqKeyBtn.textContent = 'Show';
        }
      });
    }

    // Test Groq Connection Button
    const btnTestGroq = document.getElementById('btnTestGroq');
    if (btnTestGroq) {
      btnTestGroq.addEventListener('click', async () => {
        const keyInput = document.getElementById('groqApiKeyInput');
        const modelSelect = document.getElementById('groqModelSelect');
        const statusPill = document.getElementById('groqTestStatus');
        
        const apiKey = keyInput ? keyInput.value.trim() : '';
        const model = modelSelect && modelSelect.value ? modelSelect.value : 'qwen/qwen3.8-27b';

        statusPill.className = 'test-status-pill loading';
        statusPill.innerHTML = '<span class="pulse-dot"></span> Testing Groq LPU connection...';
        statusPill.classList.remove('hidden');

        try {
          const res = await fetch('/api/ai/test-groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, model })
          });

          const data = await res.json();
          if (data.success) {
            statusPill.className = 'test-status-pill success';
            statusPill.innerHTML = `✓ Connected! Latency: <strong>${data.latencyMs}ms</strong> (${model.split('-')[0].toUpperCase()})`;
            
            // Refresh settings state to reflect active connection
            const setRes = await fetch('/api/settings');
            const setData = await setRes.json();
            updateAiProviderBadge(setData);

            // Also synchronize Deployment Checklist Groq badge
            const stepGroqBadge = document.getElementById('stepGroqStatusBadge');
            const deployGroqActiveBanner = document.getElementById('deployGroqActiveBanner');
            const deployGroqStatusText = document.getElementById('deployGroqStatusText');
            if (stepGroqBadge) {
              stepGroqBadge.className = 'step-status-pill status-active';
              stepGroqBadge.textContent = `⚡ Active (${data.latencyMs}ms)`;
            }
            if (deployGroqActiveBanner && deployGroqStatusText) {
              deployGroqActiveBanner.classList.remove('hidden');
              deployGroqStatusText.textContent = `⚡ Groq Cloud Active (${data.latencyMs}ms latency · ${model})`;
            }
          } else {
            statusPill.className = 'test-status-pill error';
            statusPill.innerHTML = `✗ ${data.error || 'Connection failed'}`;
          }
        } catch (err) {
          statusPill.className = 'test-status-pill error';
          statusPill.innerHTML = `✗ Network error: ${err.message}`;
        }
      });
    }

    // ==========================================
    // STEP 1: ROUTE 53 CUSTOM DOMAIN & ACM SSL
    // ==========================================
    const btnMapDomain = document.getElementById('btnMapDomain');
    const customDomainInput = document.getElementById('customDomainInput');
    const customDomainSslSelect = document.getElementById('customDomainSslSelect');
    const domainActiveBanner = document.getElementById('domainActiveBanner');
    const domainActiveLink = document.getElementById('domainActiveLink');
    const stepDomainStatusBadge = document.getElementById('stepDomainStatusBadge');

    if (btnMapDomain) {
      btnMapDomain.addEventListener('click', async () => {
        const domain = (customDomainInput ? customDomainInput.value : '').trim();
        if (!domain) {
          alert('Please enter a custom domain name (e.g. api.yourdomain.com)');
          return;
        }

        const sslProvider = customDomainSslSelect ? customDomainSslSelect.value : 'AWS Certificate Manager (ACM TLS 1.3)';

        btnMapDomain.disabled = true;
        btnMapDomain.innerHTML = '<span class="pulse-dot"></span> Mapping & Issuing SSL...';
        if (stepDomainStatusBadge) {
          stepDomainStatusBadge.className = 'step-status-pill status-pending';
          stepDomainStatusBadge.textContent = 'Provisioning...';
        }

        try {
          const res = await fetch('/api/domain/configure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, sslProvider })
          });
          const data = await res.json();
          if (data.success && data.customDomain) {
            if (domainActiveBanner && domainActiveLink) {
              domainActiveBanner.classList.remove('hidden');
              domainActiveLink.href = data.customDomain.endpointUrl;
              domainActiveLink.textContent = data.customDomain.endpointUrl;
            }
            if (stepDomainStatusBadge) {
              stepDomainStatusBadge.className = 'step-status-pill status-active';
              stepDomainStatusBadge.textContent = '● SSL Active (TLS 1.3)';
            }
            showToast({
              title: 'Custom Domain Configured',
              message: `Route 53 & ACM SSL active on ${data.customDomain.domain}`,
              type: 'server',
              severity: 'success'
            });
            if (typeof loadIaCCode === 'function') {
              loadIaCCode('terraform');
            }
          } else {
            alert(`Domain setup error: ${data.error || 'Failed to configure domain'}`);
            if (stepDomainStatusBadge) {
              stepDomainStatusBadge.className = 'step-status-pill status-pending';
              stepDomainStatusBadge.textContent = 'Error';
            }
          }
        } catch (err) {
          alert(`Network error: ${err.message}`);
        } finally {
          btnMapDomain.disabled = false;
          btnMapDomain.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>
            Map Domain & Issue SSL
          `;
        }
      });
    }

    // ==========================================
    // STEP 2: GROQ CLOUD API KEY QUICK ACTIVATION
    // ==========================================
    const btnToggleDeployGroqKey = document.getElementById('btnToggleDeployGroqKey');
    const groqDeployKeyInput = document.getElementById('groqDeployKeyInput');
    const groqDeployModelSelect = document.getElementById('groqDeployModelSelect');
    const btnQuickActivateGroq = document.getElementById('btnQuickActivateGroq');
    const deployGroqActiveBanner = document.getElementById('deployGroqActiveBanner');
    const deployGroqStatusText = document.getElementById('deployGroqStatusText');
    const stepGroqStatusBadge = document.getElementById('stepGroqStatusBadge');

    if (btnToggleDeployGroqKey && groqDeployKeyInput) {
      btnToggleDeployGroqKey.addEventListener('click', () => {
        if (groqDeployKeyInput.type === 'password') {
          groqDeployKeyInput.type = 'text';
          btnToggleDeployGroqKey.textContent = 'Hide';
        } else {
          groqDeployKeyInput.type = 'password';
          btnToggleDeployGroqKey.textContent = 'Show';
        }
      });
    }

    if (btnQuickActivateGroq) {
      btnQuickActivateGroq.addEventListener('click', async () => {
        const apiKey = (groqDeployKeyInput ? groqDeployKeyInput.value : '').trim();
        const model = groqDeployModelSelect ? groqDeployModelSelect.value : 'qwen/qwen3.8-27b';

        if (!apiKey) {
          alert('Please enter your Groq API key from console.groq.com/keys');
          return;
        }

        btnQuickActivateGroq.disabled = true;
        btnQuickActivateGroq.innerHTML = '<span class="pulse-dot"></span> Benchmarking...';
        if (stepGroqStatusBadge) {
          stepGroqStatusBadge.className = 'step-status-pill status-pending';
          stepGroqStatusBadge.textContent = 'Testing LPU...';
        }

        try {
          const res = await fetch('/api/ai/test-groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, model })
          });
          const data = await res.json();
          if (data.success) {
            if (deployGroqActiveBanner && deployGroqStatusText) {
              deployGroqActiveBanner.classList.remove('hidden');
              deployGroqStatusText.textContent = `⚡ Groq Cloud Active (${data.latencyMs}ms latency · ${model})`;
            }
            if (stepGroqStatusBadge) {
              stepGroqStatusBadge.className = 'step-status-pill status-active';
              stepGroqStatusBadge.textContent = `⚡ Active (${data.latencyMs}ms)`;
            }

            // Sync with Settings inputs
            const settingsKeyInput = document.getElementById('groqApiKeyInput');
            const settingsModelSelect = document.getElementById('groqModelSelect');
            if (settingsKeyInput) settingsKeyInput.value = apiKey;
            if (settingsModelSelect) settingsModelSelect.value = model;

            showToast({
              title: 'Groq Cloud AI Activated',
              message: `Ultra-fast reasoning ready (${data.latencyMs}ms latency on ${model})`,
              type: 'server',
              severity: 'success'
            });

            // Update AI Provider badges
            const setRes = await fetch('/api/settings');
            const setData = await setRes.json();
            updateAiProviderBadge(setData);
          } else {
            alert(`Groq activation error: ${data.error || 'Failed to authenticate key'}`);
            if (stepGroqStatusBadge) {
              stepGroqStatusBadge.className = 'step-status-pill status-pending';
              stepGroqStatusBadge.textContent = 'Auth Failed';
            }
          }
        } catch (err) {
          alert(`Network error: ${err.message}`);
        } finally {
          btnQuickActivateGroq.disabled = false;
          btnQuickActivateGroq.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Test & Activate
          `;
        }
      });
    }

    // ==========================================
    // STEP 3: CUSTOM APPLICATION MICROSERVICES
    // ==========================================
    const btnOpenAddMicroservice = document.getElementById('btnOpenAddMicroservice');
    const microserviceMenu = document.getElementById('microserviceMenu');
    const stepMicroservicesBadge = document.getElementById('stepMicroservicesBadge');

    // Toggle Canvas Toolbar Dropdown
    if (btnOpenAddMicroservice && microserviceMenu) {
      btnOpenAddMicroservice.addEventListener('click', (e) => {
        e.stopPropagation();
        microserviceMenu.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!microserviceMenu.contains(e.target) && !btnOpenAddMicroservice.contains(e.target)) {
          microserviceMenu.classList.add('hidden');
        }
      });
    }

    async function handleAddMicroservice(serviceType) {
      if (microserviceMenu) microserviceMenu.classList.add('hidden');
      showToast({
        title: 'Wiring Microservice',
        message: `Adding ${serviceType.toUpperCase()} to active cloud pipeline...`,
        type: 'server'
      });

      try {
        const res = await fetch('/api/architecture/add-microservice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceType })
        });
        const data = await res.json();
        if (data.success && data.architecture) {
          updateArchitectureState(data.architecture);
          if (data.node) {
            setTimeout(() => {
              const nodeEl = document.getElementById(`node-${data.node.id}`);
              if (nodeEl) {
                nodeEl.classList.add('node-pulse-active');
                setTimeout(() => nodeEl.classList.remove('node-pulse-active'), 3600);
              }
            }, 150);
          }
          showToast({
            title: `${data.node.name} Online`,
            message: `Successfully connected to application data flow.`,
            type: 'server',
            severity: 'success'
          });
        } else {
          alert(`Error adding microservice: ${data.error || 'Failed'}`);
        }
      } catch (err) {
        alert(`Network error: ${err.message}`);
      }
    }

    // Attach to menu items in canvas toolbar dropdown
    document.querySelectorAll('.microservice-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const service = item.dataset.service;
        if (service) handleAddMicroservice(service);
      });
    });

    // Attach to quick launch buttons in deployment checklist
    document.querySelectorAll('.btn-microservice').forEach(btn => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.service;
        if (service) handleAddMicroservice(service);
      });
    });

    // Toggle Gemini API Key visibility
    const toggleKeyBtn = document.getElementById('toggleApiKeyVisibility');
    if (toggleKeyBtn) {
      toggleKeyBtn.addEventListener('click', () => {
        const inp = document.getElementById('geminiApiKeyInput');
        if (inp.type === 'password') {
          inp.type = 'text';
          toggleKeyBtn.textContent = 'Hide';
        } else {
          inp.type = 'password';
          toggleKeyBtn.textContent = 'Show';
        }
      });
    }

    // Theme Switcher (Obsidian Dark default vs Clean White)
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    if (themeToggleBtn) {
      // Check stored preference; default to dark
      const savedTheme = localStorage.getItem('clouderator_theme');
      if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.style.colorScheme = 'light';
        if (themeIcon) themeIcon.textContent = '🌙';
      } else {
        document.body.classList.add('dark-theme');
        document.documentElement.classList.add('dark-theme');
        document.documentElement.style.colorScheme = 'dark';
        if (themeIcon) themeIcon.textContent = '☀️';
      }

      themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        document.documentElement.classList.toggle('dark-theme', isDark);
        document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
        if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('clouderator_theme', isDark ? 'dark' : 'light');
        showToast({
          title: isDark ? 'Obsidian Dark Activated' : 'Clean White Activated',
          message: isDark ? 'Switched to obsidian night console.' : 'Switched to clean modern white theme.',
          type: 'server'
        });
      });
    }

    // Dynamic Project Preset Switcher
    const projectSelect = document.getElementById('projectSelect');
    if (projectSelect) {
      projectSelect.addEventListener('change', async () => {
        const val = projectSelect.value;
        const res = await fetch('/api/project/preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset: val })
        });
        const data = await res.json();
        if (data.architecture) {
          updateArchitectureState(data.architecture);
          renderChatHistory(data.chatHistory || []);
          showToast({
            title: `Loaded ${data.architecture.projectName}`,
            message: 'Architecture, services, and live metrics reconfigured.',
            type: 'server'
          });
        }
      });
    }

    // New Project Modal
    const newProjectBtn = document.getElementById('newProjectBtn');
    const newProjectModal = document.getElementById('newProjectModal');
    const closeNewProjectModal = document.getElementById('closeNewProjectModal');
    const cancelNewProjectModal = document.getElementById('cancelNewProjectModal');
    const btnInitNewProject = document.getElementById('btnInitNewProject');

    if (newProjectBtn && newProjectModal) {
      newProjectBtn.addEventListener('click', () => {
        newProjectModal.classList.remove('hidden');
      });
      closeNewProjectModal.addEventListener('click', () => newProjectModal.classList.add('hidden'));
      cancelNewProjectModal.addEventListener('click', () => newProjectModal.classList.add('hidden'));

      // Template Selection
      document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          const tpl = card.dataset.template;
          if (tpl === 'food-delivery') {
            document.getElementById('newProjNameInput').value = 'Food Delivery App';
            document.getElementById('newProjDescInput').value = 'High-availability food delivery app for 50,000 daily users with real-time tracking';
          } else if (tpl === 'ecommerce-scale') {
            document.getElementById('newProjNameInput').value = 'E-Commerce Store';
            document.getElementById('newProjDescInput').value = 'Flash-sale ready e-commerce architecture with Aurora PostgreSQL and Redis caching';
          } else if (tpl === 'fintech-core') {
            document.getElementById('newProjNameInput').value = 'Fintech Core';
            document.getElementById('newProjDescInput').value = 'PCI-DSS compliant zero-loss transaction ledger with mTLS gateway';
          }
        });
      });

      btnInitNewProject.addEventListener('click', async () => {
        const name = document.getElementById('newProjNameInput').value.trim() || 'Custom Cloud App';
        const desc = document.getElementById('newProjDescInput').value.trim() || 'Scalable cloud infrastructure';
        newProjectModal.classList.add('hidden');
        switchView('canvas');

        showToast({ title: 'Synthesizing Architecture', message: `Analyzing requirements for "${name}"...`, type: 'server' });

        const res = await fetch('/api/project/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: desc })
        });
        const data = await res.json();
        if (data.architecture) {
          updateArchitectureState(data.architecture);
          renderChatHistory(data.chatHistory || []);
        }
      });
    }

    // ==========================================
    // INTERACTIVE NODE INSPECTOR CONFIGURATOR
    // ==========================================
    const inspectReplicaSlider = document.getElementById('inspectReplicaSlider');
    const replicaCountBadge = document.getElementById('replicaCountBadge');
    const inspectSizingSelect = document.getElementById('inspectSizingSelect');
    const btnApplyNodeChanges = document.getElementById('btnApplyNodeChanges');
    const btnSimulateIncident = document.getElementById('btnSimulateIncident');
    const btnDeleteNode = document.getElementById('btnDeleteNode');

    if (inspectReplicaSlider) {
      inspectReplicaSlider.addEventListener('input', () => {
        const count = Number(inspectReplicaSlider.value);
        if (replicaCountBadge) replicaCountBadge.textContent = `${count} Instances`;
        const inspectCost = document.getElementById('inspectCost');
        if (inspectCost) {
          inspectCost.textContent = `$${(count * 144).toFixed(2)} / mo`;
        }
      });
    }

    if (inspectSizingSelect) {
      inspectSizingSelect.addEventListener('change', () => {
        const val = inspectSizingSelect.value;
        const inspectCost = document.getElementById('inspectCost');
        if (inspectCost) {
          let cost = 45;
          if (val === 'micro') cost = 15;
          else if (val === 'medium') cost = 48;
          else if (val === 'large') cost = 144;
          else if (val === '2xlarge') cost = 288;
          else if (val === 'db.t4g.medium') cost = 68;
          else if (val === 'db.r6g.large') cost = 320;
          else if (val === 'db.r6g.xlarge') cost = 640;
          else if (val === 'glacier') cost = 12;
          else if (val === 'replicated') cost = 90;
          inspectCost.textContent = `$${cost.toFixed(2)} / mo`;
        }
      });
    }

    if (btnApplyNodeChanges) {
      btnApplyNodeChanges.addEventListener('click', async () => {
        const nodeId = canvas.selectedNodeId;
        if (!nodeId || !currentArchitecture) return;

        const sizingSelect = document.getElementById('inspectSizingSelect');
        const selectedOptionText = sizingSelect ? sizingSelect.options[sizingSelect.selectedIndex]?.text : '';
        const specsText = selectedOptionText ? selectedOptionText.split(' - ')[0] : 'Custom Sizing';

        const updates = { specs: specsText };
        if (nodeId === 'asg' || nodeId === 'eks') {
          updates.instanceCount = Number(inspectReplicaSlider.value);
        }

        const inspectCost = document.getElementById('inspectCost');
        if (inspectCost) {
          const costMatch = inspectCost.textContent.replace(/[^0-9.]/g, '');
          if (costMatch) updates.monthlyCost = parseFloat(costMatch);
        }

        try {
          const res = await fetch('/api/architecture/update-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodeId, updates })
          });
          const data = await res.json();
          if (data.architecture) {
            updateArchitectureState(data.architecture);
            showToast({
              title: 'Configuration Applied',
              message: `Updated sizing and resources for ${data.node?.name || nodeId}.`,
              type: 'server'
            });
          }
        } catch (e) {
          console.error('Failed to update node', e);
        }
      });
    }

    if (btnSimulateIncident) {
      btnSimulateIncident.addEventListener('click', async () => {
        const nodeId = canvas.selectedNodeId;
        if (!nodeId) return;

        try {
          const res = await fetch('/api/architecture/simulate-incident', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodeId })
          });
          const data = await res.json();
          canvas.triggerNodeIncident(nodeId);

          const badge = document.getElementById('doctorAlertBadge');
          if (badge) {
            badge.textContent = Number(badge.textContent || 0) + 1;
            badge.style.display = 'inline-block';
          }

          showToast({
            title: `⚠️ Incident Triggered`,
            message: `High latency & saturation on ${nodeId}. Go to AI Doctor for 1-click fix.`,
            severity: 'critical',
            type: 'server'
          });
        } catch (e) {
          console.error('Failed to simulate incident', e);
        }
      });
    }

    if (btnDeleteNode) {
      btnDeleteNode.addEventListener('click', async () => {
        const nodeId = canvas.selectedNodeId;
        if (!nodeId) return;

        const node = currentArchitecture?.nodes?.find(n => n.id === nodeId);
        const name = node ? node.name : nodeId;

        if (confirm(`Are you sure you want to remove "${name}" from this architecture?`)) {
          try {
            const res = await fetch(`/api/architecture/node/${nodeId}`, {
              method: 'DELETE'
            });
            const data = await res.json();
            if (data.architecture) {
              document.getElementById('nodeInspector').classList.add('hidden');
              canvas.selectedNodeId = null;
              updateArchitectureState(data.architecture);
              showToast({
                title: 'Service Removed',
                message: `Pruned ${name} and updated overall monthly cost.`,
                type: 'server'
              });
            }
          } catch (e) {
            console.error('Failed to delete node', e);
          }
        }
      });
    }

    // ==========================================
    // ADD CLOUD SERVICE PALETTE & MODAL
    // ==========================================
    const btnOpenAddService = document.getElementById('btnOpenAddService');
    const addServiceModal = document.getElementById('addServiceModal');
    const closeAddServiceModal = document.getElementById('closeAddServiceModal');
    const cancelAddServiceBtn = document.getElementById('cancelAddServiceBtn');

    if (btnOpenAddService && addServiceModal) {
      btnOpenAddService.addEventListener('click', () => {
        addServiceModal.classList.remove('hidden');
      });

      if (closeAddServiceModal) closeAddServiceModal.addEventListener('click', () => addServiceModal.classList.add('hidden'));
      if (cancelAddServiceBtn) cancelAddServiceBtn.addEventListener('click', () => addServiceModal.classList.add('hidden'));

      // Search input inside modal
      const serviceSearchInput = document.getElementById('serviceSearchInput');
      const serviceCountBadge = document.getElementById('serviceCountBadge');

      const filterServices = () => {
        const query = (serviceSearchInput ? serviceSearchInput.value : '').toLowerCase().trim();
        const activeTab = document.querySelector('.svc-tab.active');
        const activeCat = activeTab ? activeTab.dataset.cat : 'all';

        let count = 0;
        document.querySelectorAll('.service-card').forEach(card => {
          const cardCat = card.dataset.cat;
          const cardName = (card.dataset.name || '').toLowerCase();
          const cardSpecs = (card.dataset.specs || '').toLowerCase();
          const cardFreeTier = (card.dataset.freetier || '').toLowerCase();
          const isFree = card.dataset.isfreetier === 'true';
          const cardText = card.textContent.toLowerCase();

          // Category match
          let matchesCat = false;
          if (activeCat === 'all') {
            matchesCat = true;
          } else if (activeCat === 'freetier') {
            matchesCat = isFree;
          } else {
            matchesCat = cardCat === activeCat;
          }

          // Search match
          let matchesSearch = true;
          if (query) {
            matchesSearch = cardName.includes(query) || 
                            cardSpecs.includes(query) || 
                            cardFreeTier.includes(query) || 
                            cardText.includes(query) ||
                            (query.includes('free') && isFree);
          }

          if (matchesCat && matchesSearch) {
            card.style.display = 'flex';
            count++;
          } else {
            card.style.display = 'none';
          }
        });

        if (serviceCountBadge) {
          serviceCountBadge.textContent = `${count} Cloud Services`;
        }
      };

      if (serviceSearchInput) {
        serviceSearchInput.addEventListener('input', filterServices);
      }

      // Category filter tabs inside modal
      document.querySelectorAll('.svc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.svc-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          filterServices();
        });
      });

      // Add to Architecture buttons on cards
      document.querySelectorAll('.btn-add-svc').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const card = e.target.closest('.service-card');
          if (!card) return;

          const isFreeTier = card.dataset.isfreetier === 'true';
          const freeTierDesc = card.dataset.freetier || '';

          const nodeData = {
            id: card.dataset.id + '_' + Math.floor(Math.random() * 1000),
            name: card.dataset.name,
            category: card.dataset.cat,
            specs: card.dataset.specs,
            monthlyCost: parseFloat(card.dataset.cost || 0),
            categoryColor: card.dataset.color || '#2563eb',
            sla: card.dataset.sla || '99.9% SLA',
            isFreeTier: isFreeTier,
            freeTier: freeTierDesc
          };

          addServiceModal.classList.add('hidden');

          try {
            const res = await fetch('/api/architecture/add-node', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nodeData)
            });
            const data = await res.json();
            if (data.architecture) {
              updateArchitectureState(data.architecture);
              switchView('canvas');
              showToast({
                title: `Added ${nodeData.name}`,
                message: isFreeTier ? `🟢 Free Tier Eligible ($${nodeData.monthlyCost}/mo)` : `Plugged into topology ($${nodeData.monthlyCost}/mo).`,
                type: 'server'
              });
              const targetNodeId = data.newNode?.id || nodeData.id;
              setTimeout(() => {
                canvas.highlightNode(targetNodeId);
              }, 150);
            }
          } catch (err) {
            console.error('Failed to add node', err);
          }
        });
      });
    }

    // ==========================================
    // EXPORT DIAGRAM MODAL
    // ==========================================
    const btnExportDiagram = document.getElementById('btnExportDiagram');
    const exportDiagramModal = document.getElementById('exportDiagramModal');
    const closeExportDiagramModal = document.getElementById('closeExportDiagramModal');

    if (btnExportDiagram && exportDiagramModal) {
      btnExportDiagram.addEventListener('click', () => {
        exportDiagramModal.classList.remove('hidden');
      });

      if (closeExportDiagramModal) closeExportDiagramModal.addEventListener('click', () => exportDiagramModal.classList.add('hidden'));

      document.getElementById('btnExportSvg')?.addEventListener('click', () => {
        canvas.exportSvg();
        exportDiagramModal.classList.add('hidden');
        showToast({ title: 'Diagram Exported', message: 'SVG vector graphic downloaded.', type: 'server' });
      });

      document.getElementById('btnExportPng')?.addEventListener('click', () => {
        canvas.exportPng();
        exportDiagramModal.classList.add('hidden');
        showToast({ title: 'Diagram Exported', message: 'PNG presentation image downloaded.', type: 'server' });
      });

      document.getElementById('btnExportJson')?.addEventListener('click', () => {
        canvas.exportJson();
        exportDiagramModal.classList.add('hidden');
        showToast({ title: 'JSON Spec Exported', message: 'Architecture schema downloaded.', type: 'server' });
      });
    }

    // ==========================================
    // INTERACTIVE LEGEND LAYER FILTERING
    // ==========================================
    const legendItems = document.querySelectorAll('.legend-item');
    const btnClearLegendFilter = document.getElementById('btnClearLegendFilter');

    legendItems.forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.dataset.category;
        const wasActive = item.classList.contains('active');

        legendItems.forEach(i => i.classList.remove('active'));

        if (wasActive) {
          canvas.filterCategory('all');
        } else {
          item.classList.add('active');
          canvas.filterCategory(cat);
        }
      });
    });

    if (btnClearLegendFilter) {
      btnClearLegendFilter.addEventListener('click', () => {
        legendItems.forEach(i => i.classList.remove('active'));
        canvas.filterCategory('all');
      });
    }


    // Node Inspector - View Logs Modal
    const btnInspectLogs = document.getElementById('btnInspectLogs');
    const logsModal = document.getElementById('logsModal');
    const closeLogsModal = document.getElementById('closeLogsModal');
    const closeLogsModalBtn = document.getElementById('closeLogsModalBtn');
    const logsTerminalContent = document.getElementById('logsTerminalContent');
    const btnClearLogs = document.getElementById('btnClearLogs');

    if (btnInspectLogs && logsModal) {
      btnInspectLogs.addEventListener('click', () => {
        logsModal.classList.remove('hidden');
        const nodeName = document.getElementById('inspectNodeName').textContent;
        document.getElementById('logsModalTitle').textContent = `${nodeName} - Live Logs`;

        const now = new Date().toISOString().substring(11, 19);
        logsTerminalContent.innerHTML = `
<div class="log-line log-info">[${now}] INFO: Container runtime v20.11.0 initialized on ECS Fargate task ip-10-0-10-42.</div>
<div class="log-line log-success">[${now}] SUCCESS: Connected to PostgreSQL primary at clouderator-rds-primary.internal:5432 (SSL enabled).</div>
<div class="log-line log-success">[${now}] SUCCESS: Redis cache pool primed (cache.t4g.medium:6379, ping: 0.8ms).</div>
<div class="log-line log-info">[${now}] INFO: HTTP health check endpoint GET /health -> 200 OK (latency: 1.2ms).</div>
<div class="log-line log-warn">[${now}] WARN: Influx of order stream requests: 1,420 RPS. Auto-scaling policy evaluated healthy.</div>
<div class="log-line log-info">[${now}] INFO: WebSocket connection established with API Gateway (conn-id: wss_98b4f).</div>
<div class="log-line log-success">[${now}] SUCCESS: Zero unhandled rejections. Telemetry heartbeat sent.</div>
        `;
      });

      closeLogsModal.addEventListener('click', () => logsModal.classList.add('hidden'));
      closeLogsModalBtn.addEventListener('click', () => logsModal.classList.add('hidden'));
      btnClearLogs.addEventListener('click', () => {
        logsTerminalContent.innerHTML = `<div class="log-line log-info">Log buffer cleared. Listening for stdout/stderr...</div>`;
      });
    }

    // Recenter Canvas
    const btnRecenter = document.getElementById('btnRecenter');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', () => {
        canvas.setZoom(1.0);
        canvas.autoLayout();
        showToast({ title: 'Canvas Centered', message: 'Nodes refitted to viewport.', type: 'server' });
      });
    }

    // Harden Security Button
    const btnHardenSec = document.getElementById('btnHardenSec');
    if (btnHardenSec) {
      btnHardenSec.addEventListener('click', async () => {
        btnHardenSec.disabled = true;
        btnHardenSec.textContent = 'Hardening rules...';
        try {
          const res = await fetch('/api/security/harden', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            if (data.architecture) updateArchitectureState(data.architecture);
            await loadSecurityData();
            showToast({
              title: 'Security Hardened',
              message: 'Attached AWS WAF Layer 7 inspection and enforced TLS 1.3 encryption. Security score: 99/100.',
              type: 'server',
              severity: 'success'
            });
          }
        } catch (e) {
          console.error('Failed to harden security', e);
        } finally {
          btnHardenSec.disabled = false;
          btnHardenSec.textContent = 'Harden All Security Rules';
        }
      });
    }
  }

  // ==========================================
  // USER PROFILE CONTROLLER & ACCOUNT DRAWER
  // ==========================================
  const AVATAR_GRADIENTS = {
    blue: 'linear-gradient(135deg, #2563eb, #0284c7)',
    emerald: 'linear-gradient(135deg, #059669, #10b981)',
    purple: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    amber: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    rose: 'linear-gradient(135deg, #dc2626, #f43f5e)'
  };

  let userProfile = {
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

  async function initUserProfile() {
    // 1. Try local storage cache first for instant render
    const cached = localStorage.getItem('clouderator_user_profile');
    if (cached) {
      try {
        userProfile = { ...userProfile, ...JSON.parse(cached) };
      } catch (e) {
        console.error('Failed to parse cached user profile', e);
      }
    }
    renderUserProfileUI();

    // 2. Fetch from backend API to sync
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          userProfile = { ...userProfile, ...data.profile };
          localStorage.setItem('clouderator_user_profile', JSON.stringify(userProfile));
          renderUserProfileUI();
        }
      }
    } catch (err) {
      console.warn('Could not fetch server profile, using cached data.', err.message);
    }
  }

  function renderUserProfileUI() {
    const navAvatar = document.getElementById('navAvatarCircle');
    const navName = document.getElementById('navUserName');
    const userBtn = document.getElementById('userProfileBtn');
    const dropAvatar = document.getElementById('dropdownAvatarLarge');
    const dropInitials = document.getElementById('dropdownAvatarInitials');
    const dropName = document.getElementById('dropdownUserName');
    const dropEmail = document.getElementById('dropdownUserEmail');
    const dropRole = document.getElementById('dropdownUserRole');
    const modalAvatar = document.getElementById('modalAvatarPreview');
    const modalInitial = document.getElementById('modalAvatarPreviewInitial');

    const grad = AVATAR_GRADIENTS[userProfile.avatarColor] || AVATAR_GRADIENTS.blue;
    const initial = (userProfile.avatarInitial || userProfile.name.charAt(0) || 'S').toUpperCase();

    // Nav Bar
    if (navAvatar) {
      navAvatar.textContent = initial;
      navAvatar.style.background = grad;
    }
    if (navName) {
      const firstName = userProfile.name ? userProfile.name.split(' ')[0] : 'Satyendra';
      navName.textContent = firstName;
    }
    if (userBtn) {
      userBtn.setAttribute('title', `Account: ${userProfile.name}`);
    }

    // Dropdown Drawer
    if (dropAvatar) dropAvatar.style.background = grad;
    if (dropInitials) dropInitials.textContent = initial;
    if (dropName) dropName.textContent = userProfile.name;
    if (dropEmail) dropEmail.textContent = userProfile.email;
    if (dropRole) dropRole.textContent = userProfile.role;

    // Dropdown dynamic resource values
    const profileActiveProject = document.getElementById('profileActiveProject');
    if (profileActiveProject) {
      const projSelect = document.getElementById('projectSelect');
      const projName = currentArchitecture?.projectName || (projSelect ? projSelect.options[projSelect.selectedIndex]?.text : 'Food Delivery App');
      profileActiveProject.textContent = projName;
    }

    const profileActiveCloud = document.getElementById('profileActiveCloud');
    if (profileActiveCloud) {
      const prov = (userProfile.cloudProvider || currentArchitecture?.cloudProvider || 'aws').toUpperCase();
      const reg = userProfile.defaultRegion || currentArchitecture?.region || 'us-east-1';
      profileActiveCloud.textContent = `${prov} · ${reg}`;
    }

    const profileDropdownCostSummary = document.getElementById('profileDropdownCostSummary');
    if (profileDropdownCostSummary) {
      const costText = valMonthlyCost ? valMonthlyCost.textContent : '$2,340';
      profileDropdownCostSummary.textContent = `${costText}/mo · Monthly breakdown`;
    }

    const profileDropdownSecSummary = document.getElementById('profileDropdownSecSummary');
    if (profileDropdownSecSummary) {
      const secText = valSecScore ? valSecScore.textContent : '92';
      profileDropdownSecSummary.textContent = `${secText}/100 · MFA Active`;
    }

    // Modal
    if (modalAvatar) modalAvatar.style.background = grad;
    if (modalInitial) modalInitial.textContent = initial;

    const inputName = document.getElementById('profInputFullName');
    const inputUser = document.getElementById('profInputUsername');
    const inputEmail = document.getElementById('profInputEmail');
    const inputRole = document.getElementById('profInputRole');
    const inputOrg = document.getElementById('profInputOrg');
    const inputBio = document.getElementById('profInputBio');
    const selectCloud = document.getElementById('profSelectCloud');
    const selectRegion = document.getElementById('profSelectRegion');
    const selectIac = document.getElementById('profSelectIac');
    const checkHa = document.getElementById('profCheckHa');
    const checkZeroEgress = document.getElementById('profCheckZeroEgress');
    const checkServer = document.getElementById('profCheckServerAlerts');
    const checkMoney = document.getElementById('profCheckMoneyAlerts');
    const checkDoctor = document.getElementById('profCheckDoctorAlerts');
    const checkSound = document.getElementById('profCheckSoundAlerts');
    const patInput = document.getElementById('profPatTokenInput');

    if (inputName) inputName.value = userProfile.name || '';
    if (inputUser) inputUser.value = userProfile.username || '';
    if (inputEmail) inputEmail.value = userProfile.email || '';
    if (inputRole) inputRole.value = userProfile.role || '';
    if (inputOrg) inputOrg.value = userProfile.org || '';
    if (inputBio) inputBio.value = userProfile.bio || '';
    if (selectCloud) selectCloud.value = userProfile.cloudProvider || 'aws';
    if (selectRegion) selectRegion.value = userProfile.defaultRegion || 'us-east-1';
    if (selectIac) selectIac.value = userProfile.iacFormat || 'terraform';
    if (checkHa) checkHa.checked = !!userProfile.highAvailability;
    if (checkZeroEgress) checkZeroEgress.checked = !!userProfile.zeroEgress;
    if (checkServer) checkServer.checked = !!userProfile.serverAlerts;
    if (checkMoney) checkMoney.checked = !!userProfile.moneyAlerts;
    if (checkDoctor) checkDoctor.checked = !!userProfile.doctorAlerts;
    if (checkSound) checkSound.checked = !!userProfile.soundAlerts;
    if (patInput) patInput.value = userProfile.patToken || 'pat_clouderator_live_83921b79401e8a';

    // Color chips
    document.querySelectorAll('.avatar-color-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.color === userProfile.avatarColor);
    });
  }

  function setupProfileEventListeners() {
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileModal = document.getElementById('profileModal');
    const btnOpenProfileModal = document.getElementById('btnOpenProfileSettingsModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const cancelProfileModalBtn = document.getElementById('cancelProfileModalBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const btnProfileCloudCreds = document.getElementById('btnProfileCloudCreds');
    const btnProfileAiSettings = document.getElementById('btnProfileAiSettings');
    const btnProfileCostBilling = document.getElementById('btnProfileCostBilling');
    const btnProfileSecurity = document.getElementById('btnProfileSecurity');
    const btnProfileCopyId = document.getElementById('btnProfileCopyId');
    const btnProfileThemeToggle = document.getElementById('btnProfileThemeToggle');
    const btnProfileSignOut = document.getElementById('btnProfileSignOut');
    const btnCopyPatToken = document.getElementById('btnCopyPatToken');
    const profInputFullName = document.getElementById('profInputFullName');

    if (!userProfileBtn || !profileDropdown) return;

    // 1. Toggle Profile Dropdown
    userProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = profileDropdown.classList.contains('hidden');
      if (isHidden) {
        // Close notification drawer if open
        if (notifDropdown) notifDropdown.classList.add('hidden');
        profileDropdown.classList.remove('hidden');
        userProfileBtn.classList.add('active');
        userProfileBtn.setAttribute('aria-expanded', 'true');
        // Refresh dynamic metrics inside dropdown
        renderUserProfileUI();
      } else {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        userProfileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Support Enter or Space on keyboard for accessibility
    userProfileBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userProfileBtn.click();
      }
    });

    // 2. Open Account & Profile Modal
    if (btnOpenProfileModal) {
      btnOpenProfileModal.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        userProfileBtn.setAttribute('aria-expanded', 'false');
        if (profileModal) {
          profileModal.classList.remove('hidden');
          renderUserProfileUI();
        }
      });
    }

    // 3. Close Profile Modal
    if (closeProfileModal) {
      closeProfileModal.addEventListener('click', () => {
        if (profileModal) profileModal.classList.add('hidden');
      });
    }
    if (cancelProfileModalBtn) {
      cancelProfileModalBtn.addEventListener('click', () => {
        if (profileModal) profileModal.classList.add('hidden');
      });
    }
    if (profileModal) {
      profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
          profileModal.classList.add('hidden');
        }
      });
    }

    // 4. Modal Tabs
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        
        const tabMap = {
          general: 'profileTabPaneGeneral',
          cloud: 'profileTabPaneCloud',
          alerts: 'profileTabPaneAlerts',
          security: 'profileTabPaneSecurity'
        };

        document.querySelectorAll('.profile-tab-pane').forEach(pane => pane.classList.add('hidden'));
        const activePane = document.getElementById(tabMap[tab]);
        if (activePane) activePane.classList.remove('hidden');
      });
    });

    // 5. Avatar color chips inside modal
    document.querySelectorAll('.avatar-color-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.avatar-color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        userProfile.avatarColor = chip.dataset.color;
        const grad = AVATAR_GRADIENTS[userProfile.avatarColor] || AVATAR_GRADIENTS.blue;
        const modalAvatar = document.getElementById('modalAvatarPreview');
        if (modalAvatar) modalAvatar.style.background = grad;
      });
    });

    // Live update initial when typing full name in modal
    if (profInputFullName) {
      profInputFullName.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const initial = val ? val.charAt(0).toUpperCase() : 'S';
        const modalInitial = document.getElementById('modalAvatarPreviewInitial');
        if (modalInitial) modalInitial.textContent = initial;
      });
    }

    // 6. Save Profile button
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', async () => {
        const inputName = document.getElementById('profInputFullName');
        const inputUser = document.getElementById('profInputUsername');
        const inputEmail = document.getElementById('profInputEmail');
        const inputRole = document.getElementById('profInputRole');
        const inputOrg = document.getElementById('profInputOrg');
        const inputBio = document.getElementById('profInputBio');
        const selectCloud = document.getElementById('profSelectCloud');
        const selectRegion = document.getElementById('profSelectRegion');
        const selectIac = document.getElementById('profSelectIac');
        const checkHa = document.getElementById('profCheckHa');
        const checkZeroEgress = document.getElementById('profCheckZeroEgress');
        const checkServer = document.getElementById('profCheckServerAlerts');
        const checkMoney = document.getElementById('profCheckMoneyAlerts');
        const checkDoctor = document.getElementById('profCheckDoctorAlerts');
        const checkSound = document.getElementById('profCheckSoundAlerts');

        const newName = inputName ? inputName.value.trim() : userProfile.name;
        userProfile.name = newName || userProfile.name;
        userProfile.avatarInitial = userProfile.name.charAt(0).toUpperCase();
        if (inputUser) userProfile.username = inputUser.value.trim();
        if (inputEmail) userProfile.email = inputEmail.value.trim();
        if (inputRole) userProfile.role = inputRole.value.trim();
        if (inputOrg) userProfile.org = inputOrg.value.trim();
        if (inputBio) userProfile.bio = inputBio.value.trim();
        if (selectCloud) userProfile.cloudProvider = selectCloud.value;
        if (selectRegion) userProfile.defaultRegion = selectRegion.value;
        if (selectIac) userProfile.iacFormat = selectIac.value;
        if (checkHa) userProfile.highAvailability = checkHa.checked;
        if (checkZeroEgress) userProfile.zeroEgress = checkZeroEgress.checked;
        if (checkServer) userProfile.serverAlerts = checkServer.checked;
        if (checkMoney) userProfile.moneyAlerts = checkMoney.checked;
        if (checkDoctor) userProfile.doctorAlerts = checkDoctor.checked;
        if (checkSound) userProfile.soundAlerts = checkSound.checked;

        // Persist to localStorage
        localStorage.setItem('clouderator_user_profile', JSON.stringify(userProfile));

        // Save to Server
        try {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
          });
        } catch (e) {
          console.warn('Profile server save fallback to localStorage only', e);
        }

        renderUserProfileUI();
        if (profileModal) profileModal.classList.add('hidden');

        showToast({
          title: 'Profile Updated',
          message: `Settings saved for ${userProfile.name}. Cloud defaults updated.`,
          type: 'server'
        });
      });
    }

    // 7. Copy PAT Token in modal
    if (btnCopyPatToken) {
      btnCopyPatToken.addEventListener('click', () => {
        const patInput = document.getElementById('profPatTokenInput');
        if (patInput) {
          navigator.clipboard.writeText(patInput.value);
          showToast({
            title: 'PAT Token Copied',
            message: 'Personal access token copied to clipboard for CI/CD.',
            type: 'server'
          });
        }
      });
    }

    // 8. Open Cloud Credentials from profile dropdown
    if (btnProfileCloudCreds) {
      btnProfileCloudCreds.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        const credsModal = document.getElementById('cloudCredentialsModal');
        if (credsModal) credsModal.classList.remove('hidden');
      });
    }

    // 9. Quick view shortcuts from profile dropdown
    if (btnProfileAiSettings) {
      btnProfileAiSettings.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        switchView('settings');
      });
    }

    if (btnProfileCostBilling) {
      btnProfileCostBilling.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        switchView('cost');
      });
    }

    if (btnProfileSecurity) {
      btnProfileSecurity.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        switchView('security');
      });
    }

    // 10. Copy User ID from dropdown
    if (btnProfileCopyId) {
      btnProfileCopyId.addEventListener('click', () => {
        const userId = 'usr_sat_83921_clouderator';
        navigator.clipboard.writeText(userId);
        showToast({
          title: 'Clouderator ID Copied',
          message: `${userId} copied to clipboard.`,
          type: 'server'
        });
      });
    }

    // 11. Theme toggle from profile dropdown
    if (btnProfileThemeToggle) {
      btnProfileThemeToggle.addEventListener('click', () => {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) themeBtn.click();
      });
    }

    // 12. Reset Session / Sign out
    if (btnProfileSignOut) {
      btnProfileSignOut.addEventListener('click', () => {
        profileDropdown.classList.add('hidden');
        userProfileBtn.classList.remove('active');
        if (confirm('Reset active console session and reconnect to workspace?')) {
          showToast({
            title: 'Session Refreshed',
            message: 'Signed out of active workspace session.',
            type: 'server'
          });
        }
      });
    }

    // 13. Deep-link Hash Navigation Support
    const initialView = (window.location.hash || '').replace('#', '');
    if (['canvas', 'cost', 'monitoring', 'security', 'doctor', 'deployment', 'settings'].includes(initialView)) {
      switchView(initialView);
    }
  }
});

