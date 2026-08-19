import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import jsPDF from 'jspdf'
import Dashboard from './Dashboard'
import AddMedicine from './AddMedicine'
import WaterTracker from './Watertracker'
import HabitTracker from './Habittracker'

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

const PATIENT_TABS = [
  { id: 'dashboard', icon: '🏠', label: 'Overview' },
  { id: 'add',       icon: '➕', label: 'Add Med' },
  { id: 'water',     icon: '💧', label: 'Water' },
  { id: 'habits',    icon: '🏃', label: 'Habits' }
]

// ─── Patient detail panel with Sub-tabs & PDF Export (for Caretaker View) ───
function PatientDetail({ patient, db, tr, lang, onBack, activeSosForPatient }) {
  const [activeTab,    setActiveTab]    = useState('dashboard')
  const [medicines,    setMedicines]    = useState([])
  const [patientProfile, setPatientProfile] = useState(null)
  const t = (k, fb) => tr ? tr(k) : fb

  const patientUser = {
    uid: patient.patientUid,
    email: patient.patientEmail,
    displayName: patient.patientName || patient.patientEmail?.split('@')[0] || 'Patient'
  }

  useEffect(() => {
    if (!patient.patientUid || !db) return
    getDoc(doc(db, 'users', patient.patientUid)).then(snap => {
      if (snap.exists()) setPatientProfile(snap.data())
    }).catch(() => {})
  }, [patient, db])

  useEffect(() => {
    if (!patient.patientUid || !db) return
    const q = query(collection(db, 'medicines'), where('userId', '==', patient.patientUid))
    const unsub = onSnapshot(q, snap => {
      setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [patient, db])

  const exportPDF = () => {
    const docPdf = new jsPDF()
    const pName = patient.patientName || patient.patientEmail || 'Patient'
    docPdf.setFontSize(22)
    docPdf.text(`Health Report: ${pName}`, 20, 20)
    docPdf.setFontSize(14)
    docPdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
    docPdf.text(`Active Medicines:`, 20, 45)
    docPdf.setFontSize(12)
    let y = 55
    if (medicines.length === 0) {
      docPdf.text('No medicines logged.', 20, y)
      y += 10
    } else {
      medicines.forEach(m => {
        const timesStr = m.times ? m.times.join(', ') : m.time || ''
        docPdf.text(`- ${m.name} (${m.dosage || ''}) ${timesStr}`, 20, y)
        y += 10
      })
    }
    y += 10
    docPdf.setFontSize(14)
    docPdf.text('Profile Data:', 20, y)
    y += 10
    docPdf.setFontSize(12)
    docPdf.text(`Blood Group: ${patientProfile?.bloodGroup || 'N/A'}`, 20, y)
    y += 10
    docPdf.text(`Age: ${patientProfile?.age || 'N/A'}`, 20, y)
    y += 10
    docPdf.text(`Weight: ${patientProfile?.weight || 'N/A'} kg`, 20, y)
    docPdf.save(`${pName.replace(/\s+/g,'_')}_health_report.pdf`)
  }

  return (
    <div style={{ animation: 'pageSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* Back Button */}
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(26,111,255,0.08)',
        border: '1px solid rgba(26,111,255,0.18)', color: 'var(--blue)', padding: '8px 16px',
        borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--ff)', fontWeight: 700,
        fontSize: 13, marginBottom: 18,
      }}>← {t('backToPatients', 'Back to Patient List')}</button>

      {/* SOS Active Banner for this patient if any */}
      {activeSosForPatient && (
        <div style={{
          background: 'linear-gradient(135deg, #d90429, #ef233c)', color: '#fff',
          borderRadius: 18, padding: '16px 20px', marginBottom: 18,
          boxShadow: '0 8px 24px rgba(217,4,41,0.35)', animation: 'pulseSOSFast 1.2s infinite'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                🚨 EMERGENCY SOS TRIGGERED BY THIS PATIENT
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                Patient is requesting immediate assistance. Live GPS coordinates are available.
              </div>
            </div>
            {activeSosForPatient.lat && activeSosForPatient.lng && (
              <a
                href={activeSosForPatient.mapsUrl || `https://www.google.com/maps?q=${activeSosForPatient.lat},${activeSosForPatient.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#fff', color: '#d90429', padding: '8px 16px', borderRadius: 10,
                  fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                📍 Open Google Maps Location →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Patient header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        background: 'rgba(26,111,255,0.06)', border: '1px solid rgba(26,111,255,0.15)',
        borderRadius: 20, marginBottom: 18
      }}>
        <Avatar name={patient.patientName || patient.patientEmail} size={50} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
            {patient.patientName || patient.patientEmail}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            📧 {patient.patientEmail}
          </div>
          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, marginTop: 2 }}>
            ✅ {t('linked', 'Connected Patient')} — {t('caretakerEditMode', 'Full management & editing active')}
          </div>
        </div>
        <button onClick={exportPDF} style={{
          background: 'linear-gradient(135deg, #1a6fff, #60a5fa)', border: 'none',
          color: '#fff', padding: '8px 16px', borderRadius: 12, cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--ff)',
          boxShadow: '0 4px 10px rgba(26,111,255,0.3)', marginRight: 6
        }}>
          📄 Export PDF
        </button>
      </div>

      {/* Patient sub tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.7)',
        padding: '6px 8px', borderRadius: 16, border: '1px solid rgba(26,111,255,0.1)', overflowX: 'auto'
      }}>
        {PATIENT_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--ff)',
            fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
            background: activeTab === tab.id ? 'linear-gradient(135deg,#1a6fff,#60a5fa)' : 'transparent',
            color: activeTab === tab.id ? '#fff' : 'var(--text3)',
            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(26,111,255,0.25)' : 'none'
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content per tab */}
      <div>
        {activeTab === 'dashboard' && (
          <Dashboard
            medicines={medicines}
            onStatusUpdate={async (id, status) => {
              setMedicines(prev => prev.map(m => m.id === id ? { ...m, status } : m))
              try { await updateDoc(doc(db, 'medicines', id), { status }) } catch(e) { console.error(e) }
            }}
            onDelete={async (id) => {
              setMedicines(prev => prev.filter(m => m.id !== id))
              try { await deleteDoc(doc(db, 'medicines', id)) } catch(e) { console.error(e) }
            }}
            onNavigate={setActiveTab}
            user={patientUser}
            userProfile={patientProfile}
            db={db}
            lang={lang}
            tr={tr}
          />
        )}
        {activeTab === 'add' && (
          <AddMedicine
            onAdd={async (med) => {
              await addDoc(collection(db, 'medicines'), { ...med, userId: patient.patientUid })
              setActiveTab('dashboard')
            }}
            onNavigate={setActiveTab}
            lang={lang}
            tr={tr}
          />
        )}
        {activeTab === 'water' && (
          <WaterTracker
            user={patientUser}
            db={db}
            userProfile={patientProfile}
            lang={lang}
            tr={tr}
          />
        )}
        {activeTab === 'habits' && (
          <HabitTracker
            user={patientUser}
            db={db}
            lang={lang}
            tr={tr}
          />
        )}
      </div>
    </div>
  )
}

// ─── Main: CaretakerDashboard (Handles Caretaker View & Patient Care Hub) ───
export default function CaretakerDashboard({
  medicines = [], currentUserName, user, db, tr, lang,
  isFullPage = false, onLogout, changeLang, initials, onToggleRole
}) {
  const [emailInput,   setEmailInput]   = useState('')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [directory,    setDirectory]    = useState([]) // Available registered caretakers (for patient search)
  const [incomingReqs, setIncomingReqs] = useState([]) // Requests sent to this user
  const [pendingSent,  setPendingSent]  = useState([]) // Requests sent by this user
  const [myPatients,   setMyPatients]   = useState([]) // Accepted patients (for Caretaker)
  const [myCaretakers, setMyCaretakers] = useState([]) // Accepted caretakers (for Patient)
  const [status,       setStatus]       = useState('')
  const [loading,      setLoading]      = useState(false)
  const [selectedPat,  setSelectedPat]  = useState(null)
  const [activeSosList,setActiveSosList]= useState([])
  const [activeSosModal,setActiveSosModal] = useState(null)
  const [muted,        setMuted]        = useState(false)

  const userEmail = user?.email?.toLowerCase() || ''

  const t = (k, fb) => {
    if (tr) {
      const val = tr(k);
      if (val === k && fb) return fb;
      return val || fb;
    }
    return fb;
  }

  const [reqError, setReqError] = useState('')

  // ── Real-time Active SOS Alert Listener ──
  useEffect(() => {
    if (!db) return
    try {
      const q = query(collection(db, 'sosAlerts'), where('status', '==', 'active'))
      const unsub = onSnapshot(q, snap => {
        const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setActiveSosList(alerts)
        if (alerts.length > 0) {
          setActiveSosModal(alerts[0])
          if (!muted) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)()
              if (ctx.state === 'suspended') ctx.resume()
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.type = 'sawtooth'
              osc.frequency.setValueAtTime(900, ctx.currentTime)
              osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.4)
              gain.setValueAtTime(0.35, ctx.currentTime)
              gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
              osc.start(ctx.currentTime)
              osc.stop(ctx.currentTime + 0.8)
            } catch(e) {}
          }
        } else {
          setActiveSosModal(null)
        }
      })
      return () => unsub()
    } catch(e) {
      console.warn('SOS listener error:', e)
    }
  }, [db, muted])

  const resolveSos = async (alertId) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'sosAlerts', alertId), { status: 'resolved', resolvedAt: new Date().toISOString() })
      }
    } catch(e) {
      console.error('Error resolving SOS:', e)
    }
    setActiveSosList(prev => prev.filter(a => a.id !== alertId))
    if (activeSosModal?.id === alertId) setActiveSosModal(null)
  }

  // ── Real-time Requests Listener (Firestore only, no localStorage) ──
  useEffect(() => {
    if (!user || !db || !userEmail) return

    let listC = []
    let listP = []

    const merge = () => {
      const all = [...listC, ...listP].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      if (isFullPage) {
        setMyPatients(all.filter(d => d.status === 'accepted' && (d.caretakerEmail === userEmail || d.caretakerUid === user.uid)))
        setIncomingReqs(all.filter(d => d.status === 'pending' && (d.caretakerEmail === userEmail || d.caretakerUid === user.uid) && d.sentBy === 'patient'))
        setPendingSent(all.filter(d => d.status === 'pending' && (d.caretakerEmail === userEmail || d.caretakerUid === user.uid) && d.sentBy === 'caretaker'))
      } else {
        setMyCaretakers(all.filter(d => d.status === 'accepted' && (d.patientEmail === userEmail || d.patientUid === user.uid)))
        setIncomingReqs(all.filter(d => d.status === 'pending' && (d.patientEmail === userEmail || d.patientUid === user.uid) && d.sentBy === 'caretaker'))
        setPendingSent(all.filter(d => d.status === 'pending' && (d.patientEmail === userEmail || d.patientUid === user.uid) && d.sentBy === 'patient'))
      }
    }

    let unsubC = () => {}
    let unsubP = () => {}
    let unsubDir = () => {}

    try {
      unsubC = onSnapshot(
        query(collection(db, 'caretakerRequests'), where('caretakerEmail', '==', userEmail)),
        snap => { listC = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge() },
        e => console.error('Listener C error:', e.code, e.message)
      )
    } catch(e) { console.error('Setup C:', e) }

    try {
      unsubP = onSnapshot(
        query(collection(db, 'caretakerRequests'), where('patientEmail', '==', userEmail)),
        snap => { listP = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge() },
        e => console.error('Listener P error:', e.code, e.message)
      )
    } catch(e) { console.error('Setup P:', e) }

    if (!isFullPage) {
      try {
        unsubDir = onSnapshot(
          query(collection(db, 'users'), where('role', '==', 'caretaker')),
          snap => setDirectory(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.email && c.email.toLowerCase() !== userEmail)),
          () => {}
        )
      } catch(e) {}
    }

    return () => { unsubC(); unsubP(); unsubDir() }
  }, [user?.uid, db, userEmail, isFullPage])

  const fetchAllRequestsAndPatients = () => {}
  const fetchCaretakerDirectory = () => {}

  // ── Send Care Request (direct Firestore write) ──
  const handleSendRequest = async (explicitEmail = null) => {
    const targetEmail = (explicitEmail || emailInput).trim().toLowerCase()
    if (!targetEmail) { setStatus('⚠️ Please enter an email address.'); return }
    if (targetEmail === userEmail) { setStatus('⚠️ You cannot send a request to yourself.'); return }

    setLoading(true); setStatus(''); setReqError('')

    const myName = currentUserName || user?.displayName || userEmail.split('@')[0] || 'User'
    const targetName = targetEmail.split('@')[0]

    const payload = isFullPage
      ? { caretakerUid: user.uid, caretakerName: myName, caretakerEmail: userEmail, patientUid: '', patientName: targetName, patientEmail: targetEmail, sentBy: 'caretaker', status: 'pending', createdAt: new Date().toISOString() }
      : { patientUid: user.uid, patientName: myName, patientEmail: userEmail, caretakerUid: '', caretakerName: targetName, caretakerEmail: targetEmail, sentBy: 'patient', status: 'pending', createdAt: new Date().toISOString() }

    try {
      await addDoc(collection(db, 'caretakerRequests'), payload)
      setEmailInput('')
      setStatus(`✅ Request sent to ${targetEmail}! They will see it when they open the app.`)
    } catch(e) {
      console.error('SEND REQUEST ERROR:', e.code, e.message)
      const friendly = e.code === 'permission-denied'
        ? '❌ Permission denied. Please go to Firebase Console → Firestore → Rules and set: allow read, write: if request.auth != null;'
        : e.code === 'unavailable'
        ? '❌ Network issue — check your internet connection and try again.'
        : e.message?.includes('ASSERTION FAILED')
        ? '❌ Firebase internal error. Please do a full page refresh (Ctrl+Shift+R) and try again.'
        : `❌ Could not send request (${e.code || 'unknown error'}). Please try again.`
      setReqError(friendly)
    } finally {
      setLoading(false)
    }
  }

  // ── Accept Request ──
  const handleAcceptRequest = async (request) => {
    setReqError('')
    try {
      const myName = currentUserName || user?.displayName || userEmail.split('@')[0] || 'User'
      const updates = { status: 'accepted', acceptedAt: new Date().toISOString() }
      if (isFullPage) { updates.caretakerUid = user.uid; updates.caretakerName = myName }
      else { updates.patientUid = user.uid; updates.patientName = myName }
      await updateDoc(doc(db, 'caretakerRequests', request.id), updates)
    } catch(e) {
      console.error('ACCEPT ERROR:', e.code, e.message)
      const friendly = e.message?.includes('ASSERTION FAILED')
        ? '❌ Firebase internal error. Please do a full page refresh (Ctrl+Shift+R) and try again.'
        : `❌ Could not accept request. Please try again.`
      setReqError(friendly)
    }
  }

  // ── Reject / Cancel Request ──
  const handleRejectOrDelete = async (requestId) => {
    setReqError('')
    try {
      await deleteDoc(doc(db, 'caretakerRequests', requestId))
      if (selectedPat?.id === requestId) setSelectedPat(null)
    } catch(e) {
      console.error('DELETE ERROR:', e.code, e.message)
      const friendly = e.message?.includes('ASSERTION FAILED')
        ? '❌ Firebase internal error. Please do a full page refresh (Ctrl+Shift+R) and try again.'
        : `❌ Could not remove. Please try again.`
      setReqError(friendly)
    }
  }

  const activeSosForSelected = selectedPat ? activeSosList.find(a => a.patientUid === selectedPat.patientUid || a.patientEmail === selectedPat.patientEmail) : null

  // Filtered directory for search
  const filteredDirectory = directory.filter(c => {
    const q = searchQuery.toLowerCase()
    return (c.displayName || c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  // ── Render Full-Page Caretaker View ──
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
            style={{ height:44, width:'auto', objectFit:'contain', filter:'drop-shadow(0 2px 6px rgba(26,111,255,0.2))' }}
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

        {/* ── Active SOS Banner on Caretaker Dashboard ── */}
        {activeSosList.length > 0 && (
          <div style={{
            background: 'linear-gradient(90deg, #d90429, #ef233c)', color: '#fff',
            padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(217,4,41,0.35)', animation: 'pulseSOSFast 1.5s infinite'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div>
                <strong style={{ fontSize: 14, letterSpacing: 0.5 }}>
                  CRITICAL ALERT: Emergency SOS Triggered!
                </strong>
                <div style={{ fontSize: 11, opacity: 0.9 }}>
                  {activeSosList[0].patientName || activeSosList[0].patientEmail} requires urgent assistance.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setMuted(!muted)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: '1px solid #fff', color: '#fff',
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {muted ? '🔊 Unmute' : '🔇 Mute'}
              </button>
              <button
                onClick={() => setActiveSosModal(activeSosList[0])}
                style={{
                  background: '#fff', color: '#d90429', border: 'none',
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer'
                }}
              >
                📍 View Location & Help →
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: selectedPat ? '100%' : 760, margin:'0 auto', padding: selectedPat ? '28px 40px' : '28px 20px', transition: 'max-width 0.3s' }}>

          {selectedPat ? (
            <PatientDetail
              patient={selectedPat}
              db={db}
              tr={tr}
              lang={lang}
              onBack={() => setSelectedPat(null)}
              activeSosForPatient={activeSosForSelected}
            />
          ) : (
            <>
              <div className="greeting s1">
                <h2>👨‍⚕️ Caretaker Command Center</h2>
                <p>Monitor patient medications, accept incoming care requests, and manage adherence.</p>
              </div>

              {/* ── 1. INCOMING REQUESTS FROM PATIENTS (PROMINENT TOP CARD) ── */}
              {incomingReqs.length > 0 && (
                <div className="card s2" style={{
                  background: 'linear-gradient(135deg, rgba(255,179,71,0.12), rgba(26,111,255,0.06))',
                  border: '2px solid rgba(255,179,71,0.4)', borderRadius: 22, padding: '20px', marginBottom: 20,
                  boxShadow: '0 8px 24px rgba(255,179,71,0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>🔔</span>
                      <div>
                        <strong style={{ fontSize: 16, color: '#b45309' }}>Incoming Care Requests from Patients ({incomingReqs.length})</strong>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Patients who want you to monitor and manage their health</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {incomingReqs.map(req => (
                      <div key={req.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                        background: '#fff', border: '1.5px solid rgba(255,179,71,0.3)', borderRadius: 16, padding: '14px 18px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={req.patientName || req.patientEmail} size={44} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                              {req.patientName || req.patientEmail}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                              📧 {req.patientEmail}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            style={{
                              background: 'linear-gradient(135deg, #00c48c, #009e70)', color: '#fff', border: 'none',
                              padding: '9px 18px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                              boxShadow: '0 3px 10px rgba(0,196,140,0.3)'
                            }}
                          >
                            ✅ Accept & Connect
                          </button>
                          <button
                            onClick={() => handleRejectOrDelete(req.id)}
                            style={{
                              background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)', color: '#d90429',
                              padding: '9px 14px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer'
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 2. MY ACTIVE LINKED PATIENTS ── */}
              <div className="card s2" style={{ marginBottom: 20 }}>
                <div style={{ marginBottom:14 }}>
                  <div className="card-title" style={{ margin:0 }}>👥 My Connected Patients ({myPatients.length})</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Tap any patient to view their dashboard, schedule medicines, or review health stats</div>
                </div>

                {myPatients.length === 0 ? (
                  <div className="empty" style={{ padding:'32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 42, marginBottom: 8 }}>👥</div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>No connected patients yet</h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text3)' }}>
                      When a patient sends you a request (or when you add a patient by email below), they will appear here.
                    </p>
                  </div>
                ) : myPatients.map(p => {
                  const hasSos = activeSosList.some(a => a.patientUid === p.patientUid || a.patientEmail === p.patientEmail)
                  return (
                    <div key={p.id} style={{
                      display:'flex', alignItems:'center', gap:14, padding:'16px 18px',
                      background: hasSos ? 'rgba(255,59,59,0.08)' : 'rgba(26,111,255,0.04)',
                      border: hasSos ? '2px solid #ff3b3b' : '1.5px solid rgba(26,111,255,0.12)',
                      borderRadius:18, marginBottom:12, cursor:'pointer', transition:'all 0.2s',
                      boxShadow: hasSos ? '0 4px 14px rgba(255,59,59,0.25)' : 'none'
                    }}
                      onClick={() => setSelectedPat(p)}
                      onMouseOver={e => e.currentTarget.style.background= hasSos ? 'rgba(255,59,59,0.12)' : 'rgba(26,111,255,0.09)'}
                      onMouseOut={e  => e.currentTarget.style.background= hasSos ? 'rgba(255,59,59,0.08)' : 'rgba(26,111,255,0.04)'}
                    >
                      <Avatar name={p.patientName || p.patientEmail} size={48} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <strong style={{ fontSize:16, color:'var(--text)' }}>
                            {p.patientName || p.patientEmail}
                          </strong>
                          {hasSos && (
                            <span style={{
                              background:'#d90429', color:'#fff', padding:'2px 8px', borderRadius:6,
                              fontSize:10, fontWeight:900, animation:'pulseSOSFast 1s infinite'
                            }}>
                              🚨 SOS ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.patientEmail}</div>
                        <div style={{ fontSize:11, color: hasSos ? '#d90429' : 'var(--success)', fontWeight:700, marginTop:3 }}>
                          {hasSos ? '⚠️ Emergency Active · Tap to view location' : `✅ Connected · Tap to manage account`}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleRejectOrDelete(p.id) }} style={{
                          background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.22)',
                          color:'var(--danger)', padding:'7px 12px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer'
                        }}>
                          ✕ Remove
                        </button>
                        <div style={{
                          background: hasSos ? '#d90429' : 'linear-gradient(135deg,#1a6fff,#60a5fa)',
                          color:'#fff', padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:800
                        }}>
                          {hasSos ? '🚨 View SOS' : 'Manage ›'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── 3. SEND REQUEST TO PATIENT ── */}
              <div className="card s3">
                <div className="card-title">➕ Invite / Link a Patient</div>
                <p style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>
                  Enter the patient's registered email address to send them a care connection request.
                </p>
                <div className="form-group">
                  <label className="form-label">📧 Patient's Registered Email</label>
                  <input className="form-input" type="email"
                    placeholder="patient@example.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
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
                {reqError && (
                  <div style={{
                    fontSize:13, fontWeight:700, marginBottom:12, padding:'12px 14px', borderRadius:10,
                    background:'rgba(217,4,41,0.08)', border:'1.5px solid rgba(217,4,41,0.3)', color:'#d90429',
                    lineHeight:1.5
                  }}>{reqError}</div>
                )}
                <button className="btn btn-primary btn-full" onClick={() => handleSendRequest()} disabled={loading}>
                  {loading ? '⏳ Sending Request...' : '📤 Send Care Request'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Emergency SOS Critical Alert Modal ── */}
        {activeSosModal && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(13, 27, 62, 0.88)', backdropFilter:'blur(12px)',
            zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
            animation:'fadeIn 0.3s ease'
          }}>
            <div style={{
              background:'#fff', borderRadius:28, padding:'32px 26px', maxWidth:480, width:'100%',
              boxShadow:'0 25px 60px rgba(217,4,41,0.4)', textAlign:'center',
              border:'3.5px solid #ff3b3b', animation:'scaleUp 0.35s cubic-bezier(0.22,1,0.36,1) both'
            }}>
              <div style={{
                width:76, height:76, borderRadius:'50%', background:'rgba(255,59,59,0.12)',
                border:'2px solid #ff3b3b', display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 16px', fontSize:38, animation:'pulseSOSFast 1.2s infinite'
              }}>
                🚨
              </div>

              <h2 style={{ fontSize:24, fontWeight:900, color:'#d90429', margin:'0 0 6px' }}>
                PATIENT EMERGENCY SOS
              </h2>
              <p style={{ fontSize:15, color:'#1e293b', fontWeight:700, margin:'0 0 16px' }}>
                {activeSosModal.patientName || activeSosModal.patientEmail} has triggered a distress alarm!
              </p>

              {/* Location Card */}
              <div style={{
                background:'rgba(26,111,255,0.05)', border:'1.5px solid rgba(26,111,255,0.2)',
                borderRadius:18, padding:'16px', marginBottom:18, textAlign:'left'
              }}>
                <div style={{ fontSize:12, fontWeight:800, color: 'var(--blue)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  <span>📍</span>
                  <span>PATIENT GPS LOCATION DETECTED</span>
                </div>

                {activeSosModal.lat && activeSosModal.lng ? (
                  <>
                    <div style={{ fontSize:14, color:'#0f172a', fontWeight:700, marginBottom:4 }}>
                      Coordinates: {activeSosModal.lat.toFixed(5)}° N, {activeSosModal.lng.toFixed(5)}° E
                    </div>
                    {activeSosModal.accuracy && (
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>
                        Accuracy: ±{activeSosModal.accuracy} meters
                      </div>
                    )}
                    <a
                      href={activeSosModal.mapsUrl || `https://www.google.com/maps?q=${activeSosModal.lat},${activeSosModal.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        background:'linear-gradient(135deg,#1a6fff,#0284c7)', color:'#fff',
                        padding:'12px 16px', borderRadius:12, fontSize:13, fontWeight:800,
                        textDecoration:'none', boxShadow:'0 4px 14px rgba(26,111,255,0.35)'
                      }}
                    >
                      🗺️ Open Live Location in Google Maps →
                    </a>
                  </>
                ) : (
                  <div style={{ fontSize:12, color:'#64748b' }}>
                    Distress broadcast received from patient account.
                  </div>
                )}
              </div>

              {/* Patient Contact & Actions */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {activeSosModal.patientPhone ? (
                  <a
                    href={`tel:${activeSosModal.patientPhone}`}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      padding:'12px', borderRadius:14, background:'#00c48c', color:'#fff',
                      fontSize:13, fontWeight:800, textDecoration:'none', boxShadow:'0 4px 12px rgba(0,196,140,0.3)'
                    }}
                  >
                    📞 Call Patient Now
                  </a>
                ) : (
                  <a
                    href="tel:112"
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      padding:'12px', borderRadius:14, background:'#d90429', color:'#fff',
                      fontSize:13, fontWeight:800, textDecoration:'none', boxShadow:'0 4px 12px rgba(217,4,41,0.3)'
                    }}
                  >
                    📞 Call 112 (Emergency)
                  </a>
                )}
                <button
                  onClick={() => setMuted(!muted)}
                  style={{
                    padding:'12px', borderRadius:14, background:'rgba(26,111,255,0.08)',
                    border:'1.5px solid rgba(26,111,255,0.2)', color:'var(--blue)',
                    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)'
                  }}
                >
                  {muted ? '🔊 Unmute Siren' : '🔇 Mute Siren'}
                </button>
              </div>

              {/* Mark as Resolved */}
              <button
                onClick={() => resolveSos(activeSosModal.id)}
                style={{
                  width:'100%', padding:'12px', borderRadius:12,
                  background:'rgba(0,196,140,0.1)', border:'1.5px solid rgba(0,196,140,0.3)',
                  color:'#00a878', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff)'
                }}
              >
                ✅ Acknowledge & Mark SOS as Resolved
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pageSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
          @keyframes pulseSOSFast { 0%{opacity:1;box-shadow:0 0 0 0 rgba(217,4,41,0.7)}50%{opacity:0.9;box-shadow:0 0 0 12px rgba(217,4,41,0)}100%{opacity:1;box-shadow:0 0 0 0 rgba(217,4,41,0)} }
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes scaleUp{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        `}</style>
      </div>
    )
  }

  // ── PATIENT-FACING CARE VIEW (Embedded in Patient App) ──
  return (
    <>
      <div className="greeting s1">
        <h2>🔗 My Care Network</h2>
        <p>Find & connect with caretakers, family members, or doctors to monitor your health & receive emergency SOS alerts</p>
      </div>

      {/* ── 1. INCOMING REQUESTS FROM CARETAKERS ── */}
      {incomingReqs.length > 0 && (
        <div className="card s2" style={{
          background: 'linear-gradient(135deg, rgba(255,179,71,0.12), rgba(0,196,140,0.06))',
          border: '2px solid rgba(255,179,71,0.4)', borderRadius: 20, padding: '18px 20px', marginBottom: 18,
          boxShadow: '0 6px 20px rgba(255,179,71,0.15)'
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🔔</span>
              <div>
                <strong style={{ fontSize: 15, color: '#b45309' }}>Incoming Caretaker Requests ({incomingReqs.length})</strong>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>These caretakers want to monitor your health routine</div>
              </div>
            </div>
            <button onClick={fetchAllRequestsAndPatients}
              style={{ background:'rgba(26,111,255,0.08)', border:'1px solid rgba(26,111,255,0.18)', color:'var(--blue)', padding:'5px 11px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>🔄</button>
          </div>
          {incomingReqs.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 10, padding:'14px', background:'#fff', border:'1px solid rgba(255,179,71,0.25)', borderRadius:14, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Avatar name={r.caretakerName || r.caretakerEmail} size={42} />
                <div>
                  <div style={{ fontWeight:800, fontSize:15 }}>{r.caretakerName || r.caretakerEmail}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>📧 {r.caretakerEmail}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-success" style={{ fontSize:12 }} onClick={() => handleAcceptRequest(r)}>✅ Accept</button>
                <button className="btn btn-danger"  style={{ fontSize:12 }} onClick={() => handleRejectOrDelete(r.id)}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. FIND & CONNECT WITH REGISTERED CARETAKERS ── */}
      <div className="card s2" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>🔍 Find & Connect with Caretakers</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Search registered care managers or send an invite below</div>
          </div>
          <button onClick={fetchCaretakerDirectory} style={{
            background: 'rgba(26,111,255,0.08)', border: '1px solid rgba(26,111,255,0.18)',
            color: 'var(--blue)', padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700
          }}>🔄 Refresh</button>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: 14 }}>
          <input
            className="form-input"
            placeholder="Search caretaker by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Caretaker List */}
        {filteredDirectory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredDirectory.map(c => {
              const isConnected = myCaretakers.some(mc => mc.caretakerEmail === c.email?.toLowerCase() || mc.caretakerUid === c.id)
              const isPending = pendingSent.some(ps => ps.caretakerEmail === c.email?.toLowerCase() || ps.caretakerUid === c.id)

              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
                  padding: '12px 16px', background: 'rgba(26,111,255,0.04)', border: '1px solid rgba(26,111,255,0.12)',
                  borderRadius: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={c.displayName || c.name || c.email} size={42} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                        {c.displayName || c.name || c.email?.split('@')[0]}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>📧 {c.email}</div>
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <span style={{
                        background: 'rgba(0,196,140,0.1)', color: 'var(--success)', padding: '6px 12px',
                        borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-block'
                      }}>
                        ✅ Connected
                      </span>
                    ) : isPending ? (
                      <span style={{
                        background: 'rgba(255,179,71,0.1)', color: 'var(--warning)', padding: '6px 12px',
                        borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-block'
                      }}>
                        ⏳ Request Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(c.email)}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #1a6fff, #0284c7)', color: '#fff', border: 'none',
                          padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                          boxShadow: '0 3px 8px rgba(26,111,255,0.25)'
                        }}
                      >
                        + Send Request
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0 10px' }}>
            No registered caretakers found matching "{searchQuery}". You can enter any caretaker's email below.
          </p>
        )}
      </div>

      {/* ── 3. SEND INVITATION BY CUSTOM EMAIL ── */}
      <div className="card s2" style={{ marginBottom: 18 }}>
        <div className="card-title">➕ Invite Caretaker by Email Address</div>
        <p style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>
          Enter your family member, doctor, or caretaker's registered email address to grant them access to monitor your health.
        </p>
        <div className="form-group">
          <label className="form-label">📧 Caretaker's Email Address</label>
          <input className="form-input" type="email"
            placeholder="caretaker@example.com"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
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
        {reqError && (
          <div style={{
            fontSize:13, fontWeight:700, marginBottom:12, padding:'12px 14px', borderRadius:10,
            background:'rgba(217,4,41,0.08)', border:'1.5px solid rgba(217,4,41,0.3)', color:'#d90429', lineHeight:1.5
          }}>{reqError}</div>
        )}
        <button className="btn btn-primary btn-full" onClick={() => handleSendRequest()} disabled={loading}>
          {loading ? '⏳ Sending Request...' : '📤 Send Caretaker Invitation'}
        </button>
      </div>

      {/* ── 4. PENDING SENT REQUESTS ── */}
      {pendingSent.length > 0 && (
        <div className="card s2" style={{ marginBottom: 18, background: 'rgba(255,179,71,0.04)', border: '1px solid rgba(255,179,71,0.2)' }}>
          <div className="card-title" style={{ color: '#b45309' }}>⏳ Pending Sent Requests ({pendingSent.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingSent.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fff', borderRadius: 12, border: '1px solid rgba(255,179,71,0.2)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{req.caretakerName || req.caretakerEmail}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>📧 {req.caretakerEmail}</div>
                </div>
                <button
                  onClick={() => handleRejectOrDelete(req.id)}
                  style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)', color: '#d90429', padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. MY CONNECTED CARETAKERS ── */}
      <div className="card s3">
        <div className="card-title">👨‍⚕️ My Connected Caretakers ({myCaretakers.length})</div>
        {myCaretakers.length === 0 ? (
          <div className="empty" style={{ padding:'24px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>👨‍⚕️</div>
            <p style={{ color: 'var(--text3)', margin: 0 }}>No caretakers connected yet. Use the search or invitation box above to link your care team.</p>
          </div>
        ) : myCaretakers.map(c => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px', background:'rgba(0,196,140,0.05)', border:'1px solid rgba(0,196,140,0.18)', borderRadius:14, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Avatar name={c.caretakerName || c.caretakerEmail} size={44} />
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>{c.caretakerName || c.caretakerEmail}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>📧 {c.caretakerEmail}</div>
                <div style={{ fontSize:10, color:'var(--success)', fontWeight:700, marginTop:2 }}>✅ Active Caretaker Permissions</div>
              </div>
            </div>
            <button className="btn btn-danger" style={{ fontSize:12 }} onClick={() => handleRejectOrDelete(c.id)}>Disconnect</button>
          </div>
        ))}
      </div>
    </>
  )
}