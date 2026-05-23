// Generates or retrieves a persistent session ID unique to this browser.
// Stored in localStorage so it survives page refreshes but is unique per device.
const STORAGE_KEY = 'better-project-session-id';

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getSessionId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
