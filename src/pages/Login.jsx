import { useState, useEffect } from 'react'
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from '../firebase'
import { translations } from '../locales/translations'

function AppLogo({ size = 68 }) {
  return (
    <img src="/logo.png" alt="Sewarthii"
      style={{ height: size, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(26,111,255,0.3))' }}
      onError={e => { e.target.replaceWith(Object.assign(document.createElement('div'), { textContent:'💊', style:'font-size:'+size+'px' })) }}
    />
  )
}

const LANGS = [
  { code:'en', label:'🇬🇧 English' },
  { code:'hi', label:'🇮🇳 हिंदी' },
  { code:'mr', label:'🇮🇳 मराठी' },
]

export default function Login({ lang = 'en', onChangeLang }) {
  const [isSignup,       setIsSignup]       = useState(false)
  const [role,           setRole]           = useState('patient')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)
  // Forgot password state
  const [showForgot,     setShowForgot]     = useState(false)
  const [forgotEmail,    setForgotEmail]    = useState('')
  const [forgotLoading,  setForgotLoading]  = useState(false)
  const [forgotMsg,      setForgotMsg]      = useState('')
  const [forgotError,    setForgotError]    = useState('')

  const tr = translations[lang] || translations['en']
  const t = (key, fallback) => tr[key] || fallback || key

  const errMsg = (code, message) => ({
    'auth/email-already-in-use':   'Email already registered — please log in.',
    'auth/wrong-password':          'Wrong password. Try again.',
    'auth/invalid-credential':      'Wrong email or password.',
    'auth/user-not-found':          'No account found with this email — please sign up.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-email':           'Invalid email address.',
    'auth/popup-closed-by-user':    'Google sign-in was closed before completing.',
    'auth/cancelled-popup-request': 'Sign-in cancelled due to multiple clicks. Please try once.',
    'auth/popup-blocked':           `Popup was blocked by your browser. Please allow popups for ${window.location.hostname}.`,
    'auth/operation-not-allowed':   'Google Sign-In is not enabled in Firebase Console (Authentication > Sign-in method).',
    'auth/unauthorized-domain':     `Domain "${window.location.hostname}" is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.`,
    'auth/network-request-failed':  'Network connection failed. Please check your internet connection.',
  }[code] || message || `Sign-in error (${code || 'unknown'}). Please try again.`)

  useEffect(() => {
    // Check if returning from redirect sign-in
    import('firebase/auth').then(({ getRedirectResult }) => {
      getRedirectResult(auth).then(cred => {
        if (cred?.user) {
          const currentRole = localStorage.getItem('sw_active_role') || role
          persistUserRole(cred.user.uid, cred.user.email, cred.user.displayName, currentRole)
        }
      }).catch(e => {
        if (e.code) setError(errMsg(e.code, e.message))
      })
    }).catch(() => {})
  }, [])

  const persistUserRole = async (uid, emailAddr, displayName, chosenRole) => {
    try {
      const profileData = {
        role: chosenRole,
        email: (emailAddr || '').toLowerCase(),
        displayName: displayName || (emailAddr || '').split('@')[0],
      }
      if (chosenRole === 'caretaker') {
        profileData.profileComplete = true
      }
      const existing = localStorage.getItem('sw_profile_' + uid)
      if (existing) {
        try {
          const parsed = JSON.parse(existing)
          localStorage.setItem('sw_profile_' + uid, JSON.stringify({ ...parsed, ...profileData }))
        } catch(e) {}
      }
      const { getFirestore, doc, setDoc } = await import('firebase/firestore')
      const { getApp } = await import('firebase/app')
      const fdb = getFirestore(getApp())
      await setDoc(doc(fdb, 'users', uid), profileData, { merge: true })
    } catch(e) { console.error('Error saving role to DB:', e) }
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const normalizedEmail = email.trim().toLowerCase()
    localStorage.setItem('sw_active_role', role)
    localStorage.setItem('sw_pending_role_' + normalizedEmail, role)
    try {
      let cred
      if (isSignup) {
        cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await persistUserRole(cred.user.uid, cred.user.email, cred.user.displayName, role)
      } else {
        cred = await signInWithEmailAndPassword(auth, email.trim(), password)
        await persistUserRole(cred.user.uid, cred.user.email, cred.user.displayName, role)
      }
    } catch(e) {
      localStorage.removeItem('sw_active_role')
      localStorage.removeItem('sw_pending_role_' + normalizedEmail)
      setError(errMsg(e.code, e.message))
    }
    finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    localStorage.setItem('sw_active_role', role)
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      const cred = await signInWithPopup(auth, googleProvider)
      if (cred?.user) {
        const normalizedEmail = cred.user.email?.toLowerCase() || ''
        localStorage.setItem('sw_pending_role_' + normalizedEmail, role)
        await persistUserRole(cred.user.uid, cred.user.email, cred.user.displayName, role)
      }
    }
    catch(e) {
      console.error('Google Sign-In Error:', e)
      if (e.code === 'auth/popup-blocked') {
        // Fallback to redirect sign-in if popup is blocked
        try {
          const { signInWithRedirect } = await import('firebase/auth')
          localStorage.setItem('sw_active_role', role)
          await signInWithRedirect(auth, googleProvider)
          return
        } catch(re) {
          setError(errMsg(re.code, re.message))
        }
      } else {
        localStorage.removeItem('sw_active_role')
        setError(errMsg(e.code, e.message))
      }
    }
    finally { setLoading(false) }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return }
    setForgotLoading(true); setForgotError(''); setForgotMsg('')
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(auth, forgotEmail.trim())
      setForgotMsg('✅ Reset link sent! Check your Gmail inbox (and spam folder).')
      setForgotEmail('')
    } catch(e) {
      const msgs = {
        'auth/user-not-found':        'No account found with this email.',
        'auth/invalid-email':         'Invalid email address.',
        'auth/too-many-requests':     'Too many requests. Please wait a few minutes.',
        'auth/network-request-failed':'Network error. Please check your connection.',
      }
      setForgotError(msgs[e.code] || e.message || 'Failed to send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Animated background */}
      <div style={{ position:'fixed', inset:0, zIndex:0,
        background: `
          radial-gradient(ellipse 80% 60% at 5% 0%, rgba(131,184,247,0.7) 0%, transparent 55%),
          radial-gradient(ellipse 55% 45% at 95% 10%, rgba(41,121,255,0.3) 0%, transparent 55%),
          radial-gradient(ellipse 45% 35% at 50% 100%, rgba(90,159,255,0.25) 0%, transparent 60%),
          linear-gradient(160deg, #cce5ff 0%, #daeeff 35%, #eaf4ff 65%, #d4e8ff 100%)`
      }} />
      <div style={{ position:'fixed', inset:0, zIndex:0,
        background: `radial-gradient(circle 300px at 12% 20%, rgba(120,170,255,0.35), transparent),
                     radial-gradient(circle 200px at 88% 72%, rgba(41,121,255,0.2), transparent)`,
        animation: 'orbFloat 14s ease-in-out infinite alternate', pointerEvents: 'none',
      }} />

      {/* Language selector */}
      <div style={{ position:'fixed', top:16, right:20, zIndex:10 }}>
        <select value={lang} onChange={e => onChangeLang?.(e.target.value)}
          style={{ background:'rgba(255,255,255,0.85)', border:'1.5px solid rgba(26,111,255,0.2)', color:'#1a6fff', padding:'6px 10px', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none' }}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 32, padding: '40px 30px', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(26,111,255,0.18), 0 0 0 1px rgba(255,255,255,0.5)',
        position: 'relative', zIndex: 1, animation: 'pageIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:2,
          background:'linear-gradient(90deg, transparent, #1a6fff, #60a5fa, transparent)', borderRadius:2 }} />

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <AppLogo size={150} />
          <div style={{ fontSize:12, color:'#8ba0c0', marginTop:4 }}>{t('tagline','Your Smart Medicine Companion')}</div>
        </div>

        {/* ── FORGOT PASSWORD PANEL ── */}
        {showForgot ? (
          <div style={{ animation:'pageIn 0.35s ease' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🔑</div>
              <div style={{ fontWeight:800, fontSize:18, color:'#0d1b3e' }}>Reset Password</div>
              <div style={{ fontSize:12, color:'#8ba0c0', marginTop:4 }}>
                Enter your Gmail/email — we'll send a reset link instantly.
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#3a5080', display:'block', marginBottom:6 }}>📧 Email Address</label>
              <input
                style={{ width:'100%', padding:'14px 16px', borderRadius:13, border:'1.5px solid rgba(26,111,255,0.18)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:'#0d1b3e', background:'rgba(255,255,255,0.82)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,box-shadow 0.2s' }}
                placeholder="your@gmail.com" type="email" value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                onFocus={e => { e.target.style.borderColor='#1a6fff'; e.target.style.boxShadow='0 0 0 4px rgba(26,111,255,0.1)' }}
                onBlur={e  => { e.target.style.borderColor='rgba(26,111,255,0.18)'; e.target.style.boxShadow='none' }}
                onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
              />
            </div>

            {forgotError && (
              <div style={{ background:'rgba(255,77,106,0.08)', border:'1px solid rgba(255,77,106,0.25)', color:'#c0392b', padding:'11px 14px', borderRadius:12, fontSize:13, fontWeight:600, marginBottom:14, lineHeight:1.4 }}>
                ⚠️ {forgotError}
              </div>
            )}
            {forgotMsg && (
              <div style={{ background:'rgba(0,196,140,0.08)', border:'1px solid rgba(0,196,140,0.3)', color:'#059669', padding:'11px 14px', borderRadius:12, fontSize:13, fontWeight:600, marginBottom:14, lineHeight:1.4 }}>
                {forgotMsg}
              </div>
            )}

            <button onClick={handleForgotPassword} disabled={forgotLoading}
              style={{ width:'100%', padding:'14px', borderRadius:14, border:'none',
                background: forgotLoading ? '#93c5fd' : 'linear-gradient(135deg,#1a6fff,#4a90e2)',
                color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14,
                cursor: forgotLoading ? 'not-allowed' : 'pointer',
                boxShadow:'0 6px 20px rgba(26,111,255,0.3)', marginBottom:12, transition:'all 0.22s',
              }}>
              {forgotLoading ? '⏳ Sending...' : '📧 Send Reset Link to Gmail'}
            </button>
            <button onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotError(''); setForgotEmail('') }}
              style={{ width:'100%', padding:'12px', borderRadius:13, border:'1.5px solid rgba(26,111,255,0.2)', background:'transparent', color:'#1a6fff', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s' }}>
              ← Back to Login
            </button>
          </div>
        ) : (
          <>
            {/* Role selector */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#3a5080', marginBottom:8 }}>
                {isSignup ? t('signupAs','Choose your account type') : t('loginAs','Select your account type')}:
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {['patient','caretaker'].map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{
                      flex:1, padding:'12px 10px', border: role===r ? '2.5px solid #1a6fff' : '1.5px solid rgba(26,111,255,0.18)',
                      borderRadius:14, background: role===r ? 'rgba(26,111,255,0.1)' : 'rgba(255,255,255,0.6)',
                      color: role===r ? '#1a6fff' : '#8ba0c0', fontWeight:800, fontSize:13,
                      cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'all 0.2s',
                      boxShadow: role===r ? '0 4px 14px rgba(26,111,255,0.2)' : 'none'
                    }}>
                    {r === 'patient' ? `🧑‍⚕️ ${t('patient','Patient')}` : `👨‍⚕️ ${t('caretaker','Caretaker')}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', background:'rgba(26,111,255,0.06)', borderRadius:14, padding:4, marginBottom:22, border:'1px solid rgba(26,111,255,0.12)' }}>
              {[t('login','Login'), t('signup','Sign Up')].map((tab,i) => (
                <button key={tab} onClick={() => { setIsSignup(i===1); setError('') }}
                  style={{
                    flex:1, padding:'11px 0', border:'none', cursor:'pointer',
                    borderRadius:11, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14,
                    background: (i===1)===isSignup ? 'linear-gradient(135deg,#1a6fff,#4a90e2)' : 'transparent',
                    color: (i===1)===isSignup ? '#fff' : '#8ba0c0', transition:'all 0.22s',
                    boxShadow: (i===1)===isSignup ? '0 4px 14px rgba(26,111,255,0.3)' : 'none',
                  }}>{tab}</button>
              ))}
            </div>

            {/* Email */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#3a5080', display:'block', marginBottom:6 }}>📧 {t('email','Email Address')}</label>
              <input
                style={{ width:'100%', padding:'14px 16px', borderRadius:13, border:'1.5px solid rgba(26,111,255,0.18)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:'#0d1b3e', background:'rgba(255,255,255,0.82)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,box-shadow 0.2s' }}
                placeholder="you@example.com" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => { e.target.style.borderColor='#1a6fff'; e.target.style.boxShadow='0 0 0 4px rgba(26,111,255,0.1)' }}
                onBlur={e  => { e.target.style.borderColor='rgba(26,111,255,0.18)'; e.target.style.boxShadow='none' }}
                onKeyDown={e => e.key==='Enter' && handleSubmit()}
              />
            </div>

            <div style={{ marginBottom:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#3a5080', display:'block', marginBottom:6 }}>🔒 {t('password','Password')}</label>
              <input
                style={{ width:'100%', padding:'14px 16px', borderRadius:13, border:'1.5px solid rgba(26,111,255,0.18)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:'#0d1b3e', background:'rgba(255,255,255,0.82)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,box-shadow 0.2s' }}
                placeholder="Minimum 6 characters" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={e => { e.target.style.borderColor='#1a6fff'; e.target.style.boxShadow='0 0 0 4px rgba(26,111,255,0.1)' }}
                onBlur={e  => { e.target.style.borderColor='rgba(26,111,255,0.18)'; e.target.style.boxShadow='none' }}
                onKeyDown={e => e.key==='Enter' && handleSubmit()}
              />
            </div>

            {/* Forgot Password link — only shown on login, not signup */}
            {!isSignup && (
              <div style={{ textAlign:'right', marginBottom:16 }}>
                <button onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMsg(''); setForgotError('') }}
                  style={{ background:'none', border:'none', color:'#1a6fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", textDecoration:'underline', padding:0 }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div style={{ background:'rgba(255,77,106,0.08)', border:'1px solid rgba(255,77,106,0.25)', color:'#c0392b', padding:'11px 14px', borderRadius:12, fontSize:13, fontWeight:600, marginBottom:16, lineHeight:1.4 }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width:'100%', padding:'15px', borderRadius:15, border:'none',
                background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1a6fff,#4a90e2)',
                color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow:'0 6px 20px rgba(26,111,255,0.35)', marginBottom:14, transition:'all 0.22s',
              }}>
              {loading ? '⏳ Please wait...' : isSignup ? `🚀 ${t('signup','Sign Up')}` : `🔐 ${t('login','Login')}`}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(26,111,255,0.12)' }} />
              <span style={{ fontSize:12, color:'#8ba0c0', fontWeight:600 }}>OR</span>
              <div style={{ flex:1, height:1, background:'rgba(26,111,255,0.12)' }} />
            </div>

            <button onClick={handleGoogle} disabled={loading}
              style={{ width:'100%', padding:'13px', borderRadius:14,
                border:'1.5px solid rgba(26,111,255,0.18)', background:'rgba(255,255,255,0.85)',
                color:'#0d1b3e', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all 0.2s',
              }}>
              <span>🌐</span> {t('continueGoogle','Continue with Google')}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pageIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes orbFloat { 0% { transform: scale(1); } 100% { transform: scale(1.15) translate(20px, -20px); } }
      `}</style>
    </div>
  )
}