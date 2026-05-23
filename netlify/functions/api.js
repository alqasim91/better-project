const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// In-memory store — resets on each cold start (use MongoDB Atlas for persistence)
const memoryStore = [];

// --- Gemini enhancement ---

async function enhanceWithGemini(data) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a professional project manager. Enhance the following project charter input into polished, professional language. Return ONLY valid JSON — no markdown, no code fences.

Input:
Name: ${data.name}
Description: ${data.description || '(not provided)'}
Objectives: ${data.objectives || '(not provided)'}
Scope: ${data.scope || '(not provided)'}
Risks: ${data.risks || '(not provided)'}
Phases: ${JSON.stringify(data.phases || [])}
Resources: ${JSON.stringify(data.resources || [])}

Return exactly this JSON structure:
{
  "executiveSummary": "2-3 sentence professional project overview",
  "description": "polished description",
  "objectives": "well-structured objectives in professional language",
  "scope": "clear scope statement with in-scope and out-of-scope notes",
  "risks": [
    { "title": "risk name", "description": "detailed explanation", "likelihood": "High|Medium|Low", "impact": "High|Medium|Low" }
  ],
  "kpis": ["KPI 1", "KPI 2", "KPI 3", "KPI 4"],
  "stakeholderNote": "suggested stakeholders and communication approach"
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

// --- In-memory CRUD ---

function createProject(sessionId, data, enhanced) {
  const project = {
    _id: crypto.randomUUID(),
    sessionId,
    name: data.name || '',
    description: data.description || '',
    objectives: data.objectives || '',
    scope: data.scope || '',
    risks: data.risks || '',
    phases: Array.isArray(data.phases) ? data.phases : [],
    resources: Array.isArray(data.resources) ? data.resources : [],
    ...(enhanced ? { enhanced } : {}),
    createdAt: new Date().toISOString(),
  };
  memoryStore.push(project);
  const { sessionId: _, ...publicProject } = project;
  return publicProject;
}

function findAll(sessionId) {
  return memoryStore
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ sessionId: _, ...p }) => p);
}

function findById(sessionId, id) {
  const project = memoryStore.find((p) => p._id === id && p.sessionId === sessionId);
  if (!project) return null;
  const { sessionId: _, ...publicProject } = project;
  return publicProject;
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

  // CORS preflight
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

  // POST /api/project
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

  // GET /api/projects
  if (httpMethod === 'GET' && route === '/projects') {
    return json(200, findAll(sessionId));
  }

  // GET /api/project/:id
  if (httpMethod === 'GET' && route.startsWith('/project/')) {
    const id = route.replace('/project/', '');
    const project = findById(sessionId, id);
    if (!project) return json(404, { error: 'Project not found' });
    return json(200, project);
  }

  return json(404, { error: 'Not found' });
};
