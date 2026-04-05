import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'

// GitHub-style health heatmap
function HealthHeatmap({ user, db }) {
  const [data, setData] = useState({})
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (!user || !db) return
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'dailyHealth'))
        const d = {}; snap.forEach(s => { d[s.id] = s.data() }); setData(d)
      } catch(e) {}
    }
    fetch()
  }, [user, db])

  const days = []
  const now = new Date()
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

  const weeks = []; let week = []
  days.forEach((day, i) => {
    if (i === 0) { const d = new Date(day); for (let p = 0; p < d.getDay(); p++) week.push(null) }
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  })
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week) }

  const intensity = (score) => !score ? 0 : score < 30 ? 1 : score < 60 ? 2 : score < 85 ? 3 : 4
  const colors = ['rgba(26,111,255,0.08)','rgba(26,111,255,0.2)','rgba(26,111,255,0.4)','rgba(26,111,255,0.65)','#1a6fff']

  return (
    <div className="card" style={{ animation:'fadeUp 0.5s 0.3s both' }}>
      <div className="section-title" style={{ marginBottom:14 }}>📅 Health Streak Heatmap</div>
      <div style={{ overflowX:'auto', position:'relative' }}>
        <div style={{ display:'flex', gap:3 }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {wk.map((day, di) => {
                if (!day) return <div key={di} style={{ width:12, height:12 }} />
                const d = data[day]
                const score = d ? Math.round(((d.medicineScore||0)+(d.waterScore||0)+(d.activityScore||0))/3) : 0
                const lvl = intensity(score)
                return (
                  <div key={di}
                    style={{ width:12, height:12, borderRadius:3, background:colors[lvl], cursor:'pointer', transition:'transform 0.1s' }}
                    onMouseEnter={e => setTooltip({ day, score, med:d?.medicineScore||0, water:d?.waterScore||0, act:d?.activityScore||0, x:e.clientX, y:e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:10, fontSize:10, color:'var(--text3)' }}>
          <span>Less</span>
          {colors.map((c,i) => <div key={i} style={{ width:12, height:12, borderRadius:3, background:c }} />)}
          <span>More</span>
        </div>
      </div>
      {tooltip && (
        <div style={{ position:'fixed', background:'rgba(13,27,62,0.92)', color:'#fff', borderRadius:10, padding:'10px 14px', fontSize:11, zIndex:9999, pointerEvents:'none', left:tooltip.x+12, top:tooltip.y-80, lineHeight:1.7, boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }}>
          <strong>{tooltip.day}</strong><br/>
          💊 Medicine: {tooltip.med}%<br/>
          💧 Water: {tooltip.water}%<br/>
          🏃 Activity: {tooltip.act}%<br/>
          Overall: {tooltip.score}%
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ medicines, onStatusUpdate, onDelete, onNavigate, user, userProfile, lang, tr, db }) {
  const [filter, setFilter] = useState('all')
  const [waterToday, setWaterToday] = useState(0)
  const today = new Date().toISOString().split('T')[0]

  const taken   = medicines.filter(m => m.status === 'taken').length
  const missed  = medicines.filter(m => m.status === 'missed').length
  const pending = medicines.filter(m => m.status === 'pending').length
  const total   = medicines.length
  const adherence    = total > 0 ? Math.round((taken / total) * 100) : 0
  const circumference = 2 * Math.PI * 46
  const offset        = circumference - (adherence / 100) * circumference
  const filtered      = filter === 'all' ? medicines : medicines.filter(m => m.status === filter)

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const name  = user?.displayName || user?.email?.split('@')[0] || 'User'
  const waterGoal = parseFloat(userProfile?.waterGoalLiters || 2.5) * 1000

  useEffect(() => {
    if (!user || !db) return
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'waterIntake', today))
        if (snap.exists()) setWaterToday(snap.data().totalMl || 0)
      } catch(e) {}
    }
    fetch()
  }, [user, db])

  const waterPct = Math.min((waterToday / waterGoal) * 100, 100)
  const withDoctor = medicines.filter(m => m.doctorPhone)

  return (
    <>
      <style>{`
        @keyframes medIn { from{opacity:0;transform:translateY(18px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);} }
        .med-row { animation: medIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="greeting s1">
        <h2>{greet}, {name} 👋</h2>
        <p>{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      {/* HERO */}
      <div className="hero-card s2">
        <div className="hero-glow" />
        <div className="hero-illustration">🩺</div>
        <div className="hero-content">
          <div className="hero-tag">⚡ Today's Overview</div>
          <h3>Stay on track,<br />feel great 💪</h3>
          <p>Your medicine schedule</p>
          <div className="hero-pills">
            {[{v:total,l:'Total'},{v:taken,l:'Taken'},{v:pending,l:'Left'}].map(p => (
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
          { icon:'➕', title:'Add Medicine', sub:'New schedule',  page:'add' },
          { icon:'🤖', title:'AI Chat',      sub:'Ask anything',  page:'ai' },
          { icon:'📷', title:'Scan Rx',      sub:'AI scanner',    page:'scanner' },
          { icon:'💧', title:'Water',        sub:'Track intake',  page:'water' },
          { icon:'🏃', title:'Habits',       sub:'Activities',    page:'habits' },
          { icon:'📄', title:'Reports',      sub:'PDF report',    page:'reports' },
          { icon:'🔌', title:'Dispenser',    sub:'IoT device',    page:'iot' },
          { icon:'👨‍⚕️', title:'Caretaker',   sub:'Manage care',  page:'caretaker' },
        ].map(q => (
          <button key={q.page} className="quick-card" onClick={() => onNavigate(q.page)}>
            <span className="qc-icon">{q.icon}</span>
            <div className="qc-title">{q.title}</div>
            <div className="qc-sub">{q.sub}</div>
          </button>
        ))}
      </div>

      {/* STATS */}
      <div className="stats-grid s4">
        {[
          { icon:'💊', label:'Total Today', value:total,   cls:'si1' },
          { icon:'✅', label:'Taken',        value:taken,   cls:'si2' },
          { icon:'⏳', label:'Pending',      value:pending, cls:'si4' },
          { icon:'💧', label:'Water (ml)',   value:waterToday, cls:'si2' },
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

      {/* WATER PROGRESS */}
      <div className="card" style={{ animation:'fadeUp 0.4s 0.1s both' }}>
        <div className="section-header">
          <div className="section-title">💧 Water Intake Today</div>
          <button className="btn btn-outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={() => onNavigate('water')}>
            + Add
          </button>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>
          {(waterToday/1000).toFixed(2)}L of {(waterGoal/1000).toFixed(1)}L goal
        </div>
        <div style={{ height:8, background:'rgba(26,111,255,0.1)', borderRadius:99, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${waterPct}%`, background:'linear-gradient(90deg,#38bdf8,#1a6fff)', borderRadius:99, transition:'width 0.5s' }} />
        </div>
        <div style={{ fontSize:11, color:'var(--blue)', fontWeight:700 }}>{Math.round(waterPct)}% of daily goal</div>
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
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(26,111,255,0.1)" strokeWidth="9" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="url(#rg)" strokeWidth="9"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
            </svg>
            <div className="ring-center">
              <div className="ring-pct">{adherence}%</div>
              <div className="ring-lbl">Rate</div>
            </div>
          </div>
          <div className="adh-list">
            {[
              { label:'Taken',   value:taken,   color:'var(--success)' },
              { label:'Pending', value:pending, color:'var(--warning)' },
              { label:'Missed',  value:missed,  color:'var(--danger)'  },
            ].map(item => (
              <div className="adh-row" key={item.label}>
                <div className="adh-dot" style={{ background:item.color }} />
                <span className="adh-label">{item.label}</span>
                <div className="adh-bar">
                  <div className="adh-fill" style={{ width: total?`${(item.value/total)*100}%`:'0%', background:item.color }} />
                </div>
                <span className="adh-count">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HEALTH HEATMAP */}
      <HealthHeatmap user={user} db={db} />

      {/* MISSED ALERT */}
      {missed > 0 && (
        <div className="alert danger" style={{ animation:'fadeUp 0.35s ease' }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <strong>Missed Dose Alert!</strong>
            <div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>
              {missed} missed dose{missed>1?'s':''} — caregiver has been notified.
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY CONTACTS */}
      {withDoctor.length > 0 && (
        <div className="card" style={{ animation:'fadeUp 0.4s 0.1s both' }}>
          <div className="section-title" style={{ marginBottom:12 }}>🏥 Emergency Contacts</div>
          {withDoctor.map(m => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(26,111,255,0.08)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{m.doctorName || 'Doctor'}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>For: {m.name}</div>
              </div>
              <a href={`tel:${m.doctorPhone}`}
                style={{ background:'rgba(0,196,140,0.12)', color:'var(--success)', border:'1px solid rgba(0,196,140,0.25)', padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                📞 {m.doctorPhone}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* MEDICINE LIST */}
      <div className="card" style={{ animation:'fadeUp 0.5s 0.2s both' }}>
        <div className="section-header">
          <div className="section-title">💊 Today's Medicines</div>
          <button className="btn btn-primary" style={{ fontSize:11, padding:'6px 12px' }} onClick={() => onNavigate('add')}>
            + Add
          </button>
        </div>

        <div className="filter-tabs">
          {['all','pending','taken','missed'].map(f => (
            <button key={f} className={'ftab' + (filter===f?' active':'')} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>({medicines.filter(m=>m.status===f).length})</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="e-icon">💊</div>
            <h3>{filter==='all' ? 'No medicines scheduled' : `No ${filter} medicines`}</h3>
            <p>{filter==='all' ? 'Add your first medicine to get started' : `Your ${filter} list is empty`}</p>
            {filter==='all' && (
              <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => onNavigate('add')}>
                + Add Medicine
              </button>
            )}
          </div>
        ) : filtered.map((med, idx) => {
          const times = med.times || (med.time ? [med.time] : [])
          return (
            <div className="med-item med-row" key={med.id} style={{ animationDelay:`${idx*0.07}s` }}>
              <div className="med-icon" style={{
                background: med.status==='taken' ? 'rgba(0,196,140,0.12)' : med.status==='missed' ? 'rgba(255,77,106,0.12)' : 'rgba(26,111,255,0.1)'
              }}>
                {med.status==='taken' ? '✅' : med.status==='missed' ? '❌' : '💊'}
              </div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.foodTiming} food · {med.duration}d</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
                  {times.map(tm => (
                    <span key={tm} style={{ fontSize:10, fontWeight:700, background:'rgba(26,111,255,0.1)', color:'var(--blue)', padding:'2px 7px', borderRadius:6 }}>
                      ⏰ {tm}
                    </span>
                  ))}
                </div>
                <span className={'badge ' + med.status} style={{ marginTop:6, display:'inline-flex' }}>
                  {med.status==='taken' ? '✅ Taken' : med.status==='missed' ? '❌ Missed' : '⏳ Pending'}
                </span>
              </div>
              <div className="med-right">
                {/* Only Mark Taken — no missed button */}
                {med.status === 'pending' && (
                  <button className="btn btn-success" onClick={() => onStatusUpdate(med.id, 'taken')}>✓ Taken</button>
                )}
                {med.status === 'missed' && (
                  <button className="btn btn-success" style={{ fontSize:10, padding:'4px 8px' }}
                    onClick={() => onStatusUpdate(med.id, 'taken')}>Mark Taken</button>
                )}
                {med.status === 'taken' && (
                  <span style={{ fontSize:10, color:'var(--success)', fontWeight:700 }}>👍 Done!</span>
                )}
                {med.doctorPhone && (
                  <a href={`tel:${med.doctorPhone}`}
                    style={{ fontSize:10, color:'var(--success)', fontWeight:700, textDecoration:'none', marginTop:4 }}>
                    📞 Call Dr.
                  </a>
                )}
                <button
                  onClick={() => { if (window.confirm(`Delete "${med.name}" from your schedule?`)) { onDelete(med.id) } }}
                  style={{ marginTop:6, background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.25)', color:'var(--danger)', padding:'4px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)', transition:'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background='rgba(255,77,106,0.22)'}
                  onMouseOut={e  => e.currentTarget.style.background='rgba(255,77,106,0.1)'}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}