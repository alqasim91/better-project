const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Better Project');
});

// --- Gemini ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function enhanceWithGemini(data) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return null;
  }
  try {
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

// --- MongoDB Schema ---

const riskSchema = new mongoose.Schema({
  title: String,
  description: String,
  likelihood: String,
  impact: String,
}, { _id: false });

const enhancedSchema = new mongoose.Schema({
  executiveSummary: String,
  description: String,
  objectives: String,
  scope: String,
  risks: [riskSchema],
  kpis: [String],
  stakeholderNote: String,
}, { _id: false });

const projectSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  objectives: String,
  scope: String,
  phases: [
    {
      name: String,
      startDate: String,
      endDate: String,
      description: String,
    },
  ],
  resources: [
    {
      name: String,
      role: String,
    },
  ],
  risks: String,
  enhanced: enhancedSchema,
  createdAt: { type: Date, default: Date.now },
});

const Project = mongoose.model('Project', projectSchema);

// --- In-memory fallback store ---

let useMemoryStore = false;
const memoryStore = [];

function memoryCreate(sessionId, data) {
  const project = {
    _id: crypto.randomUUID(),
    sessionId,
    ...data,
    createdAt: new Date().toISOString(),
  };
  memoryStore.push(project);
  const { sessionId: _, ...publicProject } = project;
  return publicProject;
}

function memoryFindAll(sessionId) {
  return memoryStore
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ sessionId: _, ...p }) => p);
}

function memoryFindById(sessionId, id) {
  const project = memoryStore.find((p) => p._id === id && p.sessionId === sessionId);
  if (!project) return null;
  const { sessionId: _, ...publicProject } = project;
  return publicProject;
}

// --- Middleware: extract session ID ---

function getSessionId(req, res) {
  const sid = req.headers['x-session-id'];
  if (!sid) {
    res.status(401).json({ error: 'Missing session ID' });
    return null;
  }
  return sid;
}

// --- Project API Routes ---

app.post('/api/project', async (req, res) => {
  const sessionId = getSessionId(req, res);
  if (!sessionId) return;
  try {
    const enhanced = await enhanceWithGemini(req.body);
    const payload = { ...req.body, ...(enhanced ? { enhanced } : {}) };

    if (useMemoryStore) {
      const project = memoryCreate(sessionId, payload);
      return res.status(201).json(project);
    }
    const project = new Project({ ...payload, sessionId });
    const saved = await project.save();
    const obj = saved.toObject();
    delete obj.sessionId;
    res.status(201).json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects', async (req, res) => {
  const sessionId = getSessionId(req, res);
  if (!sessionId) return;
  try {
    if (useMemoryStore) {
      return res.json(memoryFindAll(sessionId));
    }
    const projects = await Project.find({ sessionId }).sort({ createdAt: -1 }).select('-sessionId');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/project/:id', async (req, res) => {
  const sessionId = getSessionId(req, res);
  if (!sessionId) return;
  try {
    if (useMemoryStore) {
      const project = memoryFindById(sessionId, req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      return res.json(project);
    }
    const project = await Project.findOne({ _id: req.params.id, sessionId }).select('-sessionId');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Connect to MongoDB and start server ---

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/betterproject';

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('MongoDB unavailable:', err.message);
    console.log('Using in-memory storage (data will not persist across restarts)');
    useMemoryStore = true;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} (in-memory mode)`);
    });
  });

module.exports = app;
