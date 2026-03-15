import { useEffect, useRef } from 'react'

// Checks every 30 seconds if it's time for a medicine
export default function ReminderSystem({ medicines, onReminder, onMissed }) {
  const notifiedRef = useRef(new Set())
  const missedRef = useRef(new Set())

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      medicines.forEach(med => {
        if (med.status !== 'pending') return

        // Reminder: exact time match
        if (med.time === hhmm && !notifiedRef.current.has(med.id)) {
          notifiedRef.current.add(med.id)
          onReminder(`${med.name} (${med.dosage})`)
          // Try browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💊 MediMind Reminder', {
              body: `Time to take ${med.name} — ${med.dosage}`,
              icon: '/favicon.ico',
            })
          }
        }

        // Missed: 15 min after scheduled time
        const [h, m] = med.time.split(':').map(Number)
        const scheduled = new Date()
        scheduled.setHours(h, m, 0, 0)
        const diff = (now - scheduled) / 60000 // minutes
        if (diff > 15 && diff < 1440 && med.status === 'pending' && !missedRef.current.has(med.id)) {
          missedRef.current.add(med.id)
          onMissed(med.id, 'missed')
        }
      })
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const interval = setInterval(check, 30000)
    check() // run immediately
    return () => clearInterval(interval)
  }, [medicines])

  return null
}