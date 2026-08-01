import { useState } from 'react';
import { STUDENTS } from '../students.js';

export default function Login({ onLoggedIn }) {
  const [step, setStep] = useState('pick'); // 'pick' | 'pin'
  const [studentKey, setStudentKey] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function pick(key) {
    setStudentKey(key);
    setStep('pin');
    setPin('');
    setError(false);
  }

  function back() {
    setStudentKey(null);
    setStep('pick');
    setPin('');
    setError(false);
  }

  function pressDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => checkPin(next), 150);
    }
  }

  function clearDigit() {
    setPin((p) => p.slice(0, -1));
  }

  function checkPin(candidate) {
    const student = STUDENTS[studentKey];
    if (candidate === student.pin) {
      onLoggedIn(studentKey);
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 500);
    }
  }

  const themeClass = studentKey ? STUDENTS[studentKey].theme : 'theme-neutral';

  return (
    <div className={`app-shell ${themeClass}`}>
      <div className="app-inner">
        <div className="screen" style={{ paddingTop: 28 }}>
          <h1 className="sr-only">My Vocabulary login</h1>
          {step === 'pick' ? (
            <>
              <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: 0.3 }}>My Vocabulary</div>
                <div style={{ fontSize: 12, color: 'var(--t-textsoft)', marginTop: 6 }}>Who&apos;s learning today?</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 28 }}>
                {Object.values(STUDENTS).map((s) => (
                  <button key={s.key} className="avatarbtn" onClick={() => pick(s.key)}>
                    <div className="avatarcircle">
                      <i className={`ti ${s.avatarIcon}`} style={{ fontSize: 32, color: '#fff' }} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize: 13 }}>{s.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{STUDENTS[studentKey].name}</div>
              <div style={{ fontSize: 12, color: 'var(--t-textsoft)', marginBottom: 20 }}>Enter your PIN</div>
              <div className={error ? 'shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: i < pin.length ? (error ? 'var(--t-danger)' : 'var(--t-primary)') : 'transparent',
                      border: i < pin.length ? 'none' : '1px solid var(--t-textsoft)'
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, justifyItems: 'center', maxWidth: 220, margin: '0 auto 16px' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((k, i) =>
                  k === '' ? (
                    <div key={i} />
                  ) : k === 'back' ? (
                    <button key={i} className="keybtn" onClick={clearDigit} aria-label="backspace">
                      <i className="ti ti-backspace" style={{ fontSize: 20 }} />
                    </button>
                  ) : (
                    <button key={i} className="keybtn" onClick={() => pressDigit(k)}>
                      {k}
                    </button>
                  )
                )}
              </div>
              <button className="btn secondary" style={{ fontSize: 12 }} onClick={back}>
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
