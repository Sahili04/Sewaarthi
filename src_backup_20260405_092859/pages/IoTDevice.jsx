import { useState } from 'react'

export default function IoTDevice({ medicines }) {
  const [connected,  setConnected]  = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [dispensing, setDispensing] = useState(null)
  const [dispensed,  setDispensed]  = useState([])
  const [log,        setLog]        = useState([])

  const addLog = msg => setLog(prev => [{ t:new Date().toLocaleTimeString(), msg }, ...prev.slice(0,12)])

  const connect = () => {
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false); setConnected(true)
      addLog('✅ ESP32 connected via WiFi')
      addLog('📡 MQTT broker: medimind.local:1883')
      addLog('🔧 Servo MG996R initialized')
      addLog('🕐 RTC DS3231 synced: ' + new Date().toLocaleTimeString())
    }, 2000)
  }

  const dispense = med => {
    if (!connected || dispensing) return
    setDispensing(med.id)
    addLog(`⚙️ Dispensing ${med.name}...`)
    setTimeout(() => {
      addLog(`✅ ${med.name} dispensed!`)
      addLog('🔔 Buzzer triggered — patient notified')
      setDispensed(prev => [...prev, med.id])
      setDispensing(null)
    }, 2500)
  }

  const pending = medicines.filter(m => m.status === 'pending')

  return (
    <>
      <div className="greeting s1">
        <h2>Smart Dispenser 🔌</h2>
        <p>ESP32 IoT pill dispenser simulation</p>
      </div>

      <div className="iot-card s2">
        <span style={{ fontSize:58, display:'block', marginBottom:10 }}>
          {dispensing ? '⚙️' : '🤖'}
        </span>
        <h3>MediMind Dispenser v1.0</h3>
        <p>ESP32 · RTC DS3231 · Servo MG996R · MQTT</p>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <span className={'status-dot ' + (connected?'on':'off')} />
          <span style={{ color: connected?'#4ade80':'rgba(255,255,255,0.5)' }}>
            {connecting ? 'Connecting...' : connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {!connected ? (
          <button className="btn btn-teal btn-full" onClick={connect} disabled={connecting}
            style={{ maxWidth:220, margin:'0 auto', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {connecting ? '⏳ Connecting...' : '🔌 Connect Device'}
          </button>
        ) : (
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button className="btn btn-teal"
              onClick={() => { const next = pending.find(m=>!dispensed.includes(m.id)); if(next) dispense(next) }}
              disabled={!!dispensing || !pending.some(m=>!dispensed.includes(m.id))}
              style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {dispensing ? '⚙️ Dispensing...' : '💊 Dispense Next'}
            </button>
            <button className="btn btn-outline" onClick={() => setConnected(false)}
              style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)' }}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="card s3">
        <div className="section-title" style={{ marginBottom:12 }}>📋 Pending Medicines</div>
        {pending.length === 0 ? (
          <div className="empty">
            <div className="e-icon">✅</div>
            <h3>All caught up!</h3>
            <p>No pending medicines to dispense</p>
          </div>
        ) : pending.map(med => (
          <div className="med-item" key={med.id}>
            <div className="med-icon">💊</div>
            <div className="med-info">
              <div className="med-name">{med.name}</div>
              <div className="med-sub">{med.dosage} · {med.time}</div>
            </div>
            <button className="btn btn-primary" style={{ fontSize:12 }}
              onClick={() => dispense(med)}
              disabled={!connected || !!dispensing || dispensed.includes(med.id)}>
              {dispensed.includes(med.id) ? '✓ Done' : dispensing===med.id ? '⚙️...' : '⚙️ Dispense'}
            </button>
          </div>
        ))}
      </div>

      <div className="card s4">
        <div className="section-title" style={{ marginBottom:10 }}>📟 Device Log</div>
        <div className="log-box">
          {log.length === 0
            ? <span style={{ color:'rgba(255,255,255,0.2)' }}>&gt; Waiting for device connection...</span>
            : log.map((e,i) => (
              <div key={i} style={{ marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,0.25)', marginRight:6 }}>[{e.t}]</span>
                <span style={{ color: i===0 ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>{e.msg}</span>
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
}