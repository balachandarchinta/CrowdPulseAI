import asyncio
import os
import json
from dotenv import load_dotenv
from cricbuzz_client import CricbuzzClient

load_dotenv()

async def test():
    key = os.getenv("RAPIDAPI_KEY")
    match_id = os.getenv("CRICBUZZ_MATCH_ID", "152152")
    
    print(f"Testing Cricbuzz API for Match ID: {match_id}")
    client = CricbuzzClient(api_key=key, match_id=match_id)
    
    # 1. Test full match info
    print("\n--- Match Info ---")
    info = await client.get_match_score()
    if info:
        print(json.dumps(info, indent=2)[:1000])
    else:
        print("Failed to get match info.")

    # 2. Test commentary
    print("\n--- Latest Ball ---")
    ball = await client.get_latest_ball()
    if ball:
        print(json.dumps(ball, indent=2))
    else:
        print("No new ball or failed to get commentary.")

if __name__ == "__main__":
    asyncio.run(test())
