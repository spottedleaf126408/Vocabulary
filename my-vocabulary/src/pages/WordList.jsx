import { useState } from 'react';
import { FAM_LABEL } from '../students.js';
import { WORD_FIELDS } from '../wordFields.js';

const SORTS = [
  ['az', 'A–Z'],
  ['date', 'Newest'],
  ['fam', 'Familiarity']
];

export default function WordList({ words, onUpdate, onDelete }) {
  const [sort, setSort] = useState('date');
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  let sorted = [...words];
  if (sort === 'az') sorted.sort((a, b) => a.english_word.localeCompare(b.english_word));
  else if (sort === 'date') sorted.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
  else if (sort === 'fam') sorted.sort((a, b) => a.familiarity - b.familiarity);

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        {SORTS.map(([key, label]) => (
          <span key={key} className={`chip ${sort === key ? 'active' : ''}`} onClick={() => setSort(key)}>
            {label}
          </span>
        ))}
      </div>
      {sorted.length === 0 && <div style={{ fontSize: 13, color: 'var(--t-textsoft)' }}>No words yet — add one from the Entry tab.</div>}
      {sorted.map((w) => (
        <WordRow
          key={w.id}
          word={w}
          isExpanded={expandedId === w.id}
          isEditing={editingId === w.id}
          onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
          onEdit={() => setEditingId(w.id)}
          onCancelEdit={() => setEditingId(null)}
          onSave={async (updates) => {
            await onUpdate(w.id, updates);
            setEditingId(null);
          }}
          onDelete={() => onDelete(w.id)}
        />
      ))}
    </div>
  );
}

function WordRow({ word, isExpanded, isEditing, onToggle, onEdit, onCancelEdit, onSave, onDelete }) {
  const [form, setForm] = useState(word);

  return (
    <div className="wordrow">
      <div className="wordrow-top" onClick={onToggle}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {word.english_word} <span style={{ fontWeight: 400, color: 'var(--t-textsoft)' }}>{word.chinese_word}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t-textsoft)' }}>{word.example_sentence_en}</div>
        </div>
        <span className="pill">{FAM_LABEL[word.familiarity]}</span>
      </div>

      {isExpanded && !isEditing && (
        <div style={{ marginTop: 8, background: 'var(--t-bg)', borderRadius: 'var(--t-radius)', padding: '10px 12px' }}>
          <Detail label="Part of speech" value={word.part_of_speech} />
          <Detail label="Phrase" value={word.phrase_en} />
          <Detail label="Phrase meaning" value={word.phrase_zh} />
          <Detail label="Sentence (EN)" value={word.example_sentence_en} />
          <Detail label="Sentence (中)" value={word.example_sentence_zh} />
          <Detail label="Word family" value={word.word_family} />
          <Detail label="Tag / unit" value={word.tag_unit} />
          <Detail label="Date added" value={word.date_added} />
          <Detail label="Added by" value={word.added_by} />
          <Detail label="Familiarity" value={FAM_LABEL[word.familiarity]} />
          <Detail label="Correct / wrong" value={`${word.times_correct || 0} / ${word.times_incorrect || 0}`} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn secondary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              Edit
            </button>
            <button
              className="btn secondary"
              style={{ fontSize: 11, padding: '6px 10px' }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete "' + word.english_word + '"?')) onDelete();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {isExpanded && isEditing && (
        <div style={{ marginTop: 8, background: 'var(--t-bg)', borderRadius: 'var(--t-radius)', padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
          {WORD_FIELDS.map(([key, label]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div className="field-label">{label}</div>
              <input type="text" value={form[key] || ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => onSave(form)}>
              Save
            </button>
            <button className="btn secondary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detailrow">
      <div className="label">{label}</div>
      <div>{value || '—'}</div>
    </div>
  );
}
