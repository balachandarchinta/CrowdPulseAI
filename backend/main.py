import os
import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from dotenv import load_dotenv
from match_engine import MatchSimulator

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Clients ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client  = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
simulator      = MatchSimulator()

print("[CrowdPulse AI] Mode: Simulation (CSK vs LSG)")

# ── Gemini: Multilingual commentary for simulator ────────────────────────────
async def gemini_commentary_simulator(match_state: dict) -> dict:
    if not gemini_client:
        return {
            "en": f"Match Update: {match_state['description']}",
            "hi": f"मैच अपडेट: {match_state['description']}",
            "ta": f"மேட்ச் அப்டேட்: {match_state['description']}",
        }

    prompt = f"""You are CrowdPulse AI — an electrifying IPL 2026 commentator for CSK vs LSG.

Match State: {match_state['teams']}, Score: {match_state['score']}, Overs: {match_state['overs']}.
Target: 185, RRR: {match_state.get('rrr', '—')}
Event: {match_state['description']}
Momentum: {match_state['momentum']}%, Crowd Pulse: {match_state['crowd_pulse']}%

Write ONE short, punchy, dramatic IPL commentary snippet (max 12 words) in 3 languages:
- English (en): dramatic broadcast style (mentioning Dhoni, Gaikwad, or Rahul if applicable)
- Hindi (hi): Hinglish mix ( passionate style )
- Tamil (ta): Passionate Tamil style (e.g. 'Aatam arambam!')

Respond ONLY with valid JSON:
{{"en": "...", "hi": "...", "ta": "..."}}"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"[Gemini] Commentary error: {e}")
        return {"en": match_state["description"], "hi": "...", "ta": "..."}

@app.get("/")
async def root():
    return {"message": "CrowdPulse AI Backend Running (Simulator Mode)"}

@app.websocket("/ws/match")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Client connected")

    try:
        while True:
            # ── SIMULATOR MODE ──
            sim_state = simulator.get_event()
            
            # Add RRR calculation for frontend
            runs = int(sim_state["score"].split("/")[0])
            overs = float(sim_state["overs"])
            runs_left = 185 - runs
            overs_left = 20 - overs
            rrr = round(runs_left / (overs_left if overs_left > 0 else 0.1), 1)
            sim_state["rrr"] = rrr if runs_left > 0 else 0

            # Generate AI commentary
            commentary = await gemini_commentary_simulator(sim_state)
            sim_state["commentary"] = commentary
            
            await websocket.send_json(sim_state)
            
            # Real-time pacing
            await asyncio.sleep(random.uniform(4.0, 7.0))

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")

if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable for Cloud Run, default to 8000 for local
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
