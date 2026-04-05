import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'

// ─── Tiny helpers ──────────────────────────────────────────────────────────
function Avatar({ name, size = 42 }) {
  const ch = (name || 'P')[0].toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#1a6fff,#60a5fa)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.38,
    }}>{ch}</div>
  )
}

function StatBadge({ icon, label, value, color = '#1a6fff' }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(26,111,255,0.1)',
      borderRadius: 16, padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ─── Patient detail panel ──────────────────────────────────────────────────
function PatientDetail({ patient, db, tr, onBack }) {
  const [medicines,   setMedicines]   = useState([])
  const [waterToday,  setWaterToday]  = useState(0)
  const [habitsToday, setHabitsToday] = useState([])
  const [loading,     setLoading]     = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const t = (k, fb) => tr ? tr(k) : fb

  useEffect(() => { loadData() }, [patient])

  const loadData = async () => {
    setLoading(true)
    try {
      // Medicines
      const medSnap = await getDocs(query(collection(db, 'medicines'), where('userId', '==', patient.patientUid)))
      setMedicines(medSnap.docs.map(d => ({ id: d.id, ...d.data() })))

      // Today's water
      const wSnap = await getDoc(doc(db, 'users', patient.patientUid, 'waterIntake', today))
      setWaterToday(wSnap.exists() ? wSnap.data().totalMl || 0 : 0)

      // Today's habits
      const hSnap = await getDocs(collection(db, 'users', patient.patientUid, 'habits'))
      setHabitsToday(hSnap.docs.map(d => d.data()).filter(h => h.date === today))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const taken   = medicines.filter(m => m.status === 'taken').length
  const missed  = medicines.filter(m => m.status === 'missed').length
  const pending = medicines.filter(m => m.status === 'pending').length
  const doneHabits = habitsToday.filter(h => h.done).length

  return (
    <div style={{ animation: 'pageSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(26,111,255,0.08)',
        border: '1px solid rgba(26,111,255,0.18)', color: 'var(--blue)', padding: '8px 16px',
        borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--ff)', fontWeight: 700,
        fontSize: 13, marginBottom: 18,
      }}>← {t('backToPatients', 'Back to Patients')}</button>

      {/* Patient header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <Avatar name={patient.patientEmail} size={54} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{patient.patientEmail}</div>
          <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, marginTop: 2 }}>
            ✅ {t('linked', 'Linked Patient')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            📅 {t('viewingToday', "Today's overview")} — {today}
          </div>
        </div>
        <button onClick={loadData} style={{
          marginLeft: 'auto', background: 'rgba(0,196,140,0.1)', border: '1px solid rgba(0,196,140,0.25)',
          color: 'var(--success)', padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--ff)',
        }}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>⏳ Loading patient data...</div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <StatBadge icon="✅" label={t('takenMeds','Taken')}   value={taken}   color="var(--success)" />
            <StatBadge icon="❌" label={t('missedFilter','Missed')} value={missed}  color="var(--danger)"  />
            <StatBadge icon="⏳" label={t('pending','Pending')}   value={pending} color="var(--warning)" />
            <StatBadge icon="💧" label={t('waterMl','Water')}      value={`${(waterToday/1000).toFixed(1)}L`} color="var(--blue)" />
            <StatBadge icon="🏃" label={t('habits','Habits')}      value={`${doneHabits}/${habitsToday.length}`} color="#8b5cf6" />
          </div>

          {/* Missed alert */}
          {missed > 0 && (
            <div className="alert danger" style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <strong>{patient.patientEmail} {t('hasMissed', 'has missed')} {missed} dose{missed > 1 ? 's' : ''}!</strong>
                <div style={{ fontWeight: 400, fontSize: 12, marginTop: 2 }}>{t('checkInWith', 'Please check in with your patient.')}</div>
              </div>
            </div>
          )}

          {/* Medicines list */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-title">💊 {t('allMedicines', 'Medicines')}</div>
            {medicines.length === 0 ? (
              <div className="empty"><div className="e-icon">💊</div><h3>{t('noMedsYet','No medicines added by patient')}</h3></div>
            ) : medicines.map(med => {
              const times = med.times || (med.time ? [med.time] : [])
              return (
                <div className="med-item" key={med.id}>
                  <div className="med-icon" style={{
                    background: med.status==='taken'?'rgba(0,196,140,0.12)':med.status==='missed'?'rgba(255,77,106,0.12)':'rgba(26,111,255,0.1)'
                  }}>
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

          {/* Habits today */}
          <div className="card">
            <div className="card-title">🏃 {t('todayActivities', "Today's Activities")}</div>
            {habitsToday.length === 0 ? (
              <div className="empty" style={{ padding:'16px 0' }}><p>{t('noActivities','No activities logged today')}</p></div>
            ) : habitsToday.map((h, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                background: h.done ? 'rgba(0,196,140,0.05)' : 'rgba(255,255,255,0.6)',
                border:`1px solid ${h.done?'rgba(0,196,140,0.18)':'rgba(26,111,255,0.1)'}`,
                borderRadius:14, marginBottom:8,
              }}>
                <div style={{ fontSize:20 }}>{h.done ? '✅' : '🏃'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{h.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>
                    ⏱ {Math.floor((h.durationSeconds||0)/60)}m {(h.durationSeconds||0)%60}s
                    {h.done && <span style={{ marginLeft:8, color:'var(--success)', fontWeight:700 }}> ✅ Done</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main: CaretakerDashboard (used both as full-page for caretakers & embedded for patients) ─
export default function CaretakerDashboard({
  medicines = [], currentUserName, user, db, tr, lang,
  // When used as full-page caretaker app, these are passed for header
  isFullPage = false, onLogout, changeLang, initials,
}) {
  const [patientEmail, setPatientEmail] = useState('')
  const [requests,     setRequests]     = useState([])    // patient: incoming
  const [myPatients,   setMyPatients]   = useState([])   // caretaker: accepted patients
  const [myCaretakers, setMyCaretakers] = useState([])   // patient: my caretakers
  const [status,       setStatus]       = useState('')
  const [loading,      setLoading]      = useState(false)
  const [selectedPat,  setSelectedPat]  = useState(null)

  const t = (k, fb) => {
    if (tr) {
      const val = tr(k);
      // tr(k) returns the key itself as a string if no translation is found. 
      // If val is strictly equal to the key AND we have a fallback, use the fallback.
      if (val === k && fb) return fb;
      return val || fb;
    }
    return fb;
  }

  useEffect(() => {
    if (!user || !db) return
    if (isFullPage) {
      fetchMyPatients()
    } else {
      fetchIncomingRequests()
      fetchMyCaretakers()
    }
  }, [user, db, isFullPage])

  const fetchMyPatients = async () => {
    try {
      const q = query(collection(db, 'caretakerRequests'), where('caretakerUid','==',user.uid))
      const snap = await getDocs(q)
      setMyPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.status === 'accepted'))
    } catch {}
  }
  const fetchIncomingRequests = async () => {
    try {
      const q = query(collection(db, 'caretakerRequests'), where('patientUid','==',user.uid))
      const snap = await getDocs(q)
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.status === 'pending'))
    } catch {}
  }
  const fetchMyCaretakers = async () => {
    try {
      const q = query(collection(db, 'caretakerRequests'), where('patientUid','==',user.uid))
      const snap = await getDocs(q)
      setMyCaretakers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.status === 'accepted'))
    } catch {}
  }

  const sendRequest = async () => {
    if (!patientEmail.trim()) return
    setLoading(true); setStatus('')
    try {
      const q = query(collection(db, 'users'), where('email','==', patientEmail.trim().toLowerCase()))
      const snap = await getDocs(q)
      if (snap.empty) { setStatus('❌ ' + t('notFound','Patient not found with this email.')); setLoading(false); return }
      const patientDoc = snap.docs[0]
      const existQ = query(collection(db, 'caretakerRequests'), where('caretakerUid','==',user.uid), where('patientUid','==',patientDoc.id))
      if (!(await getDocs(existQ)).empty) { setStatus('⚠️ Request already sent.'); setLoading(false); return }
      await addDoc(collection(db, 'caretakerRequests'), {
        caretakerUid: user.uid, caretakerName: currentUserName,
        caretakerEmail: user.email,
        patientUid: patientDoc.id,
        patientEmail: patientDoc.data().email || patientEmail.trim().toLowerCase(),
        status: 'pending', createdAt: new Date().toISOString(),
      })
      setPatientEmail('')
      setStatus('✅ ' + t('requestSent','Request sent! Waiting for patient to accept.'))
    } catch (e) { setStatus('❌ Something went wrong.'); console.error(e) }
    setLoading(false)
  }

  const acceptRequest = async (id) => {
    try { await updateDoc(doc(db, 'caretakerRequests', id), { status:'accepted' }); fetchIncomingRequests(); fetchMyCaretakers() } catch {}
  }
  const rejectRequest = async (id) => {
    try { await updateDoc(doc(db, 'caretakerRequests', id), { status:'rejected' }); fetchIncomingRequests() } catch {}
  }
  const removeCaretaker = async (id) => {
    try { await deleteDoc(doc(db, 'caretakerRequests', id)); fetchMyCaretakers() } catch {}
  }

  // ── CARETAKER FULL-PAGE VIEW ─────────────────────────────────────────────
  if (isFullPage) {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#cce5ff 0%,#daeeff 60%,#eaf4ff 100%)', fontFamily:'var(--ff)' }}>
        {/* Header */}
        <header style={{
          position:'sticky', top:0, zIndex:100,
          background:'rgba(255,255,255,0.88)', backdropFilter:'blur(16px)',
          borderBottom:'1px solid rgba(26,111,255,0.12)',
          padding:'0 24px', height:60, display:'flex', alignItems:'center', gap:12,
        }}>
          <img src="/logo.png" alt="Sewarthii"
            style={{ height:46, width:'auto', objectFit:'contain', filter:'drop-shadow(0 2px 6px rgba(26,111,255,0.2))' }}
            onError={e => e.target.style.display='none'} />
          <div style={{ flex:1 }} />
          {changeLang && (
            <select value={lang} onChange={e => changeLang(e.target.value)}
              style={{ background:'rgba(26,111,255,0.08)', border:'1px solid rgba(26,111,255,0.2)', color:'var(--blue)', padding:'5px 8px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)', outline:'none' }}>
              <option value="en">🇬🇧 EN</option>
              <option value="hi">🇮🇳 हिं</option>
              <option value="mr">🇮🇳 मरा</option>
            </select>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1a6fff,#4a90e2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>
              {initials}
            </div>
            <button onClick={onLogout} style={{
              background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.22)', color:'#e03355',
              padding:'6px 12px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'var(--ff)',
            }}>🚪 {t('logout','Logout')}</button>
          </div>
        </header>

        {/* Content */}
        <div style={{ maxWidth:680, margin:'0 auto', padding:'28px 20px' }}>

          {selectedPat ? (
            <PatientDetail patient={selectedPat} db={db} tr={tr} onBack={() => setSelectedPat(null)} />
          ) : (
            <>
              <div className="greeting s1">
                <h2>👨‍⚕️ {t('caretakerView', 'Caretaker Dashboard')}</h2>
                <p>{t('managingHealth', 'Send requests to patients and view their health data once accepted.')}</p>
              </div>

              {/* ── Send Request ─────────────────────────────── */}
              <div className="card s2" style={{ marginBottom:18 }}>
                <div className="card-title">➕ {t('addPatient','Add a Patient')}</div>
                <p style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>
                  {t('addPatientSub', 'Enter the patient\'s registered email address to send a care request.')}
                </p>
                <div className="form-group">
                  <label className="form-label">📧 {t('patientEmail',"Patient's Email")}</label>
                  <input className="form-input" type="email"
                    placeholder={t('patientEmailPlaceholder','patient@example.com')}
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendRequest()}
                  />
                </div>
                {status && (
                  <div style={{
                    fontSize:13, fontWeight:600, marginBottom:12, padding:'10px 14px', borderRadius:10,
                    background: status.startsWith('✅')?'rgba(0,196,140,0.08)':status.startsWith('⚠️')?'rgba(255,179,71,0.08)':'rgba(255,77,106,0.08)',
                    border: `1px solid ${status.startsWith('✅')?'rgba(0,196,140,0.2)':status.startsWith('⚠️')?'rgba(255,179,71,0.2)':'rgba(255,77,106,0.2)'}`,
                    color: status.startsWith('✅')?'var(--success)':status.startsWith('⚠️')?'var(--warning)':'var(--danger)',
                  }}>{status}</div>
                )}
                <button className="btn btn-primary btn-full" onClick={sendRequest} disabled={loading}>
                  {loading ? `⏳ ${t('sending','Sending...')}` : `📤 ${t('sendRequest','Send Request')}`}
                </button>
              </div>

              {/* ── My Patients ───────────────────────────────── */}
              <div className="card s3">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div className="card-title" style={{ margin:0 }}>🔗 {t('myPatients','My Patients')}</div>
                  <button onClick={fetchMyPatients} style={{
                    background:'rgba(26,111,255,0.08)', border:'1px solid rgba(26,111,255,0.18)',
                    color:'var(--blue)', padding:'5px 11px', borderRadius:8, cursor:'pointer',
                    fontSize:11, fontWeight:700, fontFamily:'var(--ff)',
                  }}>🔄</button>
                </div>

                {myPatients.length === 0 ? (
                  <div className="empty" style={{ padding:'24px 0' }}>
                    <div className="e-icon">👥</div>
                    <h3>{t('noPatientsYet','No patients yet')}</h3>
                    <p>{t('noPatientsYetSub','Send a request and wait for a patient to accept.')}</p>
                  </div>
                ) : myPatients.map(p => (
                  <div key={p.id} style={{
                    display:'flex', alignItems:'center', gap:14, padding:'14px',
                    background:'rgba(26,111,255,0.04)', border:'1px solid rgba(26,111,255,0.12)',
                    borderRadius:16, marginBottom:10, cursor:'pointer', transition:'all 0.2s',
                  }}
                    onClick={() => setSelectedPat(p)}
                    onMouseOver={e => e.currentTarget.style.background='rgba(26,111,255,0.09)'}
                    onMouseOut={e  => e.currentTarget.style.background='rgba(26,111,255,0.04)'}
                  >
                    <Avatar name={p.patientEmail} size={46} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{p.patientEmail}</div>
                      <div style={{ fontSize:11, color:'var(--success)', fontWeight:700, marginTop:3 }}>✅ {t('linked','Linked — tap to view dashboard')}</div>
                    </div>
                    <div style={{ fontSize:18, color:'var(--blue)' }}>›</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <style>{`@keyframes pageSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      </div>
    )
  }

  // ── PATIENT-FACING CARE VIEW (embedded in patient app) ────────────────────
  // This renders when a patient clicks the "Care" tab
  return (
    <>
      <div className="greeting s1">
        <h2>🔗 {t('careView', 'My Care Network')}</h2>
        <p>{t('careViewSub', 'Manage who can monitor your health')}</p>
      </div>

      {/* Incoming requests */}
      <div className="card s2">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div className="card-title" style={{ margin:0 }}>🔔 {t('incomingRequests', 'Incoming Requests')}</div>
          <button onClick={() => { fetchIncomingRequests(); fetchMyCaretakers() }}
            style={{ background:'rgba(26,111,255,0.08)', border:'1px solid rgba(26,111,255,0.18)', color:'var(--blue)', padding:'5px 11px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>🔄</button>
        </div>
        {requests.length === 0 ? (
          <div className="empty" style={{ padding:'14px 0' }}>
            <div className="e-icon" style={{ fontSize:28 }}>🔔</div>
            <p style={{ fontSize:13, color:'var(--text3)' }}>{t('noIncoming', 'No pending requests. When a caretaker sends you a request it will appear here.')}</p>
          </div>
        ) : requests.map(r => (
          <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(255,179,71,0.06)', border:'1px solid rgba(255,179,71,0.2)', borderRadius:14, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Avatar name={r.caretakerName} size={40} />
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{r.caretakerName}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{r.caretakerEmail}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-success" style={{ fontSize:12 }} onClick={() => acceptRequest(r.id)}>✅ {t('accept','Accept')}</button>
              <button className="btn btn-danger"  style={{ fontSize:12 }} onClick={() => rejectRequest(r.id)}>✕ {t('reject','Reject')}</button>
            </div>
          </div>
        ))}
      </div>

      {/* My caretakers */}
      <div className="card s3">
        <div className="card-title">👨‍⚕️ {t('myCaretakers', 'My Caretakers')}</div>
        {myCaretakers.length === 0 ? (
          <div className="empty" style={{ padding:'14px 0' }}><p>{t('noCaretakers','No caretakers linked yet')}</p></div>
        ) : myCaretakers.map(c => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(0,196,140,0.05)', border:'1px solid rgba(0,196,140,0.18)', borderRadius:14, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Avatar name={c.caretakerName} size={40} />
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{c.caretakerName}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{c.caretakerEmail}</div>
              </div>
            </div>
            <button className="btn btn-danger" style={{ fontSize:11 }} onClick={() => removeCaretaker(c.id)}>{t('remove','Remove')}</button>
          </div>
        ))}
      </div>
    </>
  )
}