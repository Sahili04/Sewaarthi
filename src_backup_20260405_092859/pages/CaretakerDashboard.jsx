import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export default function CaretakerDashboard({ medicines, currentUserName, user, db, tr }) {
  const [userRole,      setUserRole]      = useState(null)
  const [patientEmail,  setPatientEmail]  = useState('')
  const [requests,      setRequests]      = useState([])
  const [myPatients,    setMyPatients]    = useState([])
  const [myCaretakers,  setMyCaretakers]  = useState([])
  const [status,        setStatus]        = useState('')
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    if (!user || !db) return
    const loadRole = async () => {
      try {
        const { getDoc, doc:fDoc } = await import('firebase/firestore')
        const snap = await getDoc(fDoc(db, 'users', user.uid))
        if (snap.exists()) {
          const role = snap.data().role || 'patient'
          setUserRole(role)
          if (role === 'caretaker') { fetchMyPatients(); }
          else { fetchIncomingRequests(); fetchMyCaretakers(); }
        }
      } catch(e) {}
    }
    loadRole()
  }, [user, db])

  const fetchMyPatients = async () => {
    try {
      const q = query(collection(db, 'caretakerRequests'), where('caretakerUid','==',user.uid), where('status','==','accepted'))
      const snap = await getDocs(q); const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() })); setMyPatients(list)
    } catch(e) {}
  }

  const fetchIncomingRequests = async () => {
    try {
      const q = query(collection(db, 'caretakerRequests'), where('patientUid','==',user.uid), where('status','==','pending'))
      const snap = await getDocs(q); const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() })); setRequests(list)
    } catch(e) {}
  }

  const fetchMyCaretakers = async () => {
    try {
      const q = query(collection(db, 'caretakerRequests'), where('patientUid','==',user.uid), where('status','==','accepted'))
      const snap = await getDocs(q); const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() })); setMyCaretakers(list)
    } catch(e) {}
  }

  const sendRequest = async () => {
    if (!patientEmail.trim()) return
    setLoading(true); setStatus('')
    try {
      const q = query(collection(db, 'users'), where('email','==',patientEmail.trim()))
      const snap = await getDocs(q)
      if (snap.empty) { setStatus('❌ Patient not found with this email.'); setLoading(false); return }
      const patient = snap.docs[0]
      await addDoc(collection(db, 'caretakerRequests'), {
        caretakerUid: user.uid, caretakerName: currentUserName, caretakerEmail: user.email,
        patientUid: patient.id, patientEmail: patient.data().email,
        status:'pending', createdAt: new Date().toISOString(),
      })
      setPatientEmail(''); setStatus('✅ Request sent!')
    } catch(e) { setStatus('Something went wrong.') }
    setLoading(false)
  }

  const acceptRequest = async (id) => {
    try { await updateDoc(doc(db, 'caretakerRequests', id), { status:'accepted' }); fetchIncomingRequests(); fetchMyCaretakers() } catch(e) {}
  }
  const rejectRequest = async (id) => {
    try { await updateDoc(doc(db, 'caretakerRequests', id), { status:'rejected' }); fetchIncomingRequests() } catch(e) {}
  }
  const removeCaretaker = async (id) => {
    try { await deleteDoc(doc(db, 'caretakerRequests', id)); fetchMyCaretakers() } catch(e) {}
  }

  // ── Original patient medicine view (existing CaretakerDashboard UI preserved) ──
  const taken   = medicines.filter(m => m.status === 'taken').length
  const missed  = medicines.filter(m => m.status === 'missed').length
  const pending = medicines.filter(m => m.status === 'pending').length
  const total   = medicines.length

  return (
    <>
      <div className="greeting s1">
        <h2>👨‍⚕️ Caretaker View</h2>
        <p>Managing health for your patients</p>
      </div>

      {/* PENDING REQUESTS for patients */}
      {userRole !== 'caretaker' && requests.length > 0 && (
        <div className="card s2">
          <div className="card-title">🔔 Incoming Caretaker Requests</div>
          {requests.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(255,179,71,0.06)', border:'1px solid rgba(255,179,71,0.2)', borderRadius:14, marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>👨‍👩‍👧 {r.caretakerName}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{r.caretakerEmail}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-success" style={{ fontSize:12 }} onClick={() => acceptRequest(r.id)}>✅ Accept</button>
                <button className="btn btn-danger"  style={{ fontSize:12 }} onClick={() => rejectRequest(r.id)}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MY CARETAKERS (patient view) */}
      {userRole !== 'caretaker' && (
        <div className="card s3">
          <div className="card-title">🔗 My Caretakers</div>
          {myCaretakers.length === 0 ? (
            <div className="empty" style={{ padding:'12px 0' }}><p>No caretakers linked yet</p></div>
          ) : myCaretakers.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(0,196,140,0.05)', border:'1px solid rgba(0,196,140,0.18)', borderRadius:14, marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>👨‍👩‍👧 {c.caretakerName}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{c.caretakerEmail}</div>
              </div>
              <button className="btn btn-danger" style={{ fontSize:11 }} onClick={() => removeCaretaker(c.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* SEND REQUEST (caretaker view) */}
      {userRole === 'caretaker' && (
        <div className="card s2">
          <div className="card-title">➕ Add Patient</div>
          <div className="form-group">
            <label className="form-label">Patient's Email</label>
            <input className="form-input" type="email" placeholder="patient@example.com"
              value={patientEmail} onChange={e => setPatientEmail(e.target.value)} />
          </div>
          {status && (
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color: status.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{status}</div>
          )}
          <button className="btn btn-primary" onClick={sendRequest} disabled={loading}>
            {loading ? '⏳ Sending...' : '📤 Send Request'}
          </button>

          {myPatients.length > 0 && (
            <>
              <div style={{ margin:'18px 0 10px', fontFamily:'var(--fh)', fontSize:14, fontWeight:700 }}>My Patients</div>
              {myPatients.map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(26,111,255,0.04)', border:'1px solid rgba(26,111,255,0.12)', borderRadius:14, marginBottom:8 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),#60a5fa)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800 }}>
                    {(p.patientEmail||'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{p.patientEmail}</div>
                    <div style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>✅ Linked</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ORIGINAL medicine overview */}
      <div className="stats-grid s4">
        {[
          { icon:'💊', label:'Total', value:total,   cls:'si1' },
          { icon:'✅', label:'Taken', value:taken,   cls:'si2' },
          { icon:'❌', label:'Missed',value:missed,  cls:'si3' },
          { icon:'⏳', label:'Pending',value:pending,cls:'si4' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={'stat-icon ' + s.cls}>{s.icon}</div>
            <div className="stat-info"><div className="v">{s.value}</div><div className="l">{s.label}</div></div>
          </div>
        ))}
      </div>

      {missed > 0 && (
        <div className="alert danger s5">
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <strong>Patient has missed {missed} dose{missed>1?'s':''}!</strong>
            <div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>Please check in with {currentUserName}.</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-title" style={{ marginBottom:14 }}>💊 All Medicines</div>
        {medicines.length === 0 ? (
          <div className="empty"><div className="e-icon">💊</div><h3>No medicines added yet</h3></div>
        ) : medicines.map(med => {
          const times = med.times || (med.time ? [med.time] : [])
          return (
            <div className="med-item" key={med.id}>
              <div className="med-icon" style={{ background: med.status==='taken'?'rgba(0,196,140,0.12)':med.status==='missed'?'rgba(255,77,106,0.12)':'rgba(26,111,255,0.1)' }}>
                {med.status==='taken'?'✅':med.status==='missed'?'❌':'💊'}
              </div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.foodTiming} food · {med.duration}d</div>
                <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
                  {times.map(t => <span key={t} style={{ fontSize:10, fontWeight:700, background:'rgba(26,111,255,0.1)', color:'var(--blue)', padding:'2px 7px', borderRadius:6 }}>⏰ {t}</span>)}
                </div>
              </div>
              <span className={'badge ' + med.status}>
                {med.status==='taken'?'✅ Taken':med.status==='missed'?'❌ Missed':'⏳ Pending'}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}