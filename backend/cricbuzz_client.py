import aiohttp
from typing import Optional, Dict, Any

# Cricbuzz RapidAPI event type mappings
EVENT_MAP = {
    "FOUR":     "4",
    "SIX":      "6",
    "WICKET":   "W",
    "DOT":      "0",
    "ONE":      "1",
    "TWO":      "2",
    "THREE":    "3",
    "WIDE":     "WD",
    "NO BALL":  "NB",
    "NO_BALL":  "NB",
    "OVERTHROW": "4",
}

class CricbuzzClient:
    BASE_URL = "https://cricbuzz-cricket.p.rapidapi.com"

    def __init__(self, api_key: str, match_id: str = "152152"):
        self.api_key = api_key
        self.match_id = match_id
        self.headers = {
            "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
            "x-rapidapi-key": api_key,
            "Content-Type": "application/json",
        }
        self._last_unique_id: Optional[str] = None

    async def _get(self, path: str) -> Optional[Dict]:
        url = f"{self.BASE_URL}{path}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, timeout=aiohttp.ClientTimeout(total=6)) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    print(f"[Cricbuzz] HTTP {resp.status} for {path}")
                    return None
        except Exception as e:
            print(f"[Cricbuzz] Request error: {e}")
            return None

    async def get_latest_ball(self) -> Optional[Dict]:
        """
        Fetches the latest new ball from Cricbuzz commentary.
        Returns None if no new ball since last call.
        """
        data = await self._get(f"/mcenter/v1/{self.match_id}/comm")
        if not data:
            return None

        commentary_list = data.get("commentaryList", [])
        if not commentary_list:
            return None

        # First entry is the most recent over
        latest_over = commentary_list[0]
        comms = latest_over.get("commsList", [])
        if not comms:
            return None

        ball = comms[0]  # First item = most recent ball
        over_num   = ball.get("overNumber", 0)
        ball_num   = ball.get("ballNbr", 0)
        unique_id  = f"{over_num}.{ball_num}"

        # Deduplicate — only return if we haven't seen this ball before
        if unique_id == self._last_unique_id:
            return None
        self._last_unique_id = unique_id

        raw_event      = str(ball.get("event", "")).upper()
        comm_text      = ball.get("commText", "").strip()
        runs_obj       = ball.get("runs", {})
        total_runs     = runs_obj.get("totalRuns", 0)
        wickets        = runs_obj.get("wickets", 0)
        bat_team       = ball.get("batTeamName", "")

        mapped_event = EVENT_MAP.get(raw_event, "0")

        return {
            "over":        f"{over_num}.{ball_num}",
            "event":       mapped_event,
            "raw_event":   raw_event,
            "comm_text":   comm_text,
            "total_runs":  total_runs,
            "wickets":     wickets,
            "bat_team":    bat_team,
        }

    async def get_match_score(self) -> Optional[Dict]:
        """Fetch current match score / details."""
        return await self._get(f"/mcenter/v1/{self.match_id}")
