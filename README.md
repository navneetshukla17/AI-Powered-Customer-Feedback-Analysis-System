# Noted — AI-Powered Feedback & Resolution

> **Hear it. Respond. Resolve.**  
> Noted closes the customer feedback loop — from submission to resolution — using sentiment-aware AI responses and a structured three-email communication lifecycle.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Qwen-2 7B](https://img.shields.io/badge/LLM-Qwen--2%207B-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/Qwen/Qwen2-7B-Instruct)
[![Resend](https://img.shields.io/badge/Email-Resend-000000?style=flat-square)](https://resend.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🚀 View Live](https://your-live-url.com) &nbsp;·&nbsp; [📋 PRD](./PRD_AI_Powered_Customer_Feedback.docx) &nbsp;·&nbsp; [🐛 Report a Bug](https://github.com/navneetshukla17/noted/issues)

---

## The Problem

Most businesses collect customer feedback and do nothing visible with it. Customers submit reviews and hear silence — no acknowledgement, no timeline, no closure. This erodes trust and kills re-engagement.

**Noted fixes three broken moments in the feedback lifecycle:**

| Broken Moment | What Noted Does |
|---|---|
| No acknowledgement | Sends a sentiment-matched AI email within 5 seconds of submission |
| No timeline | Lets admins commit to a TAT and notify the customer instantly |
| No closure | Triggers a resolution email referencing the original complaint and what changed |

---

## System Architecture

![Noted System Architecture](./system_architecture.svg)

The system is structured across two clear boundaries — a **React frontend** consumed by two personas (customers and admins), and a **Node.js backend** that owns AI inference, email delivery, and SQLite persistence. Every feedback item moves through a defined status lifecycle: `submitted → acknowledged → in-progress → resolved`.

---

## Key Features

### For Customers
- **Feedback Form** — star rating (1–5) + written review + email address, with real-time validation
- **Instant AI Response** — Qwen-2 7B generates a personalised reply inline on submission
- **Sentiment-Matched Email** — acknowledgement email tone matches the customer's rating tier automatically

### For Admins
- **Analytics Dashboard** — total reviews, average rating, positive/negative split, rating distribution chart, submission timeline
- **Per-Review AI Analysis** — one-sentence summary + three prioritised action items, generated on demand with regeneration support
- **TAT Commitment Workflow** — send a turnaround time promise to the customer directly from the dashboard
- **Resolution Email Trigger** — mark feedback as resolved and notify the customer with context of what changed

### Under the Hood
- **Three-Stage Email Loop** — acknowledgement → TAT → resolution, each with three sentiment variants (positive / neutral / negative)
- **SQLite Persistence** — full feedback lifecycle stored with UUID identifiers, status tracking, and email event logging
- **Graceful Degradation** — hardcoded fallback responses when the Hugging Face API is unavailable; email features degrade cleanly without crashing the app

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | Customer portal and admin dashboard |
| Styling | Tailwind CSS + shadcn/ui | Component design system |
| Charts | Recharts | Rating distribution and timeline analytics |
| Backend | Node.js + Express | REST API and business logic |
| Database | SQLite (better-sqlite3) | Feedback lifecycle persistence |
| AI / LLM | Qwen-2 7B via Hugging Face | Response generation and analysis |
| Email | Resend.com | Transactional email delivery |
| Config | dotenv | Environment variable management |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A [Hugging Face API token](https://huggingface.co/settings/tokens)
- A [Resend.com API key](https://resend.com) (free tier — 3,000 emails/month)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/navneetshukla17/noted.git
cd noted
```

**2. Configure environment variables**

Copy the example file and fill in your credentials:
```bash
cp .env.example .env
```

```env
HF_TOKEN=your_huggingface_api_token
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=feedback@yourdomain.com
DATABASE_PATH=./data/feedback.db
PORT=3001
```

> **Note:** The app starts with a warning (not a crash) if `RESEND_API_KEY` is missing — email features are disabled gracefully. The app will crash on startup with a clear error if `HF_TOKEN` is missing.

**3. Install and run the backend**
```bash
cd backend
npm install
npm run dev
```

The SQLite database is initialised automatically on first startup. No migration step required.

**4. Install and run the frontend**
```bash
cd frontend
npm install
npm run dev
```

The app is now running at `http://localhost:5173`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/feedback` | Submit feedback — generates AI reply, sends acknowledgement email, writes to DB |
| `GET` | `/api/feedback` | Returns all feedback records for the admin dashboard |
| `POST` | `/api/feedback/:id/analysis` | Triggers AI summary and action item generation for a specific record |
| `POST` | `/api/feedback/:id/tat` | Sends TAT commitment email, updates status to `acknowledged` |
| `POST` | `/api/feedback/:id/resolve` | Sends resolution closure email, updates status to `resolved` |

---

## Database Schema

```sql
-- Feedback lifecycle table
CREATE TABLE feedback (
  id              TEXT PRIMARY KEY,        -- UUID
  timestamp       TEXT NOT NULL,
  email           TEXT NOT NULL,
  rating          INTEGER NOT NULL,        -- 1–5
  review          TEXT NOT NULL,
  ai_response     TEXT,
  summary         TEXT,
  actions         TEXT,                    -- JSON array
  status          TEXT DEFAULT 'submitted',-- submitted | acknowledged | in-progress | resolved
  tat_sent_at     TEXT,
  resolved_at     TEXT,
  resolution_notes TEXT
);

-- Email event log
CREATE TABLE email_events (
  id          TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL,
  event_type  TEXT NOT NULL,              -- acknowledgement | tat | resolution
  sent_at     TEXT NOT NULL,
  success     INTEGER NOT NULL            -- 1 = delivered, 0 = failed
);
```

---

## Sentiment Classification

Noted uses rating tiers to determine AI tone across all three email stages:

| Rating | Tier | Response Tone |
|---|---|---|
| 4–5 ⭐ | Positive | Warm, grateful, celebratory |
| 3 ⭐ | Neutral | Professional, balanced, improvement-focused |
| 1–2 ⭐ | Negative | Apologetic, solution-oriented, trust-rebuilding |

---

## Project Structure

```
noted/
├── backend/
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   ├── db/             # SQLite init and query helpers
│   │   ├── ai/             # Hugging Face inference client
│   │   └── emails/         # Resend client + 9 email templates
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # FeedbackForm, AdminDashboard
│   │   └── main.jsx
│   └── index.html
├── .env.example
└── README.md
```

---

## Roadmap

- [ ] Admin authentication (JWT-based login)
- [ ] Editable AI responses before email send
- [ ] Multi-language email template support
- [ ] Word cloud and topic modelling on the admin dashboard
- [ ] PostgreSQL migration path for production scale
- [ ] Webhook / CRM integration (Salesforce, HubSpot)
- [ ] Mobile-responsive React Native companion

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Built by

**Navneet Shukla**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/navneet-shukla17/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat-square&logo=github&logoColor=white)](https://github.com/navneetshukla17)