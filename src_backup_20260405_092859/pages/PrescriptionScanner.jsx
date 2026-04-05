import { useState, useRef } from 'react'

// ── Default medicines always shown after scanning ──
const DEFAULT_MEDICINES = [
  {
    name:       'Paracetamol',
    dosage:     '1 tablet (500mg)',
    time:       '08:00',
    foodTiming: 'after',
    duration:   5,
    notes:      'Take with warm water',
  },
  {
    name:       'Amoxicillin',
    dosage:     '1 capsule (250mg)',
    time:       '13:00',
    foodTiming: 'after',
    duration:   7,
    notes:      'Complete the full course',
  },
  {
    name:       'Metformin',
    dosage:     '1 tablet (500mg)',
    time:       '21:00',
    foodTiming: 'with',
    duration:   30,
    notes:      'Monitor blood sugar regularly',
  },
  {
    name:       'Vitamin D3',
    dosage:     '1 tablet (60000 IU)',
    time:       '09:00',
    foodTiming: 'after',
    duration:   30,
    notes:      'Take once weekly',
  },
]

export default function PrescriptionScanner({ onAdd, onNavigate }) {
  const [step,      setStep]      = useState('upload')
  const [preview,   setPreview]   = useState(null)
  const [extracted, setExtracted] = useState([])
  const [selected,  setSelected]  = useState([])
  const [saving,    setSaving]    = useState(false)
  const fileRef = useRef()

  const handleFile = file => {
    if (!file) return
    // Show preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // Go to scanning animation
    setStep('scanning')

    // After 2 seconds show default medicines
    setTimeout(() => {
      setExtracted(DEFAULT_MEDICINES)
      setSelected(DEFAULT_MEDICINES.map((_, i) => i)) // all selected by default
      setStep('review')
    }, 2000)
  }

  const toggleSelect = i =>
    setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])

  const updateField = (i, field, val) =>
    setExtracted(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const handleSave = async () => {
    const toSave = extracted.filter((_, i) => selected.includes(i))
    if (!toSave.length) { alert('Please select at least one medicine.'); return }
    setSaving(true)
    try {
      for (const m of toSave) {
        await onAdd({
          id:        Date.now().toString() + Math.random().toString(36).slice(2),
          ...m,
          times:     [m.time],
          duration:  Number(m.duration) || 7,
          status:    'pending',
          createdAt: new Date().toISOString(),
        })
      }
      setStep('done')
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const reset = () => {
    setStep('upload'); setPreview(null)
    setExtracted([]); setSelected([])
  }

  return (
    <>
      <style>{`
        @keyframes scanLine { 0%{top:0;opacity:1;}100%{top:100%;opacity:0.2;} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes rowIn    { from{opacity:0;transform:translateX(-14px);}to{opacity:1;transform:translateX(0);} }
        .row-in { animation: rowIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes heroFloat { 0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);} }
        @keyframes scanProg  { from{width:0;}to{width:90%;} }
      `}</style>

      <div className="greeting s1">
        <h2>Prescription Scanner 📷</h2>
        <p>Upload your prescription to load medicines</p>
      </div>

      {/* UPLOAD */}
      {step === 'upload' && (
        <div className="s2">
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <div className="upload-icon">📷</div>
            <h3>Upload Prescription</h3>
            <p>Take a photo of your doctor's prescription</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            <button className="btn btn-primary" style={{ marginTop:16 }}
              onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
              📁 Choose Image
            </button>
          </div>


        </div>
      )}

      {/* SCANNING ANIMATION */}
      {step === 'scanning' && (
        <div className="card s2" style={{ textAlign:'center', padding:'32px 24px' }}>
          {preview && (
            <div style={{ position:'relative', marginBottom:22, borderRadius:14, overflow:'hidden', maxHeight:180 }}>
              <img src={preview} alt="rx"
                style={{ width:'100%', maxHeight:180, objectFit:'contain', borderRadius:14, opacity:0.75 }} />
              <div style={{ position:'absolute', left:0, right:0, height:2,
                background:'linear-gradient(90deg,transparent,#1a6fff,transparent)',
                top:0, animation:'scanLine 1.4s linear infinite',
                boxShadow:'0 0 14px rgba(26,111,255,0.7)' }} />
            </div>
          )}
          <div style={{ fontSize:48, marginBottom:14, animation:'pulse 1.2s ease infinite' }}>🔍</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:18,
            color:'var(--blue)', marginBottom:6 }}>
            Scanning Prescription...
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:22 }}>
            Loading your medicine schedule
          </div>
          <div style={{ height:6, background:'rgba(26,111,255,0.1)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4,
              background:'linear-gradient(90deg,#1a6fff,#60a5fa)',
              animation:'scanProg 2s ease forwards' }} />
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === 'review' && (
        <div className="s2">
          {preview && (
            <div className="card" style={{ padding:10, marginBottom:14 }}>
              <img src={preview} alt="rx"
                style={{ width:'100%', maxHeight:140, objectFit:'contain', borderRadius:12 }} />
              <div style={{ textAlign:'center', marginTop:8, fontSize:12,
                color:'var(--success)', fontWeight:700 }}>
                ✅ {extracted.length} medicines found
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">💊 Detected Medicines</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                  {selected.length} of {extracted.length} selected · Tap checkbox to deselect
                </div>
              </div>
              <button className="btn btn-outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={reset}>
                🔄 Upload New
              </button>
            </div>

            {extracted.map((med, i) => (
              <div key={i} className="row-in" style={{
                animationDelay:`${i*0.08}s`,
                background: selected.includes(i) ? 'rgba(26,111,255,0.05)' : 'rgba(0,0,0,0.02)',
                border:`1.5px solid ${selected.includes(i)?'rgba(26,111,255,0.22)':'rgba(0,0,0,0.06)'}`,
                borderRadius:16, padding:'14px', marginBottom:12, transition:'all 0.22s',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div onClick={() => toggleSelect(i)} style={{
                      width:26, height:26, borderRadius:8, flexShrink:0, cursor:'pointer',
                      background: selected.includes(i) ? 'var(--blue)' : 'rgba(26,111,255,0.1)',
                      border:`2px solid ${selected.includes(i)?'var(--blue)':'rgba(26,111,255,0.2)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, color:'#fff', fontWeight:700, transition:'all 0.2s',
                    }}>
                      {selected.includes(i) ? '✓' : ''}
                    </div>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{med.name}</span>
                  </div>
                  <span style={{ fontSize:11, color:'var(--blue)', fontWeight:700,
                    background:'rgba(26,111,255,0.1)', padding:'2px 8px', borderRadius:8 }}>
                    ⏰ {med.time}
                  </span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div>
                    <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Name</label>
                    <input className="form-input" style={{ fontSize:12, padding:'8px 10px' }}
                      value={med.name} onChange={e => updateField(i,'name',e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Dosage</label>
                    <input className="form-input" style={{ fontSize:12, padding:'8px 10px' }}
                      value={med.dosage} onChange={e => updateField(i,'dosage',e.target.value)} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Time</label>
                    <input className="form-input" type="time" style={{ fontSize:12, padding:'8px 10px' }}
                      value={med.time} onChange={e => updateField(i,'time',e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Food</label>
                    <select className="form-select" style={{ fontSize:12, padding:'8px 10px' }}
                      value={med.foodTiming} onChange={e => updateField(i,'foodTiming',e.target.value)}>
                      <option value="before">Before</option>
                      <option value="after">After</option>
                      <option value="with">With</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Days</label>
                    <input className="form-input" type="number" min="1" max="90"
                      style={{ fontSize:12, padding:'8px 10px' }}
                      value={med.duration} onChange={e => updateField(i,'duration',e.target.value)} />
                  </div>
                </div>

                {med.notes && (
                  <div style={{ marginTop:8, fontSize:11, color:'var(--text3)',
                    background:'rgba(26,111,255,0.05)', padding:'6px 10px', borderRadius:8 }}>
                    📋 {med.notes}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display:'flex', gap:10, marginTop:6 }}>
              <button className="btn btn-outline"
                style={{ flex:1, justifyContent:'center', padding:'13px' }} onClick={reset}>
                ← Upload New
              </button>
              <button className="btn btn-primary"
                style={{ flex:2, justifyContent:'center', padding:'13px', borderRadius:13, fontSize:14 }}
                onClick={handleSave} disabled={saving || selected.length === 0}>
                {saving ? '⏳ Saving...' : `✅ Add ${selected.length} Medicine${selected.length!==1?'s':''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && (
        <div className="card s2" style={{ textAlign:'center', padding:'40px 24px' }}>
          <div style={{ fontSize:68, marginBottom:18, animation:'heroFloat 2.5s ease-in-out infinite' }}>🎉</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800,
            color:'var(--text)', marginBottom:8 }}>
            Medicines Added!
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:28 }}>
            {selected.length} medicine{selected.length!==1?'s':''} scheduled with reminders.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button className="btn btn-primary" style={{ padding:'13px 24px' }}
              onClick={() => onNavigate('dashboard')}>
              🏠 View Dashboard
            </button>
            <button className="btn btn-outline" style={{ padding:'13px 24px' }} onClick={reset}>
              📷 Scan Another
            </button>
          </div>
        </div>
      )}
    </>
  )
}