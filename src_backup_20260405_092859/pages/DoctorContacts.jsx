import { useState, useEffect } from 'react'
import { db, collection, addDoc, onSnapshot, query, where, updateDoc, doc } from '../firebase'

const EMPTY = { name:'', specialty:'', phone:'', phone2:'', hospital:'', notes:'', available:'' }

export default function DoctorContacts({ userId }) {
  const [doctors,   setDoctors]   = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editId,    setEditId]    = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'doctors'), where('userId', '==', userId))
    return onSnapshot(q, snap => {
      setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [userId])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowForm(true) }

  const openEdit = doctor => {
    setForm({
      name:      doctor.name      || '',
      specialty: doctor.specialty || '',
      phone:     doctor.phone     || '',
      phone2:    doctor.phone2    || '',
      hospital:  doctor.hospital  || '',
      notes:     doctor.notes     || '',
      available: doctor.available || '',
    })
    setEditId(doctor.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      alert('Doctor name and phone number are required.')
      return
    }
    setSaving(true)
    try {
      if (editId) {
        await updateDoc(doc(db, 'doctors', editId), { ...form })
      } else {
        await addDoc(collection(db, 'doctors'), { ...form, userId, createdAt: new Date().toISOString() })
      }
      setShowForm(false); setForm(EMPTY); setEditId(null)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const SPECIALTIES = ['General Physician','Cardiologist','Diabetologist','Neurologist','Orthopedic','ENT','Dermatologist','Ophthalmologist','Psychiatrist','Other']

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        .doc-card { animation: slideUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="greeting s1">
        <h2>Doctor Contacts 🏥</h2>
        <p>Emergency numbers and doctor information</p>
      </div>

      {/* Add button */}
      <button className="btn btn-primary s2"
        style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:15, borderRadius:16, marginBottom:16 }}
        onClick={openAdd}>
        ➕ Add Doctor / Emergency Contact
      </button>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div className="card s2" style={{ marginBottom:16 }}>
          <div className="section-header">
            <div className="section-title">{editId ? '✏️ Edit Doctor' : '➕ New Doctor Contact'}</div>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text3)' }}>×</button>
          </div>

          <div className="form-group">
            <label className="form-label">👨‍⚕️ Doctor's Full Name *</label>
            <input className="form-input" placeholder="e.g. Dr. Rajesh Sharma"
              value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">🔬 Specialization</label>
            <select className="form-select" value={form.specialty}
              onChange={e => setForm({...form, specialty:e.target.value})}>
              <option value="">Select specialty...</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">📞 Primary Phone Number *</label>
            <input className="form-input" placeholder="+91 98765 43210" type="tel"
              value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">📞 Alternate Phone <span style={{fontWeight:400,color:'var(--text3)'}}>(Optional)</span></label>
            <input className="form-input" placeholder="+91 98765 43210" type="tel"
              value={form.phone2} onChange={e => setForm({...form, phone2:e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">🏥 Hospital / Clinic Name</label>
            <input className="form-input" placeholder="e.g. City General Hospital"
              value={form.hospital} onChange={e => setForm({...form, hospital:e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">🕐 Available Hours</label>
            <input className="form-input" placeholder="e.g. Mon–Sat, 9am–5pm"
              value={form.available} onChange={e => setForm({...form, available:e.target.value})} />
          </div>

          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">📝 Notes</label>
            <textarea className="form-input" placeholder="e.g. Call before visiting, takes appointments on WhatsApp..."
              rows={3} value={form.notes}
              onChange={e => setForm({...form, notes:e.target.value})}
              style={{ resize:'vertical', lineHeight:1.6 }} />
          </div>

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button className="btn btn-outline" style={{ flex:1, justifyContent:'center', padding:'13px' }}
              onClick={() => { setShowForm(false); setEditId(null) }}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex:2, justifyContent:'center', padding:'13px', borderRadius:13 }}
              onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving...' : editId ? '✅ Save Changes' : '✅ Add Doctor'}
            </button>
          </div>
        </div>
      )}

      {/* DOCTOR LIST */}
      {loading ? (
        <div style={{ textAlign:'center', padding:32, color:'var(--text3)' }}>Loading contacts...</div>
      ) : doctors.length === 0 ? (
        <div className="card s3">
          <div className="empty">
            <div className="e-icon">🏥</div>
            <h3>No doctors added yet</h3>
            <p>Add your doctor's emergency contact so it's always available when needed</p>
          </div>
        </div>
      ) : doctors.map((doc_, i) => (
        <div key={doc_.id} className="doc-card card" style={{ animationDelay:`${i*0.07}s`, marginBottom:14 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:50, height:50, borderRadius:16,
                background:'linear-gradient(135deg,rgba(26,111,255,0.15),rgba(26,111,255,0.08))',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                👨‍⚕️
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{doc_.name}</div>
                {doc_.specialty && (
                  <div style={{ fontSize:12, color:'var(--blue)', fontWeight:600, marginTop:2,
                    background:'rgba(26,111,255,0.1)', padding:'2px 8px', borderRadius:20, display:'inline-block' }}>
                    {doc_.specialty}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => openEdit(doc_)}
              style={{ background:'rgba(26,111,255,0.08)', border:'1px solid rgba(26,111,255,0.2)',
                color:'var(--blue)', padding:'5px 10px', borderRadius:9, cursor:'pointer',
                fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>
              ✏️ Edit
            </button>
          </div>

          {/* Hospital */}
          {doc_.hospital && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, fontSize:13, color:'var(--text2)' }}>
              <span>🏥</span> {doc_.hospital}
            </div>
          )}

          {/* Available */}
          {doc_.available && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, fontSize:13, color:'var(--text2)' }}>
              <span>🕐</span> {doc_.available}
            </div>
          )}

          {/* Notes */}
          {doc_.notes && (
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14, padding:'8px 12px',
              background:'rgba(26,111,255,0.04)', borderRadius:10 }}>
              📋 {doc_.notes}
            </div>
          )}

          {/* Call buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <a href={`tel:${doc_.phone}`}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background:'linear-gradient(135deg,#059669,#10b981)',
                color:'#fff', padding:'13px', borderRadius:14, fontWeight:700, fontSize:14,
                textDecoration:'none', boxShadow:'0 4px 14px rgba(5,150,105,0.3)',
                transition:'all 0.22s' }}>
              📞 {doc_.phone}
            </a>
            {doc_.phone2 && (
              <a href={`tel:${doc_.phone2}`}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  background:'rgba(26,111,255,0.1)', color:'var(--blue)',
                  border:'1px solid rgba(26,111,255,0.22)',
                  padding:'13px', borderRadius:14, fontWeight:700, fontSize:13,
                  textDecoration:'none', transition:'all 0.22s' }}>
                📞 Alt: {doc_.phone2}
              </a>
            )}
          </div>
        </div>
      ))}
    </>
  )
}