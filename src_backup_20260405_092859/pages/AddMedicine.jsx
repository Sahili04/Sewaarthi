import { useState } from 'react'

const SLOTS = [
  { id: 'morning',   label: '🌅 Morning',   default: '08:00' },
  { id: 'afternoon', label: '☀️ Afternoon', default: '13:00' },
  { id: 'night',     label: '🌙 Night',     default: '21:00' },
]

const INIT = {
  name:        '',
  dosage:      '',
  foodTiming:  'after',
  duration:    7,
  slots:       { morning: { enabled: false, time: '08:00' }, afternoon: { enabled: false, time: '13:00' }, night: { enabled: false, time: '21:00' } },
  doctorName:  '',
  doctorPhone: '',
  notes:       '',
}

export default function AddMedicine({ onAdd, onNavigate }) {
  const [form,    setForm]    = useState(INIT)
  const [success, setSuccess] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const toggleSlot = id => setForm(f => ({
    ...f, slots: { ...f.slots, [id]: { ...f.slots[id], enabled: !f.slots[id].enabled } }
  }))

  const setSlotTime = (id, time) => setForm(f => ({
    ...f, slots: { ...f.slots, [id]: { ...f.slots[id], time } }
  }))

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name   = 'Medicine name is required'
    if (!form.dosage.trim()) e.dosage = 'Dosage is required'
    const anySlot = Object.values(form.slots).some(s => s.enabled)
    if (!anySlot)            e.slots  = 'Select at least one time slot (Morning, Afternoon, or Night)'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)
    try {
      const activeTimes = Object.entries(form.slots)
        .filter(([,s]) => s.enabled)
        .map(([,s]) => s.time)

      await onAdd({
        id:          Date.now().toString(),
        name:        form.name.trim(),
        dosage:      form.dosage.trim(),
        foodTiming:  form.foodTiming,
        duration:    Number(form.duration),
        times:       activeTimes,          // array of HH:MM strings
        time:        activeTimes[0] || '', // for backward compat
        slots:       form.slots,
        doctorName:  form.doctorName.trim(),
        doctorPhone: form.doctorPhone.trim(),
        notes:       form.notes.trim(),
        status:      'pending',
        createdAt:   new Date().toISOString(),
      })
      setForm(INIT); setErrors({}); setSuccess(true)
      setTimeout(() => setSuccess(false), 3500)
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
        <div className="alert success s1">
          <span style={{ fontSize:22 }}>✅</span>
          <div><strong>Medicine Added!</strong><div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>Reminder set and schedule updated.</div></div>
        </div>
      )}

      {/* ── BASIC DETAILS ── */}
      <div className="card s2">
        <div className="card-title">💊 Medicine Details</div>

        <div className="form-group">
          <label className="form-label">Medicine Name *</label>
          <input className="form-input" placeholder="e.g. Paracetamol, Metformin"
            value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          {errors.name && <span style={{ color:'var(--danger)', fontSize:12, marginTop:4, display:'block' }}>{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Dosage *</label>
          <input className="form-input" placeholder="e.g. 1 tablet, 5ml, 500mg"
            value={form.dosage} onChange={e => setForm({...form, dosage:e.target.value})} />
          {errors.dosage && <span style={{ color:'var(--danger)', fontSize:12, marginTop:4, display:'block' }}>{errors.dosage}</span>}
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
      </div>

      {/* ── TIME SLOTS ── */}
      <div className="card s3">
        <div className="card-title">⏰ When to Take</div>
        <p style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>
          Select one or more time slots. You can adjust the exact time for each.
        </p>

        {errors.slots && (
          <div style={{ color:'var(--danger)', fontSize:12, marginBottom:12, padding:'8px 12px', background:'rgba(255,77,106,0.08)', borderRadius:10 }}>
            ⚠️ {errors.slots}
          </div>
        )}

        {SLOTS.map(slot => (
          <div key={slot.id} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'14px 16px', borderRadius:16, marginBottom:10,
            background: form.slots[slot.id].enabled ? 'rgba(26,111,255,0.07)' : 'rgba(0,0,0,0.02)',
            border: `1.5px solid ${form.slots[slot.id].enabled ? 'rgba(26,111,255,0.25)' : 'rgba(0,0,0,0.07)'}`,
            transition:'all 0.22s',
          }}>
            {/* Toggle checkbox */}
            <div onClick={() => toggleSlot(slot.id)} style={{
              width:26, height:26, borderRadius:8, flexShrink:0,
              background: form.slots[slot.id].enabled ? 'var(--blue)' : 'rgba(26,111,255,0.1)',
              border: `2px solid ${form.slots[slot.id].enabled ? 'var(--blue)' : 'rgba(26,111,255,0.2)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:13, color:'#fff', fontWeight:700, transition:'all 0.2s',
            }}>
              {form.slots[slot.id].enabled ? '✓' : ''}
            </div>

            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{slot.label}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                {slot.id === 'morning' ? 'Typically 7am – 10am' : slot.id === 'afternoon' ? 'Typically 12pm – 3pm' : 'Typically 8pm – 11pm'}
              </div>
            </div>

            {form.slots[slot.id].enabled && (
              <input type="time" value={form.slots[slot.id].time}
                onChange={e => setSlotTime(slot.id, e.target.value)}
                style={{ padding:'8px 10px', borderRadius:10, border:'1.5px solid rgba(26,111,255,0.2)', fontFamily:'var(--ff)', fontSize:13, color:'var(--text)', background:'rgba(255,255,255,0.9)', outline:'none', width:110 }}
              />
            )}
          </div>
        ))}

        {/* Summary of selected times */}
        {Object.values(form.slots).some(s => s.enabled) && (
          <div style={{ marginTop:4, padding:'10px 14px', background:'rgba(26,111,255,0.06)', borderRadius:12, fontSize:12, color:'var(--blue)', fontWeight:600 }}>
            📋 Reminders set for: {Object.entries(form.slots).filter(([,s])=>s.enabled).map(([k,s])=>`${k.charAt(0).toUpperCase()+k.slice(1)} (${s.time})`).join(' · ')}
          </div>
        )}
      </div>

      {/* ── DOCTOR CONTACT ── */}
      <div className="card s4">
        <div className="card-title">🏥 Doctor's Contact <span style={{ fontSize:12, fontWeight:400, color:'var(--text3)' }}>(Optional)</span></div>

        <div className="form-group">
          <label className="form-label">Doctor's Name</label>
          <input className="form-input" placeholder="e.g. Dr. Sharma"
            value={form.doctorName} onChange={e => setForm({...form, doctorName:e.target.value})} />
        </div>

        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label">📞 Emergency Contact Number</label>
          <input className="form-input" placeholder="e.g. +91 98765 43210" type="tel"
            value={form.doctorPhone} onChange={e => setForm({...form, doctorPhone:e.target.value})} />
        </div>
      </div>

      {/* ── NOTES ── */}
      <div className="card s5">
        <div className="card-title">📝 Additional Notes <span style={{ fontSize:12, fontWeight:400, color:'var(--text3)' }}>(Optional)</span></div>
        <textarea className="form-input" placeholder="e.g. Take with warm water, avoid dairy products..."
          rows={3} value={form.notes}
          onChange={e => setForm({...form, notes:e.target.value})}
          style={{ resize:'vertical', lineHeight:1.6 }} />
      </div>

      <button className="btn btn-primary btn-full s5" style={{ marginBottom:24 }}
        onClick={handleSubmit} disabled={loading}>
        {loading ? '⏳ Saving...' : '✅ Add to Schedule'}
      </button>
    </>
  )
}