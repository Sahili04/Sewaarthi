import { useState } from 'react'
const INIT = { name:'', dosage:'', time:'', foodTiming:'after', duration:7 }

export default function AddMedicine({ onAdd, onNavigate }) {
  const [form,    setForm]    = useState(INIT)
  const [success, setSuccess] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name   = 'Required'
    if (!form.dosage.trim()) e.dosage = 'Required'
    if (!form.time)          e.time   = 'Required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)
    try {
      await onAdd({ id:Date.now().toString(), ...form, duration:Number(form.duration), status:'pending', createdAt:new Date().toISOString() })
      setForm(INIT); setErrors({}); setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch(err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="greeting s1">
        <h2>Add Medicine ➕</h2>
        <p>Schedule a new medication reminder</p>
      </div>

      {success && (
        <div className="alert success s2" style={{ marginBottom:16 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div><strong>Medicine Added!</strong><div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>Scheduled and reminder set.</div></div>
        </div>
      )}

      <div className="card s2">
        <div className="card-title">Medicine Details</div>

        <div className="form-group">
          <label className="form-label">💊 Medicine Name</label>
          <input className="form-input" placeholder="e.g. Paracetamol" value={form.name}
            onChange={e => setForm({...form, name:e.target.value})} />
          {errors.name && <span style={{ color:'var(--danger)', fontSize:12, marginTop:4, display:'block' }}>{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">📏 Dosage</label>
          <input className="form-input" placeholder="e.g. 1 tablet, 5ml" value={form.dosage}
            onChange={e => setForm({...form, dosage:e.target.value})} />
          {errors.dosage && <span style={{ color:'var(--danger)', fontSize:12, marginTop:4, display:'block' }}>{errors.dosage}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">⏰ Reminder Time</label>
          <input className="form-input" type="time" value={form.time}
            onChange={e => setForm({...form, time:e.target.value})} />
          {errors.time && <span style={{ color:'var(--danger)', fontSize:12, marginTop:4, display:'block' }}>{errors.time}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">🍽️ Food Timing</label>
          <select className="form-select" value={form.foodTiming}
            onChange={e => setForm({...form, foodTiming:e.target.value})}>
            <option value="before">Before Food</option>
            <option value="after">After Food</option>
            <option value="with">With Food</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">📅 Duration: <strong style={{ color:'var(--blue)' }}>{form.duration} days</strong></label>
          <input type="range" min="1" max="90" value={form.duration}
            onChange={e => setForm({...form, duration:e.target.value})}
            style={{ width:'100%', accentColor:'var(--blue)', marginTop:6 }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginTop:4 }}>
            <span>1 day</span><span>90 days</span>
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Saving...' : '✅ Add to Schedule'}
        </button>
      </div>
    </>
  )
}