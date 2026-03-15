import { useState, useEffect } from 'react'
import { db, auth, collection, addDoc, onSnapshot, updateDoc, doc, query, where, signOut, onAuthStateChanged } from './firebase'
import Dashboard from './pages/Dashboard'
import AddMedicine from './pages/AddMedicine'
import AIAssistant from './pages/AIAssistant'
import PrescriptionScanner from './pages/PrescriptionScanner'
import IoTDevice from './pages/IoTDevice'
import ReminderSystem from './components/ReminderSystem'
import Login from './pages/Login'
import './index.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'add', label: 'Add', icon: '➕' },
  { id: 'ai', label: 'AI Chat', icon: '🤖' },
  { id: 'scanner', label: 'Scan', icon: '📷' },
  { id: 'iot', label: 'Device', icon: '💊' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [medicines, setMedicines] = useState([])
  const [reminder, setReminder] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // Load medicines for this user only
  useEffect(() => {
    if (!user) { setMedicines([]); return }
    const q = query(collection(db, 'medicines'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      setMedicines(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user])

  const addMedicine = async (med) => {
    if (!user) return
    await addDoc(collection(db, 'medicines'), { ...med, userId: user.uid })
  }

  const updateMedicineStatus = async (id, status) => {
    await updateDoc(doc(db, 'medicines', id), { status })
  }

  const handleLogout = async () => {
    await signOut(auth)
    setPage('dashboard')
  }

  // Loading screen
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b0764, #4c1d95)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>💊</div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>ANANT MediCare</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>Loading...</div>
      </div>
    )
  }

  // Show login if not logged in
  if (!user) return <Login />

  return (
    <div className="app-layout">

      {/* MOBILE HEADER */}
      <header className="mobile-header">
        <div className="header-logo">
          <div className="logo-icon">💊</div>
          <h1>ANANT <span>MediCare</span></h1>
        </div>
        <div className="header-right">
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            Logout
          </button>
          <div className="header-avatar">
            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💊</div>
          <h1>ANANT <span>MediCare</span></h1>
        </div>
        <nav className="nav-section">
          <div className="nav-label">Main Menu</div>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={'nav-item' + (page === item.id ? ' active' : '')}
              onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="header-avatar">
            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <div className="user-info">
            <h4>{user.displayName || 'User'}</h4>
            <p style={{ cursor: 'pointer', color: '#f87171' }} onClick={handleLogout}>Logout</p>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {reminder && (
          <div className="toast">
            <h4>⏰ Medication Reminder</h4>
            <p>Time to take: <strong>{reminder}</strong></p>
            <button onClick={() => setReminder(null)}
              style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Dismiss
            </button>
          </div>
        )}
        <ReminderSystem medicines={medicines} onReminder={setReminder} onMissed={updateMedicineStatus} />
        {page === 'dashboard' && <Dashboard medicines={medicines} onStatusUpdate={updateMedicineStatus} onNavigate={setPage} user={user} />}
        {page === 'add' && <AddMedicine onAdd={addMedicine} onNavigate={setPage} />}
        {page === 'ai' && <AIAssistant medicines={medicines} />}
        {page === 'scanner' && <PrescriptionScanner onAdd={addMedicine} onNavigate={setPage} />}
        {page === 'iot' && <IoTDevice medicines={medicines} />}
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            className={'nav-item' + (page === item.id ? ' active' : '')}
            onClick={() => setPage(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}
