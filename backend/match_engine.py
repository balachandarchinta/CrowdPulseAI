import random
import time
from typing import Dict, Any

class MatchSimulator:
    def __init__(self):
        self.team1 = "CSK"
        self.team2 = "LSG"
        self.reset_match()

    def reset_match(self):
        """Resets the match to the start of the innings."""
        self.score = 0
        self.wickets = 0
        self.overs = 0
        self.balls = 0
        self.target = 185
        self.win_prob = 50.0
        self.momentum = 50
        self.pressure = 30
        self.crowd_pulse = 40
        self.is_active = True
        self.history = []

    def get_event(self) -> Dict[str, Any]:
        """Simulates a single ball and returns the event details."""
        # Reset if match is over (20 overs or 10 wickets or target reached)
        if self.overs >= 20 or self.wickets >= 10 or self.score >= self.target:
            self.reset_match()

        outcomes = ["0", "1", "2", "3", "4", "6", "W", "WD", "NB"]
        weights = [35, 25, 10, 2, 10, 8, 4, 3, 2] # Reduced W weight slightly
        
        event_type = random.choices(outcomes, weights=weights)[0]
        
        description = ""
        pulse_change = random.randint(-2, 5)
        
        if event_type == "W":
            self.wickets += 1
            description = f"OUT! A massive wicket! {self.team2} is striking back!"
            pulse_change = -30 
            self.momentum -= 20
            self.pressure += 15
            self.win_prob -= 12
        elif event_type == "6":
            self.score += 6
            description = "SIX! Into the crowd! The Dhoni effect?"
            pulse_change = 60
            self.momentum += 15
            self.pressure -= 10
            self.win_prob += 8
        elif event_type == "4":
            self.score += 4
            description = "FOUR! Piercing the gap. Beautiful shot!"
            pulse_change = 35
            self.momentum += 8
            self.pressure -= 5
            self.win_prob += 4
        elif event_type == "0":
            description = "Dot ball. Pressure is building up."
            self.pressure += 4
            pulse_change = -8
            self.momentum -= 2
        else:
            if event_type.isdigit():
                runs = int(event_type)
                self.score += runs
                description = f"{runs} run(s) taken. Keeping the scoreboard ticking."
                pulse_change = 8 * runs
                self.momentum += runs
            else:
                self.score += 1
                description = "EXTRA! Bowler loses control."
                pulse_change = 5
                self.momentum += 2
        
        # Update match state
        if event_type not in ["WD", "NB"]:
            self.balls += 1
            if self.balls == 6:
                self.balls = 0
                self.overs += 1
        
        # Clamp Score/Wickets
        if self.score > 250: self.score = 250
        if self.wickets > 10: self.wickets = 10
        
        # Atmosphere Logic
        atmosphere = "Stable"
        if self.crowd_pulse > 80: atmosphere = "ELECTRIC"
        elif self.crowd_pulse > 60: atmosphere = "VIBRANT"
        elif self.pressure > 70: atmosphere = "TENSE"
        elif self.crowd_pulse < 30: atmosphere = "QUIET"

        # Win Prob logic based on RRR
        balls_left = (20 - self.overs) * 6 - self.balls
        runs_left = self.target - self.score
        if balls_left > 0:
            rrr = (runs_left / balls_left) * 6
            self.win_prob = max(1, min(99, 100 - (rrr * 6))) # Simplified RRR dependency
        
        # Clamp values
        self.crowd_pulse = max(0, min(100, self.crowd_pulse + pulse_change))
        self.momentum = max(0, min(100, self.momentum + (pulse_change / 3)))
        self.pressure = max(0, min(100, self.pressure + random.randint(-3, 3)))

        match_state = {
            "score": f"{self.score}/{self.wickets}",
            "overs": f"{self.overs}.{self.balls}",
            "event": event_type,
            "description": description,
            "crowd_pulse": self.crowd_pulse,
            "win_prob": round(self.win_prob, 1),
            "momentum": round(self.momentum, 1),
            "pressure": round(self.pressure, 1),
            "atmosphere": atmosphere,
            "teams": f"{self.team1} vs {self.team2}",
            "target": self.target,
            "timestamp": time.time()
        }
        
        return match_state
