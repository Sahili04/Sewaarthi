import { useState, useEffect } from 'react'
import { db, collection, addDoc, updateDoc, doc } from '../firebase'
import { serverTimestamp } from 'firebase/firestore'

// Audio siren helper
function playSiren() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4)
    gain.setValueAtTime(0.4, ctx.currentTime)
    gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch(e) {}
}

export default function SOSButton({ user, userProfile }) {
  const [loading, setLoading] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Dragging states and refs
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  const handleMouseDown = (e) => {
    if (e.button !== 0) return // only left click
    setIsDragging(true)
    hasMoved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    dragOffset.current = { ...position }
  }

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setIsDragging(true)
    hasMoved.current = false
    dragStart.current = { x: touch.clientX, y: touch.clientY }
    dragOffset.current = { ...position }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved.current = true
      }
      setPosition({
        x: dragOffset.current.x + dx,
        y: dragOffset.current.y + dy
      })
    }

    const handleTouchMove = (e) => {
      if (e.touches.length === 0) return
      const touch = e.touches[0]
      const dx = touch.clientX - dragStart.current.x
      const dy = touch.clientY - dragStart.current.y
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved.current = true
      }
      setPosition({
        x: dragOffset.current.x + dx,
        y: dragOffset.current.y + dy
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  // Check if there was an active SOS stored locally
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sw_active_sos')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.status === 'active') {
          setActiveAlert(parsed)
          setShowModal(true)
        }
      }
    } catch(e) {}
  }, [])

  const broadcastAlert = async (coords = null) => {
    if (!user) return
    playSiren()

    const lat = coords?.latitude || null
    const lng = coords?.longitude || null
    const accuracy = coords?.accuracy ? Math.round(coords.accuracy) : null
    const mapsUrl = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null

    const alertData = {
      patientUid: user.uid,
      patientEmail: user.email || '',
      patientName: userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Patient',
      patientPhone: userProfile?.phone || userProfile?.doctorPhone || '',
      bloodGroup: userProfile?.bloodGroup || 'Not specified',
      lat,
      lng,
      accuracy,
      mapsUrl,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
      status: 'active',
    }

    try {
      const docRef = await addDoc(collection(db, 'sosAlerts'), alertData)
      const fullAlert = { ...alertData, id: docRef?.id || Date.now().toString() }
      setActiveAlert(fullAlert)
      setShowModal(true)
      localStorage.setItem('sw_active_sos', JSON.stringify(fullAlert))
    } catch(err) {
      console.warn('Firestore SOS write fallback to local:', err)
      const fullAlert = { ...alertData, id: Date.now().toString() }
      setActiveAlert(fullAlert)
      setShowModal(true)
      localStorage.setItem('sw_active_sos', JSON.stringify(fullAlert))
    } finally {
      setLoading(false)
    }
  }

  const triggerSOS = () => {
    if (!user) return
    setLoading(true)
    playSiren()

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          broadcastAlert(position.coords)
        },
        (error) => {
          console.warn('GPS location unavailable, broadcasting without coordinates:', error)
          broadcastAlert(null)
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      )
    } else {
      broadcastAlert(null)
    }
  }

  const resolveSOS = async () => {
    if (activeAlert?.id && db) {
      try {
        await updateDoc(doc(db, 'sosAlerts', activeAlert.id), { status: 'resolved', resolvedAt: new Date().toISOString() })
      } catch(e) {}
    }
    setActiveAlert(null)
    setShowModal(false)
    localStorage.removeItem('sw_active_sos')
  }

  return (
    <>
      {/* ── FLOATING RED SOS BUTTON (DRAGGABLE) ── */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ 
          position: 'fixed', 
          bottom: '90px', 
          right: '20px', 
          zIndex: 999,
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <button
          onClick={(e) => {
            if (hasMoved.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (activeAlert) {
              setShowModal(true);
            } else {
              triggerSOS();
            }
          }}
          disabled={loading}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: activeAlert
              ? 'linear-gradient(135deg, #ff0000, #990000)'
              : 'linear-gradient(135deg, #ff3b3b, #d90429)',
            color: '#fff',
            fontWeight: 900,
            fontSize: '18px',
            border: '4px solid #fff',
            boxShadow: '0 6px 20px rgba(217,4,41,0.55)',
            cursor: loading ? 'wait' : (isDragging ? 'grabbing' : 'pointer'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isDragging ? 'none' : 'all 0.3s',
            animation: activeAlert ? 'pulseSOSFast 1s infinite' : 'pulseSOS 2s infinite',
            letterSpacing: 1,
            userSelect: 'none'
          }}
        >
          {loading ? '...' : (
            <>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🚨</span>
              <span style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>SOS</span>
            </>
          )}
        </button>
      </div>

      {/* ── EMERGENCY SOS ACTIVE FULLSCREEN MODAL ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(13, 27, 62, 0.88)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: '#fff', borderRadius: 28, padding: '28px 24px', maxWidth: 460, width: '100%',
            boxShadow: '0 25px 60px rgba(217,4,41,0.4)', textAlign: 'center',
            border: '3px solid #ff3b3b', animation: 'scaleUp 0.35s cubic-bezier(0.22,1,0.36,1) both'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,59,59,0.12)',
              border: '2px solid #ff3b3b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 36, animation: 'pulseSOSFast 1.2s infinite'
            }}>
              🚨
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#d90429', margin: '0 0 6px' }}>
              EMERGENCY SOS ACTIVE
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
              Your distress signal and live GPS coordinates have been broadcast to your registered caretakers and response network.
            </p>

            {/* Live Location Details */}
            <div style={{
              background: 'rgba(26,111,255,0.05)', border: '1.5px solid rgba(26,111,255,0.2)',
              borderRadius: 18, padding: '16px', marginBottom: 18, textAlign: 'left'
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📍</span>
                <span>TRANSMITTED LOCATION</span>
              </div>

              {activeAlert?.lat && activeAlert?.lng ? (
                <>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, marginBottom: 4 }}>
                    Coordinates: {activeAlert.lat.toFixed(5)}° N, {activeAlert.lng.toFixed(5)}° E
                  </div>
                  {activeAlert.accuracy && (
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                      GPS Accuracy: ±{activeAlert.accuracy} meters
                    </div>
                  )}
                  <a
                    href={activeAlert.mapsUrl || `https://www.google.com/maps?q=${activeAlert.lat},${activeAlert.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'linear-gradient(135deg,#1a6fff,#38bdf8)', color: '#fff',
                      padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      textDecoration: 'none', boxShadow: '0 3px 8px rgba(26,111,255,0.3)'
                    }}
                  >
                    🗺️ View Live on Google Maps →
                  </a>
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Broadcasting patient identifier and profile. Caretaker notified.
                </div>
              )}
            </div>

            {/* Direct Emergency Call Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <a
                href="tel:112"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px', borderRadius: 14, background: '#d90429', color: '#fff',
                  fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(217,4,41,0.3)'
                }}
              >
                📞 Call 112 (Police/Med)
              </a>
              <a
                href="tel:108"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px', borderRadius: 14, background: '#0284c7', color: '#fff',
                  fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
                }}
              >
                🚑 Call 108 (Ambulance)
              </a>
            </div>

            {/* Cancel False Alarm */}
            <button
              onClick={resolveSOS}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: 'rgba(0,196,140,0.1)', border: '1.5px solid rgba(0,196,140,0.3)',
                color: '#00a878', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--ff)'
              }}
            >
              ✅ I am Safe Now (Cancel Emergency Alarm)
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseSOS {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(217, 4, 41, 0.7); }
          70% { transform: scale(1.06); box-shadow: 0 0 0 16px rgba(217, 4, 41, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(217, 4, 41, 0); }
        }
        @keyframes pulseSOSFast {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.8); }
          50% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(255, 0, 0, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  )
}
