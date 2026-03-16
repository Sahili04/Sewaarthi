import { useState } from 'react'
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from '../firebase'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill all fields'); return }
    setLoading(true); setError('')
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Email already registered. Please login.',
        'auth/wrong-password': 'Wrong password.',
        'auth/user-not-found': 'No account found. Please sign up.',
        'auth/weak-password': 'Password needs 6+ characters.',
        'auth/invalid-email': 'Invalid email.',
        'auth/invalid-credential': 'Wrong email or password.',
        'auth/too-many-requests': 'Too many attempts. Try later.',
      }
      setError(msgs[e.code] || e.message)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (e.code === 'auth/popup-blocked') {
        setError('Popup blocked! Allow popups for this site in browser settings.')
      } else if (e.code === 'auth/popup-closed-by-user') {
        setError('')
      } else {
        setError('Google sign in failed. Try email login instead.')
      }
    } finally { setLoading(false) }
  }

  const inp = {
    width:'100%', padding:'13px 15px', borderRadius:12,
    border:'1.5px solid #1a2035', fontFamily:'Outfit, sans-serif',
    fontSize:14, outline:'none', boxSizing:'border-box',
    background:'#0d1017', color:'#eef2ff', transition:'border-color 0.2s',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#06080f', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Outfit, sans-serif', position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
        @keyframes floatA{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(4deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-14px) rotate(-4deg)}}
        @keyframes glow{0%,100%{opacity:0.3}50%{opacity:0.7}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #0d1017 inset !important;-webkit-text-fill-color:#eef2ff !important;}
      `}</style>

      {/* Floating bg elements */}
      <div style={{ position:'fixed', top:'8%', left:'6%', fontSize:56, opacity:0.07, animation:'floatA 7s ease infinite', pointerEvents:'none' }}>💊</div>
      <div style={{ position:'fixed', bottom:'12%', right:'6%', fontSize:72, opacity:0.05, animation:'floatB 9s ease infinite', pointerEvents:'none' }}>🩺</div>
      <div style={{ position:'fixed', top:'50%', left:'3%', fontSize:44, opacity:0.05, animation:'floatA 6s ease infinite 1s', pointerEvents:'none' }}>🧬</div>
      <div style={{ position:'fixed', top:'20%', right:'5%', fontSize:38, opacity:0.05, animation:'floatB 5s ease infinite 2s', pointerEvents:'none' }}>⚕️</div>
      <div style={{ position:'fixed', bottom:'30%', left:'8%', fontSize:32, opacity:0.04, animation:'floatA 8s ease infinite 0.5s', pointerEvents:'none' }}>💉</div>

      {/* Glow orbs */}
      <div style={{ position:'fixed', top:'15%', left:'25%', width:400, height:400, background:'radial-gradient(circle,rgba(124,58,237,0.07),transparent 70%)', borderRadius:'50%', animation:'glow 5s ease infinite', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'15%', right:'20%', width:300, height:300, background:'radial-gradient(circle,rgba(6,182,212,0.05),transparent 70%)', borderRadius:'50%', animation:'glow 6s ease infinite 1.5s', pointerEvents:'none' }} />

      {/* Card */}
      <div style={{ background:'rgba(13,16,23,0.95)', border:'1px solid rgba(124,58,237,0.2)', backdropFilter:'blur(20px)', borderRadius:28, padding:'36px 28px', width:'100%', maxWidth:400, boxShadow:'0 0 80px rgba(124,58,237,0.1),0 24px 60px rgba(0,0,0,0.6)', position:'relative', zIndex:1, animation:'slideUp 0.4s ease' }}>

        {/* top glow */}
        <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.8),rgba(6,182,212,0.6),transparent)' }} />

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:68, height:68, background:'linear-gradient(135deg,#7c3aed,#06b6d4)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, margin:'0 auto 14px', boxShadow:'0 0 30px rgba(124,58,237,0.5)', animation:'floatB 3s ease infinite' }}>💊</div>
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:22, fontWeight:800, color:'#eef2ff', marginBottom:4 }}>
            Sewaarth <span style={{ background:'linear-gradient(90deg,#a78bfa,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>MediCare</span>
          </div>
          <div style={{ fontSize:12, color:'#4b5563' }}>Smart Medicine Reminder System</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:14, padding:4, marginBottom:24, border:'1px solid rgba(255,255,255,0.06)' }}>
          {['Login','Sign Up'].map((tab,i) => (
            <button key={tab} onClick={() => { setIsSignup(i===1); setError('') }}
              style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', borderRadius:11, fontFamily:'Outfit, sans-serif', fontWeight:700, fontSize:14, background:(i===1)===isSignup ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'transparent', color:(i===1)===isSignup ? '#fff' : '#4b5563', transition:'all 0.2s', boxShadow:(i===1)===isSignup ? '0 4px 14px rgba(124,58,237,0.3)' : 'none' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Email */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#94a3b8', display:'block', marginBottom:6 }}>📧 Email</label>
          <input style={inp} placeholder="your@email.com" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e => e.target.style.borderColor='#1a2035'}
            onKeyDown={e => e.key==='Enter' && handleSubmit()}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:error ? 14 : 20 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#94a3b8', display:'block', marginBottom:6 }}>🔒 Password</label>
          <input style={inp} placeholder={isSignup ? 'Min 6 characters' : 'Your password'} type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e => e.target.style.borderColor='#1a2035'}
            onKeyDown={e => e.key==='Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <div style={{ background:'rgba(244,63,94,0.1)', color:'#fb7185', padding:'10px 14px', borderRadius:12, fontSize:13, fontWeight:600, marginBottom:14, border:'1px solid rgba(244,63,94,0.2)', display:'flex', gap:8, alignItems:'flex-start' }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:14, borderRadius:14, border:'none', background:loading ? '#374151' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff', fontFamily:'Outfit, sans-serif', fontWeight:700, fontSize:15, cursor:loading ? 'not-allowed' : 'pointer', boxShadow:loading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)', marginBottom:12, transition:'all 0.2s' }}>
          {loading ? '⏳ Please wait...' : isSignup ? '🚀 Create Account' : '🔐 Login'}
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 12px' }}>
          <div style={{ flex:1, height:1, background:'#1a2035' }} />
          <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>OR</span>
          <div style={{ flex:1, height:1, background:'#1a2035' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width:'100%', padding:13, borderRadius:14, border:'1.5px solid #1a2035', background:'#0d1017', fontFamily:'Outfit, sans-serif', fontWeight:700, fontSize:14, cursor:loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#94a3b8', transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.color='#eef2ff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#1a2035'; e.currentTarget.style.color='#94a3b8' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign:'center', marginTop:18, fontSize:12, color:'#374151' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignup(!isSignup); setError('') }}
            style={{ background:'none', border:'none', color:'#a78bfa', fontWeight:700, cursor:'pointer', fontSize:12, fontFamily:'Outfit, sans-serif' }}>
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}