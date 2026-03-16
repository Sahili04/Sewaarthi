import { useState, useRef, useEffect } from 'react'

const SUGGESTED = [
  'When should I take my medicine?',
  'What if I miss a dose?',
  'Can I take paracetamol after food?',
  'How to manage diabetes medicines?',
  'What are common side effects?',
]

const RESPONSES = {
  miss:     "If you miss a dose, take it as soon as you remember. If it's almost time for the next, skip the missed one — never double up. See your doctor if missing multiple doses.",
  when:     "Take medicines at the same time every day for best results. Check your prescription label for specific instructions.",
  food:     "Some medicines need an empty stomach (before food); others need food to reduce irritation (after food). Always follow your doctor's advice.",
  side:     "Common side effects include nausea, dizziness, or headache. Contact your doctor immediately for severe reactions.",
  diabetes: "Diabetes medicines like Metformin are usually taken with meals. Monitor blood sugar regularly and never skip doses.",
  bp:       "Blood pressure medicines should be taken at the same time daily, even when you feel well. Never skip doses.",
  default:  "I'm Sewaarthi AI! I can help with medication timing, missed doses, food interactions, and general health questions. Always consult your doctor for personal medical decisions.",
}

const getReply = msg => {
  const l = msg.toLowerCase()
  for (const [k,v] of Object.entries(RESPONSES)) if (l.includes(k)) return v
  return RESPONSES.default
}

export default function AIAssistant({ medicines }) {
  const [messages, setMessages] = useState([
    { role:'bot', text:"Hello! I'm Sewaarthi AI 🤖 Ask me anything about your medicines, dosage timing, or health questions!" }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async text => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role:'user', text:msg }])
    setLoading(true)
    try {
      const medList = medicines.map(m=>`${m.name} (${m.dosage} at ${m.time})`).join(', ')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:300,
          system:`You are Sewaarthi AI, a helpful medication assistant. Be concise and friendly. Patient medicines: ${medList||'none'}. Under 100 words.`,
          messages:[{ role:'user', content:msg }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role:'bot', text: data.content?.[0]?.text || getReply(msg) }])
      } else throw new Error()
    } catch {
      setTimeout(() => setMessages(prev => [...prev, { role:'bot', text:getReply(msg) }]), 600)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="greeting s1">
        <h2>AI Assistant 🤖</h2>
        <p>Ask anything about your medicines</p>
      </div>

      <div className="chips s2">
        {SUGGESTED.map((q,i) => <button key={i} className="chip" onClick={() => send(q)}>{q}</button>)}
      </div>

      <div className="card s3" style={{ flex:1 }}>
        <div className="chat-wrap">
          <div className="chat-messages">
            {messages.map((m,i) => (
              <div key={i} className={'chat-bubble ' + m.role}>
                {m.role==='bot' && <div className="bot-label">🤖 Sewaarthi AI</div>}
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble bot">
                <div className="bot-label">🤖 Sewaarthi AI</div>
                <div className="typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input className="chat-input" placeholder="Ask about your medicines..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !loading && send()} />
            <button className="send-btn" onClick={() => send()} disabled={loading||!input.trim()}>→</button>
          </div>
        </div>
      </div>
    </>
  )
}