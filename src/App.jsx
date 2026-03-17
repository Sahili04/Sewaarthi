import { useState, useEffect, useRef } from 'react'
import { db, auth, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, where, signOut, onAuthStateChanged } from './firebase'
import Dashboard from './pages/Dashboard'
import AddMedicine from './pages/AddMedicine'
import AIAssistant from './pages/AIAssistant.jsx'
import PrescriptionScanner from './pages/PrescriptionScanner'
import IoTDevice from './pages/IoTDevice'
import CaretakerDashboard from './pages/CaretakerDashboard'
import DoctorContacts from './pages/DoctorContacts'
import Login from './pages/Login'
import './index.css'

const NAV = [
  { id: 'dashboard', label: 'Home',    icon: '🏠' },
  { id: 'add',       label: 'Add',     icon: '➕' },
  { id: 'ai',        label: 'AI Chat', icon: '🤖' },
  { id: 'scanner',   label: 'Scan',    icon: '📷' },
  { id: 'doctors',   label: 'Doctors', icon: '🏥' },
]

// ── Web Speech API voice reminder ──
function speakReminder(medicineName) {
  try {
    window.speechSynthesis.cancel()
    const msg = new SpeechSynthesisUtterance(
      `It is time to take your medicine. Please take ${medicineName} now.`
    )
    msg.lang   = 'en-IN'
    msg.rate   = 0.88
    msg.pitch  = 1
    msg.volume = 1
    window.speechSynthesis.speak(msg)
  } catch(e) { console.log('Speech not available') }
}

// ── Beep sound via Web Audio ──
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, t, dur) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = freq; o.type = 'sine'
      g.gain.setValueAtTime(0.3, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + dur)
    }
    beep(880, 0, 0.14); beep(1100, 0.18, 0.14); beep(880, 0.36, 0.2)
  } catch(e) {}
}

export default function App() {
  const [page,        setPage]        = useState('dashboard')
  const [medicines,   setMedicines]   = useState([])
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [reminderMed, setReminderMed] = useState(null)
  const [isCaretaker, setIsCaretaker] = useState(false)
  const checkedRef = useRef({})
  const snoozeRef  = useRef({})

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false) })
    return () => unsub()
  }, [])

  // ── Load medicines ──
  useEffect(() => {
    if (!user) { setMedicines([]); return }
    const q = query(collection(db, 'medicines'), where('userId', '==', user.uid))
    return onSnapshot(q, snap => setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user])

  // ── Reminder checker every 30s ──
  useEffect(() => {
    const check = () => {
      const now  = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      medicines.forEach(med => {
        if (med.status !== 'pending') return
        // Support multiple times (morning/afternoon/night)
        const times = med.times || (med.time ? [med.time] : [])
        times.forEach(t => {
          if (t !== hhmm) return
          const key    = med.id + '_' + t
          const snooze = snoozeRef.current[key]
          if (snooze && Date.now() < snooze) return
          if (checkedRef.current[key]) return
          checkedRef.current[key] = true
          playBeep()
          speakReminder(med.name)
          setReminderMed({ ...med, dueTime: t })
        })
      })
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [medicines])

  const navigate = p => setPage(p)

  const addMedicine = async med => {
    if (!user) return
    await addDoc(collection(db, 'medicines'), { ...med, userId: user.uid })
  }

  const updateStatus = async (id, status) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    try { await updateDoc(doc(db, 'medicines', id), { status }) } catch(e) { console.error(e) }
  }

  const deleteMedicine = async id => {
    setMedicines(prev => prev.filter(m => m.id !== id))
    try { await deleteDoc(doc(db, 'medicines', id)) } catch(e) { console.error(e) }
  }

  const handleTaken  = async () => {
    if (reminderMed) { await updateStatus(reminderMed.id, 'taken'); setReminderMed(null) }
  }
  const handleSnooze = () => {
    if (reminderMed) {
      snoozeRef.current[reminderMed.id + '_' + reminderMed.dueTime] = Date.now() + 5*60*1000
      setReminderMed(null)
    }
  }
  const handleLogout = async () => { await signOut(auth); setPage('dashboard'); checkedRef.current = {} }

  // ── Loading ──
  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#cce5ff,#daeeff)' }}>
      <div style={{ fontSize:62, marginBottom:16, animation:'hf 3s ease-in-out infinite' }}>💊</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>
        Sewa<span style={{color:'#1a6fff'}}>arthi</span>
      </div>
      <div style={{ fontSize:12, color:'#8ba0c0', marginTop:8 }}>Loading your health data...</div>
      <style>{`@keyframes hf{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}`}</style>
    </div>
  )

  if (!user) return <Login />

  const initials    = (user.displayName || user.email || 'U')[0].toUpperCase()
  const displayName = user.displayName || user.email?.split('@')[0] || 'User'

  return (
    <div className="app-layout">

      {/* ── REMINDER POPUP ── */}
      {reminderMed && (
        <div className="reminder-overlay">
          <div className="reminder-popup">
            <span className="reminder-pill-icon">💊</span>
            <h3>Medicine Time!</h3>
            <p>Don't skip your scheduled dose</p>
            <div className="med-highlight">
              <h4>{reminderMed.name}</h4>
              <p>{reminderMed.dosage} · {reminderMed.foodTiming} food · ⏰ {reminderMed.dueTime}</p>
            </div>
            <div className="reminder-actions">
              <button className="btn-take"   onClick={handleTaken}>✅ Mark Taken</button>
              <button className="btn-snooze" onClick={handleSnooze}>⏰ Snooze 5m</button>
            </div>
            <button onClick={() => speakReminder(reminderMed.name)}
              style={{ marginTop:12, background:'none', border:'1px solid rgba(26,111,255,0.2)', color:'var(--blue)', borderRadius:10, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)', width:'100%' }}>
              🔊 Speak Again
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE HEADER ── */}
      <header className="mobile-header">
        <div className="header-logo">
          <div className="logo-icon">💊</div>
          <h1>Sewa<span>arthi</span></h1>
        </div>
        <div className="header-right">
          <button onClick={() => setIsCaretaker(c => !c)}
            style={{ background: isCaretaker ? 'rgba(0,196,140,0.15)' : 'rgba(26,111,255,0.1)', border: `1px solid ${isCaretaker ? 'rgba(0,196,140,0.3)':'rgba(26,111,255,0.2)'}`, color: isCaretaker ? 'var(--success)':'var(--blue)', padding:'5px 10px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>
            {isCaretaker ? '👨‍⚕️ Caretaker' : '👤 Patient'}
          </button>
          <button onClick={handleLogout}
            style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.22)', color:'#e03355', padding:'5px 10px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>
            Logout
          </button>
          <div className="header-avatar">{initials}</div>
        </div>
      </header>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💊</div>
          <h1>Sewa<span>arthi</span></h1>
        </div>
        <nav className="nav-section">
          <div className="nav-label">Main Menu</div>
          {NAV.map(item => (
            <button key={item.id} className={'nav-item' + (page===item.id&&!isCaretaker?' active':'')}
              onClick={() => { setIsCaretaker(false); navigate(item.id) }}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
          <button className={'nav-item' + (page==='iot'&&!isCaretaker?' active':'')}
            onClick={() => { setIsCaretaker(false); navigate('iot') }}>
            <span className="nav-icon">🔌</span>
            <span className="nav-label">Device</span>
          </button>
          <div className="nav-label" style={{ marginTop:14 }}>Caretaker</div>
          <button className={'nav-item' + (isCaretaker?' active':'')}
            onClick={() => setIsCaretaker(true)}>
            <span className="nav-icon">👨‍⚕️</span>
            <span className="nav-label">Caretaker View</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="header-avatar">{initials}</div>
          <div className="user-info">
            <h4>{displayName}</h4>
            <p onClick={handleLogout}>Logout</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">
        <div key={page + isCaretaker} className="page-enter">
          {isCaretaker ? (
            <CaretakerDashboard medicines={medicines} currentUserName={displayName} />
          ) : (
            <>
              {page==='dashboard' && <Dashboard medicines={medicines} onStatusUpdate={updateStatus} onDelete={deleteMedicine} onNavigate={navigate} user={user} />}
              {page==='add'       && <AddMedicine onAdd={addMedicine} onNavigate={navigate} />}
              {page==='ai'        && <AIAssistant medicines={medicines} />}
              {page==='scanner'   && <PrescriptionScanner onAdd={addMedicine} onNavigate={navigate} />}
              {page==='doctors'   && <DoctorContacts userId={user.uid} />}
              {page==='iot'       && <IoTDevice medicines={medicines} />}
            </>
          )}
        </div>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        {NAV.map(item => (
          <button key={item.id} className={'nav-item' + (page===item.id&&!isCaretaker?' active':'')}
            onClick={() => { setIsCaretaker(false); navigate(item.id) }}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        <button className={'nav-item' + (isCaretaker?' active':'')}
          onClick={() => setIsCaretaker(true)}>
          <span className="nav-icon">👨‍⚕️</span>
          <span className="nav-label">Care</span>
        </button>
      </nav>

    </div>
  )
}