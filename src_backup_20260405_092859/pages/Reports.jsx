import { useState } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'

export default function Reports({ user, db, medicines, userProfile, tr }) {
  const [fromDate,    setFromDate]    = useState('')
  const [toDate,      setToDate]      = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [preview,     setPreview]     = useState(null)

  const generate = async () => {
    if (!fromDate || !toDate || !user || !db) return
    setGenerating(true)

    // Medicines in range
    const medSnap = await getDocs(collection(db, 'medicines'))
    const meds = []
    medSnap.forEach(d => {
      const m = { id:d.id, ...d.data() }
      if (m.userId !== user.uid) return
      meds.push(m)
    })

    // Water data
    let totalDays = 0, waterDays = 0, totalWaterMl = 0
    const waterGoalMl = parseFloat(userProfile?.waterGoalLiters||2.5)*1000
    const start = new Date(fromDate), end = new Date(toDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      const ds = d.toISOString().split('T')[0]; totalDays++
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'waterIntake', ds))
        if (snap.exists()) {
          const ml = snap.data().totalMl||0; totalWaterMl += ml
          if (ml >= waterGoalMl*0.8) waterDays++
        }
      } catch(e) {}
    }

    // Habits
    const habitSnap = await getDocs(collection(db, 'users', user.uid, 'habits'))
    const habits = []; habitSnap.forEach(d => {
      const h = { id:d.id, ...d.data() }
      if (h.date >= fromDate && h.date <= toDate) habits.push(h)
    })

    const taken = meds.filter(m => m.status==='taken').length
    const total = meds.length
    const adherence = total > 0 ? Math.round((taken/total)*100) : 0
    const avgWater = totalDays > 0 ? (totalWaterMl/totalDays/1000).toFixed(1) : 0

    setPreview({ meds, taken, total, adherence, avgWater, waterDays, totalDays, habits, fromDate, toDate })
    setGenerating(false)
  }

  const downloadPDF = async () => {
    if (!preview) return
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF()
      const name = userProfile?.displayName || user.email

      // Header bar
      pdf.setFillColor(26, 111, 255)
      pdf.rect(0, 0, 210, 32, 'F')
      pdf.setTextColor(255,255,255)
      pdf.setFontSize(20)
      pdf.setFont('helvetica','bold')
      pdf.text('Sewarthii — Health Report', 105, 20, { align:'center' })

      // Details
      pdf.setTextColor(30,30,30)
      pdf.setFontSize(11); pdf.setFont('helvetica','normal')
      pdf.text(`Patient: ${name}`, 15, 44)
      pdf.text(`Period: ${preview.fromDate} to ${preview.toDate}`, 15, 52)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 60)

      // Medicine section
      pdf.setFontSize(14); pdf.setFont('helvetica','bold'); pdf.setTextColor(26,111,255)
      pdf.text('Medicine Adherence', 15, 74)
      pdf.setFontSize(11); pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30)
      pdf.text(`Total Doses: ${preview.total}`, 15, 84)
      pdf.text(`Doses Taken: ${preview.taken}`, 15, 92)
      pdf.text(`Doses Missed: ${preview.total - preview.taken}`, 15, 100)
      pdf.text(`Adherence Rate: ${preview.adherence}%`, 15, 108)

      // Adherence bar
      pdf.setFillColor(220,235,255); pdf.rect(15, 114, 120, 7, 'F')
      pdf.setFillColor(26,111,255); pdf.rect(15, 114, (preview.adherence/100)*120, 7, 'F')

      // Water section
      pdf.setFontSize(14); pdf.setFont('helvetica','bold'); pdf.setTextColor(14,165,233)
      pdf.text('Water Intake', 15, 134)
      pdf.setFontSize(11); pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30)
      pdf.text(`Average Daily: ${preview.avgWater} L`, 15, 144)
      pdf.text(`Days Goal Met (≥80%): ${preview.waterDays} / ${preview.totalDays}`, 15, 152)

      // Activity section
      pdf.setFontSize(14); pdf.setFont('helvetica','bold'); pdf.setTextColor(0,196,140)
      pdf.text('Activity Summary', 15, 168)
      pdf.setFontSize(11); pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30)
      const doneHabits = preview.habits.filter(h => h.done)
      pdf.text(`Activities Logged: ${preview.habits.length}`, 15, 178)
      pdf.text(`Completed: ${doneHabits.length}`, 15, 186)

      // Medicine list
      pdf.setFontSize(13); pdf.setFont('helvetica','bold'); pdf.setTextColor(26,111,255)
      pdf.text('Medicine List', 15, 202)
      pdf.setFontSize(9); pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30)
      let y = 212
      preview.meds.slice(0,20).forEach(m => {
        pdf.text(`• ${m.name}  ${m.dosage}  —  ${m.status==='taken'?'✓ Taken':'✗ '+m.status}`, 15, y)
        y += 7
        if (y > 278) { pdf.addPage(); y = 20 }
      })

      pdf.save(`Sewarthii_Report_${preview.fromDate}_to_${preview.toDate}.pdf`)
    } catch(e) { alert('Could not generate PDF. Make sure jspdf is installed: npm install jspdf') }
  }

  return (
    <>
      <div className="greeting s1">
        <h2>📄 {tr?.('generateReport') || 'Reports'}</h2>
        <p>Generate a PDF summary of your health data</p>
      </div>

      <div className="card s2">
        <div className="card-title">📅 Select Date Range</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div className="form-group">
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-full" onClick={generate} disabled={generating || !fromDate || !toDate}>
          {generating ? '⏳ Generating...' : '📊 Generate Report'}
        </button>
      </div>

      {preview && (
        <div className="card s3">
          <div className="card-title">📊 Report Preview</div>

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom:18 }}>
            {[
              { icon:'💊', label:'Adherence', value:`${preview.adherence}%`, cls:'si1' },
              { icon:'💧', label:'Avg Water',  value:`${preview.avgWater}L`,  cls:'si2' },
              { icon:'🏃', label:'Activities', value:`${preview.habits.filter(h=>h.done).length} done`, cls:'si4' },
              { icon:'📅', label:'Period',     value:`${preview.totalDays}d`,  cls:'si1' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className={'stat-icon '+s.cls}>{s.icon}</div>
                <div className="stat-info"><div className="v">{s.value}</div><div className="l">{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Adherence bar */}
          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>
              <span>Medicine Adherence</span><span>{preview.adherence}%</span>
            </div>
            <div style={{ height:12, background:'rgba(26,111,255,0.1)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${preview.adherence}%`, background:'linear-gradient(90deg,var(--blue),#60a5fa)', borderRadius:99, transition:'width 0.5s' }} />
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={downloadPDF}
            style={{ background:'linear-gradient(135deg,#1a6fff,#4a90e2)' }}>
            📥 {tr?.('downloadPDF') || 'Download PDF Report'}
          </button>
        </div>
      )}
    </>
  )
}