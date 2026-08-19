import { useState, useEffect, useRef } from 'react'
import { db, auth, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, where, signOut, onAuthStateChanged } from './firebase'
import Dashboard from './pages/Dashboard'
import AddMedicine from './pages/AddMedicine'
import AIAssistant from './pages/AIAssistant.jsx'
import PrescriptionScanner from './pages/PrescriptionScanner'
import IoTDevice from './pages/IoTDevice'
import CaretakerDashboard from './pages/Caretakerdashboard'
import DoctorContacts from './pages/DoctorContacts'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import WaterTracker from './pages/Watertracker'
import HabitTracker from './pages/Habittracker'
import Reports from './pages/Reports'
import SeedData from './pages/SeedData'
import SOSButton from './components/SOSButton'
import { translations, voiceLang } from './locales/translations'
import './index.css'

// ── Language helpers ──
function getLang() { return localStorage.getItem('sw_lang') || 'en' }
function setLang(l) { localStorage.setItem('sw_lang', l) }
function t(key, lang) {
  const val = translations[lang]?.[key] ?? translations['en']?.[key] ?? key
  return val
}

// ── Pre-init AudioContext on user interaction ──
let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)() } catch(e) {}
  }
  return _audioCtx
}
document.addEventListener('click', () => getAudioCtx(), { once: true })

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
    const ctx = getAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
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

// ── Browser Notification ──
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}
function showBrowserNotif(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, { body, icon: '/logo.png', badge: '/logo.png', requireInteraction: true })
    n.onclick = () => { window.focus(); n.close() }
  }
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

// ── Logo ──
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
  const [userRole,    setUserRole]    = useState('patient')
  const checkedRef = useRef({})
  const snoozeRef  = useRef({})
  const waterSnoozeRef = useRef({})

  const changeLang = (l) => { setLang(l); setLangState(l) }
  const tr = (key) => t(key, lang)

  // Request notification permission
  useEffect(() => { requestNotifPermission() }, [])

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        // Read explicit role selected on login screen or stored for this user
        const activeRole = localStorage.getItem('sw_active_role')
        const emailRole = u.email ? localStorage.getItem('sw_pending_role_' + u.email.toLowerCase()) : null
        const storedUserRole = localStorage.getItem('sw_role_' + u.uid)
        const emailName = (u.email || '').toLowerCase()
        const isEmailCaretaker = emailName.includes('caretaker') || emailName.includes('caretacker')
        const explicitRole = activeRole || emailRole || storedUserRole || (isEmailCaretaker ? 'caretaker' : null)

        let currentRole = explicitRole || 'patient'
        let profileComplete = currentRole === 'caretaker'

        // 1. Immediately read cached profile from localStorage
        try {
          const cached = localStorage.getItem('sw_profile_' + u.uid)
          if (cached) {
            const parsed = JSON.parse(cached)
            setUserProfile(parsed)
            if (!explicitRole && parsed.role) {
              currentRole = parsed.role
            }
            if (currentRole === 'caretaker') {
              profileComplete = true
            } else {
              profileComplete = !!parsed.profileComplete || (!!parsed.weight && !!parsed.height)
            }
          }
        } catch(e) {}

        // 2. Fetch fresh user data from Firestore
        try {
          const { getDoc, doc: fDoc, setDoc: fSetDoc } = await import('firebase/firestore')
          const snap = await getDoc(fDoc(db, 'users', u.uid))
          if (snap.exists()) {
            const data = snap.data()
            if (!explicitRole && data.role) {
              currentRole = data.role
            }
            const updatedProfile = { ...data, role: currentRole }
            if (currentRole === 'caretaker') {
              updatedProfile.profileComplete = true
            }
            setUserProfile(updatedProfile)
            localStorage.setItem('sw_profile_' + u.uid, JSON.stringify(updatedProfile))
            if (currentRole === 'caretaker') {
              profileComplete = true
            } else {
              profileComplete = !!data.profileComplete || (!!data.weight && !!data.height)
            }
          }

          // If an explicit role was detected/chosen, make sure Firestore has it synced
          if (explicitRole) {
            await fSetDoc(fDoc(db, 'users', u.uid), {
              role: explicitRole,
              email: u.email ? u.email.toLowerCase() : '',
              displayName: u.displayName || (u.email ? u.email.split('@')[0] : 'User'),
              ...(explicitRole === 'caretaker' ? { profileComplete: true } : {})
            }, { merge: true })
          }
        } catch(e) {
          console.warn('Firestore user fetch failed:', e)
        }

        // Clean up pending login flags
        localStorage.removeItem('sw_active_role')
        if (u.email) {
          localStorage.removeItem('sw_pending_role_' + u.email.toLowerCase())
        }

        setUserRole(currentRole)
        if (currentRole === 'caretaker') {
          setNeedsProfile(false)
        } else {
          setNeedsProfile(!profileComplete)
        }
      } else {
        setUserProfile(null)
        setUserRole('patient')
        setNeedsProfile(false)
      }
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // ── Helper to load/save local medicines ──
  const loadLocalMedicines = (uid) => {
    try {
      const data = localStorage.getItem('sw_meds_' + uid)
      return data ? JSON.parse(data) : []
    } catch(e) { return [] }
  }

  const saveLocalMedicines = (uid, meds) => {
    try {
      localStorage.setItem('sw_meds_' + uid, JSON.stringify(meds))
    } catch(e) {}
  }

  // ── Load medicines ──
  useEffect(() => {
    if (!user) { setMedicines([]); return }
    // 1. Instantly load from local storage cache
    const local = loadLocalMedicines(user.uid)
    if (local && local.length > 0) {
      setMedicines(local)
    }
    // 2. Subscribe to Firestore with fallback
    try {
      const q = query(collection(db, 'medicines'), where('userId', '==', user.uid))
      const unsub = onSnapshot(q, snap => {
        const firestoreMeds = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (firestoreMeds.length > 0 || local.length === 0) {
          setMedicines(firestoreMeds)
          saveLocalMedicines(user.uid, firestoreMeds)
        }
      }, err => {
        console.warn('Firestore onSnapshot error, using local medicines cache:', err)
      })
      return () => unsub()
    } catch(e) {
      console.warn('Firestore query error:', e)
    }
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
          const msgFn = translations[lang]?.medicineTime || translations['en'].medicineTime
          const msg = typeof msgFn === 'function' ? msgFn(med.name) : `Time to take ${med.name}`
          speakReminder(msg, lang)
          setReminderMed({ ...med, dueTime: tm })
          // Browser notification for background tabs
          showBrowserNotif(tr('medicineTimeTitle') || 'Medicine Time!', msg)
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
        const waterMsg = translations[lang]?.waterTime || translations['en'].waterTime
        speakReminder(waterMsg, lang)
        setWaterAlert({ amount: rem.amount || 250, idx })
        showBrowserNotif(tr('waterTimeTitle') || 'Water Time!', waterMsg)
      })
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [userProfile, lang])

  const navigate = p => setPage(p)

  const addMedicine = async med => {
    if (!user) return
    const medWithUser = {
      ...med,
      id: med.id || Date.now().toString(),
      userId: user.uid
    }
    // Optimistic local state and storage
    setMedicines(prev => {
      const exists = prev.some(m => m.id === medWithUser.id || (m.name === medWithUser.name && m.time === medWithUser.time))
      const updated = exists ? prev.map(m => (m.id === medWithUser.id || (m.name === medWithUser.name && m.time === medWithUser.time)) ? medWithUser : m) : [medWithUser, ...prev]
      saveLocalMedicines(user.uid, updated)
      return updated
    })

    // Background Firestore persist
    try {
      const docRef = await addDoc(collection(db, 'medicines'), medWithUser)
      if (docRef?.id) {
        setMedicines(prev => {
          const updated = prev.map(m => m.id === medWithUser.id ? { ...m, id: docRef.id } : m)
          saveLocalMedicines(user.uid, updated)
          return updated
        })
      }
    } catch(e) {
      console.warn('Firestore addDoc failed, persisted locally:', e)
    }
  }

  const updateStatus = async (id, status) => {
    setMedicines(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, status } : m)
      if (user) saveLocalMedicines(user.uid, updated)
      return updated
    })
    try { await updateDoc(doc(db, 'medicines', id), { status }) } catch(e) {
      console.warn('Firestore updateDoc failed, status updated locally:', e)
    }
  }

  const deleteMedicine = async id => {
    setMedicines(prev => {
      const updated = prev.filter(m => m.id !== id)
      if (user) saveLocalMedicines(user.uid, updated)
      return updated
    })
    try { await deleteDoc(doc(db, 'medicines', id)) } catch(e) {
      console.warn('Firestore deleteDoc failed, deleted locally:', e)
    }
  }

  const addWaterIntake = async (ml) => {
    if (!user) return 0
    const today = new Date().toISOString().split('T')[0]
    const localW = Number(localStorage.getItem('sw_water_' + user.uid + '_' + today) || 0)
    const newTotal = localW + ml
    localStorage.setItem('sw_water_' + user.uid + '_' + today, newTotal.toString())
    const waterGoal = parseFloat(userProfile?.waterGoalLiters || 2.5) * 1000
    const waterScore = Math.min(Math.round((newTotal / waterGoal) * 100), 100)
    localStorage.setItem('sw_water_score_' + user.uid + '_' + today, waterScore.toString())

    try {
      if (db) {
        await setDoc(doc(db, 'users', user.uid, 'waterIntake', today), { totalMl: newTotal, date: today }, { merge: true })
        await setDoc(doc(db, 'users', user.uid, 'dailyHealth', today), { waterScore, date: today }, { merge: true })
      }
    } catch(e) {
      console.warn('Firestore water sync failed, saved locally:', e)
    }
    return newTotal
  }

  const handleTaken  = async () => {
    if (reminderMed) { await updateStatus(reminderMed.id, 'taken'); setReminderMed(null) }
  }
  const handleSnooze = () => {
    if (reminderMed) {
      snoozeRef.current[reminderMed.id + '_' + reminderMed.dueTime] = Date.now() + 10*60*1000
      setReminderMed(null)
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

  const handleLogout = async () => {
    try {
      if (user) {
        localStorage.removeItem('sw_profile_' + user.uid)
      }
      localStorage.removeItem('sw_active_role')
    } catch(e) {}
    setUserRole('patient')
    await signOut(auth)
    setPage('dashboard')
    checkedRef.current = {}
  }

  // Hidden seed route — accessible at /?seed=1
  if (new URLSearchParams(window.location.search).get('seed') === '1' && user) {
    return <SeedData user={user} db={db} />
  }

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#cce5ff,#daeeff)' }}>
      <AppLogo size={100} />
      <div style={{ fontSize:12, color:'#8ba0c0', marginTop:8 }}>{tr('tagline') || 'Loading your health data...'}</div>
    </div>
  )

  if (!user) return <Login lang={lang} onChangeLang={changeLang} />

  if (needsProfile) return (
    <ProfileSetup
      user={user} db={db} lang={lang} tr={tr}
      onComplete={(profile) => { setUserProfile(profile); setNeedsProfile(false) }}
    />
  )

  const initials    = (user.displayName || user.email || 'U')[0].toUpperCase()
  const displayName = user.displayName || user.email?.split('@')[0] || 'User'

  const sharedProps = { lang, tr }

  const handleToggleRole = async (targetRole) => {
    if (!user) return
    const newRole = targetRole || (userRole === 'caretaker' ? 'patient' : 'caretaker')
    setUserRole(newRole)
    if (newRole === 'caretaker') {
      setNeedsProfile(false)
    }
    try {
      const { doc: fDoc, setDoc: fSetDoc } = await import('firebase/firestore')
      await fSetDoc(fDoc(db, 'users', user.uid), { role: newRole, profileComplete: true }, { merge: true })
      const cached = localStorage.getItem('sw_profile_' + user.uid)
      const prof = cached ? JSON.parse(cached) : {}
      prof.role = newRole
      prof.profileComplete = true
      localStorage.setItem('sw_profile_' + user.uid, JSON.stringify(prof))
    } catch(e) {
      console.error('Error toggling role:', e)
    }
  }

  // ── CARETAKER ACCOUNT: dedicated full-page experience, no patient nav ──
  if (userRole === 'caretaker') {
    return (
      <CaretakerDashboard
        user={user} db={db} tr={tr} lang={lang}
        currentUserName={displayName}
        isFullPage={true}
        initials={initials}
        changeLang={changeLang}
        onLogout={handleLogout}
        onToggleRole={handleToggleRole}
      />
    )
  }

  return (
    <div className="app-layout">

      {/* ── MEDICINE REMINDER POPUP ── */}
      {reminderMed && (
        <div className="reminder-overlay">
          <div className="reminder-popup">
            <span className="reminder-pill-icon">💊</span>
            <h3>{tr('medicineTimeTitle')}</h3>
            <p>{tr('dontSkip')}</p>
            <div className="med-highlight">
              <h4>{reminderMed.name}</h4>
              <p>{reminderMed.dosage} · {reminderMed.foodTiming} food · ⏰ {reminderMed.dueTime}</p>
            </div>
            <div className="reminder-actions">
              <button className="btn-take" onClick={handleTaken}>✅ {tr('taken')}</button>
              <button className="btn-snooze" onClick={handleSnooze}>⏰ {tr('snooze')} 10m</button>
            </div>
            <button onClick={() => {
              const msgFn = translations[lang]?.medicineTime || translations['en'].medicineTime
              const msg = typeof msgFn === 'function' ? msgFn(reminderMed.name) : `Time to take ${reminderMed.name}`
              speakReminder(msg, lang)
            }}
              style={{ marginTop:12, background:'none', border:'1px solid rgba(26,111,255,0.2)', color:'var(--blue)', borderRadius:10, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)', width:'100%' }}>
              🔊 {tr('speakAgain')}
            </button>
          </div>
        </div>
      )}

      {/* ── WATER ALERT POPUP ── */}
      {waterAlert && (
        <div className="reminder-overlay">
          <div className="reminder-popup">
            <span className="reminder-pill-icon">💧</span>
            <h3>{tr('waterTimeTitle')}</h3>
            <p>{tr('stayHydrated')}</p>
            <div className="med-highlight">
              <h4>💧 {waterAlert.amount}ml</h4>
              <p>{tr('drinkGlass')}</p>
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
        <div style={{ padding:'0 8px 12px', borderBottom:'1px solid rgba(26,111,255,0.1)', marginBottom:8, flexShrink:0 }}>
          <LanguageSelector lang={lang} onChange={changeLang} />
        </div>
        <nav className="nav-section">
          <div className="nav-label">{tr('mainMenu')}</div>
          {NAV.map(item => (
            <button key={item.id} className={'nav-item' + (page===item.id?' active':'')}
              onClick={() => navigate(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{tr(item.labelKey)}</span>
            </button>
          ))}
          <button className={'nav-item' + (page==='iot'?' active':'')}
            onClick={() => navigate('iot')}>
            <span className="nav-icon">🔌</span>
            <span className="nav-label">{tr('device')}</span>
          </button>
          <button className={'nav-item' + (page==='profile'?' active':'')}
            onClick={() => navigate('profile')}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">{tr('healthBmi')}</span>
          </button>
          <div className="nav-label" style={{ marginTop:14 }}>{tr('caretaker')}</div>
          <button className={'nav-item' + (page==='care'?' active':'')}
            onClick={() => navigate('care')}>
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
        <div key={page} className="page-enter">
          {page==='dashboard' && <Dashboard medicines={medicines} onStatusUpdate={updateStatus} onDelete={deleteMedicine} onNavigate={navigate} user={user} userProfile={userProfile} db={db} {...sharedProps} />}
          {page==='add'       && <AddMedicine onAdd={addMedicine} onNavigate={navigate} {...sharedProps} />}
          {page==='ai'        && <AIAssistant medicines={medicines} onAddMedicine={addMedicine} onUpdateStatus={updateStatus} onAddWater={addWaterIntake} onNavigate={navigate} user={user} userProfile={userProfile} {...sharedProps} />}
          {page==='scanner'   && <PrescriptionScanner onAdd={addMedicine} onNavigate={navigate} {...sharedProps} />}
          {page==='doctors'   && <DoctorContacts userId={user.uid} {...sharedProps} />}
          {page==='iot'       && <IoTDevice medicines={medicines} onStatusUpdate={updateStatus} {...sharedProps} />}
          {page==='water'     && <WaterTracker user={user} db={db} userProfile={userProfile} lang={lang} speakReminder={speakReminder} onAddWater={addWaterIntake} {...sharedProps} />}
          {page==='habits'    && <HabitTracker user={user} db={db} {...sharedProps} />}
          {page==='reports'   && <Reports user={user} db={db} medicines={medicines} userProfile={userProfile} {...sharedProps} />}
          {page==='profile'   && <ProfileSetup user={user} db={db} lang={lang} tr={tr} inline onComplete={(p) => setUserProfile(p)} />}
          {page==='care'      && <CaretakerDashboard medicines={medicines} currentUserName={displayName} user={user} db={db} isFullPage={false} onToggleRole={handleToggleRole} {...sharedProps} />}
          <SOSButton user={user} userProfile={userProfile} />
        </div>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        {NAV.slice(0,5).map(item => (
          <button key={item.id} className={'nav-item' + (page===item.id?' active':'')}
            onClick={() => navigate(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{tr(item.labelKey)}</span>
          </button>
        ))}
        <button className={'nav-item' + (page==='care'?' active':'')}
          onClick={() => navigate('care')}>
          <span className="nav-icon">👨‍⚕️</span>
          <span className="nav-label">{tr('care')}</span>
        </button>
      </nav>

    </div>
  )
}