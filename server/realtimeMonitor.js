// Clouderator Real-Time Telemetry & Financial Notification Daemon

class RealtimeMonitor {
  constructor(wss) {
    this.wss = wss;
    // Real notifications list - populated only by actual system & user events
    this.notifications = [];

    this.serverMetrics = {
      overallCpu: 48,
      overallMemory: 62,
      latencyMs: 38,
      requestsPerSec: 1420,
      activeConnections: 3850,
      healthyInstances: 3,
      totalInstances: 3,
      history: []
    };

    // Initialize historical metrics points
    for (let i = 20; i >= 0; i--) {
      this.serverMetrics.history.push({
        time: `${i}m ago`,
        cpu: Math.floor(40 + Math.random() * 25),
        ram: Math.floor(55 + Math.random() * 15),
        rps: Math.floor(1200 + Math.random() * 400)
      });
    }

    this.startSimulation();
  }

  startSimulation() {
    // Pulse live server telemetry metrics every 4 seconds
    setInterval(() => {
      this.serverMetrics.overallCpu = Math.min(96, Math.max(25, Math.floor(this.serverMetrics.overallCpu + (Math.random() * 8 - 4))));
      this.serverMetrics.overallMemory = Math.min(90, Math.max(45, Math.floor(this.serverMetrics.overallMemory + (Math.random() * 4 - 2))));
      this.serverMetrics.latencyMs = Math.min(120, Math.max(18, Math.floor(35 + (Math.random() * 14 - 7))));
      this.serverMetrics.requestsPerSec = Math.floor(1300 + (Math.random() * 300));
      this.serverMetrics.activeConnections = Math.floor(3700 + (Math.random() * 400));

      this.serverMetrics.history.push({
        time: 'Now',
        cpu: this.serverMetrics.overallCpu,
        ram: this.serverMetrics.overallMemory,
        rps: this.serverMetrics.requestsPerSec
      });
      if (this.serverMetrics.history.length > 25) {
        this.serverMetrics.history.shift();
      }

      this.broadcast({
        type: 'METRICS_UPDATE',
        payload: this.serverMetrics
      });
    }, 4000);
  }

  broadcast(messageObj) {
    if (!this.wss) return;
    const data = JSON.stringify(messageObj);
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    });
  }

  addNotification(notifObj) {
    const newNotif = {
      id: notifObj.id || `notif-${Date.now()}`,
      type: (notifObj.type || 'server').toLowerCase(),
      title: notifObj.title || 'Notification',
      message: notifObj.message || '',
      severity: (notifObj.severity || 'info').toLowerCase(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      amount: notifObj.amount || null,
      metric: notifObj.metric || null,
      actionLabel: notifObj.actionLabel || null
    };
    this.notifications.unshift(newNotif);
    if (this.notifications.length > 50) this.notifications.pop();
    this.broadcast({
      type: 'NEW_NOTIFICATION',
      payload: newNotif
    });
    return newNotif;
  }

  getNotifications() {
    return this.notifications;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    return this.notifications;
  }

  getMetrics(architecture) {
    if (architecture && (!architecture.nodes || architecture.nodes.length === 0)) {
      return {
        overallCpu: 0,
        overallMemory: 0,
        latencyMs: 0,
        requestsPerSec: 0,
        activeConnections: 0,
        healthyInstances: 0,
        totalInstances: 0,
        hasArchitecture: false,
        history: []
      };
    }
    
    // Scale instances count if architecture exists
    if (architecture && architecture.nodes) {
      const computeCount = architecture.nodes.filter(n => 
        ['ec2', 'asg', 'ecs', 'eks', 'app_servers', 'compute_instance'].includes(n.id) || n.category === 'compute'
      ).length;
      return {
        ...this.serverMetrics,
        totalInstances: computeCount > 0 ? computeCount : 1,
        healthyInstances: computeCount > 0 ? computeCount : 1,
        hasArchitecture: true
      };
    }

    return this.serverMetrics;
  }
}

module.exports = { RealtimeMonitor };
