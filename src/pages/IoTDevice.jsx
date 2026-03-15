import { useState } from 'react'

export default function IoTDevice({ medicines }) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [dispensing, setDispensing] = useState(false)
  const [dispensed, setDispensed] = useState([])
  const [log, setLog] = useState([])

  const addLog = (msg) => setLog(prev => [{ t: new Date().toLocaleTimeString(), msg }, ...prev.slice(0, 9)])

  const connect = () => {
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
      addLog('✅ ESP32 connected via WiFi')
      addLog('📡 MQTT broker: medimind.local:1883')
      addLog('🔧 Servo motor initialized')
      addLog('🕐 RTC synced: ' + new Date().toLocaleTimeString())
    }, 2000)
  }

  const dispense = (med) => {
    if (!connected || dispensing) return
    setDispensing(true)
    addLog('⚙️ Dispensing ' + med.name + '...')
    setTimeout(() => {
      addLog('✅ ' + med.name + ' dispensed!')
      addLog('🔔 Buzzer triggered')
      setDispensed(prev => [...prev, med.id])
      setDispensing(false)
    }, 2000)
  }

  const pending = medicines.filter(m => m.status === 'pending')

  return (
    <>
      <div className="greeting">
        <h2>Smart Dispenser 💊</h2>
        <p>ESP32 IoT pill dispenser simulation</p>
      </div>

      <div className="iot-card">
        <span style={{ fontSize: 48, display: 'block', marginBottom: 8 }}>
          {dispensing ? '⚙️' : '🤖'}
        </span>
        <h3>MediMind Dispenser v1.0</h3>
        <p>ESP32 · RTC DS3231 · Servo MG996R</p>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <span className={'status-dot ' + (connected ? 'on' : 'off')} />
          {connecting ? 'Connecting...' : connected ? 'Connected' : 'Not Connected'}
        </div>
        {!connected ? (
          <button className="btn btn-teal btn-full" onClick={connect} disabled={connecting} style={{ fontFamily: 'Inter, sans-serif' }}>
            {connecting ? '⏳ Connecting...' : '🔌 Connect Device'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-teal" onClick={() => pending.length > 0 && dispense(pending[0])} disabled={dispensing || pending.length === 0} style={{ fontFamily: 'Inter, sans-serif' }}>
              {dispensing ? '⚙️ Dispensing...' : '💊 Dispense Next'}
            </button>
            <button className="btn btn-outline" onClick={() => setConnected(false)} style={{ fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: 12 }}>📋 Pending Medicines</div>
        {pending.length === 0 ? (
          <div className="empty">
            <div className="e-icon">✅</div>
            <h3>All done!</h3>
          </div>
        ) : (
          pending.map(med => (
            <div className="med-item" key={med.id}>
              <div className="med-icon">💊</div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.time}</div>
              </div>
              <button className="btn btn-primary"
                onClick={() => dispense(med)}
                disabled={!connected || dispensing || dispensed.includes(med.id)}
                style={{ fontSize: 12 }}>
                {dispensed.includes(med.id) ? '✓ Done' : '⚙️ Dispense'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: 10 }}>📟 Device Log</div>
        <div className="log-box">
          {log.length === 0
            ? <span style={{ color: '#475569' }}>&gt; Waiting for connection...</span>
            : log.map((e, i) => (
              <div key={i} style={{ color: i === 0 ? '#34d399' : '#475569', marginBottom: 3 }}>
                <span style={{ color: '#334155', marginRight: 6 }}>[{e.t}]</span>{e.msg}
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
}