export default function Home({ words, stats, goTo }) {
  const due = words.filter((w) => w.familiarity < 3).length;
  const mastered = words.filter((w) => w.familiarity === 4).length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <Metric value={words.length} label="total words" />
        <Metric value={due} label="due for review" />
        <Metric value={mastered} label="mastered" />
        <Metric value={stats?.streak ?? 0} label="day streak" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => goTo('entry')}>+ Add word</button>
        <button className="btn secondary" onClick={() => goTo('flashcards')}>Study flashcards</button>
        <button className="btn secondary" onClick={() => goTo('quiz')}>Take a quiz</button>
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="metric">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
