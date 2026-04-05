import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'

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
function bmiLabel(bmi) {
  if (!bmi) return ''
  if (bmi < 18.5) return { text:'Underweight', color:'#3b82f6' }
  if (bmi < 25)   return { text:'Normal ✅',   color:'var(--success)' }
  if (bmi < 30)   return { text:'Overweight',  color:'var(--warning)' }
  return               { text:'Obese',         color:'var(--danger)' }
}

export default function ProfileSetup({ user, db, onComplete, inline }) {
  const [height,  setHeight]  = useState('')
  const [weight,  setWeight]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)

  const bmi       = calcBMI(height, weight)
  const waterGoal = calcWater(weight)
  const bmiInfo   = bmiLabel(bmi)

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
      } catch(e) {}
    }
    fetch()
  }, [user, db])

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

  const content = (
    <>
      {!inline && (
        <div className="greeting s1">
          <h2>Profile Setup 👤</h2>
          <p>Enter your details to personalise your experience</p>
        </div>
      )}
      {inline && (
        <div className="greeting s1">
          <h2>My Profile 👤</h2>
          <p>Update your health details</p>
        </div>
      )}

      {success && (
        <div className="alert success s1">
          <span style={{ fontSize:22 }}>✅</span>
          <div><strong>Profile Saved!</strong><div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>Your health data has been updated.</div></div>
        </div>
      )}

      <div className="card s2">
        <div className="card-title">📏 Body Measurements</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input className="form-input" type="number" placeholder="e.g. 165" min="50" max="250"
              value={height} onChange={e => setHeight(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input className="form-input" type="number" placeholder="e.g. 65" min="10" max="300"
              value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
        </div>

        {bmi && (
          <div style={{ background:'rgba(26,111,255,0.05)', border:'1.5px solid rgba(26,111,255,0.15)', borderRadius:16, padding:18, marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-around', marginBottom:14 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>Your BMI</div>
                <div style={{ fontSize:32, fontWeight:800, color:bmiInfo.color, fontFamily:'var(--fh)' }}>{bmi}</div>
                <div style={{ fontSize:12, fontWeight:700, color:bmiInfo.color }}>{bmiInfo.text}</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4 }}>Daily Water Goal</div>
                <div style={{ fontSize:32, fontWeight:800, color:'var(--blue)', fontFamily:'var(--fh)' }}>{waterGoal}L</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)' }}>liters / day</div>
              </div>
            </div>
            {/* BMI bar */}
            <div style={{ height:8, background:'rgba(26,111,255,0.1)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min((bmi/40)*100,100)}%`, background:bmiInfo.color, borderRadius:99, transition:'width 0.4s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', marginTop:5 }}>
              <span>Underweight &lt;18.5</span><span>Normal 18.5-25</span><span>Obese &gt;30</span>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-full s3" onClick={handleSave} disabled={saving || !height || !weight}
        style={{ marginBottom:24 }}>
        {saving ? '⏳ Saving...' : '✅ Save Profile'}
      </button>
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
            Complete Your Profile
          </div>
          <div style={{ fontSize:12, color:'#8ba0c0', marginTop:4 }}>We'll personalise your water & health goals</div>
        </div>
        {content}
      </div>
      <style>{`@keyframes pageIn{from{opacity:0;transform:translateY(24px) scale(0.983);}to{opacity:1;transform:translateY(0) scale(1);}}`}</style>
    </div>
  )
}