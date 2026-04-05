import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'

const PRESETS = ['🚶 Walking','🚴 Cycling','🏃 Running','🧘 Yoga','💪 Workout','🏊 Swimming','🧗 Climbing','🤸 Stretching']

export default function HabitTracker({ user, db, tr }) {
  const [activities, setActivities] = useState([])
  const [newName,    setNewName]    = useState('')
  const [activeTimer,setActiveTimer]= useState(null)
  const [elapsed,    setElapsed]    = useState({})
  const timerRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { if (user && db) fetchActivities() }, [user, db])

  const fetchActivities = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'habits'))
      const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() }))
      setActivities(list.filter(a => a.date === today))
    } catch(e) {}
  }

  const addActivity = async (name) => {
    if (!name.trim()) return
    try {
      await addDoc(collection(db, 'users', user.uid, 'habits'), { name:name.trim(), date:today, done:false, durationSeconds:0 })
      setNewName(''); fetchActivities()
    } catch(e) {}
  }

  const startTimer = (id) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setActiveTimer(id)
    setElapsed(prev => ({ ...prev, [id]: prev[id] || 0 }))
    timerRef.current = setInterval(() => {
      setElapsed(prev => ({ ...prev, [id]: (prev[id]||0)+1 }))
    }, 1000)
  }

  const stopTimer = async (id) => {
    clearInterval(timerRef.current); setActiveTimer(null)
    try { await updateDoc(doc(db, 'users', user.uid, 'habits', id), { durationSeconds: elapsed[id]||0 }) } catch(e) {}
  }

  const markDone = async (id) => {
    if (activeTimer === id) { clearInterval(timerRef.current); setActiveTimer(null) }
    try {
      const secs = elapsed[id] || 0
      await updateDoc(doc(db, 'users', user.uid, 'habits', id), { done:true, durationSeconds:secs })
      // update activity score in daily health
      const { setDoc, doc:fDoc } = await import('firebase/firestore')
      const doneCount = activities.filter(a => a.done).length + 1
      const totalCount = activities.length || 1
      const activityScore = Math.round((doneCount/totalCount)*100)
      await setDoc(fDoc(db, 'users', user.uid, 'dailyHealth', today), { activityScore, date:today }, { merge:true })
      fetchActivities()
    } catch(e) {}
  }

  const fmt = (secs) => {
    const m = Math.floor(secs/60).toString().padStart(2,'0')
    const s = (secs%60).toString().padStart(2,'0')
    return `${m}:${s}`
  }

  return (
    <>
      <div className="greeting s1">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2>🏃 {tr?.('habits') || 'Habit Tracker'}</h2>
            <p>Track your daily activities and stay active</p>
          </div>
          <button onClick={() => window.open('https://www.google.com/fit/', '_blank')}
            style={{ background:'rgba(0,196,140,0.1)', border:'1px solid rgba(0,196,140,0.25)', color:'var(--success)', padding:'8px 14px', borderRadius:12, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'var(--ff)', display:'flex', alignItems:'center', gap:6 }}>
            🏃 Google Fit
          </button>
        </div>
      </div>

      {/* Preset activities */}
      <div className="card s2">
        <div className="card-title">⚡ Quick Add Activity</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:14 }}>
          {PRESETS.map(act => (
            <button key={act} onClick={() => addActivity(act)}
              style={{ padding:'11px 14px', border:'1.5px solid rgba(26,111,255,0.15)', borderRadius:12, background:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:'var(--ff)', fontWeight:600, fontSize:13, color:'var(--text)', transition:'all 0.2s', textAlign:'left' }}
              onMouseOver={e => { e.currentTarget.style.background='rgba(26,111,255,0.08)'; e.currentTarget.style.borderColor='rgba(26,111,255,0.3)'; e.currentTarget.style.color='var(--blue)' }}
              onMouseOut={e  => { e.currentTarget.style.background='rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor='rgba(26,111,255,0.15)'; e.currentTarget.style.color='var(--text)' }}>
              {act}
            </button>
          ))}
        </div>

        {/* Custom activity */}
        <div style={{ display:'flex', gap:8 }}>
          <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Custom activity name..." onKeyDown={e => e.key==='Enter' && addActivity(newName)}
            style={{ flex:1 }} />
          <button className="btn btn-primary" onClick={() => addActivity(newName)}>Add</button>
        </div>
      </div>

      {/* Today's list */}
      <div className="card s3">
        <div className="section-header">
          <div className="section-title">📋 Today's Activities</div>
          <span style={{ fontSize:12, color:'var(--text3)' }}>{activities.filter(a=>a.done).length}/{activities.length} done</span>
        </div>

        {activities.length === 0 ? (
          <div className="empty">
            <div className="e-icon">🏃</div>
            <h3>No activities yet</h3>
            <p>Add an activity to start tracking</p>
          </div>
        ) : activities.map((act, idx) => (
          <div key={act.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px', background: act.done ? 'rgba(0,196,140,0.04)' : 'rgba(255,255,255,0.68)', border:`1px solid ${act.done ? 'rgba(0,196,140,0.2)' : 'rgba(255,255,255,0.9)'}`, borderRadius:16, marginBottom:10, opacity: act.done ? 0.8:1, transition:'all 0.24s', animation:`medIn 0.38s ${idx*0.06}s both` }}>
            <div style={{ width:46, height:46, borderRadius:14, background: act.done ? 'rgba(0,196,140,0.12)' : 'rgba(26,111,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {act.done ? '✅' : '🏃'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{act.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                ⏱ {fmt(activeTimer===act.id ? (elapsed[act.id]||0) : (act.durationSeconds||0))}
                {act.done && <span style={{ marginLeft:8, color:'var(--success)', fontWeight:700 }}>✅ Completed</span>}
              </div>
            </div>
            {!act.done && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                {activeTimer === act.id ? (
                  <button className="btn" style={{ background:'rgba(255,179,71,0.15)', color:'#d97706', border:'1px solid rgba(255,179,71,0.3)', fontSize:11 }} onClick={() => stopTimer(act.id)}>
                    ⏹ Stop
                  </button>
                ) : (
                  <button className="btn btn-outline" style={{ fontSize:11 }} onClick={() => startTimer(act.id)}>
                    ▶ Start
                  </button>
                )}
                <button className="btn btn-success" style={{ fontSize:11 }} onClick={() => markDone(act.id)}>
                  ✅ Done
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes medIn{from{opacity:0;transform:translateY(18px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}`}</style>
    </>
  )
}