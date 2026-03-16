import { useState, useRef } from 'react'

export default function PrescriptionScanner({ onAdd, onNavigate }) {
  const [step,      setStep]      = useState('upload')   // upload | scanning | review | done
  const [preview,   setPreview]   = useState(null)
  const [base64,    setBase64]    = useState(null)
  const [mimeType,  setMimeType]  = useState('image/jpeg')
  const [extracted, setExtracted] = useState([])
  const [selected,  setSelected]  = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef()

  // Convert file to base64
  const toBase64 = file => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result.split(',')[1])
    r.onerror = () => rej(new Error('Read failed'))
    r.readAsDataURL(file)
  })

  const handleFile = async file => {
    if (!file) return
    setError('')

    // Preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // Determine media type
    const mime = file.type.startsWith('image/') ? file.type : 'image/jpeg'
    setMimeType(mime)

    try {
      const b64 = await toBase64(file)
      setBase64(b64)
      setStep('scanning')
      await scanWithAI(b64, mime)
    } catch(e) {
      setError('Could not read file. Please try a JPG or PNG image.')
      setStep('upload')
    }
  }

  const scanWithAI = async (b64, mime) => {
    setError('')
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mime, data: b64 }
              },
              {
                type: 'text',
                text: `You are a medical prescription reader. Carefully read this prescription image and extract ALL medicines listed.

Return ONLY a valid JSON array. No explanation, no markdown, no backticks. Just the raw JSON array.

Each item must have these exact fields:
- "name": medicine name (string)
- "dosage": dose like "1 tablet", "500mg", "5ml", "2 tablets" (string)  
- "time": best time to take in HH:MM 24hr format like "08:00", "14:00", "20:00" (string)
- "foodTiming": one of "before", "after", or "with" (string)
- "duration": number of days as integer (number, default 7 if not specified)

Example output:
[{"name":"Paracetamol","dosage":"1 tablet (500mg)","time":"08:00","foodTiming":"after","duration":5},{"name":"Amoxicillin","dosage":"1 capsule (250mg)","time":"14:00","foodTiming":"after","duration":7}]

If you cannot read any medicines clearly, return an empty array: []
If the image is not a prescription, return: []`
              }
            ]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.content?.[0]?.text?.trim() || '[]'

      // Parse the JSON response
      let medicines = []
      try {
        // Strip any accidental markdown fences
        const clean = text.replace(/```json|```/g, '').trim()
        medicines = JSON.parse(clean)
        if (!Array.isArray(medicines)) medicines = []
      } catch(parseErr) {
        console.error('JSON parse error:', parseErr, 'Raw text:', text)
        medicines = []
      }

      if (medicines.length === 0) {
        setError('No medicines could be detected in the image. Please try a clearer photo or enter medicines manually.')
        setStep('upload')
        return
      }

      // Sanitize each medicine
      const sanitized = medicines.map((m, i) => ({
        name:        String(m.name || '').trim(),
        dosage:      String(m.dosage || '1 tablet').trim(),
        time:        /^\d{2}:\d{2}$/.test(m.time) ? m.time : ['08:00','12:00','18:00','20:00'][i % 4],
        foodTiming:  ['before','after','with'].includes(m.foodTiming) ? m.foodTiming : 'after',
        duration:    Number.isInteger(Number(m.duration)) && Number(m.duration) > 0 ? Number(m.duration) : 7,
      })).filter(m => m.name.length > 0)

      setExtracted(sanitized)
      setSelected(sanitized.map((_, i) => i))  // all selected by default
      setStep('review')

    } catch(e) {
      console.error('AI scan error:', e)
      setError('Could not analyse the prescription. Please check your internet connection and try again.')
      setStep('upload')
    }
  }

  const toggleSelect = i =>
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])

  const updateField = (i, field, val) =>
    setExtracted(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const handleSave = async () => {
    const toSave = extracted.filter((_, i) => selected.includes(i))
    if (!toSave.length) { alert('Please select at least one medicine.'); return }
    setSaving(true)
    try {
      for (const m of toSave) {
        await onAdd({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          ...m,
          status:    'pending',
          createdAt: new Date().toISOString(),
        })
      }
      setStep('done')
    } catch(e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setStep('upload'); setPreview(null); setBase64(null)
    setExtracted([]); setSelected([]); setError('')
  }

  const rescan = () => {
    if (base64) { setStep('scanning'); scanWithAI(base64, mimeType) }
    else reset()
  }

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0%   { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes medExtract {
          from { opacity:0; transform:translateX(-16px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .med-extract { animation: medExtract 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes heroFloat { 0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-12px) rotate(2deg);} }
      `}</style>

      <div className="greeting s1">
        <h2>Scan Prescription 📷</h2>
        <p>Upload your prescription — AI will extract medicines automatically</p>
      </div>

      {error && (
        <div className="alert danger" style={{ marginBottom:14, animation:'fadeUp 0.3s ease' }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div>
            <strong>Scan failed</strong>
            <div style={{ fontWeight:400, marginTop:2, fontSize:12 }}>{error}</div>
          </div>
        </div>
      )}

      {/* ── STEP 1: UPLOAD ── */}
      {step === 'upload' && (
        <div className="s2">
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <div className="upload-icon">📷</div>
            <h3>Upload Prescription</h3>
            <p>AI will automatically read and extract all medicines</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            <button className="btn btn-primary" style={{ marginTop:16 }}
              onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
              📁 Choose Image
            </button>
          </div>

          {/* How it works */}
          <div className="card s3">
            <div className="card-title">🤖 AI-Powered Scanning</div>
            {[
              { icon:'📤', txt:'Upload a clear photo of your prescription' },
              { icon:'🧠', txt:'Claude AI reads and identifies all medicines' },
              { icon:'✏️', txt:'Review and edit the extracted details' },
              { icon:'✅', txt:'Medicines are added to your schedule instantly' },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:i<3?12:0 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(26,111,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {s.icon}
                </div>
                <span style={{ fontSize:13, color:'var(--text2)' }}>{s.txt}</span>
              </div>
            ))}
          </div>

          <div className="alert info s4">
            <span style={{ fontSize:18 }}>💡</span>
            <div style={{ fontSize:12 }}>For best results, take a clear photo in good lighting. Blurry images may not extract correctly.</div>
          </div>
        </div>
      )}

      {/* ── STEP 2: SCANNING ── */}
      {step === 'scanning' && (
        <div className="card s2" style={{ textAlign:'center', padding:'32px 24px' }}>
          {preview && (
            <div style={{ position:'relative', marginBottom:22, borderRadius:14, overflow:'hidden', maxHeight:180 }}>
              <img src={preview} alt="prescription"
                style={{ width:'100%', maxHeight:180, objectFit:'contain', borderRadius:14, opacity:0.7 }} />
              {/* Scan line animation */}
              <div style={{
                position:'absolute', left:0, right:0, height:2,
                background:'linear-gradient(90deg,transparent,#1a6fff,transparent)',
                top:0, animation:'scanLine 1.5s linear infinite',
                boxShadow:'0 0 12px rgba(26,111,255,0.6)',
              }} />
              <div style={{
                position:'absolute', inset:0,
                background:'linear-gradient(180deg,rgba(26,111,255,0.08),transparent)',
              }} />
            </div>
          )}

          <div style={{ fontSize:44, marginBottom:14, animation:'pulse 1.2s ease infinite' }}>🧠</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:18, color:'var(--blue)', marginBottom:6 }}>
            AI Reading Prescription...
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:22 }}>
            Claude AI is analysing your image and extracting medicine details
          </div>

          <div style={{ height:6, background:'rgba(26,111,255,0.1)', borderRadius:4, overflow:'hidden', marginBottom:16 }}>
            <div style={{
              height:'100%', borderRadius:4,
              background:'linear-gradient(90deg,#1a6fff,#60a5fa)',
              animation:'scanProg 2.5s ease forwards',
            }} />
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
            {['Reading text...','Identifying medicines...','Extracting details...'].map((t,i) => (
              <div key={i} style={{ fontSize:10, color:'var(--text3)', fontWeight:600, animation:`pulse ${1+i*0.3}s ease infinite`, animationDelay:`${i*0.2}s` }}>
                {t}
              </div>
            ))}
          </div>

          <style>{`@keyframes scanProg{from{width:0;}to{width:92%;}}`}</style>
        </div>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {step === 'review' && (
        <div className="s2">
          {preview && (
            <div className="card" style={{ padding:10, marginBottom:14 }}>
              <img src={preview} alt="prescription"
                style={{ width:'100%', maxHeight:140, objectFit:'contain', borderRadius:12 }} />
            </div>
          )}

          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">✅ Medicines Found</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                  {extracted.length} medicine{extracted.length!==1?'s':''} detected · {selected.length} selected
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-outline" style={{ fontSize:11, padding:'5px 10px' }} onClick={rescan}>
                  🔄 Rescan
                </button>
              </div>
            </div>

            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>
              Review and edit the extracted details. Tap a medicine to deselect it.
            </div>

            {extracted.map((med, i) => (
              <div key={i} className="med-extract" style={{
                animationDelay:`${i*0.08}s`,
                background: selected.includes(i) ? 'rgba(26,111,255,0.06)' : 'rgba(0,0,0,0.02)',
                border: `1.5px solid ${selected.includes(i) ? 'rgba(26,111,255,0.25)' : 'rgba(0,0,0,0.06)'}`,
                borderRadius:16, padding:'14px 14px 12px', marginBottom:12,
                transition:'all 0.22s',
              }}>
                {/* Header row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div onClick={() => toggleSelect(i)} style={{
                      width:24, height:24, borderRadius:8,
                      background: selected.includes(i) ? 'var(--blue)' : 'rgba(26,111,255,0.1)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', fontSize:12, color: selected.includes(i) ? '#fff' : 'var(--blue)',
                      fontWeight:700, transition:'all 0.2s', flexShrink:0,
                      border:`2px solid ${selected.includes(i) ? 'var(--blue)' : 'rgba(26,111,255,0.2)'}`,
                    }}>
                      {selected.includes(i) ? '✓' : ''}
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{med.name}</span>
                  </div>
                  <span style={{ fontSize:11, color:'var(--blue)', fontWeight:600, background:'rgba(26,111,255,0.1)', padding:'2px 8px', borderRadius:8 }}>
                    {med.time}
                  </span>
                </div>

                {/* Editable fields */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div>
                    <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Medicine Name</label>
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
                    <input className="form-input" type="number" min="1" max="90" style={{ fontSize:12, padding:'8px 10px' }}
                      value={med.duration} onChange={e => updateField(i,'duration',e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:10, marginTop:6 }}>
              <button className="btn btn-outline" style={{ flex:1, justifyContent:'center', padding:'13px' }} onClick={reset}>
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

      {/* ── STEP 4: DONE ── */}
      {step === 'done' && (
        <div className="card s2" style={{ textAlign:'center', padding:'40px 24px' }}>
          <div style={{ fontSize:68, marginBottom:18, animation:'heroFloat 2.5s ease-in-out infinite' }}>🎉</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>
            Medicines Added!
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:28 }}>
            {extracted.filter((_,i)=>selected.includes(i)).length} medicine{selected.length!==1?'s':''} from your prescription have been scheduled.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button className="btn btn-primary" style={{ padding:'13px 24px' }} onClick={() => onNavigate('dashboard')}>
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