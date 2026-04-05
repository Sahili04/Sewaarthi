import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'

function calcBMI(h, w) {
  const hm = parseFloat(h)/100, wk = parseFloat(w)
  if (!hm || !wk) return null
  return (wk/(hm*hm)).toFixed(1)
}
function calcWater(w) {
  const wk = parseFloat(w)
  if (!wk) return null
  return ((wk*35)/1000).toFixed(1)
}
function bmiLabel(bmi, tr) {
  if (!bmi) return ''
  if (bmi < 18.5) return { text: tr ? tr('bmiUnder') : 'Underweight', color:'#3b82f6' }
  if (bmi < 25)   return { text: tr ? `${tr('bmiNormal')} ✅` : 'Normal ✅', color:'var(--success)' }
  if (bmi < 30)   return { text: tr ? tr('bmiOver') : 'Overweight', color:'var(--warning)' }
  return               { text: tr ? tr('bmiObese') : 'Obese', color:'var(--danger)' }
}

export default function ProfileSetup({ user, db, onComplete, inline, lang, tr }) {
  const [height,    setHeight]    = useState('')
  const [weight,    setWeight]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [intake,    setIntake]    = useState(0)
  const [reminders, setReminders] = useState([])
  const [newTime,   setNewTime]   = useState('')
  const [newAmount, setNewAmount] = useState(250)

  const today = new Date().toISOString().split('T')[0]
  const bmi       = calcBMI(height, weight)
  const waterGoal = calcWater(weight)
  const bmiInfo   = bmiLabel(bmi, tr)
  const waterGoalMl = waterGoal ? parseFloat(waterGoal) * 1000 : 2500

  const t = (key, fallback) => tr ? tr(key) : fallback

  useEffect(() => {
    if (!user || !db) return
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data()
          if (d.height) setHeight(d.height)
          if (d.weight) setWeight(d.weight)
        }
        // Load today's water intake
        const intakeSnap = await getDoc(doc(db, 'users', user.uid, 'waterIntake', today))
        if (intakeSnap.exists()) setIntake(intakeSnap.data().totalMl || 0)
        // Load reminders
        fetchReminders()
      } catch(e) {}
    }
    fetch()
  }, [user, db])

  const fetchReminders = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'waterReminders'))
      const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() })); setReminders(list)
    } catch(e) {}
  }

  const addWaterIntake = async (ml) => {
    const newTotal = intake + ml
    try {
      await setDoc(doc(db, 'users', user.uid, 'waterIntake', today), { totalMl:newTotal, date:today })
      setIntake(newTotal)
      const waterScore = Math.min(Math.round((newTotal / waterGoalMl) * 100), 100)
      await setDoc(doc(db, 'users', user.uid, 'dailyHealth', today), { waterScore, date:today }, { merge:true })
    } catch(e) {}
  }

  const addReminder = async () => {
    if (!newTime) return
    try {
      await addDoc(collection(db, 'users', user.uid, 'waterReminders'), { time:newTime, amount:newAmount })
      setNewTime(''); fetchReminders()
    } catch(e) {}
  }

  const deleteReminder = async (id) => {
    try { await deleteDoc(doc(db, 'users', user.uid, 'waterReminders', id)); fetchReminders() } catch(e) {}
  }

  const handleSave = async () => {
    if (!height || !weight) return
    setSaving(true)
    const data = { height, weight, bmi, waterGoalLiters: waterGoal, profileComplete: true }
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      onComplete?.(data)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const waterPercent = Math.min((intake / waterGoalMl) * 100, 100)
  const radius = 46; const circ = 2 * Math.PI * radius
  const offset = circ - (waterPercent / 100) * circ

  const content = (
    <>
      {!inline && (
        <div className="greeting s1">
          <h2>{t('healthBmi', 'Health & BMI')} 🏥</h2>
          <p>{t('bmiPageSub', 'Your body stats and daily water goal')}</p>
        </div>
      )}
      {inline && (
        <div className="greeting s1">
          <h2>{t('healthBmi', 'Health & BMI')} 🏥</h2>
          <p>{t('bmiPageSub', 'Your body stats and daily water goal')}</p>
        </div>
      )}

      {success && (
        <div className="alert success s1">
          <span style={{ fontSize:22 }}>✅</span>
          <div><strong>{t('profileSaved', 'Profile Saved!')}</strong><div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>{t('profileUpdated', 'Your health data has been updated.')}</div></div>
        </div>
      )}

      {/* Body Measurements */}
      <div className="card s2">
        <div className="card-title">📏 {t('bodyMeasurements', 'Body Measurements')}</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="form-group">
            <label className="form-label">{t('height', 'Height (cm)')}</label>
            <input className="form-input" type="number" placeholder="e.g. 165" min="50" max="250"
              value={height} onChange={e => setHeight(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('weight', 'Weight (kg)')}</label>
            <input className="form-input" type="number" placeholder="e.g. 65" min="10" max="300"
              value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
        </div>

        {bmi && (
          <div style={{ background:'rgba(26,111,255,0.05)', border:'1.5px solid rgba(26,111,255,0.15)', borderRadius:16, padding:18, marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-around', marginBottom:14 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>{t('bmi', 'Your BMI')}</div>
                <div style={{ fontSize:32, fontWeight:800, color:bmiInfo.color, fontFamily:'var(--fh)' }}>{bmi}</div>
                <div style={{ fontSize:12, fontWeight:700, color:bmiInfo.color }}>{bmiInfo.text}</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>{t('dailyWaterGoal', 'Daily Water Goal')}</div>
                <div style={{ fontSize:32, fontWeight:800, color:'var(--blue)', fontFamily:'var(--fh)' }}>{waterGoal}L</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)' }}>{t('litersDay', 'liters / day')}</div>
              </div>
            </div>
            {/* BMI bar */}
            <div style={{ height:8, background:'rgba(26,111,255,0.1)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min((bmi/40)*100,100)}%`, background:bmiInfo.color, borderRadius:99, transition:'width 0.4s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', marginTop:5 }}>
              <span>{t('underweight', 'Underweight <18.5')}</span>
              <span>{t('normalBmi', 'Normal 18.5-25')}</span>
              <span>{t('obeseBmi', 'Obese >30')}</span>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-full s3" onClick={handleSave} disabled={saving || !height || !weight}
        style={{ marginBottom:16 }}>
        {saving ? `⏳ ${t('saving', 'Saving...')}` : `✅ ${t('saveProfile', 'Save Profile')}`}
      </button>

      {/* ── WATER INTAKE SECTION ── */}
      {bmi && (
        <>
          {/* Water ring progress */}
          <div className="card s4" style={{ textAlign:'center' }}>
            <div className="card-title">💧 {t('waterTodayProgress', 'Water Today')}</div>
            <div style={{ display:'flex', alignItems:'center', gap:22, justifyContent:'center', marginTop:10 }}>
              <div style={{ position:'relative', width:120, height:120 }}>
                <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(26,111,255,0.1)" strokeWidth="9" />
                  <circle cx="50" cy="50" r={radius} fill="none"
                    stroke="url(#wgp)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition:'stroke-dashoffset 0.5s' }} />
                  <defs>
                    <linearGradient id="wgp" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#1a6fff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontFamily:'var(--fh)', fontSize:20, fontWeight:800, color:'var(--blue)' }}>{(intake/1000).toFixed(1)}L</div>
                  <div style={{ fontSize:9, color:'var(--text3)', fontWeight:600 }}>of {waterGoal || '?'}L</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { label: t('consumed','Consumed'), value:`${intake}ml`, color:'var(--blue)' },
                  { label: t('remaining','Remaining'), value:`${Math.max(waterGoalMl-intake,0)}ml`, color:'var(--text2)' },
                  { label: t('progress','Progress'), value:`${Math.round(waterPercent)}%`, color:'var(--success)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'left' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--fh)', fontSize:17, fontWeight:800, color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick add water */}
          <div className="card s5">
            <div className="card-title">➕ {t('quickAddWater', 'Quick Add Water')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[150, 250, 350, 500].map(ml => (
                <button key={ml} onClick={() => addWaterIntake(ml)}
                  style={{ padding:'12px 6px', border:'1.5px solid rgba(26,111,255,0.2)', borderRadius:14, background:'rgba(26,111,255,0.06)', cursor:'pointer', fontFamily:'var(--ff)', fontWeight:700, fontSize:12, color:'var(--blue)', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}
                  onMouseOver={e => { e.currentTarget.style.background='var(--blue)'; e.currentTarget.style.color='#fff' }}
                  onMouseOut={e  => { e.currentTarget.style.background='rgba(26,111,255,0.06)'; e.currentTarget.style.color='var(--blue)' }}>
                  💧<span>+{ml}ml</span>
                </button>
              ))}
            </div>
          </div>

          {/* Water Reminders */}
          <div className="card s6">
            <div className="card-title">⏰ {t('waterReminders', 'Water Reminders')}</div>
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                className="form-input" style={{ flex:1, minWidth:120 }} />
              <select value={newAmount} onChange={e => setNewAmount(Number(e.target.value))}
                className="form-select" style={{ flex:1, minWidth:100 }}>
                <option value={150}>150ml</option>
                <option value={250}>250ml</option>
                <option value={500}>500ml</option>
              </select>
              <button className="btn btn-primary" onClick={addReminder}>{t('setReminder','Set')}</button>
            </div>
            {reminders.length === 0 ? (
              <div className="empty" style={{ padding:'12px 0' }}>
                <div className="e-icon" style={{ fontSize:24 }}>⏰</div>
                <p>{t('noReminders','No water reminders set yet')}</p>
              </div>
            ) : reminders.map(r => (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'rgba(26,111,255,0.04)', borderRadius:12, marginBottom:8, border:'1px solid rgba(26,111,255,0.1)' }}>
                <span style={{ fontSize:13, fontWeight:600 }}>⏰ {r.time} — 💧 {r.amount}ml</span>
                <button onClick={() => deleteReminder(r.id)}
                  style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.25)', color:'var(--danger)', padding:'4px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )

  if (inline) return content

  // Full page (shown after signup)
  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ position:'fixed', inset:0, zIndex:0, background:`radial-gradient(ellipse 80% 60% at 5% 0%, rgba(131,184,247,0.7) 0%, transparent 55%), linear-gradient(160deg, #cce5ff 0%, #daeeff 35%, #eaf4ff 100%)` }} />
      <div style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(28px)', borderRadius:32, padding:'40px 30px', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(26,111,255,0.18)', position:'relative', zIndex:1, animation:'pageIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
        <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:2, background:'linear-gradient(90deg, transparent, #1a6fff, #60a5fa, transparent)', borderRadius:2 }} />
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <img src="/logo.png" alt="Sewarthii" style={{ height:64, width:'auto', objectFit:'contain' }} onError={e => e.target.style.display='none'} />
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'#0d1b3e', marginTop:8 }}>
            {t('completeProfile', 'Complete Your Profile')}
          </div>
          <div style={{ fontSize:12, color:'#8ba0c0', marginTop:4 }}>{t('personaliseGoals', "We'll personalise your water & health goals")}</div>
        </div>
        {content}
      </div>
      <style>{`@keyframes pageIn{from{opacity:0;transform:translateY(24px) scale(0.983);}to{opacity:1;transform:translateY(0) scale(1);}}`}</style>
    </div>
  )
}