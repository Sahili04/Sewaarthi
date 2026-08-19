import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'

function parseHeightInCm(val, unit = 'cm') {
  if (!val) return 0
  const num = parseFloat(val)
  if (isNaN(num) || num <= 0) return 0
  if (unit === 'ft' || (unit === 'auto' && num <= 8.5)) {
    // If entered in feet (e.g. 5.8 = 5 ft 8 in)
    const feet = Math.floor(num)
    const decimals = Math.round((num - feet) * 10)
    if (decimals > 0 && decimals <= 11) {
      return ((feet * 12 + decimals) * 2.54)
    }
    return num * 30.48
  }
  return num
}

function calcBMI(h, w, unit = 'cm') {
  const cm = parseHeightInCm(h, unit)
  const wk = parseFloat(w)
  if (!cm || !wk || cm < 40 || wk < 10) return null
  const hm = cm / 100
  return (wk / (hm * hm)).toFixed(1)
}

function calcWater(w) {
  const wk = parseFloat(w)
  if (!wk || wk < 10) return '2.5'
  return ((wk * 35) / 1000).toFixed(1)
}

function bmiLabel(bmi, tr) {
  if (!bmi) return { text: '', color: 'var(--text3)', category: '' }
  const num = parseFloat(bmi)
  if (num < 18.5) return { text: tr ? tr('bmiUnder') : 'Underweight (<18.5)', color: '#38bdf8', category: 'underweight' }
  if (num < 25)   return { text: tr ? `${tr('bmiNormal')} ✅` : 'Normal / Healthy ✅ (18.5–24.9)', color: 'var(--success)', category: 'normal' }
  if (num < 30)   return { text: tr ? tr('bmiOver') : 'Overweight ⚠️ (25–29.9)', color: 'var(--warning)', category: 'overweight' }
  return { text: tr ? tr('bmiObese') : 'Obese ⚠️ (≥30)', color: 'var(--danger)', category: 'obese' }
}

function getIdealWeightRange(h, unit = 'cm') {
  const cm = parseHeightInCm(h, unit)
  if (!cm || cm < 40) return null
  const hm = cm / 100
  const min = (18.5 * (hm * hm)).toFixed(1)
  const max = (24.9 * (hm * hm)).toFixed(1)
  return { min, max }
}

export default function ProfileSetup({ user, db, onComplete, inline, lang, tr }) {
  const [height,    setHeight]    = useState('')
  const [weight,    setWeight]    = useState('')
  const [heightUnit,setHeightUnit]= useState('cm')
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [intake,    setIntake]    = useState(0)
  const [reminders, setReminders] = useState([])
  const [newTime,   setNewTime]   = useState('')
  const [newAmount, setNewAmount] = useState(250)

  const today = new Date().toISOString().split('T')[0]
  const bmi       = calcBMI(height, weight, heightUnit)
  const waterGoal = calcWater(weight)
  const bmiInfo   = bmiLabel(bmi, tr)
  const idealW    = getIdealWeightRange(height, heightUnit)
  const waterGoalMl = waterGoal ? parseFloat(waterGoal) * 1000 : 2500

  const t = (key, fallback) => tr ? tr(key) : fallback

  useEffect(() => {
    if (!user) return
    // 1. Instantly load cached profile
    try {
      const localP = localStorage.getItem('sw_profile_' + user.uid)
      if (localP) {
        const d = JSON.parse(localP)
        if (d.height) setHeight(d.height.toString())
        if (d.weight) setWeight(d.weight.toString())
        if (d.heightUnit) setHeightUnit(d.heightUnit)
      }
      const localW = localStorage.getItem('sw_water_' + user.uid + '_' + today)
      if (localW) setIntake(Number(localW))
      const localRem = localStorage.getItem('sw_water_reminders_' + user.uid)
      if (localRem) setReminders(JSON.parse(localRem))
    } catch(e) {}

    // 2. Sync with Firestore if available
    if (db) {
      const fetch = async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          if (snap.exists()) {
            const d = snap.data()
            if (d.height) setHeight(d.height.toString())
            if (d.weight) setWeight(d.weight.toString())
            if (d.heightUnit) setHeightUnit(d.heightUnit)
            localStorage.setItem('sw_profile_' + user.uid, JSON.stringify(d))
          }
          const intakeSnap = await getDoc(doc(db, 'users', user.uid, 'waterIntake', today))
          if (intakeSnap.exists()) {
            const tot = intakeSnap.data().totalMl || 0
            setIntake(tot)
            localStorage.setItem('sw_water_' + user.uid + '_' + today, tot.toString())
          }
          fetchReminders()
        } catch(e) {}
      }
      fetch()
    }
  }, [user, db, today])

  const fetchReminders = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'waterReminders'))
      const list = []
      snap.forEach(d => list.push({ id:d.id, ...d.data() }))
      if (list.length > 0) {
        setReminders(list)
        localStorage.setItem('sw_water_reminders_' + user.uid, JSON.stringify(list))
      }
    } catch(e) {}
  }

  const addWaterIntake = async (ml) => {
    const newTotal = intake + ml
    setIntake(newTotal)
    if (user) {
      localStorage.setItem('sw_water_' + user.uid + '_' + today, newTotal.toString())
      const waterScore = Math.min(Math.round((newTotal / waterGoalMl) * 100), 100)
      localStorage.setItem('sw_water_score_' + user.uid + '_' + today, waterScore.toString())
    }
    try {
      if (user && db) {
        await setDoc(doc(db, 'users', user.uid, 'waterIntake', today), { totalMl:newTotal, date:today }, { merge:true })
        const waterScore = Math.min(Math.round((newTotal / waterGoalMl) * 100), 100)
        await setDoc(doc(db, 'users', user.uid, 'dailyHealth', today), { waterScore, date:today }, { merge:true })
      }
    } catch(e) {}
  }

  const addReminder = async () => {
    if (!newTime) return
    const newRem = { id: Date.now().toString(), time:newTime, amount:newAmount }
    const updated = [...reminders, newRem]
    setReminders(updated)
    if (user) localStorage.setItem('sw_water_reminders_' + user.uid, JSON.stringify(updated))
    setNewTime('')
    try {
      if (user && db) {
        await addDoc(collection(db, 'users', user.uid, 'waterReminders'), { time:newTime, amount:newAmount })
        fetchReminders()
      }
    } catch(e) {}
  }

  const deleteReminder = async (id) => {
    const updated = reminders.filter(r => r.id !== id)
    setReminders(updated)
    if (user) localStorage.setItem('sw_water_reminders_' + user.uid, JSON.stringify(updated))
    try {
      if (user && db) {
        await deleteDoc(doc(db, 'users', user.uid, 'waterReminders', id))
      }
    } catch(e) {}
  }

  const handleSave = async () => {
    if (!height || !weight) return
    setSaving(true)
    const finalCm = parseHeightInCm(height, heightUnit)
    const finalBmi = calcBMI(height, weight, heightUnit)
    const finalWaterGoal = calcWater(weight)

    const data = {
      height: finalCm ? Math.round(finalCm).toString() : height,
      rawHeight: height,
      heightUnit,
      weight: weight.toString(),
      bmi: finalBmi,
      waterGoalLiters: finalWaterGoal,
      profileComplete: true,
      updatedAt: new Date().toISOString()
    }

    // 1. Immediately persist locally and update parent state
    if (user) {
      localStorage.setItem('sw_profile_' + user.uid, JSON.stringify(data))
    }
    onComplete?.(data)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)

    // 2. Sync to Firestore in background
    try {
      if (user && db) {
        await setDoc(doc(db, 'users', user.uid), data, { merge: true })
      }
    } catch(e) {
      console.warn('Firestore profile sync failed, saved locally:', e)
    } finally {
      setSaving(false)
    }
  }

  const waterPercent = Math.min((intake / waterGoalMl) * 100, 100)
  const radius = 46; const circ = 2 * Math.PI * radius
  const offset = circ - (waterPercent / 100) * circ

  const bmiGaugePct = bmi ? Math.min(Math.max(((parseFloat(bmi) - 15) / 25) * 100, 0), 100) : 0

  const content = (
    <>
      <div className="greeting s1">
        <h2>{t('healthBmi', 'Health & BMI')} 🏥</h2>
        <p>{t('bmiPageSub', 'Your body stats, BMI calculation & daily hydration')}</p>
      </div>

      {success && (
        <div className="alert success s1" style={{ display:'flex', alignItems:'center', gap:10, animation:'fadeUp 0.3s ease' }}>
          <span style={{ fontSize:22 }}>✅</span>
          <div>
            <strong>{t('profileSaved', 'Profile Saved!')}</strong>
            <div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>
              BMI ({bmi}) and health goals updated across Dashboard & Reminders.
            </div>
          </div>
        </div>
      )}

      {/* ── BODY MEASUREMENTS & BMI CALCULATOR ── */}
      <div className="card s2">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="card-title" style={{ margin:0 }}>📏 {t('bodyMeasurements', 'BMI Calculator')}</div>
          {/* Height Unit Toggle */}
          <div style={{ display:'flex', background:'rgba(26,111,255,0.08)', borderRadius:10, padding:2 }}>
            <button type="button" onClick={() => setHeightUnit('cm')}
              style={{ padding:'4px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:700, cursor:'pointer', background: heightUnit==='cm'?'var(--blue)':'transparent', color: heightUnit==='cm'?'#fff':'var(--blue)', transition:'all 0.2s' }}>
              cm
            </button>
            <button type="button" onClick={() => setHeightUnit('ft')}
              style={{ padding:'4px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:700, cursor:'pointer', background: heightUnit==='ft'?'var(--blue)':'transparent', color: heightUnit==='ft'?'#fff':'var(--blue)', transition:'all 0.2s' }}>
              ft.in
            </button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="form-group">
            <label className="form-label">
              {heightUnit === 'cm' ? 'Height (cm)' : 'Height (ft.in, e.g. 5.8)'}
            </label>
            <input className="form-input" type="number" step={heightUnit==='ft'?'0.1':'1'}
              placeholder={heightUnit==='cm'?'e.g. 170':'e.g. 5.8'}
              value={height} onChange={e => setHeight(e.target.value)} />
            {heightUnit === 'ft' && (
              <span style={{ fontSize:10, color:'var(--text3)', marginTop:3, display:'block' }}>
                5.8 = 5 ft 8 in ≈ 173 cm
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input className="form-input" type="number" placeholder="e.g. 68" min="15" max="250"
              value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
        </div>

        {/* Live BMI Display Card */}
        {bmi ? (
          <div style={{ background:'rgba(26,111,255,0.04)', border:'1.5px solid rgba(26,111,255,0.18)', borderRadius:18, padding:'18px 20px', marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center', marginBottom:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>{t('bmi', 'Your BMI')}</div>
                <div style={{ fontSize:36, fontWeight:800, color:bmiInfo.color, fontFamily:'var(--fh)', lineHeight:1 }}>{bmi}</div>
                <div style={{ fontSize:12, fontWeight:700, color:bmiInfo.color, marginTop:6 }}>{bmiInfo.text}</div>
              </div>
              <div style={{ width:1, height:48, background:'rgba(26,111,255,0.15)' }} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>{t('dailyWaterGoal', 'Water Goal')}</div>
                <div style={{ fontSize:36, fontWeight:800, color:'var(--blue)', fontFamily:'var(--fh)', lineHeight:1 }}>{waterGoal}L</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginTop:6 }}>{Math.round(waterGoalMl)} ml / day</div>
              </div>
            </div>

            {/* BMI Bar Indicator */}
            <div style={{ position:'relative', height:10, background:'rgba(0,0,0,0.06)', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, #38bdf8 0%, #00c48c 35%, #fbbf24 70%, #ff4d6a 100%)', opacity:0.85 }} />
              <div style={{ position:'absolute', top:0, bottom:0, width:6, background:'#fff', borderRadius:4, transform:'translateX(-50%)', left:`${bmiGaugePct}%`, boxShadow:'0 0 6px rgba(0,0,0,0.5)', transition:'left 0.4s ease' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', fontWeight:600 }}>
              <span style={{ color:'#38bdf8' }}>Underweight (&lt;18.5)</span>
              <span style={{ color:'var(--success)' }}>Normal (18.5-25)</span>
              <span style={{ color:'var(--warning)' }}>Overweight</span>
              <span style={{ color:'var(--danger)' }}>Obese (&gt;30)</span>
            </div>

            {idealW && (
              <div style={{ marginTop:14, paddingTop:12, borderTop:'1px dashed rgba(26,111,255,0.15)', fontSize:12, color:'var(--text2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>🎯 Healthy weight for your height:</span>
                <strong style={{ color:'var(--blue)', fontWeight:700 }}>{idealW.min} kg – {idealW.max} kg</strong>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding:'14px', background:'rgba(26,111,255,0.03)', borderRadius:14, textAlign:'center', fontSize:12, color:'var(--text3)', border:'1px dashed rgba(26,111,255,0.15)' }}>
            ⚖️ Enter your height and weight above to calculate your BMI and healthy weight range.
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-full s3" onClick={handleSave} disabled={saving || !height || !weight}
        style={{ marginBottom:16, padding:'14px' }}>
        {saving ? `⏳ ${t('saving', 'Saving...')}` : `✅ ${t('saveProfile', 'Save Health & BMI Stats')}`}
      </button>

      {/* ── HYDRATION TRACKER LINKED WITH BMI ── */}
      {bmi && (
        <>
          <div className="card s4" style={{ textAlign:'center' }}>
            <div className="card-title">💧 {t('waterTodayProgress', 'Daily Hydration Status')}</div>
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
          <div style={{ fontSize:12, color:'#8ba0c0', marginTop:4 }}>{t('personaliseGoals', "We'll personalise your BMI, water & health goals")}</div>
        </div>
        {content}
      </div>
      <style>{`@keyframes pageIn{from{opacity:0;transform:translateY(24px) scale(0.983);}to{opacity:1;transform:translateY(0) scale(1);}}`}</style>
    </div>
  )
}