import { useState } from 'react'

export default function Dashboard({ medicines, onStatusUpdate, onNavigate, user }) {
  const [filter, setFilter] = useState('all')

  const taken = medicines.filter(m => m.status === 'taken').length
  const missed = medicines.filter(m => m.status === 'missed').length
  const pending = medicines.filter(m => m.status === 'pending').length
  const total = medicines.length
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (adherence / 100) * circumference
  const filtered = filter === 'all' ? medicines : medicines.filter(m => m.status === filter)

  const name = user?.displayName || user?.email?.split('@')[0] || 'User'
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <>
      <style>{`
        @keyframes medCardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .med-card-in{animation:medCardIn 0.3s ease forwards;opacity:0;}
      `}</style>

      <div className="greeting">
        <h2>{greet}, {name} 👋</h2>
        <p>{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {/* HERO */}
      <div className="hero-card">
        <div className="hero-glow"/>
        <div className="hero-content">
          <div className="hero-tag">⚡ Today's Health Overview</div>
          <h3>Stay on track,<br/>stay healthy 💪</h3>
          <p>Your medication schedule for today</p>
          <div className="hero-pills">
            {[{v:total,l:'Total'},{v:taken,l:'Taken'},{v:pending,l:'Pending'},{v:missed,l:'Missed'}].map(p=>(
              <div className="hero-pill" key={p.l}>
                <span className="pv">{p.v}</span>
                <span className="pl">{p.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-grid">
        {[
          {icon:'➕',title:'Add Medicine',sub:'Schedule new',page:'add'},
          {icon:'🤖',title:'AI Chat',sub:'Ask anything',page:'ai'},
          {icon:'📷',title:'Scan Rx',sub:'Upload photo',page:'scanner'},
          {icon:'🔌',title:'Dispenser',sub:'IoT device',page:'iot'},
        ].map(q=>(
          <button key={q.page} className="quick-card" onClick={()=>onNavigate(q.page)}>
            <span className="qc-icon">{q.icon}</span>
            <div className="qc-title">{q.title}</div>
            <div className="qc-sub">{q.sub}</div>
          </button>
        ))}
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {[
          {icon:'💊',label:'Total Today',value:total,cls:'si1'},
          {icon:'✅',label:'Taken',value:taken,cls:'si2'},
          {icon:'❌',label:'Missed',value:missed,cls:'si3'},
          {icon:'⏳',label:'Pending',value:pending,cls:'si4'},
        ].map(s=>(
          <div className="stat-card" key={s.label}>
            <div className={'stat-icon '+s.cls}>{s.icon}</div>
            <div className="stat-info">
              <div className="v">{s.value}</div>
              <div className="l">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ADHERENCE */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">📊 Adherence Rate</div>
          <span style={{fontSize:13,fontWeight:700,color:'#a78bfa'}}>{adherence}%</span>
        </div>
        <div className="ring-wrap">
          <div className="ring-box">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1a2035" strokeWidth="9"/>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#rg)" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{transition:'stroke-dashoffset 1s ease'}}
              />
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
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
              {label:'Taken',value:taken,color:'#10b981'},
              {label:'Pending',value:pending,color:'#f59e0b'},
              {label:'Missed',value:missed,color:'#f43f5e'},
            ].map(item=>(
              <div className="adh-row" key={item.label}>
                <div className="adh-dot" style={{background:item.color}}/>
                <span className="adh-label">{item.label}</span>
                <div className="adh-bar">
                  <div className="adh-fill" style={{width:total?`${(item.value/total)*100}%`:'0%',background:item.color}}/>
                </div>
                <span className="adh-count">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {missed > 0 && (
        <div className="alert danger">
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <strong>Caregiver Alerted!</strong>
            <div style={{fontWeight:400,marginTop:2,fontSize:12}}>{missed} missed dose{missed>1?'s':''} reported.</div>
          </div>
        </div>
      )}

      {/* MEDICINE LIST */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">💊 Today's Medicines</div>
          <button className="btn btn-primary" style={{fontSize:11,padding:'6px 12px'}} onClick={()=>onNavigate('add')}>
            + Add
          </button>
        </div>

        <div className="filter-tabs">
          {['all','pending','taken','missed'].map(f=>(
            <button key={f} className={'ftab'+(filter===f?' active':'')} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {f!=='all'&&<span style={{marginLeft:4,fontSize:10,opacity:0.7}}>({medicines.filter(m=>m.status===f).length})</span>}
            </button>
          ))}
        </div>

        {filtered.length===0 ? (
          <div className="empty">
            <div className="e-icon">{filter==='taken'?'✅':filter==='missed'?'❌':filter==='pending'?'⏳':'💊'}</div>
            <h3>{filter==='all'?'No medicines scheduled':`No ${filter} medicines`}</h3>
            <p>{filter==='all'?'Add your first medicine to get started':`Your ${filter} list is empty`}</p>
            {filter==='all'&&(
              <button className="btn btn-primary" style={{marginTop:14}} onClick={()=>onNavigate('add')}>
                + Add Medicine
              </button>
            )}
          </div>
        ):(
          filtered.map((med,idx)=>(
            <div className="med-item med-card-in" key={med.id} style={{animationDelay:`${idx*0.05}s`}}>
              <div className="med-icon" style={{background:med.status==='taken'?'rgba(16,185,129,0.15)':med.status==='missed'?'rgba(244,63,94,0.15)':'rgba(124,58,237,0.15)'}}>
                {med.status==='taken'?'✅':med.status==='missed'?'❌':'💊'}
              </div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.foodTiming} food · {med.duration} days</div>
                <span className={'badge '+med.status} style={{marginTop:6,display:'inline-flex'}}>
                  {med.status==='taken'?'✅ Taken':med.status==='missed'?'❌ Missed':'⏳ Pending'}
                </span>
              </div>
              <div className="med-right">
                <span className="med-time">⏰ {med.time}</span>
                {med.status==='pending'&&(
                  <div className="action-row">
                    <button className="btn btn-success" onClick={()=>onStatusUpdate(med.id,'taken')}>✓ Taken</button>
                    <button className="btn btn-danger" onClick={()=>onStatusUpdate(med.id,'missed')}>✗ Miss</button>
                  </div>
                )}
                {med.status==='missed'&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <span style={{fontSize:10,color:'#fb7185',fontWeight:700}}>🔔 Alert Sent</span>
                    <button className="btn btn-success" style={{fontSize:10,padding:'4px 8px'}} onClick={()=>onStatusUpdate(med.id,'taken')}>
                      Mark Taken
                    </button>
                  </div>
                )}
                {med.status==='taken'&&<span style={{fontSize:10,color:'#34d399',fontWeight:700}}>👍 Done!</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}