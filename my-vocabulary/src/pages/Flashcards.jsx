import { useState } from 'react';
import { FAM_LABEL } from '../students.js';

const TIME_SORTS = [
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['random', 'Random']
];

const RATINGS = [
  ['Again', -1],
  ['Hard', 0],
  ['Good', 1],
  ['Easy', 1]
];

export default function Flashcards({ words, onReview }) {
  const [step, setStep] = useState('setup');
  const [famFilter, setFamFilter] = useState([0, 1, 2, 3, 4]);
  const [timeSort, setTimeSort] = useState('newest');
  const [count, setCount] = useState(Math.min(5, words.length) || 1);
  const [pool, setPool] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  function toggleFam(i) {
    setFamFilter((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]));
  }

  function start() {
    let p = words.filter((w) => famFilter.includes(w.familiarity));
    if (timeSort === 'newest') p.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    else if (timeSort === 'oldest') p.sort((a, b) => new Date(a.date_added) - new Date(b.date_added));
    else p.sort(() => 0.5 - Math.random());
    p = p.slice(0, count);
    if (p.length === 0) {
      alert('No words match that filter.');
      return;
    }
    setPool(p);
    setIdx(0);
    setFlipped(false);
    setStep('review');
  }

  async function rate(delta) {
    const w = pool[idx];
    await onReview(w.id, delta);
    if (idx + 1 >= pool.length) {
      setStep('setup');
      alert('Review session complete!');
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  }

  if (step === 'setup') {
    return (
      <div>
        <div style={{ fontSize: 13, color: 'var(--t-textsoft)', marginBottom: 10 }}>Flashcard setup (review only, not scored)</div>
        <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 4 }}>Familiarity</div>
        <div style={{ marginBottom: 10 }}>
          {FAM_LABEL.map((l, i) => (
            <span key={i} className={`chip ${famFilter.includes(i) ? 'active' : ''}`} onClick={() => toggleFam(i)}>
              {l}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 4 }}>Order by time added</div>
        <div style={{ marginBottom: 10 }}>
          {TIME_SORTS.map(([key, label]) => (
            <span key={key} className={`chip ${timeSort === key ? 'active' : ''}`} onClick={() => setTimeSort(key)}>
              {label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--t-textsoft)' }}>How many cards</span>
          <input
            type="number"
            min={1}
            max={Math.max(words.length, 1)}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <button className="btn" onClick={start}>Start review</button>
      </div>
    );
  }

  const w = pool[idx];
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 8 }}>
        Review mode &middot; card {idx + 1} / {pool.length}
      </div>
      <div
        onClick={() => setFlipped((f) => !f)}
        style={{
          cursor: 'pointer',
          background: 'var(--t-card)',
          borderRadius: 'var(--t-radius)',
          padding: '28px 16px',
          textAlign: 'center',
          fontSize: flipped ? 14 : 22,
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {flipped ? (
          <div>
            <div>{w.english_word} — {w.phrase_en} ({w.phrase_zh})</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{w.example_sentence_en}</div>
            <div style={{ color: 'var(--t-textsoft)', fontSize: 12, marginTop: 4 }}>{w.example_sentence_zh}</div>
            <div style={{ color: 'var(--t-textsoft)', fontSize: 11, marginTop: 4 }}>family: {w.word_family}</div>
          </div>
        ) : (
          w.chinese_word
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t-textsoft)', textAlign: 'center', margin: '8px 0 14px' }}>tap card to flip</div>
      {flipped && (
        <>
          <div style={{ fontSize: 10, color: 'var(--t-textsoft)', textAlign: 'center', marginBottom: 6 }}>
            how well did you know it? (updates familiarity: {FAM_LABEL[w.familiarity]})
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {RATINGS.map(([label, delta], i) => (
              <button key={i} className="btn secondary" style={{ fontSize: 11, padding: '8px 10px' }} onClick={() => rate(delta)}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
