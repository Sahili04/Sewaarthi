import { useState } from 'react'
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from '../firebase'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const errMsg = code => ({
    'auth/email-already-in-use': 'Email already registered — please log in.',
    'auth/wrong-password':        'Wrong password. Try again.',
    'auth/invalid-credential':    'Wrong email or password.',
    'auth/user-not-found':        'No account found — please sign up.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Invalid email address.',
    'auth/popup-closed-by-user':  'Google sign-in was cancelled.',
    'auth/popup-blocked':         'Popup blocked. Please allow popups for this site.',
  }[code] || 'Something went wrong. Please try again.')

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      isSignup
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch(e) { setError(errMsg(e.code)) }
    finally    { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await signInWithPopup(auth, googleProvider) }
    catch(e) { setError(errMsg(e.code)) }
    finally  { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Same animated background as main app */}
      <div style={{ position:'fixed', inset:0, zIndex:0,
        background: `
          radial-gradient(ellipse 80% 60% at 5% 0%, rgba(131,184,247,0.7) 0%, transparent 55%),
          radial-gradient(ellipse 55% 45% at 95% 10%, rgba(41,121,255,0.3) 0%, transparent 55%),
          radial-gradient(ellipse 45% 35% at 50% 100%, rgba(90,159,255,0.25) 0%, transparent 60%),
          linear-gradient(160deg, #cce5ff 0%, #daeeff 35%, #eaf4ff 65%, #d4e8ff 100%)`
      }} />

      {/* Floating orbs */}
      <div style={{ position:'fixed', inset:0, zIndex:0,
        background: `radial-gradient(circle 300px at 12% 20%, rgba(120,170,255,0.35), transparent),
                     radial-gradient(circle 200px at 88% 72%, rgba(41,121,255,0.2), transparent)`,
        animation: 'orbFloat 14s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 32, padding: '40px 30px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(26,111,255,0.18), 0 0 0 1px rgba(255,255,255,0.5)',
        position: 'relative', zIndex: 1,
        animation: 'pageIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:2,
          background:'linear-gradient(90deg, transparent, #1a6fff, #60a5fa, transparent)',
          borderRadius:2 }} />

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <div style={{
            width:68, height:68,
            background:'linear-gradient(135deg,#1a6fff,#60a5fa)',
            borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:34, margin:'0 auto 14px',
            boxShadow:'0 8px 24px rgba(26,111,255,0.35)',
            animation:'heroFloat 3s ease-in-out infinite',
          }}>💊</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#0d1b3e' }}>
            Sewa<span style={{color:'#1a6fff'}}>arthi</span>
          </div>
          <div style={{ fontSize:12, color:'#8ba0c0', marginTop:5 }}>Your Smart Medicine Companion</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'rgba(26,111,255,0.06)', borderRadius:14, padding:4, marginBottom:26, border:'1px solid rgba(26,111,255,0.12)' }}>
          {['Login','Sign Up'].map((tab,i) => (
            <button key={tab} onClick={() => { setIsSignup(i===1); setError('') }}
              style={{
                flex:1, padding:'11px 0', border:'none', cursor:'pointer',
                borderRadius:11, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14,
                background: (i===1)===isSignup ? 'linear-gradient(135deg,#1a6fff,#4a90e2)' : 'transparent',
                color: (i===1)===isSignup ? '#fff' : '#8ba0c0',
                transition:'all 0.22s',
                boxShadow: (i===1)===isSignup ? '0 4px 14px rgba(26,111,255,0.3)' : 'none',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Email */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#3a5080', display:'block', marginBottom:6 }}>📧 Email Address</label>
          <input
            style={{ width:'100%', padding:'14px 16px', borderRadius:13, border:'1.5px solid rgba(26,111,255,0.18)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:'#0d1b3e', background:'rgba(255,255,255,0.82)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,box-shadow 0.2s' }}
            placeholder="you@example.com" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={e => { e.target.style.borderColor='#1a6fff'; e.target.style.boxShadow='0 0 0 4px rgba(26,111,255,0.1)' }}
            onBlur={e  => { e.target.style.borderColor='rgba(26,111,255,0.18)'; e.target.style.boxShadow='none' }}
            onKeyDown={e => e.key==='Enter' && handleSubmit()}
          />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#3a5080', display:'block', marginBottom:6 }}>🔒 Password</label>
          <input
            style={{ width:'100%', padding:'14px 16px', borderRadius:13, border:'1.5px solid rgba(26,111,255,0.18)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:'#0d1b3e', background:'rgba(255,255,255,0.82)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,box-shadow 0.2s' }}
            placeholder="Minimum 6 characters" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={e => { e.target.style.borderColor='#1a6fff'; e.target.style.boxShadow='0 0 0 4px rgba(26,111,255,0.1)' }}
            onBlur={e  => { e.target.style.borderColor='rgba(26,111,255,0.18)'; e.target.style.boxShadow='none' }}
            onKeyDown={e => e.key==='Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <div style={{ background:'rgba(255,77,106,0.08)', border:'1px solid rgba(255,77,106,0.25)', color:'#c0392b', padding:'11px 14px', borderRadius:12, fontSize:13, fontWeight:600, marginBottom:16 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'15px', borderRadius:15, border:'none',
            background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1a6fff,#4a90e2)',
            color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:15,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow:'0 6px 20px rgba(26,111,255,0.35)', marginBottom:14,
            transition:'all 0.22s',
          }}>
          {loading ? '⏳ Please wait...' : isSignup ? '🚀 Create Account' : '🔐 Login'}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 14px' }}>
          <div style={{ flex:1, height:1, background:'rgba(26,111,255,0.12)' }} />
          <span style={{ fontSize:11, color:'#8ba0c0', fontWeight:600 }}>OR</span>
          <div style={{ flex:1, height:1, background:'rgba(26,111,255,0.12)' }} />
        </div>

        <button onClick={handleGoogle} disabled={loading}
          style={{ width:'100%', padding:'14px', borderRadius:14,
            border:'1.5px solid rgba(26,111,255,0.18)', background:'rgba(255,255,255,0.9)',
            fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            gap:10, color:'#0d1b3e', transition:'all 0.22s',
            boxShadow:'0 2px 8px rgba(26,111,255,0.08)',
          }}
          onMouseOver={e => { e.currentTarget.style.background='rgba(255,255,255,1)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(26,111,255,0.14)' }}
          onMouseOut={e  => { e.currentTarget.style.background='rgba(255,255,255,0.9)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(26,111,255,0.08)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#EA4335" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#4285F4" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.86v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.51 10.53A4.82 4.82 0 014.26 9c0-.53.09-1.04.25-1.53V5.4H1.86A8 8 0 001 9c0 1.3.31 2.52.86 3.6l2.65-2.07z"/>
            <path fill="#34A853" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.86 5.4l2.65 2.07c.63-1.89 2.4-3.29 4.47-3.29z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign:'center', marginTop:18, fontSize:12, color:'#8ba0c0' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignup(!isSignup); setError('') }}
            style={{ background:'none', border:'none', color:'#1a6fff', fontWeight:700, cursor:'pointer', fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        @keyframes pageIn { from{opacity:0;transform:translateY(24px) scale(0.983);}to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes heroFloat { 0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-12px) rotate(2deg);} }
        @keyframes orbFloat { 0%{transform:translate(0,0) scale(1);}50%{transform:translate(10px,-15px) scale(1.02);}100%{transform:translate(-8px,8px) scale(0.98);} }
      `}</style>
    </div>
  )
}