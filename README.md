# 💊 Sewaarthi — Smart Medicine Reminder & AI-Assisted Pill Management

> A React-based healthcare web application designed to help elderly users manage medication schedules efficiently with AI assistance and IoT integration simulation.

This project combines **AI**, **web development**, and **IoT concepts** to create a smart medication management system.

---

## 🚀 Features

### 🧭 Dashboard
- View all medicines
- Mark medicines as **Taken / Missed**
- Track adherence statistics

### ➕ Add Medicine
Add new medicines with:
- Medicine name
- Dosage
- Time schedule
- Before/after food timing
- Duration

### ⏰ Smart Reminder System
- Automatically checks reminders every **30 seconds**
- Sends **browser notifications**
- Alerts users for upcoming medication

### ⚠️ Missed Dose Detection
- Automatically marks medicine as **missed**
- Triggered if dose not taken within **15 minutes**

### 🔐 Authentication
- Email/Password login and signup
- Google Sign In
- Powered by **Firebase Auth**
- Each user's data is private and secure

### 🤖 AI Chat Assistant
- Ask medicine-related questions
- Powered by **Claude AI**
- Includes fallback response system

### 📷 Prescription Scanner
- Upload prescription image
- Simulated OCR extraction
- Helps auto-fill medicine data

### 🔌 IoT Pill Dispenser Simulation
Simulated hardware system using:
- ESP32
- MQTT protocol
- Servo motor dispenser
- Smart alert system

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Pure CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI | Claude API |
| Deployment | Vercel |

---

## 📦 Run Project Locally

Clone the repository:
```bash
git clone https://github.com/Sahili04/Anant-medicare.git
```

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Open:
```
http://localhost:5173
```

---

## 🔧 Firebase Setup

Create a project at **firebase.google.com** and update `src/firebase.js`:
```js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
}
```

Enable in Firebase Console:
- ✅ Firestore Database — test mode
- ✅ Authentication — Email/Password
- ✅ Authentication — Google

---

## 🌐 Deploy to Vercel

Install CLI:
```bash
npm install -g vercel
```

Deploy:
```bash
vercel
```

---

## 🔮 Future IoT Integration

The application can connect to a smart pill dispenser hardware system built using:

### Hardware Components
| Component | Purpose |
|-----------|---------|
| ESP32 | WiFi-enabled microcontroller |
| DS3231 RTC | Real-time clock module |
| MG996R Servo | Pill dispensing motor |
| LCD 16x2 | Local status display |
| Buzzer | Audio medication alert |

### Communication Protocol
- **MQTT** over WiFi
- Broker: `medimind.local:1883`
- Web app sends dispense command → ESP32 executes → sends confirmation back

---

## 📁 Project Structure
```
src/
  components/
    ReminderSystem.jsx
  pages/
    Dashboard.jsx
    AddMedicine.jsx
    AIAssistant.jsx
    PrescriptionScanner.jsx
    IoTDevice.jsx
    Login.jsx
  firebase.js
  App.jsx
  main.jsx
  index.css
```

---

## 🎯 Project Goal

To create an AI-assisted medication management platform that helps users — especially **elderly patients** — maintain proper medication adherence and reduce missed doses.


## 📄 License

MIT License — Free to use and modify.
