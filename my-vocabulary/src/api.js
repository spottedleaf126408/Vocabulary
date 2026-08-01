const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function apiGet(action, params) {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

// Content-Type text/plain avoids a CORS preflight (Apps Script doesn't
// implement doOptions), so POST bodies are JSON-stringified but sent as
// plain text; Code.gs parses e.postData.contents as JSON regardless.
async function apiPost(action, body) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...body })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export const api = {
  getWords: (student) => apiGet('getWords', { student }).then((r) => r.words),
  getStats: (student) => apiGet('getStats', { student }).then((r) => r.stats),
  addWord: (student, word) => apiPost('addWord', { student, word }).then((r) => r.word),
  updateWord: (student, id, updates) => apiPost('updateWord', { student, id, updates }).then((r) => r.word),
  deleteWord: (student, id) => apiPost('deleteWord', { student, id }),
  reviewWord: (student, id, delta) => apiPost('reviewWord', { student, id, delta }),
  quizAnswer: (student, id, correct, demote) => apiPost('quizAnswer', { student, id, correct, demote }),
  quizComplete: (student, score, total) => apiPost('quizComplete', { student, score, total }).then((r) => r.stats)
};
