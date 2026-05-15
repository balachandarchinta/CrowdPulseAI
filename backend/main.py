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

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY else None

simulator = MatchSimulator()

async def generate_ai_commentary(match_state: dict):
    if not client:
        return {
            "en": f"Standard Commentary: {match_state['description']}",
            "hi": f"साधारण कमेंट्री: {match_state['description']}",
            "ta": f"சாதாரண வர்ணனை: {match_state['description']}"
        }
    
    prompt = f"""
    You are an energetic cricket commentator for CrowdPulse AI. 
    Match State: {match_state['teams']}, Score: {match_state['score']}, Overs: {match_state['overs']}, Event: {match_state['description']}.
    Current Momentum: {match_state['momentum']}%, Crowd Pulse: {match_state['crowd_pulse']}%.
    
    Provide a very short, punchy, futuristic commentary (1 sentence) in 3 languages: English, Hindi (Hinglish/Devanagari), and Tamil.
    Format as JSON: {{"en": "...", "hi": "...", "ta": "..."}}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"en": match_state['description'], "hi": "त्रुटि", "ta": "பிழை"}

@app.get("/")
async def root():
    return {"message": "CrowdPulse AI Backend is Running"}

@app.websocket("/ws/match")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Simulate match event
            match_state = simulator.get_event()
            
            # Generate AI commentary
            commentary = await generate_ai_commentary(match_state)
            match_state["commentary"] = commentary
            
            # Send to frontend
            await websocket.send_json(match_state)
            
            # Wait for next ball (randomized for simulation feel)
            await asyncio.sleep(random.uniform(3.0, 6.0))
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
