import { useState } from 'react';
import { FAM_LABEL } from '../students.js';

const FORMATS = [
  ['mc', 'Multiple choice'],
  ['typing', 'Typing'],
  ['fillblank', 'Fill-in-blank']
];
const DIRECTIONS = [
  ['zh-en', 'Chinese → English'],
  ['en-zh', 'English → Chinese']
];

export default function Quiz({ words, onAnswer, onComplete }) {
  const [step, setStep] = useState('setup');
  const [famFilter, setFamFilter] = useState([0, 1]);
  const [count, setCount] = useState(Math.min(3, words.length) || 1);
  const [format, setFormat] = useState('mc');
  const [direction, setDirection] = useState('zh-en');
  const [pool, setPool] = useState([]);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null); // { correct, answer, word }
  const [mcOptions, setMcOptions] = useState([]);

  function toggleFam(i) {
    setFamFilter((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]));
  }

  function buildMcOptions(w, dir) {
    const correctOpt = dir === 'zh-en' ? w.english_word : w.chinese_word;
    const others = words.filter((x) => x.id !== w.id).map((x) => (dir === 'zh-en' ? x.english_word : x.chinese_word));
    return [correctOpt, ...others.slice(0, 3)].sort(() => 0.5 - Math.random());
  }

  function start() {
    let p = words.filter((w) => famFilter.includes(w.familiarity));
    p.sort(() => 0.5 - Math.random());
    p = p.slice(0, count);
    if (p.length === 0) {
      alert('No words match that familiarity filter.');
      return;
    }
    setPool(p);
    setQ(0);
    setScore(0);
    setTyped('');
    setFeedback(null);
    if (format === 'mc') setMcOptions(buildMcOptions(p[0], format === 'fillblank' ? 'zh-en' : direction));
    setStep('question');
  }

  function effectiveDirection() {
    return format === 'fillblank' ? 'zh-en' : direction;
  }

  async function submitAnswer(chosen) {
    const w = pool[q];
    const dir = effectiveDirection();
    const correctOpt = format === 'fillblank' ? w.english_word : dir === 'zh-en' ? w.english_word : w.chinese_word;
    const isCorrect = format === 'mc' ? chosen === correctOpt : chosen.trim().toLowerCase() === correctOpt.trim().toLowerCase();
    if (isCorrect) setScore((s) => s + 1);
    setFeedback({ correct: isCorrect, answer: correctOpt, word: w });
    setStep('feedback');
    // Ask the backend to record the answer; demote decision comes after, via demote().
    await onAnswer(w.id, isCorrect, false);
  }

  async function demote(confirmYes) {
    const w = feedback.word;
    if (confirmYes) {
      await onAnswer(w.id, false, true);
    }
    next();
  }

  function next() {
    setFeedback(null);
    setTyped('');
    const nextQ = q + 1;
    if (nextQ >= pool.length) {
      onComplete(score, pool.length);
      setStep('results');
    } else {
      setQ(nextQ);
      if (format === 'mc') setMcOptions(buildMcOptions(pool[nextQ], effectiveDirection()));
      setStep('question');
    }
  }

  if (step === 'setup') {
    return (
      <div>
        <div style={{ fontSize: 13, color: 'var(--t-textsoft)', marginBottom: 10 }}>Quiz setup</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--t-textsoft)' }}>Number of questions</span>
          <input type="number" min={1} max={Math.max(words.length, 1)} value={count} onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 4 }}>Source filter — familiarity</div>
        <div style={{ marginBottom: 10 }}>
          {FAM_LABEL.map((l, i) => (
            <span key={i} className={`chip ${famFilter.includes(i) ? 'active' : ''}`} onClick={() => toggleFam(i)}>
              {l}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 4 }}>Format</div>
        <div style={{ marginBottom: 10 }}>
          {FORMATS.map(([key, label]) => (
            <span key={key} className={`chip ${format === key ? 'active' : ''}`} onClick={() => setFormat(key)}>
              {label}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 4 }}>
          Direction{format === 'fillblank' ? ' (fill-in-blank always fills the English word)' : ''}
        </div>
        <div style={{ marginBottom: 16 }}>
          {DIRECTIONS.map(([key, label]) => (
            <span
              key={key}
              className={`chip ${direction === key ? 'active' : ''}`}
              style={format === 'fillblank' ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
              onClick={() => setDirection(key)}
            >
              {label}
            </span>
          ))}
        </div>
        <button className="btn" onClick={start}>Start quiz</button>
      </div>
    );
  }

  if (step === 'question') {
    const w = pool[q];
    const dir = effectiveDirection();
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--t-textsoft)', marginBottom: 6 }}>Question {q + 1} / {pool.length}</div>
        {format === 'mc' && (
          <>
            <Prompt text={dir === 'zh-en' ? w.chinese_word : w.english_word} />
            {mcOptions.map((o, i) => (
              <button key={i} className="btn secondary" style={{ display: 'block', width: '100%', marginBottom: 8, textAlign: 'left' }} onClick={() => submitAnswer(o)}>
                {o}
              </button>
            ))}
          </>
        )}
        {format === 'typing' && (
          <>
            <Prompt text={dir === 'zh-en' ? w.chinese_word : w.english_word} />
            <input type="text" value={typed} placeholder="type your answer" onChange={(e) => setTyped(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn" onClick={() => submitAnswer(typed)}>Submit</button>
          </>
        )}
        {format === 'fillblank' && (
          <>
            <div style={{ background: 'var(--t-card)', borderRadius: 'var(--t-radius)', padding: 20, textAlign: 'center', fontSize: 16, marginBottom: 6 }}>
              {blankSentence(w)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t-textsoft)', textAlign: 'center', marginBottom: 12 }}>{w.example_sentence_zh}</div>
            <input type="text" value={typed} placeholder="fill in the missing word" onChange={(e) => setTyped(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn" onClick={() => submitAnswer(typed)}>Submit</button>
          </>
        )}
      </div>
    );
  }

  if (step === 'feedback' && feedback) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        {feedback.correct ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--t-success)' }}>Correct! +5 XP</div>
            <div style={{ fontSize: 11, color: 'var(--t-textsoft)', margin: '6px 0 16px' }}>
              Familiarity unchanged ({FAM_LABEL[feedback.word.familiarity]})
            </div>
            <button className="btn" onClick={next}>Next</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--t-danger)' }}>Not quite — answer: {feedback.answer}</div>
            {feedback.word.familiarity > 0 ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--t-textsoft)', margin: '10px 0' }}>
                  Move this word down from <b>{FAM_LABEL[feedback.word.familiarity]}</b> to <b>{FAM_LABEL[feedback.word.familiarity - 1]}</b>?
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button className="btn" onClick={() => demote(true)}>Yes, move down</button>
                  <button className="btn secondary" onClick={() => demote(false)}>No, keep it</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: 'var(--t-textsoft)', margin: '8px 0 16px' }}>Already at "New" — nothing lower to move to.</div>
                <button className="btn" onClick={next}>Next</button>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // results
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{score} / {pool.length}</div>
      <div style={{ fontSize: 12, color: 'var(--t-textsoft)', margin: '6px 0 16px' }}>
        +{score * 5} XP earned{pool.length > 0 && score === pool.length ? ' (+10 perfect bonus)' : ''}
      </div>
      <button className="btn" onClick={() => setStep('setup')}>Retake</button>
    </div>
  );
}

function Prompt({ text }) {
  return (
    <div style={{ background: 'var(--t-card)', borderRadius: 'var(--t-radius)', padding: 20, textAlign: 'center', fontSize: 20, marginBottom: 14 }}>
      {text}
    </div>
  );
}

function blankSentence(w) {
  const re = new RegExp('\\b\\w*' + w.english_word + '\\w*\\b', 'i');
  return w.example_sentence_en.replace(re, '_____');
}
