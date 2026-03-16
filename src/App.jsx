import { useState, useEffect, useRef } from 'react'
import { db, auth, collection, addDoc, onSnapshot, updateDoc, doc, query, where, signOut, onAuthStateChanged } from './firebase'
import Dashboard from './pages/Dashboard'
import AddMedicine from './pages/AddMedicine'
import AIAssistant from './pages/AIAssistant'
import PrescriptionScanner from './pages/PrescriptionScanner'
import IoTDevice from './pages/IoTDevice'
import Login from './pages/Login'
import './index.css'

const NAV = [
  { id: 'dashboard', label: 'Home',    icon: '🏠' },
  { id: 'add',       label: 'Add',     icon: '➕' },
  { id: 'ai',        label: 'AI Chat', icon: '🤖' },
  { id: 'scanner',   label: 'Scan',    icon: '📷' },
  { id: 'iot',       label: 'Device',  icon: '💊' },
]

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, t, dur) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = freq; o.type = 'sine'
      g.gain.setValueAtTime(0.28, ctx.currentTime + t)
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
  const checkedRef = useRef({})
  const snoozeRef  = useRef({})

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false) })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) { setMedicines([]); return }
    const q = query(collection(db, 'medicines'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q,
      snap => setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => console.error('Firestore error:', err)
    )
    return () => unsub()
  }, [user])

  useEffect(() => {
    const check = () => {
      const now  = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      medicines.forEach(med => {
        if (med.status !== 'pending' || med.time !== hhmm) return
        const key    = med.id + '_' + hhmm
        const snooze = snoozeRef.current[med.id]
        if (snooze && Date.now() < snooze) return
        if (checkedRef.current[key]) return
        checkedRef.current[key] = true
        playBeep(); setReminderMed(med)
      })
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [medicines])

  // ─────────────────────────────────────────────
  //  THE CRITICAL FUNCTION — update Firestore doc
  // ─────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    // 1. Immediately update local state so UI responds instantly
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m))
    // 2. Persist to Firestore
    try {
      await updateDoc(doc(db, 'medicines', id), { status: newStatus })
    } catch(e) {
      console.error('Firestore update failed:', e)
      // if Firestore fails, local state is already updated — UI still works
    }
  }

  const addMedicine = async (med) => {
    if (!user) return
    try {
      await addDoc(collection(db, 'medicines'), { ...med, userId: user.uid })
    } catch(e) {
      console.error('Add medicine failed:', e)
      alert('Failed to save: ' + e.message)
    }
  }

  const handleTaken  = async () => { if (reminderMed) { await updateStatus(reminderMed.id, 'taken'); setReminderMed(null) } }
  const handleSnooze = ()       => { if (reminderMed) { snoozeRef.current[reminderMed.id] = Date.now() + 5*60*1000; setReminderMed(null) } }
  const handleLogout = async () => { await signOut(auth); setPage('dashboard'); checkedRef.current = {} }

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#cce5ff,#daeeff)' }}>
      <div style={{ fontSize:62, marginBottom:16, animation:'hf 3s ease-in-out infinite' }}>💊</div>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e' }}>
        Sewa<span style={{color:'#1a6fff'}}>arthi</span>
      </div>
      <style>{`@keyframes hf{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}`}</style>
    </div>
  )

  if (!user) return <Login />

  const initials    = (user.displayName || user.email || 'U')[0].toUpperCase()
  const displayName = user.displayName || user.email?.split('@')[0] || 'User'

  return (
    <div className="app-layout">

      {reminderMed && (
        <div className="reminder-overlay">
          <div className="reminder-popup">
            <span className="reminder-pill-icon">💊</span>
            <h3>Medicine Time!</h3>
            <p>Don't skip your scheduled dose</p>
            <div className="med-highlight">
              <h4>{reminderMed.name}</h4>
              <p>{reminderMed.dosage} · {reminderMed.foodTiming} food · ⏰ {reminderMed.time}</p>
            </div>
            <div className="reminder-actions">
              <button className="btn-take"   onClick={handleTaken}>✅ Mark Taken</button>
              <button className="btn-snooze" onClick={handleSnooze}>⏰ Snooze 5m</button>
            </div>
          </div>
        </div>
      )}

      <header className="mobile-header">
        <div className="header-logo">
          <div className="logo-icon">💊</div>
          <h1>Sewa<span>arthi</span></h1>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.22)', color:'#e03355', padding:'5px 11px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
            Logout
          </button>
          <div className="header-avatar">{initials}</div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💊</div>
          <h1>Sewa<span>arthi</span></h1>
        </div>
        <nav className="nav-section">
          <div className="nav-label">Main Menu</div>
          {NAV.map(item => (
            <button key={item.id} className={'nav-item' + (page===item.id?' active':'')} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="header-avatar">{initials}</div>
          <div className="user-info">
            <h4>{displayName}</h4>
            <p onClick={handleLogout}>Logout</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div key={page} className="page-enter">
          {page === 'dashboard' && (
            <Dashboard
              medicines={medicines}
              onStatusUpdate={updateStatus}
              onNavigate={setPage}
              user={user}
            />
          )}
          {page === 'add'     && <AddMedicine onAdd={addMedicine} onNavigate={setPage} />}
          {page === 'ai'      && <AIAssistant medicines={medicines} />}
          {page === 'scanner' && <PrescriptionScanner onAdd={addMedicine} onNavigate={setPage} />}
          {page === 'iot'     && <IoTDevice medicines={medicines} />}
        </div>
      </main>

      <nav className="bottom-nav">
        {NAV.map(item => (
          <button key={item.id} className={'nav-item' + (page===item.id?' active':'')} onClick={() => setPage(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}