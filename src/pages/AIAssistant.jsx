import { useState, useRef, useEffect } from 'react'

const SUGGESTED = [
  'When should I take my medicine?',
  'What if I miss a dose?',
  'Can I take paracetamol after food?',
  'How to manage diabetes medicines?',
  'What are common side effects?',
  'How to store medicines properly?',
  'Can I take two medicines together?',
]

const RESPONSES = [
  {
    keywords: ['miss', 'forgot', 'skip'],
    reply: "If you miss a dose, take it as soon as you remember. If it's almost time for the next dose, skip the missed one — never double up. Consult your doctor if you miss multiple doses regularly."
  },
  {
    keywords: ['when', 'time', 'schedule'],
    reply: "Take medicines at the same time every day for best results. Set a daily alarm as a reminder. Morning medicines are best taken after breakfast, night medicines after dinner."
  },
  {
    keywords: ['paracetamol', 'before', 'after', 'food'],
    reply: "Paracetamol can be taken before or after food. However, taking it after food reduces the chance of stomach irritation. Always follow your doctor's specific instructions."
  },
  {
    keywords: ['diabetes', 'metformin', 'sugar', 'blood sugar'],
    reply: "Diabetes medicines like Metformin are usually taken with or after meals. Monitor blood sugar regularly, maintain a healthy diet, and never skip doses. Regular checkups are important."
  },
  {
    keywords: ['side effect', 'reaction', 'allergy'],
    reply: "Common side effects include nausea, dizziness, headache, or fatigue. These usually improve after a few days. Contact your doctor immediately for severe reactions like rash, swelling, or difficulty breathing."
  },
  {
    keywords: ['store', 'storage', 'keep'],
    reply: "Store medicines in a cool, dry place away from sunlight. Keep them away from children. Some medicines like insulin need refrigeration. Check the label for specific storage instructions."
  },
  {
    keywords: ['together', 'combine', 'mix', 'two', 'multiple'],
    reply: "Taking multiple medicines together can sometimes cause interactions. Always tell your doctor about all medicines you take. Never combine medicines without consulting your doctor first."
  },
  {
    keywords: ['blood pressure', 'bp', 'hypertension'],
    reply: "Blood pressure medicines should be taken at the same time every day, even when you feel well. Skipping doses can cause dangerous spikes. Reduce salt intake and maintain a healthy lifestyle."
  },
  {
    keywords: ['antibiotic', 'amoxicillin', 'course'],
    reply: "Always complete the full course of antibiotics even if you feel better. Stopping early can cause the infection to return and create antibiotic resistance. Take with food to reduce stomach upset."
  },
  {
    keywords: ['vitamin', 'supplement'],
    reply: "Vitamins and supplements are best taken after meals to improve absorption. Vitamin D is best taken with a fatty meal. Consult your doctor for the right dosage based on your needs."
  },
  {
    keywords: ['expired', 'expiry', 'date'],
    reply: "Never take expired medicines as they may be ineffective or harmful. Check expiry dates regularly and safely dispose of expired medicines. Return them to a pharmacy for safe disposal."
  },
  {
    keywords: ['pregnant', 'pregnancy', 'breastfeed'],
    reply: "Many medicines are not safe during pregnancy or breastfeeding. Always inform your doctor if you are pregnant or breastfeeding before taking any medicine, including vitamins and supplements."
  },
  {
    keywords: ['child', 'baby', 'infant', 'kid'],
    reply: "Children's doses are different from adults. Never give adult medicines to children without consulting a doctor. Use the correct dose based on the child's weight and age."
  },
  {
    keywords: ['alcohol', 'drink'],
    reply: "Alcohol can interact with many medicines, making them less effective or more dangerous. Avoid alcohol when taking antibiotics, painkillers, sleep medicines, or blood pressure medicines."
  },
  {
    keywords: ['pain', 'painkiller', 'ibuprofen'],
    reply: "Painkillers like Ibuprofen should be taken after food to protect the stomach. Don't take them for more than a few days without consulting a doctor. Avoid if you have stomach ulcers."
  },
]

const DEFAULT_REPLY = "I'm Sewaarthi AI, your medication assistant! I can help with questions about medicine timing, missed doses, side effects, storage, and general health guidance. Please consult your doctor for personalized medical advice. Type your question below! 💊"

function getReply(msg) {
  const lower = msg.toLowerCase()
  for (const item of RESPONSES) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item.reply
    }
  }
  return DEFAULT_REPLY
}

export default function AIAssistant({ medicines }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hello! I'm Sewaarthi AI 🤖 Ask me anything about your medicines, dosage timing, side effects, or general health questions!"
    }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    // Simulate thinking delay
    setTimeout(() => {
      const reply = getReply(msg)
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
      setLoading(false)
    }, 800)
  }

  return (
    <>
      <div className="greeting s1">
        <h2>AI Assistant 🤖</h2>
        <p>Ask anything about your medicines</p>
      </div>

      <div className="chips s2">
        {SUGGESTED.map((q, i) => (
          <button key={i} className="chip" onClick={() => send(q)}>{q}</button>
        ))}
      </div>

      <div className="card s3" style={{ flex: 1 }}>
        <div className="chat-wrap">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={'chat-bubble ' + m.role}>
                {m.role === 'bot' && <div className="bot-label">🤖 Sewaarthi AI</div>}
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble bot">
                <div className="bot-label">🤖 Sewaarthi AI</div>
                <div className="typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about your medicines..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}>
              →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}