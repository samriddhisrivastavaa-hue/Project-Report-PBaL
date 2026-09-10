# 📱 SMS Organizer & Classifier

An SMS organizer app that automatically classifies incoming messages into **Personal, Promotional, OTP, Transaction, and Service** categories, and flags **phishing/scam links** — built with a Node.js/Express/PostgreSQL backend and an Android (Kotlin + Jetpack Compose) app.

## 🔗 Live Demo

**[https://project-report-pbal.onrender.com](https://project-report-pbal.onrender.com)**

> Open the link above to see the app live — sign in with the one-click demo account, load sample messages, and try the "Live Classify" box to see any SMS get categorized in real time.
>
> Note: this is hosted on a free server, so if it hasn't been visited in a while, the first load can take ~30-50 seconds while it wakes up.

## ✨ Features

- Auto-classification of messages into 5 categories using a rule-based classifier (supports both English and Hindi keywords)
- Phishing/scam link detection (shortened URLs, IP-based links, lookalike domains, urgency keywords)
- Secure signup/login (bcrypt password hashing + JWT authentication)
- Archive and soft-delete for messages
- Reclassify existing messages whenever the classification rules are improved
- Android app: real SMS inbox import, real-time SMS classification, voice-to-text search, scheduled SMS sending, and an analytics dashboard
- Web demo (this deployed link): a browser-based version for quick, live demonstration without needing a phone

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, PostgreSQL (Neon), Prisma ORM
- **Frontend (mobile):** Kotlin, Jetpack Compose, Retrofit
- **Frontend (web demo):** HTML, CSS, vanilla JavaScript
- **Deployment:** Render

## 📂 Project Structure

- `server.js` — Express server and API routes
- `classifier.js` — message classification and phishing detection logic
- `prisma/` — database schema
- `public/` — web demo page (served by the backend)
