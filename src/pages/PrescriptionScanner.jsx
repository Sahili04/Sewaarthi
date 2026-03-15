import { useState, useRef } from 'react'

const DEMO = [
  { name: 'Paracetamol', dosage: '1 tablet (500mg)', time: '08:00', foodTiming: 'after', duration: 5 },
  { name: 'Amoxicillin', dosage: '1 capsule (250mg)', time: '14:00', foodTiming: 'after', duration: 7 },
  { name: 'Metformin', dosage: '1 tablet (500mg)', time: '20:00', foodTiming: 'with', duration: 30 },
]

export default function PrescriptionScanner({ onAdd, onNavigate }) {
  const [step, setStep] = useState('upload')
  const [preview, setPreview] = useState(null)
  const [extracted, setExtracted] = useState([])
  const [selected, setSelected] = useState([])
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      setStep('scanning')
      setTimeout(() => {
        setExtracted(DEMO)
        setSelected(DEMO.map((_, i) => i))
        setStep('result')
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const toggle = (i) => setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])

  const addAll = () => {
    selected.forEach(i => onAdd({ id: Date.now().toString() + i, ...extracted[i], status: 'pending', createdAt: new Date().toISOString() }))
    setStep('done')
  }

  return (
    <>
      <div className="greeting">
        <h2>Scan Prescription 📷</h2>
        <p>Upload a photo to extract medicines automatically</p>
      </div>

      {step === 'upload' && (
        <div className="upload-zone" onClick={() => fileRef.current.click()}>
          <div className="upload-icon">📷</div>
          <h3>Upload Prescription</h3>
          <p>Tap to choose a photo or PDF</p>
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
            📁 Choose File
          </button>
        </div>
      )}

      {step === 'scanning' && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)' }}>Scanning...</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Extracting medicine details</div>
          <div style={{ marginTop: 16, height: 6, background: '#dbeafe', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '80%', background: 'var(--blue)', borderRadius: 3, transition: 'width 2s ease' }} />
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">✅ Extracted Medicines</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{selected.length} selected</span>
          </div>
          {extracted.map((med, i) => (
            <div key={i} className={'med-item'} onClick={() => toggle(i)}
              style={{ cursor: 'pointer', background: selected.includes(i) ? '#dbeafe' : 'transparent', borderRadius: 12, padding: '10px 8px' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: selected.includes(i) ? 'var(--blue)' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: selected.includes(i) ? '#fff' : 'var(--blue)', fontWeight: 700, flexShrink: 0 }}>
                {selected.includes(i) ? '✓' : i + 1}
              </div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-sub">{med.dosage} · {med.time} · {med.foodTiming} food</div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={addAll} disabled={selected.length === 0}>
            ✅ Add {selected.length} Medicine{selected.length !== 1 ? 's' : ''} to Schedule
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="alert success">
          <span style={{ fontSize: 22 }}>🎉</span>
          <div>
            <strong>Medicines Added!</strong>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn btn-success" onClick={() => onNavigate('dashboard')}>View Dashboard</button>
              <button className="btn btn-outline" onClick={() => { setStep('upload'); setPreview(null) }}>Scan Another</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}