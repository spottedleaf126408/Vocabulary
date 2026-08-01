import { useEffect, useState, useCallback } from 'react';
import { STUDENTS } from './students.js';
import { api } from './api.js';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Entry from './pages/Entry.jsx';
import WordList from './pages/WordList.jsx';
import Flashcards from './pages/Flashcards.jsx';
import Quiz from './pages/Quiz.jsx';
import Stats from './pages/Stats.jsx';

const PAGES = [
  ['home', 'home'],
  ['entry', 'plus'],
  ['list', 'list'],
  ['flashcards', 'cards'],
  ['quiz', 'target'],
  ['stats', 'chart-bar']
];

export default function App() {
  const [studentKey, setStudentKey] = useState(null);
  const [page, setPage] = useState('home');
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const student = studentKey ? STUDENTS[studentKey] : null;

  const reload = useCallback(async () => {
    if (!studentKey) return;
    setLoading(true);
    setLoadError('');
    try {
      const [w, s] = await Promise.all([
        api.getWords(STUDENTS[studentKey].sheetTab),
        api.getStats(STUDENTS[studentKey].sheetTab)
      ]);
      setWords(w);
      setStats(s);
    } catch (e) {
      setLoadError('Could not load data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [studentKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleLoggedIn(key) {
    setStudentKey(key);
    setPage('home');
  }

  function logout() {
    setStudentKey(null);
    setWords([]);
    setStats(null);
    setPage('home');
  }

  async function handleAdd(form) {
    const word = await api.addWord(student.sheetTab, form);
    setWords((ws) => [...ws, word]);
    const s = await api.getStats(student.sheetTab);
    setStats(s);
  }

  async function handleUpdate(id, updates) {
    const word = await api.updateWord(student.sheetTab, id, updates);
    setWords((ws) => ws.map((w) => (w.id === id ? word : w)));
  }

  async function handleDelete(id) {
    await api.deleteWord(student.sheetTab, id);
    setWords((ws) => ws.filter((w) => w.id !== id));
  }

  async function handleReview(id, delta) {
    const result = await api.reviewWord(student.sheetTab, id, delta);
    setWords((ws) => ws.map((w) => (w.id === id ? result.word : w)));
    setStats(result.stats);
  }

  async function handleQuizAnswer(id, correct, demote) {
    const result = await api.quizAnswer(student.sheetTab, id, correct, demote);
    setWords((ws) => ws.map((w) => (w.id === id ? result.word : w)));
    setStats(result.stats);
  }

  async function handleQuizComplete(score, total) {
    const s = await api.quizComplete(student.sheetTab, score, total);
    setStats(s);
  }

  if (!studentKey) {
    return <Login onLoggedIn={handleLoggedIn} />;
  }

  return (
    <div className={`app-shell ${student.theme}`}>
      <div className="app-inner">
        <div className="topbar">
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{student.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t-textsoft)' }}>
              Lv.{stats?.level ?? 1} &middot; {stats?.streak ?? 0} day streak
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 90 }}>
              <div style={{ height: 8, background: 'rgba(128,128,128,0.3)', borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats ? Math.round((100 * stats.xpIntoLevel) / stats.xpForNextLevel) : 0}%`,
                    background: 'var(--t-primary)'
                  }}
                />
              </div>
              <div style={{ fontSize: 10, textAlign: 'right', color: 'var(--t-textsoft)', marginTop: 2 }}>
                {stats?.xpIntoLevel ?? 0}/{stats?.xpForNextLevel ?? 50} XP
              </div>
            </div>
            <i className="ti ti-logout-2" onClick={logout} style={{ fontSize: 18, cursor: 'pointer', color: 'var(--t-textsoft)' }} aria-label="switch student" />
          </div>
        </div>

        <div className="screen">
          {loading && <div style={{ fontSize: 12, color: 'var(--t-textsoft)' }}>Loading…</div>}
          {loadError && <div style={{ fontSize: 12, color: 'var(--t-danger)', marginBottom: 10 }}>{loadError} <button className="btn secondary" style={{ fontSize: 11 }} onClick={reload}>Retry</button></div>}
          {!loading && !loadError && (
            <>
              {page === 'home' && <Home words={words} stats={stats} goTo={setPage} />}
              {page === 'entry' && <Entry student={student} onAdd={handleAdd} />}
              {page === 'list' && <WordList words={words} onUpdate={handleUpdate} onDelete={handleDelete} />}
              {page === 'flashcards' && <Flashcards words={words} onReview={handleReview} />}
              {page === 'quiz' && <Quiz words={words} onAnswer={handleQuizAnswer} onComplete={handleQuizComplete} />}
              {page === 'stats' && <Stats words={words} stats={stats} />}
            </>
          )}
        </div>

        <div className="pagenav">
          {PAGES.map(([key, icon]) => (
            <button key={key} className={`navbtn ${page === key ? 'active' : ''}`} onClick={() => setPage(key)}>
              <i className={`ti ti-${icon}`} />
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
