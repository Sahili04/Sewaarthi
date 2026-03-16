import { useState, useEffect, useRef } from 'react'
import { db, auth, collection, addDoc, onSnapshot, updateDoc, doc, query, where, signOut, onAuthStateChanged } from './firebase'
import Dashboard from './pages/Dashboard'
import AddMedicine from './pages/AddMedicine'
import AIAssistant from './pages/AIAssistant'
import PrescriptionScanner from './pages/PrescriptionScanner'
import IoTDevice from './pages/IoTDevice'
import Login from './pages/Login'
import './index.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'add', label: 'Add', icon: '➕' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'scanner', label: 'Scan', icon: '📷' },
  { id: 'iot', label: 'Device', icon: '💊' },
]

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523, 659, 784, 659]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.16)
    })
  } catch (e) {}
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [prevPage, setPrevPage] = useState('dashboard')
  const [medicines, setMedicines] = useState([])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [reminderMed, setReminderMed] = useState(null)
  const notifiedRef = useRef(new Set())
  const missedRef = useRef(new Set())

  const navigate = (p) => {
    setPrevPage(page)
    setPage(p)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) { setMedicines([]); return }
    const q = query(collection(db, 'medicines'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      setMedicines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user])

  useEffect(() => {
    if (!medicines.length) return
    const check = () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      medicines.forEach(med => {
        if (med.status !== 'pending') return
        if (med.time === hhmm && !notifiedRef.current.has(med.id)) {
          notifiedRef.current.add(med.id)
          setReminderMed(med)
          playBeep()
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💊 Sewaarth MediCare', {
              body: `Time to take ${med.name} — ${med.dosage}`,
              icon: '/favicon.ico',
              requireInteraction: true
            })
          }
        }
        const [h, m] = med.time.split(':').map(Number)
        const scheduled = new Date()
        scheduled.setHours(h, m, 0, 0)
        const diff = (now - scheduled) / 60000
        if (diff > 15 && diff < 1440 && !missedRef.current.has(med.id)) {
          missedRef.current.add(med.id)
          updateDoc(doc(db, 'medicines', med.id), { status: 'missed' })
        }
      })
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const interval = setInterval(check, 30000)
    check()
    return () => clearInterval(interval)
  }, [medicines])

  const addMedicine = async (med) => {
    if (!user) return
    await addDoc(collection(db, 'medicines'), { ...med, userId: user.uid })
  }

  const updateMedicineStatus = async (id, status) => {
    await updateDoc(doc(db, 'medicines', id), { status })
  }

  const handleTake = async () => {
    if (reminderMed) {
      await updateMedicineStatus(reminderMed.id, 'taken')
      setReminderMed(null)
    }
  }

  const handleSnooze = () => {
    const med = reminderMed
    setReminderMed(null)
    notifiedRef.current.delete(med.id)
    setTimeout(() => { setReminderMed(med); playBeep() }, 5 * 60 * 1000)
  }

  const handleLogout = async () => {
    await signOut(auth)
    setPage('dashboard')
  }

  if (authLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#06080f', fontFamily:'Outfit, sans-serif' }}>
        <style>{`@keyframes pb{from{transform:translateY(0) scale(1)}to{transform:translateY(-8px) scale(1.06)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        <div style={{ animation:'pb 0.9s ease infinite alternate, fadeIn 0.5s ease', fontSize:60, marginBottom:16 }}>💊</div>
        <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:24, fontWeight:800, background:'linear-gradient(90deg,#a78bfa,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:6 }}>
          Sewaarth MediCare
        </div>
        <div style={{ fontSize:13, color:'#4b5563' }}>Loading your health dashboard...</div>
      </div>
    )
  }

  if (!user) return <Login />

  const initials = (user.displayName || user.email || 'U')[0].toUpperCase()

  return (
    <div className="app-layout">

      {/* REMINDER POPUP */}
      {reminderMed && (
        <div className="reminder-overlay" onClick={e => e.target.className === 'reminder-overlay' && setReminderMed(null)}>
          <div className="reminder-popup">
            <span className="reminder-pill-icon">💊</span>
            <h3>Medicine Time!</h3>
            <p>Your scheduled dose is ready</p>
            <div className="med-highlight">
              <h4>{reminderMed.name}</h4>
              <p>{reminderMed.dosage} · {reminderMed.foodTiming} food · ⏰ {reminderMed.time}</p>
            </div>
            <div className="reminder-actions">
              <button className="btn-take" onClick={handleTake}>✅ Mark Taken</button>
              <button className="btn-snooze" onClick={handleSnooze}>⏰ Snooze 5m</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE HEADER */}
      <header className="mobile-header">
        <div className="header-logo">
          <div className="logo-icon">💊</div>
          <h1>Sewaarth <span>MediCare</span></h1>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
          <div className="header-avatar">{initials}</div>
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💊</div>
          <h1>Sewaarth <span>MediCare</span></h1>
        </div>
        <nav className="nav-section">
          <div className="nav-label">Navigation</div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={'nav-item' + (page === item.id ? ' active' : '')} onClick={() => navigate(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="header-avatar">{initials}</div>
          <div className="user-info">
            <h4>{user.displayName || user.email?.split('@')[0] || 'User'}</h4>
            <p onClick={handleLogout}>Logout</p>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <div key={page} className="page-enter">
          {page === 'dashboard' && <Dashboard medicines={medicines} onStatusUpdate={updateMedicineStatus} onNavigate={navigate} user={user} />}
          {page === 'add' && <AddMedicine onAdd={addMedicine} onNavigate={navigate} />}
          {page === 'ai' && <AIAssistant medicines={medicines} />}
          {page === 'scanner' && <PrescriptionScanner onAdd={addMedicine} onNavigate={navigate} />}
          {page === 'iot' && <IoTDevice medicines={medicines} onStatusUpdate={updateMedicineStatus} />}
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={'nav-item' + (page === item.id ? ' active' : '')} onClick={() => navigate(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}