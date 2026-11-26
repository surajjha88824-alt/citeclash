# CiteClash - AI Search / GEO Visibility & Competitor Battle-Card Platform

CiteClash is a production-grade B2B SaaS platform that helps brands monitor, benchmark, and optimize their Generative Engine Optimization (GEO) and citation visibility across modern AI search engines (ChatGPT Search, Perplexity AI, Google AI Overviews, Claude, Gemini).

---

## 🏗️ Architecture Overview

```text
getclash/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # auth, workspaces, audits, tickets, health
│   │   ├── core/              # config, database, security, exceptions, deps
│   │   ├── models/            # SQLAlchemy Async 2.0 models (User, Workspace, etc.)
│   │   └── schemas/           # Pydantic v2 validation schemas
│   ├── alembic/               # PostgreSQL / Supabase migration scripts
│   ├── .env.example           # Environment template
│   └── requirements.txt       # FastAPI & SQLAlchemy dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Glassmorphism & UI components
│   │   ├── lib/               # Typed Axios client & helpers
│   │   ├── App.tsx            # Aurora ambient animated Battle-Card Simulator
│   │   └── index.css          # Dynamic color shifts, glassmorphism, keyframes
│   ├── .env.example           # Frontend environment template
│   └── package.json           # Vite, React, TS, Tailwind CSS, Framer Motion
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI server with auto-reload
uvicorn app.main:app --reload --port 8000
```
- Interactive API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Database Migrations (PostgreSQL / Supabase)

To apply migrations to your PostgreSQL or Supabase database instance:
```bash
cd backend
alembic upgrade head
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Frontend application URL: [http://localhost:5173](http://localhost:5173)

---

## 🔒 Security & Tenant Isolation

- **Strict Ownership Dependency:** Workspaces and their sub-resources (tracked prompts, audit runs) enforce strict ownership matching against the authenticated user's ID. Cross-tenant leakage is prevented with `403 Forbidden` exceptions.
- **JWT Authentication:** Dual-token architecture with short-lived HMAC-SHA256 Access Tokens and long-lived Refresh Tokens.
- **Password Security:** Salted bcrypt hashing via Passlib.
- **Role-Based Access:** Standard user accounts and `super_admin` role separation for support and operational management.
