import { useState } from 'react'

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time' },
]

function inPeriod(dateStr, period) {
  if (period === 'all') return true
  const d   = new Date(dateStr || Date.now())
  const now = new Date()
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week')  {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    return d >= start
  }
  if (period === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }
  return true
}

const statusColor = s => s==='taken' ? '#059669' : s==='missed' ? '#e03355' : '#d97706'
const statusBg    = s => s==='taken' ? 'rgba(0,196,140,0.1)' : s==='missed' ? 'rgba(255,77,106,0.1)' : 'rgba(255,179,71,0.1)'
const statusLabel = s => s==='taken' ? '✅ Taken' : s==='missed' ? '❌ Missed' : '⏳ Pending'

export default function CaretakerDashboard({ medicines, currentUserName }) {
  const [period, setPeriod] = useState('today')

  // Filter by period using createdAt
  // For "today": show ALL medicines (they're all active today regardless of when added)
  const filtered = period === 'today'
    ? medicines
    : medicines.filter(m => inPeriod(m.createdAt, period))

  const taken   = filtered.filter(m => m.status === 'taken').length
  const missed  = filtered.filter(m => m.status === 'missed').length
  const pending = filtered.filter(m => m.status === 'pending').length
  const total   = filtered.length
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0

  // Group by date
  const grouped = filtered.reduce((acc, med) => {
    const key = period === 'today'
      ? 'Today — ' + new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short', year:'numeric' })
      : (med.createdAt
          ? new Date(med.createdAt).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
          : 'Today')
    if (!acc[key]) acc[key] = []
    acc[key].push(med)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const getDate = key => {
      const meds = grouped[key]
      const d = meds[0]?.createdAt
      return d ? new Date(d) : new Date()
    }
    return getDate(b) - getDate(a)
  })

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}`}</style>

      <div className="greeting s1">
        <h2>Caretaker View 👨‍⚕️</h2>
        <p>Monitoring: <strong>{currentUserName}</strong></p>
      </div>

      {/* Period selector */}
      <div className="card s2" style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text2)', whiteSpace:'nowrap' }}>View history:</span>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ flex:1, padding:'10px 14px', borderRadius:12,
              border:'1.5px solid rgba(26,111,255,0.2)', fontFamily:'var(--ff)',
              fontSize:14, fontWeight:600, color:'var(--blue)',
              background:'rgba(255,255,255,0.9)', outline:'none', cursor:'pointer' }}>
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid s3">
        {[
          { icon:'💊', label:'Total',   value: total,            cls:'si1' },
          { icon:'✅', label:'Taken',   value: taken,            cls:'si2' },
          { icon:'❌', label:'Missed',  value: missed,           cls:'si3' },
          { icon:'📊', label:'Rate',    value: adherence + '%',  cls:'si4' },
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

      {/* Adherence */}
      <div className="card s4">
        <div className="section-header">
          <div className="section-title">
            📊 Adherence — {PERIODS.find(p => p.id === period)?.label}
          </div>
          <span style={{ fontSize:15, fontWeight:800,
            color: adherence>=80 ? 'var(--success)' : adherence>=50 ? 'var(--warning)' : 'var(--danger)' }}>
            {adherence}%
          </span>
        </div>

        <div style={{ height:10, background:'rgba(26,111,255,0.1)', borderRadius:6, overflow:'hidden', marginBottom:12 }}>
          <div style={{
            height:'100%', borderRadius:6, width:`${adherence}%`,
            transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)',
            background: adherence>=80
              ? 'linear-gradient(90deg,#059669,#10b981)'
              : adherence>=50
              ? 'linear-gradient(90deg,#d97706,#fbbf24)'
              : 'linear-gradient(90deg,#e03355,#fb7185)',
          }} />
        </div>

        {[
          { label:'Taken',   value:taken,   color:'#059669' },
          { label:'Pending', value:pending, color:'#d97706' },
          { label:'Missed',  value:missed,  color:'#e03355' },
        ].map(item => (
          <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:item.color, flexShrink:0 }} />
            <span style={{ width:52, fontSize:11, fontWeight:600, color:'var(--text3)' }}>{item.label}</span>
            <div style={{ flex:1, height:5, background:'rgba(26,111,255,0.08)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background:item.color,
                width: total ? `${(item.value/total)*100}%` : '0%',
                transition:'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text2)', minWidth:16 }}>{item.value}</span>
          </div>
        ))}

        <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
          {taken} taken · {missed} missed · {pending} pending · {total} total
        </div>

        {missed > 0 && (
          <div style={{ marginTop:12, padding:'10px 14px',
            background:'rgba(255,77,106,0.08)', border:'1px solid rgba(255,77,106,0.22)',
            borderRadius:12, fontSize:13, color:'#c0392b', fontWeight:600,
            display:'flex', gap:8, alignItems:'center' }}>
            <span>🔔</span>
            <span>{missed} missed dose{missed>1?'s':''} — patient needs attention!</span>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card s5">
        <div className="section-title" style={{ marginBottom:14 }}>📋 Medication History</div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="e-icon">📋</div>
            <h3>No records found</h3>
            <p>No medicines for {PERIODS.find(p=>p.id===period)?.label.toLowerCase()}</p>
          </div>
        ) : sortedDates.map(date => {
          const meds     = grouped[date]
          const dayTaken = meds.filter(m => m.status==='taken').length
          return (
            <div key={date} style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                fontSize:12, fontWeight:700, color:'var(--text3)',
                padding:'6px 0', borderBottom:'1px solid rgba(26,111,255,0.1)', marginBottom:10 }}>
                <span>📅 {date}</span>
                <span style={{
                  color:      dayTaken===meds.length ? 'var(--success)' : dayTaken===0 ? 'var(--danger)' : 'var(--warning)',
                  background: dayTaken===meds.length ? 'rgba(0,196,140,0.1)' : dayTaken===0 ? 'rgba(255,77,106,0.1)' : 'rgba(255,179,71,0.1)',
                  padding:'2px 10px', borderRadius:20, fontSize:11,
                }}>
                  {dayTaken}/{meds.length} taken
                </span>
              </div>

              {meds.map((med, i) => {
                const times = med.times || (med.time ? [med.time] : [])
                return (
                  <div key={med.id} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', marginBottom:8,
                    background:'rgba(255,255,255,0.65)',
                    border:'1px solid rgba(255,255,255,0.9)',
                    borderLeft:`4px solid ${statusColor(med.status)}`,
                    borderRadius:14,
                    animation:`fadeUp 0.3s ${i*0.05}s both`,
                  }}>
                    <div style={{ width:38, height:38, borderRadius:10,
                      background:statusBg(med.status),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, flexShrink:0 }}>
                      {med.status==='taken' ? '✅' : med.status==='missed' ? '❌' : '⏳'}
                    </div>

                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{med.name}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                        {med.dosage} · {med.foodTiming} food · {med.duration}d
                      </div>
                      <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
                        {times.map(t => (
                          <span key={t} style={{ fontSize:10, fontWeight:700,
                            background:'rgba(26,111,255,0.1)', color:'var(--blue)',
                            padding:'2px 7px', borderRadius:6 }}>
                            ⏰ {t}
                          </span>
                        ))}
                      </div>
                      {med.notes && (
                        <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>📋 {med.notes}</div>
                      )}
                    </div>

                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700,
                        color:statusColor(med.status), background:statusBg(med.status),
                        padding:'4px 10px', borderRadius:20, display:'block', whiteSpace:'nowrap' }}>
                        {statusLabel(med.status)}
                      </span>
                      {med.doctorName && (
                        <a href={`tel:${med.doctorPhone}`}
                          style={{ fontSize:10, color:'var(--success)', fontWeight:700,
                            textDecoration:'none', marginTop:5, display:'block' }}>
                          📞 {med.doctorName}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}