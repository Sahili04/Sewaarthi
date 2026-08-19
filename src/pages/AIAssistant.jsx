import { useState, useRef, useEffect } from 'react'

// ── Medical & Pharmacological Knowledge Graph ──
const CLINICAL_INSIGHTS = [
  {
    category: 'diabetes',
    keywords: ['diabetes', 'sugar', 'metformin', 'glycomet', 'glimepiride', 'insulin', 'madhumeh', 'hba1c'],
    reply: "Diabetes medications (like Metformin) are best taken with or immediately after meals to reduce stomach discomfort. Always keep a fast-acting carb (like glucose, candy, or fruit juice) handy in case blood sugar drops below 70 mg/dL (hypoglycemia symptoms: shakiness, sweating, sudden dizziness)."
  },
  {
    category: 'hypertension',
    keywords: ['bp', 'blood pressure', 'hypertension', 'amlodipine', 'telmisartan', 'losartan', 'atenolol', 'high bp'],
    reply: "Blood pressure medicines should be taken at the exact same hour every day for consistent arterial pressure control. Avoid skipping doses even if your blood pressure reading feels normal. Limit sodium/salt intake and stay hydrated."
  },
  {
    category: 'thyroid',
    keywords: ['thyroid', 'thyronorm', 'eltroxin', 'levothyroxine', 'hypothyroid'],
    reply: "Thyroid medication (Levothyroxine / Thyronorm) MUST be taken on an empty stomach first thing in the morning with a full glass of plain water. Wait at least 45–60 minutes before having tea, coffee, milk, or breakfast for proper absorption."
  },
  {
    category: 'gastric',
    keywords: ['acidity', 'gas', 'pantocid', 'pantoprazole', 'omeprazole', 'rabeprazole', 'gelusil', 'digene', 'pet dard'],
    reply: "Antacids and Proton Pump Inhibitors (Pantoprazole, Omeprazole) work best when taken 30 minutes before your first meal of the day (empty stomach). If you take iron or calcium supplements, space them at least 2 hours apart from antacids."
  },
  {
    category: 'antibiotic',
    keywords: ['antibiotic', 'amoxicillin', 'azithromycin', 'augmentin', 'cefixime', 'infection'],
    reply: "Always complete the full course of antibiotics prescribed by your doctor, even if you feel completely better after 2 days. Stopping early can allow bacteria to develop resistance and cause reinfection. Take with food to avoid nausea."
  },
  {
    category: 'pain',
    keywords: ['paracetamol', 'dolo', 'crocin', 'calpol', 'fever', 'headache', 'pain', 'bukhar', 'dard', 'combiflam', 'ibuprofen'],
    reply: "Paracetamol (Dolo 650 / Crocin) is safe for fever and body aches. Never exceed 4,000 mg in 24 hours to protect your liver. Take pain relievers with food or after meals to protect your stomach lining."
  },
  {
    category: 'cardiac',
    keywords: ['heart', 'cholesterol', 'atorvastatin', 'rosuvastatin', 'aspirin', 'ecospirin', 'statin', 'chest'],
    reply: "Statins (Atorvastatin / Rosuvastatin) are most effective when taken at bedtime, as your liver synthesizes the most cholesterol overnight. Blood thinners like Ecosprin should always be taken after meals to prevent gastric bleeding."
  },
  {
    category: 'vitamins',
    keywords: ['vitamin', 'd3', 'b12', 'calcium', 'shelcal', 'zinc', 'multivitamin', 'becosules'],
    reply: "Vitamin D3 is fat-soluble and absorbs best when taken after a meal containing healthy fats (milk, curd, nuts). Calcium and Iron supplements should NEVER be taken at the exact same time — space them by at least 2 hours for full absorption."
  },
  {
    category: 'emergency',
    keywords: ['chest pain', 'heart attack', 'breathing problem', 'cant breathe', 'chhati dard', 'unconscious', 'faint', 'severe bleeding'],
    reply: "⚠️ URGENT MEDICAL ADVICE: If you or someone is experiencing sudden crushing chest pain, radiating pain down the arm, severe shortness of breath, or loss of consciousness, call emergency services immediately or press the red SOS button on your dashboard."
  },
  {
    category: 'missed_dose',
    keywords: ['miss', 'forgot', 'skip', 'dawa bhul', 'dawai bhul'],
    reply: "If you forgot to take a dose, take it as soon as you remember. However, if it's already near your next scheduled time, skip the missed dose and resume your regular schedule. NEVER double up doses to compensate."
  },
]

// ── Text Formatter ──
function FormattedText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*.*?\*\*)/g)
        return (
          <div key={li} style={{ minHeight: line.trim() === '' ? 8 : undefined, marginBottom: 3 }}>
            {parts.map((part, pi) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pi} style={{ color: 'inherit', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
              }
              return <span key={pi}>{part}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ──
function parseWaterIntake(text) {
  const lower = text.toLowerCase()
  const glassMatch = lower.match(/(\d+)\s*(?:glass|glasses)/)
  if (glassMatch) return parseInt(glassMatch[1], 10) * 250
  if (lower.includes('glass of water') || lower.includes('one glass') || lower.includes('1 glass') || lower.includes('ek glass')) return 250
  if (lower.includes('two glasses') || lower.includes('2 glasses') || lower.includes('do glass')) return 500

  const mlMatch = lower.match(/(\d+)\s*(?:ml|milliliter|millilitre)/)
  if (mlMatch) return parseInt(mlMatch[1], 10)

  const literMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|litre|liters|litres)/)
  if (literMatch) return Math.round(parseFloat(literMatch[1]) * 1000)

  if (lower.includes('water') || lower.includes('pani') || lower.includes('hydrat')) {
    const numMatch = lower.match(/(\d+)/)
    if (numMatch) {
      const val = parseInt(numMatch[1], 10)
      return val > 20 ? val : val * 250
    }
    return 250
  }
  return null
}

function parseMedicineSchedule(text) {
  const lower = text.toLowerCase()
  if (!lower.includes('med') && !lower.includes('tablet') && !lower.includes('pill') && !lower.includes('dose') && !lower.includes('dawai') && !lower.includes('goli') && !lower.includes('remind') && !lower.includes('schedule') && !lower.includes('take') && !lower.includes('add') && !lower.includes('start')) {
    return null
  }

  let name = ''
  const namePatterns = [
    /(?:add|schedule|take|prescribe|remind me to take|med|medicine|tablet|goli|dawai)\s+([a-zA-Z0-9\s]{2,25}?)(?:\s+\d+mg|\s+\d+ml|\s+tablet|\s+morning|\s+afternoon|\s+night|\s+evening|\s+before|\s+after|$)/i,
    /([A-Z][a-zA-Z0-9]+)/
  ]
  for (const p of namePatterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const cand = m[1].replace(/^(medicine|tablet|pill|dawai|goli|to|the|my|a|an)\s+/i, '').trim()
      if (cand && cand.length >= 3 && !['water','glass','schedule','remind','routine','pani'].includes(cand.toLowerCase())) {
        name = cand
        break
      }
    }
  }
  if (!name) {
    const words = text.split(/\s+/).filter(w => !['add','schedule','medicine','tablet','pill','water','take','remind','me','to','in','the','at','morning','night','evening','afternoon','after','before','food','with','pani','dawai','goli'].includes(w.toLowerCase()))
    if (words.length > 0) name = words[0]
  }

  if (!name || name.length < 2) return null

  let dosage = '1 tablet'
  const doseMatch = text.match(/(\d+\s*(?:mg|ml|mcg|iu|tablet|tablets|capsule|capsules|pill|pills|drops))/i)
  if (doseMatch) dosage = doseMatch[1]
  else if (text.match(/(\d+)\s*(?:tab|cap)/i)) dosage = text.match(/(\d+)\s*(?:tab|cap)/i)[1] + ' tablet'

  let times = []
  let slots = {
    morning:   { enabled: false, time: '08:00' },
    afternoon: { enabled: false, time: '13:00' },
    night:     { enabled: false, time: '21:00' }
  }

  if (lower.includes('morning') || lower.includes('subah') || lower.includes('breakfast')) {
    slots.morning.enabled = true
    times.push('08:00')
  }
  if (lower.includes('afternoon') || lower.includes('dopahar') || lower.includes('lunch')) {
    slots.afternoon.enabled = true
    times.push('13:00')
  }
  if (lower.includes('night') || lower.includes('evening') || lower.includes('dinner') || lower.includes('raat') || lower.includes('soote')) {
    slots.night.enabled = true
    times.push('21:00')
  }

  const timeExplicit = text.match(/(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (timeExplicit) {
    let hh = parseInt(timeExplicit[1], 10)
    const mm = timeExplicit[2] ? timeExplicit[2] : '00'
    const ampm = (timeExplicit[3] || '').toLowerCase()
    if (ampm === 'pm' && hh < 12) hh += 12
    if (ampm === 'am' && hh === 12) hh = 0
    const formatted = `${String(hh).padStart(2,'0')}:${mm}`
    times = [formatted]
    if (hh < 12) slots.morning = { enabled: true, time: formatted }
    else if (hh < 17) slots.afternoon = { enabled: true, time: formatted }
    else slots.night = { enabled: true, time: formatted }
  }

  if (times.length === 0) {
    slots.morning.enabled = true
    times.push('08:00')
  }

  let foodTiming = 'after'
  if (lower.includes('before food') || lower.includes('before meal') || lower.includes('empty stomach') || lower.includes('bhukhe pet')) foodTiming = 'before'
  if (lower.includes('with food') || lower.includes('with meal') || lower.includes('khate waqt')) foodTiming = 'with'

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    dosage,
    foodTiming,
    times,
    time: times[0],
    slots,
    duration: 14,
    notes: 'Scheduled via Sewaarthi AI',
    status: 'pending',
  }
}

export default function AIAssistant({ medicines = [], onAddMedicine, onUpdateStatus, onAddWater, onNavigate, user, userProfile, lang = 'en' }) {
  const [messages, setMessages] = useState([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkingTip, setThinkingTip] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceLang, setVoiceLang] = useState(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN')

  const recognitionRef = useRef(null)
  const endRef = useRef(null)

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const displayName = user?.displayName || userProfile?.name || user?.email?.split('@')[0] || 'Friend'

  // Dynamic context metrics
  const totalMeds = medicines.length
  const takenMeds = medicines.filter(m => m.status === 'taken').length
  const pendingMeds = medicines.filter(m => m.status === 'pending').length
  const waterGoal = parseFloat(userProfile?.waterGoalLiters || 2.5) * 1000
  const localWater = Number(localStorage.getItem('sw_water_' + (user?.uid || '') + '_' + today) || 0)
  const waterPercent = Math.min(Math.round((localWater / waterGoal) * 100), 100)
  const nextMed = medicines.find(m => m.status === 'pending')

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = voiceLang

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setInput(transcript)
        if (event.results[0].isFinal) {
          setIsListening(false)
          handleUserMessage(transcript)
        }
      }

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [voiceLang])

  // Text-to-Speech Vocalizer helper
  const speakText = (textToSpeak) => {
    if (!voiceEnabled || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel() // Stop any previous speech
      const clean = textToSpeak.replace(/\*\*/g, '').replace(/•/g, '').replace(/💡|💊|💧|⚖️|⏰|🍽️|✅|🚨|🤖/g, '')
      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = 0.95 // Slightly slower and clearer for seniors
      utterance.pitch = 1.0
      utterance.lang = voiceLang
      window.speechSynthesis.speak(utterance)
    } catch(e) {}
  }

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please use Google Chrome, Edge, or Safari.")
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.lang = voiceLang
        recognitionRef.current.start()
        setIsListening(true)
      } catch(e) {
        console.warn(e)
      }
    }
  }

  // Initial proactive greeting with context
  useEffect(() => {
    const greetingText = hour < 12 
      ? `Good morning, ${displayName}! 🌅\nI'm your Sewaarthi AI health companion. I'm actively monitoring your medication schedule and daily hydration.` 
      : hour < 17 
      ? `Good afternoon, ${displayName}! ☀️\nHope your day is going well. I'm here to help with your medications, health tracking, and wellness questions.`
      : `Good evening, ${displayName}! 🌙\nTime to wind down and ensure all today's medications and hydration goals are completed.`

    setMessages([
      {
        role: 'bot',
        text: greetingText,
        card: {
          type: 'daily_briefing',
          data: {
            takenMeds,
            totalMeds,
            pendingMeds,
            waterIntake: localWater,
            waterGoal,
            waterPercent,
            nextMed
          }
        }
      }
    ])
  }, [user, userProfile])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Dynamic intelligent prompt suggestions
  const dynamicChips = [
    nextMed ? `💊 Take ${nextMed.name}` : '📋 Today’s Meds',
    waterPercent < 100 ? '💧 Log 250ml Water' : '💧 Water Status',
    '⚖️ Check my BMI',
    '💊 Add new medicine',
    '🩺 Drug interactions advice',
    '📊 Daily Health Summary'
  ]

  const handleUserMessage = async (rawText) => {
    const msg = (rawText || input).trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    const lower = msg.toLowerCase()

    // ── 1. Mark Medicine as Taken via Chat ──
    const isMarkTaken = (lower.includes('took') || lower.includes('taken') || lower.includes('le li') || lower.includes('khali') || lower.includes('consumed') || lower.includes('mark')) && (lower.includes('med') || lower.includes('dawai') || lower.includes('goli') || medicines.some(m => lower.includes(m.name.toLowerCase())))
    if (isMarkTaken) {
      setThinkingTip('Checking active prescriptions...')
      const targetMed = medicines.find(m => lower.includes(m.name.toLowerCase())) || medicines.find(m => m.status === 'pending')
      if (targetMed) {
        if (onUpdateStatus) {
          try { await onUpdateStatus(targetMed.id, 'taken') } catch(e) {}
        }
        const confirmText = `Wonderful job! I have marked ${targetMed.name} as taken.`
        speakText(confirmText)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `Wonderful job! I have updated your dashboard adherence tracker:`,
            card: {
              type: 'taken_success',
              data: {
                name: targetMed.name,
                dosage: targetMed.dosage || '1 dose',
                time: targetMed.times ? targetMed.times.join(', ') : targetMed.time || 'Daily'
              }
            }
          }])
          setLoading(false)
        }, 500)
        return
      }
    }

    // ── 2. Log Water Intake ──
    const isWaterLog = (lower.includes('water') || lower.includes('pani') || lower.includes('drank') || lower.includes('drink')) && (lower.includes('add') || lower.includes('log') || lower.includes('drank') || lower.includes('glass') || lower.includes('ml') || lower.includes('piya') || lower.includes('had'))
    if (isWaterLog) {
      setThinkingTip('Updating hydration balance...')
      const ml = parseWaterIntake(msg) || 250
      let newTotal = null
      if (onAddWater) {
        try { newTotal = await onAddWater(ml) } catch(e) {}
      }
      const currentTotal = newTotal || (localWater + ml)
      const pct = Math.min(Math.round((currentTotal / waterGoal) * 100), 100)

      speakText(`Recorded ${ml} milliliters of water. Great job staying hydrated!`)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `Hydration recorded! Staying consistently hydrated promotes better drug absorption and kidney health.`,
          card: {
            type: 'water',
            data: {
              amount: ml,
              total: currentTotal,
              goal: waterGoal,
              percent: pct
            }
          }
        }])
        setLoading(false)
      }, 500)
      return
    }

    // ── 3. Schedule New Medicine ──
    const isMedAdd = (lower.includes('add') || lower.includes('schedule') || lower.includes('remind') || lower.includes('take') || lower.includes('start') || lower.includes('nayi dawai')) && (lower.includes('med') || lower.includes('tablet') || lower.includes('pill') || lower.includes('dawai') || lower.includes('goli') || lower.includes('mg') || lower.includes('dose'))
    if (isMedAdd) {
      setThinkingTip('Analyzing dosage, frequency & meal timing...')
      const medData = parseMedicineSchedule(msg)
      if (medData) {
        if (onAddMedicine) {
          try {
            await onAddMedicine({
              ...medData,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            })
          } catch(e) {}
        }
        speakText(`Scheduled ${medData.name} ${medData.dosage} with reminders.`)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `I have scheduled your medicine with reminders. Here are the confirmed details:`,
            card: {
              type: 'medicine',
              data: {
                name: medData.name,
                dosage: medData.dosage,
                times: medData.times,
                foodTiming: medData.foodTiming,
                duration: medData.duration
              }
            }
          }])
          setLoading(false)
        }, 600)
        return
      }
    }

    // ── 4. Medicine List & Schedule Inquiries ──
    if (lower.includes('my medicine') || lower.includes('what medicine') || lower.includes('scheduled medicine') || lower.includes('my dawai') || lower.includes('meds list') || lower.includes('aushadh') || lower.includes('list')) {
      setThinkingTip('Fetching your active prescription routine...')
      setTimeout(() => {
        if (!medicines || medicines.length === 0) {
          const resp = "You currently have no scheduled medicines."
          speakText(resp)
          setMessages(prev => [...prev, {
            role: 'bot',
            text: "You currently have no scheduled medicines. You can ask me to add one anytime, for example: 'Add Metformin 500mg morning and night after food'."
          }])
        } else {
          speakText(`You have ${medicines.length} active medicines scheduled.`)
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `Here is your active medication schedule (${medicines.length} medicine${medicines.length > 1 ? 's' : ''}):`,
            card: {
              type: 'medicine_list',
              data: { medicines }
            }
          }])
        }
        setLoading(false)
      }, 400)
      return
    }

    // ── 5. Water Status Inquiry ──
    if (lower.includes('how much water') || lower.includes('water status') || lower.includes('today water') || lower.includes('pani kitna') || lower.includes('hydration')) {
      setThinkingTip('Calculating daily hydration progress...')
      const pct = Math.min(Math.round((localWater / waterGoal) * 100), 100)
      speakText(`You have consumed ${localWater} milliliters of water today, which is ${pct} percent of your goal.`)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `Here is your hydration status for today (${today}):`,
          card: {
            type: 'water',
            data: {
              amount: 0,
              total: localWater,
              goal: waterGoal,
              percent: pct
            }
          }
        }])
        setLoading(false)
      }, 400)
      return
    }

    // ── 6. BMI Inquiry & Calculation ──
    if (lower.includes('bmi') || lower.includes('body mass') || lower.includes('mera bmi') || lower.includes('weight status') || lower.includes('vajan')) {
      setThinkingTip('Evaluating Body Mass Index & health range...')
      const hMatch = lower.match(/(?:height|h)\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\s*(cm|ft|feet|in)?/i) || lower.match(/(\d{2,3})\s*cm/i)
      const wMatch = lower.match(/(?:weight|w|wt)\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\s*(kg|kgs|lbs|pound)?/i) || lower.match(/(\d{2,3})\s*kg/i)
      
      let calcH = hMatch ? parseFloat(hMatch[1]) : (userProfile?.height ? parseFloat(userProfile.height) : null)
      let calcW = wMatch ? parseFloat(wMatch[1]) : (userProfile?.weight ? parseFloat(userProfile.weight) : null)

      if (calcH && calcW) {
        if (calcH <= 8.5) calcH = calcH * 30.48
        const hm = calcH / 100
        const calcB = (calcW / (hm * hm)).toFixed(1)
        const numB = parseFloat(calcB)
        const cat = numB < 18.5 ? 'Underweight (<18.5)' : numB < 25 ? 'Normal / Healthy Weight (18.5–24.9)' : numB < 30 ? 'Overweight (25–29.9)' : 'Obese (≥30)'
        const color = numB < 18.5 ? '#38bdf8' : numB < 25 ? '#00c48c' : numB < 30 ? '#fbbf24' : '#ff4d6a'
        const minW = (18.5 * hm * hm).toFixed(1)
        const maxW = (24.9 * hm * hm).toFixed(1)

        speakText(`Your BMI is ${calcB}, which falls in the ${cat} range. Healthy weight for your height is ${minW} to ${maxW} kilograms.`)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `Here is your comprehensive BMI assessment:`,
            card: {
              type: 'bmi',
              data: {
                bmi: calcB,
                height: Math.round(calcH),
                weight: calcW,
                category: cat,
                color,
                idealRange: `${minW} kg – ${maxW} kg`
              }
            }
          }])
          setLoading(false)
        }, 450)
        return
      } else {
        const askBmi = "To calculate your BMI, tell me your height and weight! For example: Calculate BMI for height 170cm and weight 65kg."
        speakText(askBmi)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: askBmi
          }])
          setLoading(false)
        }, 400)
        return
      }
    }

    // ── 7. Clinical Drug & Medical Knowledge Base ──
    for (const item of CLINICAL_INSIGHTS) {
      if (item.keywords.some(k => lower.includes(k))) {
        setThinkingTip('Reviewing pharmacological guidelines...')
        speakText(item.reply)
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: item.reply }])
          setLoading(false)
        }, 500)
        return
      }
    }

    // ── 8. Intelligent Default Health Response ──
    setThinkingTip('Processing health inquiry...')
    const defaultReply = "I am your voice-enabled health companion! You can speak or type to log water, schedule medicines, or ask health questions."
    speakText(defaultReply)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `I am your voice-enabled health companion! 🤖🎙️\n\nYou can speak or type to:\n• 💊 **Schedule or Mark Medicine:** "Add Paracetamol 500mg morning" or "I took my Metformin"\n• 💧 **Log Water:** "I drank 250ml water"\n• ⚖️ **Evaluate BMI:** "Calculate BMI for height 168cm weight 62kg"\n• 🩺 **Clinical Questions:** Ask about food timings, side effects, missed doses, or interactions!`
      }])
      setLoading(false)
    }, 550)
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div className="greeting s1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2>AI Voice & Health Assistant 🤖🎙️</h2>
          <p>Tap the microphone to speak in English, Hindi, or Marathi</p>
        </div>

        {/* Voice controls & Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={voiceLang}
            onChange={e => setVoiceLang(e.target.value)}
            style={{
              background: 'rgba(26,111,255,0.08)', border: '1px solid rgba(26,111,255,0.2)',
              color: 'var(--blue)', padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--ff)', outline: 'none'
            }}
          >
            <option value="en-IN">🇬🇧 English (IN)</option>
            <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
            <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
          </select>

          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled)
              if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel()
            }}
            title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            style={{
              background: voiceEnabled ? 'rgba(0,196,140,0.1)' : 'rgba(255,77,106,0.1)',
              border: `1px solid ${voiceEnabled ? 'rgba(0,196,140,0.25)' : 'rgba(255,77,106,0.25)'}`,
              color: voiceEnabled ? 'var(--success)' : 'var(--danger)',
              padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700
            }}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
        </div>
      </div>

      {/* ── QUICK ACTION CHIPS ── */}
      <div className="chips s2" style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
        {dynamicChips.map((q, i) => (
          <button key={i} className="chip" onClick={() => handleUserMessage(q)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            {q}
          </button>
        ))}
      </div>

      {/* ── CHAT CONTAINER ── */}
      <div className="card s3" style={{ flex: 1, display:'flex', flexDirection:'column', padding:'16px 20px' }}>
        <div className="chat-wrap" style={{ display:'flex', flexDirection:'column', height:'56vh' }}>
          <div className="chat-messages" style={{ flex:1, overflowY:'auto', paddingRight:6 }}>
            {messages.map((m, i) => (
              <div key={i} className={'chat-bubble ' + m.role} style={{ lineHeight:1.5, marginBottom:14, padding:'14px 18px' }}>
                {m.role === 'bot' && (
                  <div className="bot-label" style={{ fontWeight:800, marginBottom:6, color:'var(--blue)', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
                    🤖 Sewaarthi AI
                    <span style={{ fontSize:10, background:'rgba(26,111,255,0.1)', padding:'2px 6px', borderRadius:6, color:'var(--blue)', fontWeight:600 }}>Active Care</span>
                  </div>
                )}
                
                {/* Formatted Text */}
                <FormattedText text={m.text} />

                {/* ── 1. Daily Briefing Card ── */}
                {m.card && m.card.type === 'daily_briefing' && (
                  <div style={{ background:'linear-gradient(135deg, rgba(26,111,255,0.08) 0%, rgba(56,189,248,0.06) 100%)', border:'1.5px solid rgba(26,111,255,0.2)', borderRadius:18, padding:'16px 18px', marginTop:12 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'var(--blue)', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>⚡ Real-Time Health Summary</span>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>{today}</span>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                      <div style={{ background:'rgba(255,255,255,0.85)', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(26,111,255,0.12)' }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>💊 MEDICATIONS</div>
                        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginTop:2 }}>
                          {m.card.data.takenMeds} / {m.card.data.totalMeds} taken
                        </div>
                        <div style={{ fontSize:11, color: m.card.data.pendingMeds > 0 ? 'var(--warning)' : 'var(--success)', fontWeight:600, marginTop:2 }}>
                          {m.card.data.pendingMeds > 0 ? `${m.card.data.pendingMeds} pending` : 'All taken! ✅'}
                        </div>
                      </div>

                      <div style={{ background:'rgba(255,255,255,0.85)', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(56,189,248,0.2)' }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>💧 HYDRATION</div>
                        <div style={{ fontSize:15, fontWeight:800, color:'#0284c7', marginTop:2 }}>
                          {m.card.data.waterIntake} ml
                        </div>
                        <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginTop:2 }}>
                          {m.card.data.waterPercent}% of {m.card.data.waterGoal}ml
                        </div>
                      </div>
                    </div>

                    {m.card.data.nextMed && (
                      <div style={{ background:'rgba(26,111,255,0.06)', borderRadius:12, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed rgba(26,111,255,0.2)' }}>
                        <div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>Upcoming Dose:</div>
                          <strong style={{ fontSize:13, color:'var(--text)' }}>💊 {m.card.data.nextMed.name}</strong> ({m.card.data.nextMed.dosage})
                        </div>
                        <span style={{ background:'var(--blue)', color:'#fff', padding:'4px 8px', borderRadius:8, fontSize:11, fontWeight:700 }}>
                          ⏰ {m.card.data.nextMed.times ? m.card.data.nextMed.times[0] : m.card.data.nextMed.time}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 2. Medicine Scheduled Card ── */}
                {m.card && m.card.type === 'medicine' && (
                  <div style={{ background:'rgba(26,111,255,0.06)', border:'1.5px solid rgba(26,111,255,0.2)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:22 }}>💊</span>
                        <strong style={{ fontSize:16, color:'var(--text)' }}>{m.card.data.name}</strong>
                      </div>
                      <span style={{ background:'var(--blue)', color:'#fff', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>
                        {m.card.data.dosage}
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                      <div>⏰ <strong>Time:</strong> {m.card.data.times.join(', ')}</div>
                      <div>🍽️ <strong>Timing:</strong> {m.card.data.foodTiming} food</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, paddingTop:8, borderTop:'1px dashed rgba(26,111,255,0.18)', color:'var(--success)', fontWeight:700 }}>
                      <span>✅ Scheduled & Reminders Active</span>
                      <span style={{ color:'var(--text3)', fontWeight:500 }}>{m.card.data.duration} days</span>
                    </div>
                  </div>
                )}

                {/* ── 3. Medicine Marked Taken Card ── */}
                {m.card && m.card.type === 'taken_success' && (
                  <div style={{ background:'rgba(0,196,140,0.08)', border:'1.5px solid rgba(0,196,140,0.25)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ fontSize:26 }}>🎉</div>
                      <div>
                        <strong style={{ fontSize:15, color:'var(--success)' }}>Dose Confirmed Taken!</strong>
                        <div style={{ fontSize:12, color:'var(--text)', marginTop:2 }}>
                          {m.card.data.name} ({m.card.data.dosage}) · {m.card.data.time}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 4. Water Log Card ── */}
                {m.card && m.card.type === 'water' && (
                  <div style={{ background:'rgba(56,189,248,0.08)', border:'1.5px solid rgba(56,189,248,0.25)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:22 }}>💧</span>
                        <strong style={{ fontSize:15, color:'#0284c7' }}>
                          {m.card.data.amount > 0 ? `+${m.card.data.amount}ml Water Logged` : 'Hydration Tracker'}
                        </strong>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:'#0284c7' }}>{m.card.data.total}ml</span>
                    </div>
                    <div style={{ height:8, background:'rgba(56,189,248,0.2)', borderRadius:99, overflow:'hidden', marginTop:6 }}>
                      <div style={{ height:'100%', width:`${m.card.data.percent}%`, background:'linear-gradient(90deg,#38bdf8,#1a6fff)', borderRadius:99, transition:'width 0.4s ease' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginTop:6, fontWeight:600 }}>
                      <span>Daily Goal: {m.card.data.goal}ml</span>
                      <span style={{ color:'var(--blue)' }}>{m.card.data.percent}% Completed</span>
                    </div>
                  </div>
                )}

                {/* ── 5. BMI Metric Card ── */}
                {m.card && m.card.type === 'bmi' && (
                  <div style={{ background:'rgba(26,111,255,0.05)', border:'1.5px solid rgba(26,111,255,0.18)', borderRadius:16, padding:'14px 16px', marginTop:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:22 }}>⚖️</span>
                        <strong style={{ fontSize:15, color:'var(--text)' }}>BMI Evaluation</strong>
                      </div>
                      <span style={{ background:m.card.data.color, color:'#fff', padding:'4px 12px', borderRadius:99, fontSize:13, fontWeight:800 }}>
                        {m.card.data.bmi}
                      </span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:m.card.data.color, marginBottom:8 }}>
                      {m.card.data.category}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                      <span>Height: <strong>{m.card.data.height} cm</strong></span>
                      <span>Weight: <strong>{m.card.data.weight} kg</strong></span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text2)', borderTop:'1px dashed rgba(26,111,255,0.18)', paddingTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>🎯 Healthy weight target:</span>
                      <strong style={{ color:'var(--blue)' }}>{m.card.data.idealRange}</strong>
                    </div>
                  </div>
                )}

                {/* ── 6. Medicine Schedule List Card ── */}
                {m.card && m.card.type === 'medicine_list' && (
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                    {m.card.data.medicines.map((med, idx) => (
                      <div key={idx} style={{ background:'rgba(26,111,255,0.05)', border:'1px solid rgba(26,111,255,0.14)', borderRadius:12, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>💊 {med.name}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{med.dosage || '1 dose'} · {med.foodTiming || 'after'} food</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <span style={{ fontSize:11, background:'rgba(26,111,255,0.1)', color:'var(--blue)', padding:'3px 8px', borderRadius:8, fontWeight:700 }}>
                            ⏰ {med.times ? med.times.join(', ') : med.time || 'Daily'}
                          </span>
                          <div style={{ fontSize:10, color: med.status === 'taken' ? 'var(--success)' : 'var(--warning)', fontWeight:600, marginTop:3 }}>
                            {med.status === 'taken' ? '✓ Taken' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Context Analyzing Indicator */}
            {loading && (
              <div className="chat-bubble bot" style={{ padding:'12px 16px' }}>
                <div className="bot-label" style={{ fontWeight:800, marginBottom:4, color:'var(--blue)', display:'flex', alignItems:'center', gap:6 }}>
                  🤖 Sewaarthi AI
                  <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>{thinkingTip || 'Analyzing...'}</span>
                </div>
                <div className="typing"><span /><span /><span /></div>
              </div>
            )}

            {/* Live Voice Listening Pulse Bar */}
            {isListening && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,77,106,0.12), rgba(26,111,255,0.12))',
                border: '1.5px solid #ff4d6a', borderRadius: 16, padding: '12px 18px', marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                animation: 'pulseVoice 1.2s infinite'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🎙️</span>
                  <div>
                    <strong style={{ fontSize: 13, color: '#e03355' }}>Listening to your voice...</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      Speak now in {voiceLang === 'hi-IN' ? 'हिन्दी' : voiceLang === 'mr-IN' ? 'मराठी' : 'English'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleListening}
                  style={{
                    background: '#ff4d6a', color: '#fff', border: 'none', padding: '6px 12px',
                    borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Stop ⏹️
                </button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── INPUT ROW WITH MICROPHONE BUTTON ── */}
          <div className="chat-input-row" style={{ display:'flex', gap:8, marginTop:12, alignItems: 'center' }}>
            <button
              onClick={toggleListening}
              title={isListening ? 'Stop Listening' : 'Speak with Voice'}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: isListening
                  ? 'linear-gradient(135deg, #ff4d6a, #e03355)'
                  : 'linear-gradient(135deg, #1a6fff, #38bdf8)',
                color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, boxShadow: isListening ? '0 0 14px rgba(255,77,106,0.6)' : '0 3px 10px rgba(26,111,255,0.3)',
                transition: 'all 0.25s', animation: isListening ? 'pulseVoice 1s infinite' : 'none'
              }}
            >
              {isListening ? '⏹️' : '🎙️'}
            </button>

            <input
              className="chat-input"
              placeholder={isListening ? "Listening... Speak now..." : "Type or speak (e.g., 'Maine Metformin le li', 'Add 250ml water')..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleUserMessage()}
              style={{ flex:1, height: 44 }}
            />

            <button
              className="send-btn"
              onClick={() => handleUserMessage()}
              disabled={loading || !input.trim()}
              style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseVoice {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 77, 106, 0.6); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 77, 106, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 77, 106, 0); }
        }
      `}</style>
    </>
  )
}