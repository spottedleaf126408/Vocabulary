import { FAM_LABEL } from '../students.js';

export default function Stats({ words, stats }) {
  const dist = [0, 0, 0, 0, 0];
  words.forEach((w) => { dist[w.familiarity] += 1; });
  const max = Math.max(...dist, 1);

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--t-textsoft)', marginBottom: 10 }}>Familiarity distribution</div>
      {dist.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 70, fontSize: 11, color: 'var(--t-textsoft)' }}>{FAM_LABEL[i]}</div>
          <div style={{ flex: 1, background: 'var(--t-card)', borderRadius: 6, height: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((100 * v) / max)}%`, background: 'var(--t-primary)' }} />
          </div>
          <div style={{ width: 16, fontSize: 11 }}>{v}</div>
        </div>
      ))}
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--t-textsoft)' }}>
        Current streak: <b style={{ color: 'var(--t-text)' }}>{stats?.streak ?? 0} days</b>
        {' '}&middot; Longest: <b style={{ color: 'var(--t-text)' }}>{stats?.longestStreak ?? 0} days</b>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--t-textsoft)' }}>
        Level <b style={{ color: 'var(--t-text)' }}>{stats?.level ?? 1}</b>
        {' '}&middot; {stats?.xpIntoLevel ?? 0} / {stats?.xpForNextLevel ?? 50} XP to next level
        {' '}&middot; {stats?.xp ?? 0} XP lifetime
      </div>
      {stats?.badges?.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--t-textsoft)' }}>
          Badges: {stats.badges.join(', ')}
        </div>
      )}
    </div>
  );
}
