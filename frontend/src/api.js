import { getSessionId } from './sessionId';

function headers(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId(),
    ...extra,
  };
}

export async function fetchProjects(signal) {
  const res = await fetch('/api/projects', { headers: headers(), signal });
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchProject(id) {
  const res = await fetch(`/api/project/${id}`, { headers: headers() });
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}

export async function createProject(data) {
  const res = await fetch('/api/project', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save project');
  }
  return res.json();
}
