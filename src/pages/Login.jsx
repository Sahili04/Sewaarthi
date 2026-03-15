import { useState } from 'react'
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from '../firebase'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill all fields'); return }
    if (isSignup && !name) { setError('Please enter your name'); return }
    setLoading(true)
    setError('')
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setError('Email already registered. Please login.')
      else if (e.code === 'auth/wrong-password') setError('Wrong password. Try again.')
      else if (e.code === 'auth/user-not-found') setError('No account found. Please sign up.')
      else if (e.code === 'auth/weak-password') setError('Password must be at least 6 characters.')
      else setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError('Google sign in failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #0e7490 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Background circles */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'fixed', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(6,182,212,0.1)' }} />

      <div style={{
        background: '#fff',
        borderRadius: 28,
        padding: '36px 28px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 12px',
            boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
          }}>💊</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: '#1e1b4b' }}>
            ANANT <span style={{ color: '#7c3aed' }}>MediCare</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Your Smart Medicine Reminder
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: 14, padding: 4, marginBottom: 24 }}>
          {['Login', 'Sign Up'].map((tab, i) => (
            <button key={tab} onClick={() => { setIsSignup(i === 1); setError('') }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                borderRadius: 11, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
                background: (i === 1) === isSignup ? '#7c3aed' : 'transparent',
                color: (i === 1) === isSignup ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Form */}
        {isSignup && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b', display: 'block', marginBottom: 6 }}>
              👤 Full Name
            </label>
            <input
              style={{ width: '100%', padding: '13px 15px', borderRadius: 14, border: '2px solid #ede9fe', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b', display: 'block', marginBottom: 6 }}>
            📧 Email
          </label>
          <input
            style={{ width: '100%', padding: '13px 15px', borderRadius: 14, border: '2px solid #ede9fe', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b', display: 'block', marginBottom: 6 }}>
            🔒 Password
          </label>
          <input
            style={{ width: '100%', padding: '13px 15px', borderRadius: 14, border: '2px solid #ede9fe', fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#9f1239', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 14, borderLeft: '4px solid #ef4444' }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 16, border: 'none',
            background: loading ? '#a78bfa' : 'linear-gradient(135deg, #5b21b6, #7c3aed)',
            color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            marginBottom: 12,
          }}>
          {loading ? '⏳ Please wait...' : isSignup ? '🚀 Create Account' : '🔐 Login'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: '#ede9fe' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#ede9fe' }} />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 16,
            border: '2px solid #ede9fe', background: '#fff',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10, color: '#1e1b4b',
          }}>
          <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="G" />
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignup(!isSignup); setError('') }}
            style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}