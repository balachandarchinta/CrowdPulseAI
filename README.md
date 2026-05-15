# ⚡ CrowdPulse AI - IPL 2026 Dashboard

CrowdPulse AI is an immersive, real-time fan engagement dashboard designed for the **IPL 2026 CSK vs LSG** match. It combines live match simulation, AI-driven multilingual commentary, and emotional analytics to create a "Neon Stadium" experience.

![Dashboard Preview](https://via.placeholder.com/1200x600/0a0a0f/gold?text=CrowdPulse+AI+-+Neon+Stadium+Experience)

## 🌟 Key Features

- **🏆 Real-time Match Simulation**: High-fidelity CSK vs LSG match engine with realistic scoring (capped at 250/10) and automatic innings resets.
- **🤖 Gemini 2.0 Flash Commentary**: AI-generated, dramatic commentary in **English, Hindi, and Tamil**.
- **📊 Emotional Analytics**:
  - **Pulse Meter**: Real-time stadium energy tracking.
  - **Momentum Tracker**: Dynamic shift in match control.
  - **Pressure Gauge**: Visualizing high-stakes moments.
- **🎨 Neon Stadium UI**: Premium glassmorphism design with team-specific gold (CSK) and teal (LSG) branding.
- **☁️ Cloud-Native Backend**: Deployed on **Google Cloud Run** for global scalability.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Vanilla CSS (Custom Design System).
- **Backend**: FastAPI (Python 3.11), WebSockets.
- **AI Engine**: Google Gemini 2.0 Flash API.
- **Infrastructure**: Docker, Google Artifact Registry, Google Cloud Run.

## 🚀 Cloud Deployment (Backend)

The backend is containerized and ready for Google Cloud Run.

```bash
# Build and Push
gcloud builds submit --tag gcr.io/[PROJECT_ID]/crowdpulse-backend .

# Deploy
gcloud run deploy crowdpulse-backend \
  --image gcr.io/[PROJECT_ID]/crowdpulse-backend \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars "GEMINI_API_KEY=[YOUR_KEY]"
```

## 📈 Match Metrics (Current Settings)

| Metric | Constraint |
| :--- | :--- |
| **Max Score** | 250 Runs |
| **Max Wickets** | 10 Wickets |
| **Overs** | 20.0 Overs |
| **Target** | 185 Runs (CSK Chase) |
| **Commentary** | Multilingual (EN, HI, TA) |

## 📦 Local Installation

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/balachandarchinta/CrowdPulseAI.git
   ```

2. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
Developed with ❤️ for IPL Fans by CrowdPulse AI Team.
