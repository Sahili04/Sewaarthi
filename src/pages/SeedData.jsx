import { useState } from 'react'
import {
  collection, addDoc, getDocs, doc, setDoc, deleteDoc, writeBatch, query, where
} from 'firebase/firestore'

// ── Realistic data pools ─────────────────────────────────────────────────────
const MEDS = [
  { name:'Metformin 500mg',    dosage:'500mg',   foodTiming:'after',  times:['08:00','20:00'], duration:180, type:'chronic' },
  { name:'Amlodipine 5mg',     dosage:'5mg',     foodTiming:'before', times:['07:30'],         duration:180, type:'chronic' },
  { name:'Atorvastatin 10mg',  dosage:'10mg',    foodTiming:'after',  times:['21:00'],         duration:180, type:'chronic' },
  { name:'Pantoprazole 40mg',  dosage:'40mg',    foodTiming:'before', times:['07:00'],         duration:90,  type:'chronic' },
  { name:'Vitamin D3 60K',     dosage:'60000IU', foodTiming:'after',  times:['09:00'],         duration:12,  type:'supplement' },
  { name:'Vitamin B12',        dosage:'1500mcg', foodTiming:'after',  times:['09:00'],         duration:30,  type:'supplement' },
  { name:'Azithromycin 500mg', dosage:'500mg',   foodTiming:'after',  times:['09:00'],         duration:5,   type:'acute' },
  { name:'Paracetamol 650mg',  dosage:'650mg',   foodTiming:'after',  times:['08:00','14:00','20:00'], duration:5, type:'acute' },
  { name:'Cetirizine 10mg',    dosage:'10mg',    foodTiming:'before', times:['22:00'],         duration:14,  type:'acute' },
  { name:'Omeprazole 20mg',    dosage:'20mg',    foodTiming:'before', times:['08:00'],         duration:30,  type:'acute' },
]

const HABITS = ['🚶 Walking','🧘 Yoga','💪 Workout','🚴 Cycling','🏃 Running','🤸 Stretching','🏊 Swimming','🧗 Climbing']

const DOCTORS = [
  { name:'Dr. Rajesh Sharma',   specialty:'General Physician', phone:'+91 98765 43210', phone2:'+91 22 2765 4321', hospital:'City General Hospital, Pune', notes:'Call before visiting. Mon–Sat 10am–1pm & 5pm–8pm. Takes appointments on WhatsApp.', available:'Mon–Sat, 10am–8pm' },
  { name:'Dr. Priya Kulkarni',  specialty:'Diabetologist',     phone:'+91 99887 76543', phone2:'', hospital:'Apollo Clinic, Kothrud', notes:'Specialist appointment required. Carries HbA1c reports. Very thorough.', available:'Tue, Thu, Sat — 11am–3pm' },
  { name:'Dr. Anand Mehta',     specialty:'Cardiologist',       phone:'+91 90123 45678', phone2:'+91 20 2567 8901', hospital:'Ruby Hall Clinic, Pune', notes:'24/7 emergency line available. Echo and stress test on Wednesdays.', available:'Mon–Fri, 9am–1pm' },
  { name:'Dr. Sunita Desai',    specialty:'General Physician',  phone:'+91 87654 32109', phone2:'', hospital:'Desai Medical, Baner', notes:'Neighbourhood clinic. Good for general check-ups and prescriptions.', available:'Daily 8am–12pm' },
]

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const hit = (pct) => Math.random() * 100 < pct

function dateStr(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// Generate a realistic streak pattern over 180 days
// Returns array of booleans: true = goal met, false = missed
function generateStreakPattern(days) {
  const pattern = []
  let inStreak = false
  let streakLen = 0
  let breakLen = 0

  for (let i = days - 1; i >= 0; i--) {
    if (!inStreak) {
      // building a break
      breakLen++
      // chance to start a new streak after 1-7 day break
      if (breakLen >= rnd(1, 7)) { inStreak = true; streakLen = 0; breakLen = 0 }
      pattern.push(false)
    } else {
      // in a streak
      streakLen++
      const keepGoing = hit(streakLen < 5 ? 85 : streakLen < 12 ? 70 : 50)
      if (!keepGoing) { inStreak = false; breakLen = 0 }
      pattern.push(true)
    }
  }
  return pattern // index 0 = 179 days ago, index 179 = today
}

export default function SeedData({ user, db }) {
  const [status,   setStatus]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [progress, setProgress] = useState(0)
  const log = (msg) => setStatus(msg)

  const deleteAll = async () => {
    // medicines — delete all that belong to this user (check both userId field and fallback)
    log('🗑️ Clearing medicines...')
    const msAll = await getDocs(collection(db, 'medicines'))
    let b1 = writeBatch(db); let bc1 = 0
    msAll.forEach(d => {
      const data = d.data()
      if (data.userId === user.uid || (!data.userId && data.userEmail === user.email)) {
        b1.delete(d.ref); bc1++
        if (bc1 === 400) { /* flush handled below */ }
      }
    })
    if (bc1 > 0) await b1.commit()

    // doctors
    log('🗑️ Clearing doctors...')
    const ds = await getDocs(query(collection(db, 'doctors'), where('userId','==',user.uid)))
    const b2 = writeBatch(db); ds.forEach(d => b2.delete(d.ref)); await b2.commit()

    // caretaker requests where user is patient
    log('🗑️ Clearing caretaker links...')
    const cr = await getDocs(query(collection(db, 'caretakerRequests'), where('patientUid','==',user.uid)))
    const b3 = writeBatch(db); cr.forEach(d => b3.delete(d.ref)); await b3.commit()

    // sub-collections
    for (const sub of ['habits', 'waterIntake', 'dailyHealth', 'waterReminders']) {
      log(`🗑️ Clearing ${sub}...`)
      const snap = await getDocs(collection(db, 'users', user.uid, sub))
      // batch delete in chunks of 400
      let b = writeBatch(db); let c = 0
      for (const d of snap.docs) {
        b.delete(d.ref); c++
        if (c === 400) { await b.commit(); b = writeBatch(db); c = 0 }
      }
      if (c > 0) await b.commit()
    }
  }

  const seed = async () => {
    if (!user || !db) return
    setLoading(true); setProgress(0)
    try {
      await deleteAll()
      setProgress(10)

      const DAYS = 180
      const today = new Date().toISOString().split('T')[0]
      const waterGoal = 2500

      // ── 0. Linked caretaker ────────────────────────────────────────────
      log('👨‍⚕️ Linking fake caretaker...')
      await addDoc(collection(db, 'caretakerRequests'), {
        caretakerUid:   'demo_caretaker_uid_001',
        caretakerName:  'Ananya Raut',
        caretakerEmail: 'ananya.raut@gmail.com',
        patientUid:     user.uid,
        patientEmail:   user.email,
        status:         'accepted',
        createdAt:      new Date(Date.now() - 45 * 86400000).toISOString(),
      })
      setProgress(12)

      // ── 1. Doctors ─────────────────────────────────────────────────────
      log('🏥 Adding doctors...')
      for (const dr of DOCTORS) {
        await addDoc(collection(db, 'doctors'), {
          ...dr, userId: user.uid, createdAt: new Date(Date.now() - rnd(30,150)*86400000).toISOString(),
        })
      }
      setProgress(16)

      // ── 2. Medicines ───────────────────────────────────────────────────
      log('💊 Adding medicines...')
      // Chronic: ongoing
      for (const med of MEDS.filter(m => m.type === 'chronic')) {
        const st = hit(82) ? 'taken' : hit(60) ? 'pending' : 'missed'
        await addDoc(collection(db, 'medicines'), {
          userId:user.uid, name:med.name, dosage:med.dosage,
          foodTiming:med.foodTiming, times:med.times, duration:med.duration,
          status:st, createdAt:new Date(Date.now()-rnd(120,175)*86400000).toISOString(),
        })
      }
      // Supplements
      for (const med of MEDS.filter(m => m.type === 'supplement')) {
        await addDoc(collection(db, 'medicines'), {
          userId:user.uid, name:med.name, dosage:med.dosage,
          foodTiming:med.foodTiming, times:med.times, duration:med.duration,
          status:'taken', createdAt:new Date(Date.now()-rnd(60,90)*86400000).toISOString(),
        })
      }
      // Acute (completed courses)
      for (const med of MEDS.filter(m => m.type === 'acute')) {
        await addDoc(collection(db, 'medicines'), {
          userId:user.uid, name:med.name, dosage:med.dosage,
          foodTiming:med.foodTiming, times:med.times, duration:med.duration,
          status:'taken', createdAt:new Date(Date.now()-rnd(14,120)*86400000).toISOString(),
        })
      }
      setProgress(24)

      // ── 3. Generate streak patterns ────────────────────────────────────
      const waterPattern  = generateStreakPattern(DAYS) // true = met 80% goal
      const habitPattern  = generateStreakPattern(DAYS) // true = did at least 1+ habit

      // ── 4. Daily data for 180 days ─────────────────────────────────────
      log('📅 Building 180 days of history...')

      // batch writes for speed
      let batch = writeBatch(db); let batchCount = 0
      const flushBatch = async () => { await batch.commit(); batch = writeBatch(db); batchCount = 0 }

      for (let i = DAYS - 1; i >= 0; i--) {
        const date = dateStr(i)
        const metWater = waterPattern[DAYS - 1 - i]
        const didHabit = habitPattern[DAYS - 1 - i]
        const isWeekend = [0,6].includes(new Date(date).getDay())

        // ── Water intake ──────────────────────────────────────────────
        let waterMl
        if (metWater) {
          waterMl = rnd(2200, 3400)           // hit goal
        } else {
          waterMl = isWeekend ? rnd(800, 1800) : rnd(1200, 2100) // missed
        }
        // Seed today's water as partially consumed (looks active)
        if (i === 0) waterMl = rnd(1400, 2200)
        const waterRef = doc(db, 'users', user.uid, 'waterIntake', date)
        batch.set(waterRef, { totalMl: waterMl, date })
        batchCount++

        // ── Daily health ──────────────────────────────────────────────
        const waterScore    = Math.min(Math.round((waterMl / waterGoal) * 100), 100)
        const actScore      = didHabit ? rnd(60, 100) : rnd(0, 35)
        // medicineScore: simulate realistic adherence — good most days, occasional misses
        const medicineScore = i > 0 ? (hit(82) ? rnd(80, 100) : hit(60) ? rnd(40, 79) : rnd(0, 39)) : 75
        const healthRef     = doc(db, 'users', user.uid, 'dailyHealth', date)
        batch.set(healthRef, { date, waterScore, activityScore: actScore, medicineScore })
        batchCount++

        if (batchCount >= 400) await flushBatch()

        // ── Habits (can't easily batch addDoc, use setDoc with generated id) ──
        if (didHabit) {
          const numActs = rnd(1, isWeekend ? 2 : 3)
          for (let a = 0; a < numActs; a++) {
            const actName  = HABITS[rnd(0, HABITS.length - 1)]
            const done     = hit(a === 0 ? 95 : 70) // first one almost always done
            const secs     = done ? rnd(900, 4200) : rnd(0, 600)
            const habitRef = doc(collection(db, 'users', user.uid, 'habits'))
            batch.set(habitRef, { name:actName, date, done, durationSeconds:secs })
            batchCount++
            if (batchCount >= 400) await flushBatch()
          }
        }

        if (i % 30 === 0) setProgress(24 + Math.round(((DAYS - i) / DAYS) * 60))
      }
      if (batchCount > 0) await flushBatch()
      setProgress(87)

      // ── 5. Water reminders ─────────────────────────────────────────────
      log('⏰ Adding water reminders...')
      const reminders = [
        { time:'08:00', amount:250 }, { time:'10:30', amount:250 },
        { time:'13:00', amount:350 }, { time:'16:00', amount:250 },
        { time:'18:30', amount:250 }, { time:'20:30', amount:150 },
      ]
      for (const r of reminders) {
        await addDoc(collection(db, 'users', user.uid, 'waterReminders'), r)
      }

      // ── 6. Update user profile with water goal ─────────────────────────
      log('👤 Updating profile...')
      const { setDoc: sd, doc: fd } = await import('firebase/firestore')
      await sd(fd(db, 'users', user.uid), {
        waterGoalLiters: '2.5',
        waterReminders: reminders,
        profileComplete: true,
      }, { merge: true })

      setProgress(100)
      log('✅ Done! 6 months of realistic data seeded — medicines, doctors, water streaks & habits. Refresh the app!')
    } catch (e) {
      console.error(e)
      log('❌ Error: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#cce5ff,#daeeff)', fontFamily:'Outfit,sans-serif', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:36, maxWidth:480, width:'100%', boxShadow:'0 24px 64px rgba(26,111,255,0.12)' }}>
        <div style={{ fontSize:40, textAlign:'center', marginBottom:8 }}>🌱</div>
        <h2 style={{ textAlign:'center', fontWeight:800, fontSize:22, color:'#0d1b3e', margin:'0 0 6px' }}>Seed Demo Data</h2>
        <p style={{ textAlign:'center', color:'#64748b', fontSize:13, marginBottom:28 }}>
          Deletes all existing data and seeds <strong>6 months</strong> of realistic usage —
          medicines, doctor contacts, water intake with natural streaks, and daily habits.
        </p>

        {/* What gets seeded */}
        <div style={{ background:'rgba(26,111,255,0.04)', border:'1px solid rgba(26,111,255,0.12)', borderRadius:14, padding:'14px 18px', marginBottom:20, fontSize:12 }}>
          {[
            ['👨‍⚕️','1 Caretaker linked','Ananya Raut — already accepted & connected'],
            ['💊','10 Medicines','4 chronic, 2 supplements, 4 completed acute courses'],
            ['🏥','4 Doctors','GP, Diabetologist, Cardiologist, Clinic'],
            ['💧','180 days water','Realistic streaks — some long runs, some breaks'],
            ['🏃','Habit logs','Daily activities with done/not-done patterns'],
            ['⏰','6 Reminders','Water reminders pre-configured'],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <div><strong style={{ color:'#0d1b3e' }}>{title}</strong><span style={{ color:'#64748b' }}> — {sub}</span></div>
            </div>
          ))}
        </div>

        {status && (
          <div style={{
            background: status.startsWith('✅')?'rgba(0,196,140,0.08)':status.startsWith('❌')?'rgba(255,77,106,0.08)':'rgba(26,111,255,0.06)',
            border:`1px solid ${status.startsWith('✅')?'rgba(0,196,140,0.2)':status.startsWith('❌')?'rgba(255,77,106,0.2)':'rgba(26,111,255,0.15)'}`,
            borderRadius:12, padding:'12px 16px', marginBottom:18, fontSize:13, fontWeight:600,
            color: status.startsWith('✅')?'#00a878':status.startsWith('❌')?'#e03355':'#1a6fff',
          }}>{status}</div>
        )}

        {loading && (
          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div style={{ height:8, background:'rgba(26,111,255,0.1)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#1a6fff,#60a5fa)', borderRadius:99, transition:'width 0.4s' }} />
            </div>
          </div>
        )}

        <button onClick={seed} disabled={loading} style={{
          width:'100%', padding:'14px 24px', borderRadius:14,
          background: loading?'rgba(26,111,255,0.4)':'linear-gradient(135deg,#1a6fff,#4a90e2)',
          color:'#fff', border:'none', cursor:loading?'not-allowed':'pointer',
          fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:15,
        }}>
          {loading ? '⏳ Seeding data...' : '🚀 Delete & Seed 6 Months of Data'}
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:'#94a3b8', marginTop:16 }}>
          ⚠️ This deletes ALL existing data first. Takes ~30–60 seconds.
        </p>
      </div>
    </div>
  )
}
