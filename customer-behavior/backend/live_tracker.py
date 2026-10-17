import json
import random
import os
import datetime
import time

TELEMETRY_FILE = "live_telemetry.json"
DEVICE_ID = "DEV_" + "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=6))

def simulate_device_telemetry():
    """Simulates real-time system tracking across OS apps, keylogs, and network requests."""
    print(f"[*] Started Live OS Telemetry Tracker for device {DEVICE_ID}...")
    
    # Base states
    study_pct = 40
    ent_pct = 30
    shop_pct = 15
    other_pct = 15
    mood_score = 0.5  # Neutral to positive
    web_flag = 0
    
    base_sentiment_history = [random.randint(40, 95) for _ in range(6)]
    base_usage_history = [
        {"day": (datetime.datetime.now() - datetime.timedelta(days=6)).strftime('%b %d'), "study": random.randint(20,50), "entertainment": random.randint(20,40), "shopping": random.randint(5,20), "screen_time": round(random.uniform(4, 9), 1), "mood": "Relaxed", "fraud_status": "Clear"},
        {"day": (datetime.datetime.now() - datetime.timedelta(days=5)).strftime('%b %d'), "study": random.randint(30,60), "entertainment": random.randint(10,30), "shopping": random.randint(5,15), "screen_time": round(random.uniform(4, 9), 1), "mood": "Productive", "fraud_status": "Clear"},
        {"day": (datetime.datetime.now() - datetime.timedelta(days=4)).strftime('%b %d'), "study": random.randint(20,50), "entertainment": random.randint(20,40), "shopping": random.randint(10,25), "screen_time": round(random.uniform(4, 9), 1), "mood": "Stress", "fraud_status": "High Risk"},
        {"day": (datetime.datetime.now() - datetime.timedelta(days=3)).strftime('%b %d'), "study": random.randint(40,70), "entertainment": random.randint(10,20), "shopping": random.randint(5,10), "screen_time": round(random.uniform(4, 9), 1), "mood": "Productive", "fraud_status": "Clear"},
        {"day": (datetime.datetime.now() - datetime.timedelta(days=2)).strftime('%b %d'), "study": random.randint(10,40), "entertainment": random.randint(30,60), "shopping": random.randint(15,30), "screen_time": round(random.uniform(4, 9), 1), "mood": "Relaxed", "fraud_status": "Suspicious"},
        {"day": (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%b %d'), "study": random.randint(5,20), "entertainment": random.randint(40,70), "shopping": random.randint(10,30), "screen_time": round(random.uniform(4, 9), 1), "mood": "Mixed", "fraud_status": "Clear"}
    ]
    
    while True:
        # Simulate active user behavior drifting slightly over time
        study_pct = max(5, min(70, study_pct + random.randint(-5, 5)))
        ent_pct = max(10, min(60, ent_pct + random.randint(-4, 6)))
        shop_pct = max(5, min(40, shop_pct + random.randint(-3, 3)))
        
        # Normalize percentages
        total = study_pct + ent_pct + shop_pct
        rem = 100 - total
        if rem < 0:
            study_pct = int(study_pct * (100 / total) * 0.9)
            ent_pct = int(ent_pct * (100 / total) * 0.9)
            shop_pct = int(shop_pct * (100 / total) * 0.9)
            other_pct = 100 - (study_pct + ent_pct + shop_pct)
        else:
            other_pct = rem
            
        # Simulate keyboard sentiment from texts/socials (-1.0 to 1.0)
        mood_score = max(-1.0, min(1.0, mood_score + random.uniform(-0.3, 0.3)))
        
        if mood_score < -0.5:
            mood = "Stressed"
        elif mood_score < -0.1:
            mood = "Anxious"
        elif mood_score > 0.6:
            mood = "Entertained"
        elif mood_score > 0.2:
            mood = "Productive"
        else:
            mood = "Relaxed"
            
        # Random occasional dark-web or high-risk web scraping spike
        web_flag = max(0, web_flag - 1)
        if random.random() > 0.90:
            web_flag += random.randint(1, 3)
            
        f_status = "Clear"
        if web_flag >= 2 or other_pct > 30:
            f_status = "High Risk"
        elif web_flag == 1 or mood == "Stressed":
            f_status = "Suspicious"
            
        # Create user matrix payload
        highest_cat = "Study/Work"
        if ent_pct > study_pct and ent_pct > shop_pct: highest_cat = "Entertainment"
        elif shop_pct > study_pct and shop_pct > ent_pct: highest_cat = "Shopping"
            
        # Mock multi-day flow
        payload = {
            "timestamp": time.time(),
            "aggregates": {
                "total_devices": 1,
                "majority_mood": mood,
                "total_texts_analyzed": random.randint(15, 300),
                "highest_usage_category": highest_cat,
                "avg_screen_time": round(random.uniform(4.5, 9.2), 1),
                "fraud_count": 1 if f_status == "High Risk" else 0,
                "category_averages": {
                    "study": study_pct,
                    "entertainment": ent_pct,
                    "shopping": shop_pct,
                    "other": other_pct
                },
                "sentiment_flow": base_sentiment_history + [int(mood_score * 50 + 50)],
                "usage_history": base_usage_history + [{"day": "Today", "study": study_pct, "entertainment": ent_pct, "shopping": shop_pct, "screen_time": round(random.uniform(4.5, 9.2), 1), "mood": mood, "fraud_status": f_status}]
            },
            "users": [{
                "device_id": DEVICE_ID,
                "primary_mood": mood,
                "usage": {
                    "study": study_pct,
                    "entertainment": ent_pct,
                    "shopping": shop_pct,
                    "other": other_pct
                },
                "fraud_status": f_status,
                "confidence": f"{round(random.uniform(85, 99), 1)}%",
                "pages": random.randint(40, 200),
                "duration": f"{random.randint(1, 8)}h {random.randint(10, 59)}m"
            }]
        }
        
        # Write to JSON file atomic
        tmp_file = f"{TELEMETRY_FILE}.tmp"
        with open(tmp_file, "w") as f:
            json.dump(payload, f)
        os.rename(tmp_file, TELEMETRY_FILE)
        
        print(f"[{time.strftime('%H:%M:%S')}] Live State Updated: {mood}, Fraud Risk: {f_status}")
        time.sleep(3)  # Pulse every 3 seconds

if __name__ == "__main__":
    simulate_device_telemetry()
