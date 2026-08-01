import { useState } from 'react';
import { WORD_FIELDS as FIELDS, EMPTY_WORD as EMPTY } from '../wordFields.js';

export default function Entry({ student, onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.chinese_word.trim() || !form.english_word.trim()) {
      setError('Chinese word and English word are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAdd({ ...form, added_by: student.name });
      setForm(EMPTY);
    } catch (e) {
      setError('Could not save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--t-textsoft)', marginBottom: 10 }}>Add a new word (syncs to Google Sheet)</div>
      {FIELDS.map(([key, label, placeholder]) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div className="field-label">{label}</div>
          <input
            type="text"
            value={form[key]}
            placeholder={placeholder}
            onChange={(e) => update(key, e.target.value)}
          />
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--t-textsoft)', margin: '6px 0 12px' }}>
        Date added: auto &middot; Added by: {student.name}
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--t-danger)', marginBottom: 10 }}>{error}</div>}
      <button className="btn" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save word'}
      </button>
    </div>
  );
}
