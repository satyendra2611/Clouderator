const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial empty architecture schema
function getEmptyArchitecture(projectName = 'New Cloud Architecture') {
  return {
    projectName,
    cloudProvider: 'aws',
    userScale: 10000,
    costReductionPct: 0,
    metrics: {
      monthlyCost: 0,
      costPercentDiff: 0,
      performanceScore: 100,
      performanceStatus: 'Ready',
      availabilityScore: 99.99,
      availabilityStatus: 'Multi-AZ Ready',
      securityScore: 95,
      securityStatus: 'Zero-Trust Ready'
    },
    nodes: [],
    edges: []
  };
}

function getInitialGreeting() {
  return [
    {
      id: `msg-welcome`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: "Hello! I'm Clouderator AI. What cloud architecture or system design would you like to build today?",
      bulletPoints: [],
      provider: 'groq'
    }
  ];
}

class SessionStore {
  constructor() {
    this.sessions = this.loadFromFile();
    this.activeSessionId = null;
  }

  loadFromFile() {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading sessions.json:', err.message);
    }
    return [];
  }

  saveToFile() {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(this.sessions, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing sessions.json:', err.message);
    }
  }

  getAllSessions() {
    return this.sessions
      .map(s => ({
        id: s.id,
        title: s.title || 'Untitled Architecture',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        nodeCount: s.architecture?.nodes?.length || 0,
        monthlyCost: s.architecture?.metrics?.monthlyCost || 0,
        messageCount: s.messages?.length || 0
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getSession(id) {
    return this.sessions.find(s => s.id === id) || null;
  }

  createSession(customTitle = null) {
    const id = `session-${Date.now()}`;
    const newSession = {
      id,
      title: customTitle || 'New Cloud Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: getInitialGreeting(),
      architecture: getEmptyArchitecture(customTitle || 'New Cloud Architecture')
    };

    this.sessions.unshift(newSession);
    this.saveToFile();
    this.activeSessionId = id;
    return newSession;
  }

  updateSession(id, updates) {
    let session = this.sessions.find(s => s.id === id);
    if (!session) {
      session = this.createSession();
      id = session.id;
    }

    if (updates.title) session.title = updates.title;
    if (updates.messages) session.messages = updates.messages;
    if (updates.architecture) session.architecture = updates.architecture;
    session.updatedAt = new Date().toISOString();

    this.saveToFile();
    return session;
  }

  deleteSession(id) {
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.saveToFile();
    if (this.activeSessionId === id) {
      this.activeSessionId = null;
    }
    return true;
  }
}

const sessionStore = new SessionStore();

module.exports = {
  sessionStore,
  getEmptyArchitecture,
  getInitialGreeting
};
