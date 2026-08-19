import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'

// GitHub-style health heatmap
function HealthHeatmap({ user, db, tr }) {
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

  const t = (key, fallback) => tr ? tr(key) : fallback

  return (
    <div className="card" style={{ animation:'fadeUp 0.5s 0.3s both' }}>
      <div className="section-title" style={{ marginBottom:14 }}>📅 {t('healthHeatmap','Health Streak Heatmap')}</div>
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
          <span>{t('less','Less')}</span>
          {colors.map((c,i) => <div key={i} style={{ width:12, height:12, borderRadius:3, background:c }} />)}
          <span>{t('more','More')}</span>
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

function CircleMetric({ pct, color, icon, label, val, onClick }) {
  const circ = 2 * Math.PI * 24
  const offset = circ - (pct / 100) * circ
  return (
    <div onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      minWidth: 68, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s', zIndex: 2
    }}>
      <div style={{
        position: 'relative', width: 54, height: 54, background: 'rgba(0,0,0,0.15)',
        borderRadius: '50%', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
          <circle cx="27" cy="27" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle cx="27" cy="27" r="24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {icon}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard({ medicines, onStatusUpdate, onDelete, onNavigate, user, userProfile, lang, tr, db }) {
  const [filter, setFilter] = useState('all')
  const [waterToday, setWaterToday] = useState(0)
  const [steps, setSteps] = useState(0)
  const today = new Date().toISOString().split('T')[0]

  const t = (key, fallback) => tr ? tr(key) : fallback

  const taken   = medicines.filter(m => m.status === 'taken').length
  const missed  = medicines.filter(m => m.status === 'missed').length
  const pending = medicines.filter(m => m.status === 'pending').length
  const total   = medicines.length
  const adherence    = total > 0 ? Math.round((taken / total) * 100) : 0
  const circumference = 2 * Math.PI * 46
  const offset        = circumference - (adherence / 100) * circumference
  const filtered      = filter === 'all' ? medicines : medicines.filter(m => m.status === filter)

  const hour  = new Date().getHours()
  const greet = hour < 12 ? t('goodMorning','Good Morning') : hour < 17 ? t('goodAfternoon','Good Afternoon') : t('goodEvening','Good Evening')
  const name  = user?.displayName || user?.email?.split('@')[0] || 'User'
  const waterGoal = parseFloat(userProfile?.waterGoalLiters || 2.5) * 1000

  useEffect(() => {
    if (!user) return
    const localW = localStorage.getItem('sw_water_' + user.uid + '_' + today)
    if (localW) setWaterToday(Number(localW))
    const localS = localStorage.getItem('sw_steps_' + user.uid + '_' + today)
    if (localS) setSteps(Number(localS))
    if (!db) return
    const fetch = async () => {
      try {
        const wSnap = await getDoc(doc(db, 'users', user.uid, 'waterIntake', today))
        if (wSnap.exists() && wSnap.data().totalMl > 0) {
          setWaterToday(wSnap.data().totalMl)
          localStorage.setItem('sw_water_' + user.uid + '_' + today, wSnap.data().totalMl.toString())
        }
        const sSnap = await getDoc(doc(db, 'users', user.uid, 'dailyHealth', today))
        if (sSnap.exists() && sSnap.data().steps > 0) {
          setSteps(sSnap.data().steps)
          localStorage.setItem('sw_steps_' + user.uid + '_' + today, sSnap.data().steps.toString())
        }
      } catch(e) {}
    }
    fetch()
  }, [user, db, today])

  const waterPct = Math.min((waterToday / waterGoal) * 100, 100)
  const stepsPct = Math.min((steps / 5000) * 100, 100)

  let bmi = 0
  if (userProfile?.bmi) {
    bmi = parseFloat(userProfile.bmi).toFixed(1)
  } else if (userProfile?.height && userProfile?.weight) {
    let h = parseFloat(userProfile.height)
    const w = parseFloat(userProfile.weight)
    if (h > 0 && h <= 8.5) h = h * 30.48 // Convert feet to cm if entered in feet
    const hM = h / 100
    if (hM > 0 && w > 0) bmi = (w / (hM * hM)).toFixed(1)
  }
  const bmiPct = bmi > 0 ? Math.min(Math.max(((parseFloat(bmi) - 15) / 25) * 100, 0), 100) : 0

  const addSteps = async () => {
    const newSteps = steps + 500
    setSteps(newSteps)
    if (user) {
      localStorage.setItem('sw_steps_' + user.uid + '_' + today, newSteps.toString())
    }
    try {
      if (user && db) {
        await setDoc(doc(db, 'users', user.uid, 'dailyHealth', today), { steps: newSteps }, { merge: true })
      }
    } catch(e) {}
  }

  const withDoctor = medicines.filter(m => m.doctorPhone)

  return (
    <>
      <style>{`
        @keyframes medIn { from{opacity:0;transform:translateY(18px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);} }
        .med-row { animation: medIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .tracker-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="greeting s1">
        <h2>{greet}, {name} 👋</h2>
        <p>{new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'mr-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      {/* HERO */}
      <div className="hero-card s2" style={{
        position: 'relative', overflow: 'hidden', padding: '24px 20px 20px', borderRadius: 28,
        background: 'linear-gradient(135deg, #0d3b8e 0%, #1a6fff 50%, #38bdf8 100%)',
        boxShadow: '0 16px 32px rgba(26,111,255,0.25)'
      }}>
        <div style={{ position:'absolute', top:'-20%', right:'-10%', width:150, height:150, background:'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30%', left:'-10%', width:200, height:200, background:'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:1.2, marginBottom:4 }}>
              ⚡ {t('todayOverview',"Today's Overview")}
            </div>
            <h3 style={{ margin:0, fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
              {t('stayOnTrack','Stay on track,')}<br />{t('feelGreat','feel great 💪')}
            </h3>
          </div>
          <div style={{ fontSize:42, opacity:0.9, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🩺</div>
        </div>

        <div className="tracker-scroll" style={{
          display:'flex', gap:18, overflowX:'auto', overflowY:'visible', paddingBottom:8, paddingTop:4, position:'relative', zIndex:1
        }}>
          <CircleMetric pct={adherence} color="#a78bfa" icon="💊" label={t('meds','Meds')} val={`${taken}/${total}`} />
          <CircleMetric pct={waterPct} color="#38bdf8" icon="💧" label={t('water','Water')} val={`${(waterToday/1000).toFixed(1)}L`} onClick={() => onNavigate('water')} />
          <CircleMetric pct={stepsPct} color="#4ade80" icon="👟" label={t('steps','Steps')} val={steps.toLocaleString()} onClick={addSteps} />
          <CircleMetric pct={bmiPct} color="#fbbf24" icon="⚖️" label={t('bmi','BMI')} val={bmi > 0 ? bmi : '--'} onClick={() => onNavigate('profile')} />
        </div>
      </div>

      {/* ── VOICE ASSISTANT COPILOT CARD ── */}
      <div className="s2" style={{
        background: 'linear-gradient(135deg, rgba(26,111,255,0.07) 0%, rgba(56,189,248,0.08) 100%)',
        border: '1.5px solid rgba(26,111,255,0.2)', borderRadius: 22, padding: '16px 20px', marginTop: 16, marginBottom: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6fff, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22,
            boxShadow: '0 4px 14px rgba(26,111,255,0.35)', flexShrink: 0
          }}>
            🎙️
          </div>
          <div>
            <strong style={{ fontSize: 15, color: 'var(--text)' }}>
              {lang === 'hi' ? 'बोलकर बात करें (वॉयस असिस्टेंट)' : lang === 'mr' ? 'आवाजाने बोला (व्हॉईस असिस्टंट)' : 'Hands-Free Voice Assistant'}
            </strong>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {lang === 'hi' ? 'दवाई, पानी या स्वास्थ्य सवाल बोलकर पूछें' : lang === 'mr' ? 'औषध, पाणी किंवा आरोग्य प्रश्न विचारा' : 'Log water, mark medicines, or ask questions in EN, हिन्दी, or मराठी'}
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('ai')}
          style={{
            background: 'linear-gradient(135deg,#1a6fff,#0284c7)', color: '#fff', border: 'none',
            padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(26,111,255,0.3)', fontFamily: 'var(--ff)', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <span>🎙️ Start Speaking →</span>
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-grid s3">
        {[
          { icon:'➕', titleKey:'addMedicine', subKey:'newSchedule',  page:'add' },
          { icon:'🤖', titleKey:'aiChat',      subKey:'askAnything',  page:'ai' },
          { icon:'📷', titleKey:'scanRx',      subKey:'aiScanner',    page:'scanner' },
          { icon:'💧', titleKey:'water',       subKey:'trackIntake',  page:'water' },
          { icon:'🏃', titleKey:'habitNav',    subKey:'activities',   page:'habits' },
          { icon:'📄', titleKey:'reports',     subKey:'pdfReport',    page:'reports' },
          { icon:'🔌', titleKey:'iotDevice',   subKey:'iotSub',       page:'iot' },
          { icon:'👨‍⚕️', titleKey:'care',      subKey:'manageCare',  page:'caretaker' },
        ].map(q => (
          <button key={q.page} className="quick-card" onClick={() => onNavigate(q.page)}>
            <span className="qc-icon">{q.icon}</span>
            <div className="qc-title">{t(q.titleKey, q.titleKey)}</div>
            <div className="qc-sub">{t(q.subKey, q.subKey)}</div>
          </button>
        ))}
      </div>

      {/* STATS */}
      <div className="stats-grid s4">
        {[
          { icon:'💊', label:t('totalToday','Total Today'), value:total,    cls:'si1' },
          { icon:'✅', label:t('takenMeds','Taken'),         value:taken,    cls:'si2' },
          { icon:'⏳', label:t('pending','Pending'),         value:pending,  cls:'si4' },
          { icon:'💧', label:t('waterMl','Water (ml)'),     value:waterToday, cls:'si2' },
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
          <div className="section-title">💧 {t('waterIntakeToday','Water Intake Today')}</div>
          <button className="btn btn-outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={() => onNavigate('water')}>
            + {t('addWater','Add')}
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
          <div className="section-title">📊 {t('adherenceRate','Adherence Rate')}</div>
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
              { label:t('takenMeds','Taken'),   value:taken,   color:'var(--success)' },
              { label:t('pending','Pending'), value:pending, color:'var(--warning)' },
              { label:t('missedFilter','Missed'),  value:missed,  color:'var(--danger)'  },
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
      <HealthHeatmap user={user} db={db} tr={tr} />

      {/* MISSED ALERT */}
      {missed > 0 && (
        <div className="alert danger" style={{ animation:'fadeUp 0.35s ease' }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <strong>{t('missedDoseAlert','Missed Dose Alert!')}</strong>
            <div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>
              {missed} {t('missedNotified','missed dose — caregiver has been notified.')}
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY CONTACTS */}
      {withDoctor.length > 0 && (
        <div className="card" style={{ animation:'fadeUp 0.4s 0.1s both' }}>
          <div className="section-title" style={{ marginBottom:12 }}>🏥 {t('emergencyContacts','Emergency Contacts')}</div>
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
          <div className="section-title">💊 {t('todayMedicines',"Today's Medicines")}</div>
          <button className="btn btn-primary" style={{ fontSize:11, padding:'6px 12px' }} onClick={() => onNavigate('add')}>
            + {t('add','Add')}
          </button>
        </div>

        <div className="filter-tabs">
          {[
            { f:'all',     lk:'allFilter' },
            { f:'pending', lk:'pendingFilter' },
            { f:'taken',   lk:'takenFilter' },
            { f:'missed',  lk:'missedFilter' },
          ].map(({f,lk}) => (
            <button key={f} className={'ftab' + (filter===f?' active':'')} onClick={() => setFilter(f)}>
              {t(lk, f.charAt(0).toUpperCase()+f.slice(1))}
              {f !== 'all' && <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>({medicines.filter(m=>m.status===f).length})</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="e-icon">💊</div>
            <h3>{filter==='all' ? t('noMedsScheduled','No medicines scheduled') : `${t('noMedsList','No')} ${t(filter+'Filter',filter)} ${t('emptyList','')}`}</h3>
            <p>{filter==='all' ? t('addFirstMed','Add your first medicine to get started') : ''}</p>
            {filter==='all' && (
              <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => onNavigate('add')}>
                + {t('addMedicine','Add Medicine')}
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
                  {med.status==='taken' ? `✅ ${t('takenMeds','Taken')}` : med.status==='missed' ? `❌ ${t('missedFilter','Missed')}` : `⏳ ${t('pending','Pending')}`}
                </span>
              </div>
              <div className="med-right">
                {med.status === 'pending' && (
                  <button className="btn btn-success" onClick={() => onStatusUpdate(med.id, 'taken')}>✓ {t('takenMeds','Taken')}</button>
                )}
                {med.status === 'missed' && (
                  <button className="btn btn-success" style={{ fontSize:10, padding:'4px 8px' }}
                    onClick={() => onStatusUpdate(med.id, 'taken')}>{t('markTaken','Mark Taken')}</button>
                )}
                {med.status === 'taken' && (
                  <span style={{ fontSize:10, color:'var(--success)', fontWeight:700 }}>👍 {t('done','Done')}!</span>
                )}
                {med.doctorPhone && (
                  <a href={`tel:${med.doctorPhone}`}
                    style={{ fontSize:10, color:'var(--success)', fontWeight:700, textDecoration:'none', marginTop:4 }}>
                    📞 {t('callDr','Call Dr.')}
                  </a>
                )}
                <button
                  onClick={() => { if (window.confirm(`Delete "${med.name}"?`)) { onDelete(med.id) } }}
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