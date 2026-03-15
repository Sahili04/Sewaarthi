import { useState } from 'react'

export default function Dashboard({ medicines, onStatusUpdate, onNavigate }) {
  const [filter, setFilter] = useState('all')

  const taken = medicines.filter(m => m.status === 'taken').length
  const missed = medicines.filter(m => m.status === 'missed').length
  const pending = medicines.filter(m => m.status === 'pending').length
  const total = medicines.length
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (adherence / 100) * circumference
  const filtered = filter === 'all' ? medicines : medicines.filter(m => m.status === filter)

  return (
    <>
      <div className="greeting">
        <h2>Hello, Anant 👋</h2>
        <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* HERO BANNER */}
      <div className="hero-banner">
        <div className="hero-illustration">🩺</div>
        <div className="hero-content">
          <div className="hero-tag">Today's Summary</div>
          <h3>Stay Healthy,{'\n'}Stay Strong 💪</h3>
          <p>Your medicine schedule for today</p>
          <div className="hero-pills">
            <div className="hero-pill">
              <span className="pv">{total}</span>
              <span className="pl">Total</span>
            </div>
            <div className="hero-pill">
              <span className="pv">{taken}</span>
              <span className="pl">Taken</span>
            </div>
            <div className="hero-pill">
              <span className="pv">{pending}</span>
              <span className="pl">Pending</span>
            </div>
            <div className="hero-pill">
              <span className="pv">{missed}</span>
              <span className="pl">Missed</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-grid">
        {[
          { icon: '➕', title: 'Add Medicine', sub: 'Schedule new', color: 'purple', page: 'add' },
          { icon: '🤖', title: 'AI Assistant', sub: 'Ask anything', color: 'teal', page: 'ai' },
          { icon: '📷', title: 'Scan Rx', sub: 'Upload photo', color: 'blue', page: 'scanner' },
          { icon: '💊', title: 'Dispenser', sub: 'IoT device', color: 'green', page: 'iot' },
        ].map(q => (
          <button key={q.page} className={'quick-card ' + q.color} onClick={() => onNavigate(q.page)}>
            <span className="qc-icon">{q.icon}</span>
            <div className="qc-title">{q.title}</div>
            <div className="qc-sub">{q.sub}</div>
          </button>
        ))}
      </div>

      {/* ADHERENCE */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📊 Adherence Rate</div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--purple)' }}>{adherence}%</span>
        </div>
        <div className="ring-wrap">
          <div className="ring-box">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#ede9fe" strokeWidth="9" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#pg)" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ring-center">
              <div className="ring-pct">{adherence}%</div>
              <div className="ring-lbl">Rate</div>
            </div>
          </div>
          <div className="adh-list">
            {[
              { label: 'Taken', value: taken, color: 'var(--success)' },
              { label: 'Pending', value: pending, color: 'var(--warning)' },
              { label: 'Missed', value: missed, color: 'var(--danger)' },
            ].map(item => (
              <div className="adh-row" key={item.label}>
                <div className="adh-dot" style={{ background: item.color }} />
                <span style={{ width: 52, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
                <div className="adh-bar">
                  <div className="adh-fill" style={{ width: total ? `${(item.value / total) * 100}%` : '0%', background: item.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, minWidth: 14 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {missed > 0 && (
        <div className="alert danger">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div><strong>Caregiver Alerted!</strong><div style={{ fontWeight: 400, marginTop: 2 }}>{missed} missed dose{missed > 1 ? 's' : ''} reported.</div></div>
        </div>
      )}

      {/* MEDICINE LIST */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">💊 Today's Medicines</div>
          <button className="btn btn-primary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => onNavigate('add')}>+ Add</button>
        </div>
        <div className="filter-tabs">
          {['all', 'pending', 'taken', 'missed'].map(f => (
            <button key={f} className={'ftab' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="e-icon">💊</div>
            <h3>No medicines yet</h3>
            <p>Add your first medicine to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => onNavigate('add')}>+ Add Medicine</button>
          </div>
        ) : (
          filtered.map(med => (
            <div className="med-item" key={med.id}>
              <div className="med-icon">💊</div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.foodTiming} food</div>
                <span className={'badge ' + med.status} style={{ marginTop: 4, display: 'inline-flex' }}>
                  {med.status === 'taken' ? '✅' : med.status === 'missed' ? '❌' : '⏳'} {med.status}
                </span>
              </div>
              <div className="med-right">
                <span className="med-time">⏰ {med.time}</span>
                {med.status === 'pending' && (
                  <div className="action-row">
                    <button className="btn btn-success" onClick={() => onStatusUpdate(med.id, 'taken')}>✓ Taken</button>
                    <button className="btn btn-danger" onClick={() => onStatusUpdate(med.id, 'missed')}>✗ Miss</button>
                  </div>
                )}
                {med.status === 'missed' && <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>🔔 Alert Sent</span>}
                {med.status === 'taken' && <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>👍 Done!</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}