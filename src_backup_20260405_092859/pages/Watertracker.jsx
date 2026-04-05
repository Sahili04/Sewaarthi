import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'

export default function WaterTracker({ user, db, userProfile, lang, speakReminder, tr }) {
  const [intake,     setIntake]     = useState(0)
  const [goal,       setGoal]       = useState(2500)
  const [reminders,  setReminders]  = useState([])
  const [newTime,    setNewTime]    = useState('')
  const [newAmount,  setNewAmount]  = useState(250)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user || !db) return
    fetchIntake(); fetchReminders()
    if (userProfile?.waterGoalLiters) setGoal(parseFloat(userProfile.waterGoalLiters)*1000)
  }, [user, db, userProfile])

  const fetchIntake = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid, 'waterIntake', today))
      if (snap.exists()) setIntake(snap.data().totalMl || 0)
    } catch(e) {}
  }

  const fetchReminders = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'waterReminders'))
      const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() })); setReminders(list)
    } catch(e) {}
  }

  const addIntake = async (ml) => {
    const newTotal = intake + ml
    try {
      await setDoc(doc(db, 'users', user.uid, 'waterIntake', today), { totalMl:newTotal, date:today })
      setIntake(newTotal)
      // update daily health score
      const waterScore = Math.min(Math.round((newTotal/goal)*100), 100)
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

  const percent   = Math.min((intake/goal)*100, 100)
  const remaining = Math.max(goal - intake, 0)
  const radius = 46
  const circ   = 2 * Math.PI * radius
  const offset = circ - (percent/100)*circ

  return (
    <>
      <div className="greeting s1">
        <h2>💧 {tr?.('waterTracker') || 'Water Tracker'}</h2>
        <p>Stay hydrated throughout the day</p>
      </div>

      {/* Ring progress */}
      <div className="card s2" style={{ textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:22, justifyContent:'center' }}>
          <div style={{ position:'relative', width:130, height:130 }}>
            <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(26,111,255,0.1)" strokeWidth="9" />
              <circle cx="50" cy="50" r={radius} fill="none"
                stroke="url(#wg)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition:'stroke-dashoffset 0.5s' }} />
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#1a6fff" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:'var(--fh)', fontSize:22, fontWeight:800, color:'var(--blue)' }}>{(intake/1000).toFixed(1)}L</div>
              <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>of {(goal/1000).toFixed(1)}L</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { label: tr?.('consumed') || 'Consumed', value: `${intake}ml`, color:'var(--blue)' },
              { label: tr?.('remaining') || 'Remaining', value: `${remaining}ml`, color:'var(--text2)' },
              { label: 'Progress', value: `${Math.round(percent)}%`, color:'var(--success)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'left' }}>
                <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>{s.label}</div>
                <div style={{ fontFamily:'var(--fh)', fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="card s3">
        <div className="card-title">➕ Quick Add</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[150, 250, 350, 500].map(ml => (
            <button key={ml} onClick={() => addIntake(ml)}
              style={{ padding:'14px 8px', border:'1.5px solid rgba(26,111,255,0.2)', borderRadius:14, background:'rgba(26,111,255,0.06)', cursor:'pointer', fontFamily:'var(--ff)', fontWeight:700, fontSize:13, color:'var(--blue)', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}
              onMouseOver={e => { e.currentTarget.style.background='var(--blue)'; e.currentTarget.style.color='#fff' }}
              onMouseOut={e  => { e.currentTarget.style.background='rgba(26,111,255,0.06)'; e.currentTarget.style.color='var(--blue)' }}>
              💧<span>+{ml}ml</span>
            </button>
          ))}
        </div>
      </div>

      {/* Set Reminder */}
      <div className="card s4">
        <div className="card-title">⏰ Water Reminders</div>
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
            className="form-input" style={{ flex:1, minWidth:120 }} />
          <select value={newAmount} onChange={e => setNewAmount(Number(e.target.value))}
            className="form-select" style={{ flex:1, minWidth:100 }}>
            <option value={150}>150ml</option>
            <option value={250}>250ml</option>
            <option value={500}>500ml</option>
          </select>
          <button className="btn btn-primary" onClick={addReminder}>Set</button>
        </div>

        {reminders.length === 0 ? (
          <div className="empty" style={{ padding:'16px 0' }}>
            <div className="e-icon" style={{ fontSize:28 }}>⏰</div>
            <p>No water reminders set yet</p>
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
  )
}