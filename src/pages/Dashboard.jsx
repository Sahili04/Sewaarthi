import { useState } from 'react'

export default function Dashboard({ medicines, onStatusUpdate, onNavigate, user }) {
  const [filter, setFilter] = useState('all')

  // ── Computed stats (recalculate every render when medicines changes)
  const taken     = medicines.filter(m => m.status === 'taken').length
  const missed    = medicines.filter(m => m.status === 'missed').length
  const pending   = medicines.filter(m => m.status === 'pending').length
  const total     = medicines.length
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0

  const circumference = 2 * Math.PI * 46
  const offset        = circumference - (adherence / 100) * circumference

  const filtered = filter === 'all'
    ? medicines
    : medicines.filter(m => m.status === filter)

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const name  = user?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <>
      <style>{`
        @keyframes medIn {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        .med-row { animation: medIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* GREETING */}
      <div className="greeting s1">
        <h2>{greet}, {name} 👋</h2>
        <p>{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      {/* HERO BANNER */}
      <div className="hero-card s2">
        <div className="hero-glow" />
        <div className="hero-illustration">🩺</div>
        <div className="hero-content">
          <div className="hero-tag">⚡ Today's Overview</div>
          <h3>Stay on track,<br />feel great 💪</h3>
          <p>Your medicine schedule</p>
          <div className="hero-pills">
            {[
              { v: total,   l: 'Total'  },
              { v: taken,   l: 'Taken'  },
              { v: pending, l: 'Left'   },
              { v: missed,  l: 'Missed' },
            ].map(p => (
              <div className="hero-pill" key={p.l}>
                <span className="pv">{p.v}</span>
                <span className="pl">{p.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-grid s3">
        {[
          { icon:'➕', title:'Add Medicine', sub:'New schedule', cls:'p1', page:'add'     },
          { icon:'🤖', title:'AI Chat',      sub:'Ask anything', cls:'p2', page:'ai'      },
          { icon:'📷', title:'Scan Rx',      sub:'Upload photo', cls:'p3', page:'scanner' },
          { icon:'🔌', title:'Dispenser',    sub:'IoT device',   cls:'p4', page:'iot'     },
        ].map(q => (
          <button key={q.page} className={'quick-card ' + q.cls} onClick={() => onNavigate(q.page)}>
            <span className="qc-icon">{q.icon}</span>
            <div className="qc-title">{q.title}</div>
            <div className="qc-sub">{q.sub}</div>
          </button>
        ))}
      </div>

      {/* STATS */}
      <div className="stats-grid s4">
        {[
          { icon:'💊', label:'Total Today', value: total,   cls:'si1' },
          { icon:'✅', label:'Taken',        value: taken,   cls:'si2' },
          { icon:'❌', label:'Missed',       value: missed,  cls:'si3' },
          { icon:'⏳', label:'Pending',      value: pending, cls:'si4' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={'stat-icon ' + s.cls}>{s.icon}</div>
            <div className="stat-info">
              <div className="v">{s.value}</div>
              <div className="l">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ADHERENCE RING */}
      <div className="card s5">
        <div className="section-header">
          <div className="section-title">📊 Adherence Rate</div>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>{adherence}%</span>
        </div>
        <div className="ring-wrap">
          <div className="ring-box">
            <svg width="110" height="110" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#1a6fff" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle cx="50" cy="50" r="46" fill="none"
                stroke="rgba(26,111,255,0.12)" strokeWidth="9" />
              {/* Progress — animates whenever adherence changes */}
              <circle cx="50" cy="50" r="46" fill="none"
                stroke="url(#rg)" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <div className="ring-center">
              <div className="ring-pct">{adherence}%</div>
              <div className="ring-lbl">Rate</div>
            </div>
          </div>

          <div className="adh-list">
            {[
              { label:'Taken',   value: taken,   color:'var(--success)' },
              { label:'Pending', value: pending, color:'var(--warning)' },
              { label:'Missed',  value: missed,  color:'var(--danger)'  },
            ].map(item => (
              <div className="adh-row" key={item.label}>
                <div className="adh-dot"   style={{ background: item.color }} />
                <span className="adh-label">{item.label}</span>
                <div className="adh-bar">
                  <div className="adh-fill"
                    style={{
                      width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                      background: item.color,
                    }}
                  />
                </div>
                <span className="adh-count">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MISSED ALERT */}
      {missed > 0 && (
        <div className="alert danger" style={{ animation:'medIn 0.35s ease' }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div>
            <strong>Caregiver Alerted!</strong>
            <div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>
              {missed} missed dose{missed > 1 ? 's' : ''} reported.
            </div>
          </div>
        </div>
      )}

      {/* MEDICINE LIST */}
      <div className="card" style={{ animation:'medIn 0.5s 0.35s both' }}>
        <div className="section-header">
          <div className="section-title">💊 Today's Medicines</div>
          <button className="btn btn-primary"
            style={{ fontSize:11, padding:'6px 12px' }}
            onClick={() => onNavigate('add')}>
            + Add
          </button>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {['all','pending','taken','missed'].map(f => (
            <button key={f}
              className={'ftab' + (filter === f ? ' active' : '')}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>
                  ({medicines.filter(m => m.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="e-icon">💊</div>
            <h3>{filter === 'all' ? 'No medicines scheduled' : `No ${filter} medicines`}</h3>
            <p>{filter === 'all' ? 'Add your first medicine to get started' : `Your ${filter} list is empty`}</p>
            {filter === 'all' && (
              <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => onNavigate('add')}>
                + Add Medicine
              </button>
            )}
          </div>
        ) : (
          filtered.map((med, idx) => (
            <div className="med-item med-row" key={med.id}
              style={{ animationDelay: `${idx * 0.07}s` }}>

              {/* Icon changes based on status */}
              <div className="med-icon" style={{
                background:
                  med.status === 'taken'  ? 'rgba(0,196,140,0.12)' :
                  med.status === 'missed' ? 'rgba(255,77,106,0.12)' :
                  'rgba(26,111,255,0.1)',
              }}>
                {med.status === 'taken'  ? '✅' :
                 med.status === 'missed' ? '❌' : '💊'}
              </div>

              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.foodTiming} food · {med.duration}d</div>
                <span className={'badge ' + med.status} style={{ marginTop:6, display:'inline-flex' }}>
                  {med.status === 'taken'  ? '✅ Taken'   :
                   med.status === 'missed' ? '❌ Missed'  : '⏳ Pending'}
                </span>
              </div>

              <div className="med-right">
                <span className="med-time">⏰ {med.time}</span>

                {/* PENDING — show Taken + Miss buttons */}
                {med.status === 'pending' && (
                  <div className="action-row">
                    <button
                      className="btn btn-success"
                      onClick={() => onStatusUpdate(med.id, 'taken')}
                    >
                      ✓ Taken
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => onStatusUpdate(med.id, 'missed')}
                    >
                      ✗ Miss
                    </button>
                  </div>
                )}

                {/* MISSED — show alert + option to mark as taken */}
                {med.status === 'missed' && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                    <span style={{ fontSize:10, color:'var(--danger)', fontWeight:700 }}>🔔 Alert Sent</span>
                    <button
                      className="btn btn-success"
                      style={{ fontSize:10, padding:'4px 8px' }}
                      onClick={() => onStatusUpdate(med.id, 'taken')}
                    >
                      Mark Taken
                    </button>
                  </div>
                )}

                {/* TAKEN */}
                {med.status === 'taken' && (
                  <span style={{ fontSize:10, color:'var(--success)', fontWeight:700 }}>👍 Done!</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}