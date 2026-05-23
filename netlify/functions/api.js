const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const memoryStore = [];

// --- Gemini ---

async function enhanceWithGemini(data) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a professional project manager writing a formal project charter. Polish the following raw inputs and return ONLY valid JSON — no markdown, no code fences.

Project: ${data.name}
PM: ${data.projectManager || 'N/A'} | Sponsor: ${data.sponsor || 'N/A'}
Dates: ${data.startDate || 'N/A'} → ${data.endDate || 'N/A'} | Status: ${data.status || 'Draft'}

WHY (purpose): ${data.purpose || 'N/A'}

DELIVERABLES: ${(data.deliverables || []).filter(Boolean).join(' | ')}
OUT OF SCOPE: ${(data.outOfScope || []).filter(Boolean).join(' | ')}

TEAM: ${JSON.stringify(data.team || [])}
PHASES: ${JSON.stringify(data.phases || [])}
BUDGET: ${data.budget || 'N/A'}
RISKS: ${JSON.stringify(data.risks || [])}

Return this exact JSON structure:
{
  "executiveSummary": "2-3 sentence professional project summary for the charter header",
  "purpose": "Polished 2-3 sentence purpose statement. Clear, professional, no jargon.",
  "deliverables": ["Polished deliverable 1", "Polished deliverable 2"],
  "outOfScope": ["Polished out-of-scope item 1"],
  "risks": [
    { "risk": "Risk title", "mitigation": "How we handle it" }
  ],
  "budgetNote": "Polished budget statement, or repeat the input if already clear"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (err) {
    console.warn('Gemini enhancement failed:', err.message);
    return null;
  }
}

// --- CRUD ---

function createProject(sessionId, data, enhanced) {
  const project = {
    _id: crypto.randomUUID(),
    sessionId,
    name: data.name || '',
    projectManager: data.projectManager || '',
    sponsor: data.sponsor || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    status: data.status || 'Draft',
    purpose: data.purpose || '',
    deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
    outOfScope: Array.isArray(data.outOfScope) ? data.outOfScope : [],
    team: Array.isArray(data.team) ? data.team : [],
    phases: Array.isArray(data.phases) ? data.phases : [],
    budget: data.budget || '',
    risks: Array.isArray(data.risks) ? data.risks : [],
    approvals: Array.isArray(data.approvals) ? data.approvals : [],
    ...(enhanced ? { enhanced } : {}),
    createdAt: new Date().toISOString(),
  };
  memoryStore.push(project);
  const { sessionId: _, ...pub } = project;
  return pub;
}

function findAll(sessionId) {
  return memoryStore
    .filter(p => p.sessionId === sessionId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ sessionId: _, ...p }) => p);
}

function findById(sessionId, id) {
  const p = memoryStore.find(p => p._id === id && p.sessionId === sessionId);
  if (!p) return null;
  const { sessionId: _, ...pub } = p;
  return pub;
}

// --- Response helper ---

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

// --- Handler ---

exports.handler = async (event) => {
  const { httpMethod, path, body, headers } = event;

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  const sessionId = headers['x-session-id'] || headers['X-Session-Id'];
  if (!sessionId) return json(401, { error: 'Missing session ID' });

  const route = path
    .replace(/^\/.netlify\/functions\/api/, '')
    .replace(/^\/api/, '') || '/';

  if (httpMethod === 'POST' && route === '/project') {
    try {
      const data = JSON.parse(body || '{}');
      if (!data.name) return json(400, { error: 'Project name is required' });
      const enhanced = await enhanceWithGemini(data);
      const project = createProject(sessionId, data, enhanced);
      return json(201, project);
    } catch (e) {
      return json(400, { error: e.message });
    }
  }

  if (httpMethod === 'GET' && route === '/projects') {
    return json(200, findAll(sessionId));
  }

  if (httpMethod === 'GET' && route.startsWith('/project/')) {
    const id = route.replace('/project/', '');
    const project = findById(sessionId, id);
    if (!project) return json(404, { error: 'Project not found' });
    return json(200, project);
  }

  return json(404, { error: 'Not found' });
};
