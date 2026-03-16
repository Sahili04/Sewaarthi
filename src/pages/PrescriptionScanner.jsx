import { useState, useRef } from 'react'

export default function PrescriptionScanner({ onAdd, onNavigate }) {
  const [step, setStep] = useState('upload')
  const [preview, setPreview] = useState(null)
  const [rows, setRows] = useState([])
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      setStep('scanning')
      setTimeout(() => {
        setRows([{ id: Date.now(), name: '', dosage: '1 tablet', time: '08:00', foodTiming: 'after', duration: 7 }])
        setStep('result')
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const addRow = () => setRows(prev => [...prev, { id: Date.now(), name: '', dosage: '1 tablet', time: '08:00', foodTiming: 'after', duration: 7 }])
  const updateRow = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id))

  const saveAll = () => {
    const valid = rows.filter(r => r.name.trim())
    if (!valid.length) return
    valid.forEach((med, i) => {
      onAdd({ id: Date.now().toString() + i, name: med.name.trim(), dosage: med.dosage, time: med.time, foodTiming: med.foodTiming, duration: Number(med.duration), status: 'pending', createdAt: new Date().toISOString() })
    })
    setStep('done')
  }

  const reset = () => { setStep('upload'); setPreview(null); setRows([]) }
  const validCount = rows.filter(r => r.name.trim()).length

  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #1a2035', fontFamily:'Outfit, sans-serif', fontSize:13, color:'#eef2ff', background:'#0d1017', outline:'none', boxSizing:'border-box' }
  const selectStyle = { ...inputStyle }

  return (
    <>
      <div className="greeting">
        <h2>Scan Prescription 📷</h2>
        <p>Upload photo then enter medicines from it</p>
      </div>

      {step === 'upload' && (
        <>
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <div className="upload-icon">📷</div>
            <h3>Upload Prescription Photo</h3>
            <p>Take a clear photo of your doctor's prescription</p>
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
              📁 Choose File
            </button>
          </div>
          <div className="card">
            <div className="card-title">How It Works</div>
            {[{i:'📷',t:'Upload Photo',d:'Take a clear photo of your prescription'},
              {i:'✏️',t:'Type Medicines',d:'Look at photo and enter each medicine'},
              {i:'⏰',t:'Get Reminders',d:'Automatic reminders at scheduled times'}
            ].map((item,idx)=>(
              <div key={idx} style={{ display:'flex', gap:12, marginBottom:14 }}>
                <div style={{ width:38, height:38, background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.i}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#eef2ff' }}>{item.t}</div>
                  <div style={{ fontSize:12, color:'#4b5563', marginTop:2 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 'scanning' && (
        <div className="card" style={{ textAlign:'center', padding:40 }}>
          {preview && <img src={preview} alt="Rx" style={{ width:'100%', borderRadius:12, maxHeight:200, objectFit:'cover', marginBottom:20 }} />}
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontWeight:700, fontSize:15, color:'#a78bfa', marginBottom:6 }}>Processing...</div>
          <div style={{ fontSize:12, color:'#4b5563', marginBottom:16 }}>Getting ready for you to enter medicines</div>
          <div style={{ height:5, background:'#1a2035', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)', borderRadius:3, animation:'prog 2s ease forwards', width:'0%' }}/>
          </div>
          <style>{`@keyframes prog{from{width:0%}to{width:90%}}`}</style>
        </div>
      )}

      {step === 'result' && (
        <>
          {preview && (
            <div className="card">
              <div className="card-title">📄 Your Prescription</div>
              <img src={preview} alt="Rx" style={{ width:'100%', borderRadius:12, maxHeight:220, objectFit:'cover' }} />
              <div style={{ marginTop:10, fontSize:12, color:'#4b5563', textAlign:'center' }}>👆 Look at this image and type medicines below</div>
            </div>
          )}
          <div className="card">
            <div className="section-header">
              <div className="section-title">✏️ Enter Medicines</div>
              <button className="btn btn-primary" style={{ fontSize:11, padding:'6px 12px' }} onClick={addRow}>+ Add Row</button>
            </div>
            <div className="alert info" style={{ marginBottom:14 }}>
              <span>💡</span>
              <div style={{ fontSize:12 }}>Look at your prescription above and type each medicine. Click <strong>+ Add Row</strong> for each one.</div>
            </div>
            {rows.length === 0 && (
              <div className="empty" style={{ padding:'20px 0' }}>
                <div className="e-icon">💊</div>
                <p>Click <strong>+ Add Row</strong> to start entering medicines</p>
              </div>
            )}
            {rows.map((row, idx) => (
              <div key={row.id} style={{ background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:14, padding:14, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#a78bfa' }}>Medicine {idx+1}</span>
                  <button onClick={() => removeRow(row.id)} style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.2)', color:'#fb7185', padding:'3px 8px', borderRadius:6, cursor:'pointer', fontSize:11, fontFamily:'Outfit, sans-serif', fontWeight:700 }}>✕</button>
                </div>
                <div style={{ marginBottom:8 }}>
                  <label style={{ fontSize:11, color:'#4b5563', display:'block', marginBottom:4 }}>Medicine Name *</label>
                  <input style={inputStyle} placeholder="e.g. Paracetamol" value={row.name} onChange={e => updateRow(row.id,'name',e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div>
                    <label style={{ fontSize:11, color:'#4b5563', display:'block', marginBottom:4 }}>Dosage</label>
                    <input style={inputStyle} placeholder="1 tablet" value={row.dosage} onChange={e => updateRow(row.id,'dosage',e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:'#4b5563', display:'block', marginBottom:4 }}>Time</label>
                    <input style={inputStyle} type="time" value={row.time} onChange={e => updateRow(row.id,'time',e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:11, color:'#4b5563', display:'block', marginBottom:4 }}>Food Timing</label>
                    <select style={selectStyle} value={row.foodTiming} onChange={e => updateRow(row.id,'foodTiming',e.target.value)}>
                      <option value="before">Before Food</option>
                      <option value="after">After Food</option>
                      <option value="with">With Food</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:'#4b5563', display:'block', marginBottom:4 }}>Days</label>
                    <input style={inputStyle} type="number" min="1" max="90" value={row.duration} onChange={e => updateRow(row.id,'duration',parseInt(e.target.value)||1)} />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-primary btn-full" onClick={saveAll} disabled={validCount===0} style={{ marginTop:8, opacity:validCount===0?0.5:1 }}>
              ✅ Add {validCount>0?validCount:''} Medicine{validCount!==1?'s':''} to Schedule
            </button>
            <button className="btn btn-outline" style={{ width:'100%', marginTop:8, justifyContent:'center' }} onClick={reset}>
              📷 Use Different Image
            </button>
          </div>
        </>
      )}

      {step === 'done' && (
        <div className="card" style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:20, fontWeight:800, color:'#eef2ff', marginBottom:8 }}>Medicines Added!</div>
          <div style={{ fontSize:13, color:'#4b5563', marginBottom:24 }}>You'll receive reminders at the scheduled times.</div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>🏠 View Dashboard</button>
            <button className="btn btn-outline" onClick={reset}>📷 Scan Another</button>
          </div>
        </div>
      )}
    </>
  )
}