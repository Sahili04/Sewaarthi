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
import ProfileSetup from './pages/ProfileSetup'
import WaterTracker from './pages/WaterTracker'
import HabitTracker from './pages/HabitTracker'
import Reports from './pages/Reports'
import { translations, voiceLang } from './locales/translations'
import './index.css'

// ── Language helpers ──
function getLang() { return localStorage.getItem('sw_lang') || 'en' }
function setLang(l) { localStorage.setItem('sw_lang', l) }
function t(key, lang) {
  const val = translations[lang]?.[key] ?? translations['en']?.[key] ?? key
  return val
}

// ── Voice reminder ──
function speakReminder(text, lang) {
  try {
    window.speechSynthesis.cancel()
    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = voiceLang[lang] || 'en-IN'
    msg.rate = 0.88; msg.pitch = 1; msg.volume = 1
    window.speechSynthesis.speak(msg)
  } catch(e) { console.log('Speech not available') }
}

// ── Beep sound ──
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, tm, dur) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = freq; o.type = 'sine'
      g.gain.setValueAtTime(0.3, ctx.currentTime + tm)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tm + dur)
      o.start(ctx.currentTime + tm); o.stop(ctx.currentTime + tm + dur)
    }
    beep(880, 0, 0.14); beep(1100, 0.18, 0.14); beep(880, 0.36, 0.2)
  } catch(e) {}
}

// ── Language Selector ──
function LanguageSelector({ lang, onChange }) {
  return (
    <select value={lang} onChange={e => onChange(e.target.value)}
      style={{ background:'rgba(26,111,255,0.08)', border:'1px solid rgba(26,111,255,0.2)', color:'var(--blue)', padding:'5px 8px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)', outline:'none' }}>
      <option value="en">🇬🇧 EN</option>
      <option value="hi">🇮🇳 हिं</option>
      <option value="mr">🇮🇳 मरा</option>
    </select>
  )
}

// ── Logo with image ──
function AppLogo({ size = 36 }) {
  return (
    <img src="/logo.png" alt="Sewarthii"
      style={{ height: size, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(26,111,255,0.25))' }}
      onError={e => { e.target.style.display='none' }}
    />
  )
}

const NAV = [
  { id: 'dashboard', labelKey: 'home',     icon: '🏠' },
  { id: 'add',       labelKey: 'add',      icon: '➕' },
  { id: 'ai',        labelKey: 'ai',       icon: '🤖' },
  { id: 'scanner',   labelKey: 'scan',     icon: '📷' },
  { id: 'doctors',   labelKey: 'doctors',  icon: '🏥' },
  { id: 'water',     labelKey: 'water',    icon: '💧' },
  { id: 'habits',    labelKey: 'habitNav', icon: '🏃' },
  { id: 'reports',   labelKey: 'reports',  icon: '📄' },
]

export default function App() {
  const [page,        setPage]        = useState('dashboard')
  const [medicines,   setMedicines]   = useState([])
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [reminderMed, setReminderMed] = useState(null)
  const [waterAlert,  setWaterAlert]  = useState(null)
  const [isCaretaker, setIsCaretaker] = useState(false)
  const [lang,        setLangState]   = useState(getLang())
  const [userProfile, setUserProfile] = useState(null)
  const [needsProfile,setNeedsProfile]= useState(false)
  const checkedRef = useRef({})
  const snoozeRef  = useRef({})
  const waterSnoozeRef = useRef({})

  const changeLang = (l) => { setLang(l); setLangState(l) }
  const tr = (key) => t(key, lang)

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        // load profile from firestore
        try {
          const { getDoc, doc: fDoc } = await import('firebase/firestore')
          const snap = await getDoc(fDoc(db, 'users', u.uid))
          if (snap.exists()) {
            const data = snap.data()
            setUserProfile(data)
            setNeedsProfile(!data.profileComplete)
          } else {
            setNeedsProfile(true)
          }
        } catch(e) { setNeedsProfile(false) }
      }
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // ── Load medicines ──
  useEffect(() => {
    if (!user) { setMedicines([]); return }
    const q = query(collection(db, 'medicines'), where('userId', '==', user.uid))
    return onSnapshot(q, snap => setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user])

  // ── Medicine reminder checker ──
  useEffect(() => {
    const check = () => {
      const now  = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      medicines.forEach(med => {
        if (med.status !== 'pending') return
        const times = med.times || (med.time ? [med.time] : [])
        times.forEach(tm => {
          if (tm !== hhmm) return
          const key    = med.id + '_' + tm
          const snooze = snoozeRef.current[key]
          if (snooze && Date.now() < snooze) return
          if (checkedRef.current[key]) return
          checkedRef.current[key] = true
          playBeep()
          const msg = typeof tr('medicineTime') === 'function' ? tr('medicineTime')(med.name) : `Time to take ${med.name}`
          speakReminder(msg, lang)
          setReminderMed({ ...med, dueTime: tm })
        })
      })
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [medicines, lang])

  // ── Water reminder checker ──
  useEffect(() => {
    if (!user || !userProfile?.waterReminders) return
    const check = () => {
      const now  = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      ;(userProfile.waterReminders || []).forEach((rem, idx) => {
        if (rem.time !== hhmm) return
        const key = `water_${idx}`
        if (waterSnoozeRef.current[key] && Date.now() < waterSnoozeRef.current[key]) return
        if (checkedRef.current[key]) return
        checkedRef.current[key] = true
        playBeep()
        speakReminder(tr('waterTime'), lang)
        setWaterAlert({ amount: rem.amount || 250, idx })
      })
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [userProfile, lang])

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
      snoozeRef.current[reminderMed.id + '_' + reminderMed.dueTime] = Date.now() + 10*60*1000
      setReminderMed(null)
      // recheck after snooze
      setTimeout(() => { delete checkedRef.current[reminderMed.id + '_' + reminderMed.dueTime] }, 10*60*1000 + 5000)
    }
  }
  const handleWaterDrink = () => setWaterAlert(null)
  const handleWaterSnooze = () => {
    if (waterAlert) {
      waterSnoozeRef.current[`water_${waterAlert.idx}`] = Date.now() + 10*60*1000
      setWaterAlert(null)
    }
  }

  const handleLogout = async () => { await signOut(auth); setPage('dashboard'); checkedRef.current = {} }

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#cce5ff,#daeeff)' }}>
      <AppLogo size={80} />
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0d1b3e', marginTop:12 }}>
        Sewa<span style={{color:'#1a6fff'}}>arthii</span>
      </div>
      <div style={{ fontSize:12, color:'#8ba0c0', marginTop:8 }}>Loading your health data...</div>
    </div>
  )

  if (!user) return <Login lang={lang} onChangeLang={changeLang} />

  if (needsProfile) return (
    <ProfileSetup
      user={user} db={db} lang={lang}
      onComplete={(profile) => { setUserProfile(profile); setNeedsProfile(false) }}
    />
  )

  const initials    = (user.displayName || user.email || 'U')[0].toUpperCase()
  const displayName = user.displayName || user.email?.split('@')[0] || 'User'

  const sharedProps = { lang, tr }

  return (
    <div className="app-layout">

      {/* ── MEDICINE REMINDER POPUP ── */}
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
              <button className="btn-take" onClick={handleTaken}>✅ {tr('taken')}</button>
              <button className="btn-snooze" onClick={handleSnooze}>⏰ {tr('snooze')} 10m</button>
            </div>
            <button onClick={() => {
              const msg = typeof tr('medicineTime') === 'function' ? tr('medicineTime')(reminderMed.name) : `Time to take ${reminderMed.name}`
              speakReminder(msg, lang)
            }}
              style={{ marginTop:12, background:'none', border:'1px solid rgba(26,111,255,0.2)', color:'var(--blue)', borderRadius:10, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)', width:'100%' }}>
              🔊 Speak Again
            </button>
          </div>
        </div>
      )}

      {/* ── WATER ALERT POPUP ── */}
      {waterAlert && (
        <div className="reminder-overlay">
          <div className="reminder-popup">
            <span className="reminder-pill-icon">💧</span>
            <h3>Water Time!</h3>
            <p>Stay hydrated — it's time to drink water</p>
            <div className="med-highlight">
              <h4>💧 {waterAlert.amount}ml</h4>
              <p>Drink a glass of water now</p>
            </div>
            <div className="reminder-actions">
              <button className="btn-take" onClick={handleWaterDrink}>✅ {tr('drinkNow')}</button>
              <button className="btn-snooze" onClick={handleWaterSnooze}>⏰ {tr('snooze')} 10m</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE HEADER ── */}
      <header className="mobile-header">
        <div className="header-logo">
          <AppLogo size={34} />
        </div>
        <div className="header-right">
          <LanguageSelector lang={lang} onChange={changeLang} />
          <button onClick={() => setIsCaretaker(c => !c)}
            style={{ background: isCaretaker ? 'rgba(0,196,140,0.15)' : 'rgba(26,111,255,0.1)', border: `1px solid ${isCaretaker ? 'rgba(0,196,140,0.3)':'rgba(26,111,255,0.2)'}`, color: isCaretaker ? 'var(--success)':'var(--blue)', padding:'5px 10px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>
            {isCaretaker ? `👨‍⚕️ ${tr('caretaker')}` : `👤 ${tr('patient')}`}
          </button>
          <button onClick={handleLogout}
            style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.22)', color:'#e03355', padding:'5px 10px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'var(--ff)' }}>
            {tr('logout')}
          </button>
          <div className="header-avatar">{initials}</div>
        </div>
      </header>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <AppLogo size={42} />
        </div>
        <div style={{ padding:'0 8px 12px', borderBottom:'1px solid rgba(26,111,255,0.1)', marginBottom:8 }}>
          <LanguageSelector lang={lang} onChange={changeLang} />
        </div>
        <nav className="nav-section">
          <div className="nav-label">Main Menu</div>
          {NAV.map(item => (
            <button key={item.id} className={'nav-item' + (page===item.id&&!isCaretaker?' active':'')}
              onClick={() => { setIsCaretaker(false); navigate(item.id) }}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{tr(item.labelKey)}</span>
            </button>
          ))}
          <button className={'nav-item' + (page==='iot'&&!isCaretaker?' active':'')}
            onClick={() => { setIsCaretaker(false); navigate('iot') }}>
            <span className="nav-icon">🔌</span>
            <span className="nav-label">{tr('device')}</span>
          </button>
          <button className={'nav-item' + (page==='profile'&&!isCaretaker?' active':'')}
            onClick={() => { setIsCaretaker(false); navigate('profile') }}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">{tr('profile')}</span>
          </button>
          <div className="nav-label" style={{ marginTop:14 }}>Caretaker</div>
          <button className={'nav-item' + (isCaretaker?' active':'')}
            onClick={() => setIsCaretaker(true)}>
            <span className="nav-icon">👨‍⚕️</span>
            <span className="nav-label">{tr('care')}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="header-avatar">{initials}</div>
          <div className="user-info">
            <h4>{displayName}</h4>
            <p onClick={handleLogout}>{tr('logout')}</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">
        <div key={page + isCaretaker} className="page-enter">
          {isCaretaker ? (
            <CaretakerDashboard medicines={medicines} currentUserName={displayName} user={user} db={db} {...sharedProps} />
          ) : (
            <>
              {page==='dashboard' && <Dashboard medicines={medicines} onStatusUpdate={updateStatus} onDelete={deleteMedicine} onNavigate={navigate} user={user} userProfile={userProfile} {...sharedProps} />}
              {page==='add'       && <AddMedicine onAdd={addMedicine} onNavigate={navigate} {...sharedProps} />}
              {page==='ai'        && <AIAssistant medicines={medicines} {...sharedProps} />}
              {page==='scanner'   && <PrescriptionScanner onAdd={addMedicine} onNavigate={navigate} {...sharedProps} />}
              {page==='doctors'   && <DoctorContacts userId={user.uid} {...sharedProps} />}
              {page==='iot'       && <IoTDevice medicines={medicines} onStatusUpdate={updateStatus} {...sharedProps} />}
              {page==='water'     && <WaterTracker user={user} db={db} userProfile={userProfile} lang={lang} speakReminder={speakReminder} {...sharedProps} />}
              {page==='habits'    && <HabitTracker user={user} db={db} {...sharedProps} />}
              {page==='reports'   && <Reports user={user} db={db} medicines={medicines} userProfile={userProfile} {...sharedProps} />}
              {page==='profile'   && <ProfileSetup user={user} db={db} lang={lang} inline onComplete={(p) => setUserProfile(p)} />}
            </>
          )}
        </div>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        {NAV.slice(0,5).map(item => (
          <button key={item.id} className={'nav-item' + (page===item.id&&!isCaretaker?' active':'')}
            onClick={() => { setIsCaretaker(false); navigate(item.id) }}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{tr(item.labelKey)}</span>
          </button>
        ))}
        <button className={'nav-item' + (isCaretaker?' active':'')}
          onClick={() => setIsCaretaker(true)}>
          <span className="nav-icon">👨‍⚕️</span>
          <span className="nav-label">{tr('care')}</span>
        </button>
      </nav>

    </div>
  )
}