from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import sqlite3, os, datetime, json, traceback

# ── App setup ────────────────────────────────────────────────
app = FastAPI(title="BehaviourMirror API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "behaviour.db")

# ── Database init ─────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       TEXT    NOT NULL DEFAULT 'default',
            date          TEXT    NOT NULL,
            study         INTEGER NOT NULL DEFAULT 0,
            entertainment INTEGER NOT NULL DEFAULT 0,
            social        INTEGER NOT NULL DEFAULT 0,
            shopping      INTEGER NOT NULL DEFAULT 0,
            other         INTEGER NOT NULL DEFAULT 0,
            screen_time   REAL    NOT NULL DEFAULT 0.0,
            sites_visited INTEGER NOT NULL DEFAULT 0,
            mood          TEXT    NOT NULL DEFAULT '',
            notes         TEXT    NOT NULL DEFAULT '',
            created_at    TEXT    NOT NULL,
            updated_at    TEXT    NOT NULL,
            UNIQUE(user_id, date)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ── Mood derivation (no randomness) ──────────────────────────
def derive_mood(study, entertainment, social, shopping, other):
    """Deterministically derive mood from usage proportions."""
    total = study + entertainment + social + shopping + other
    if total == 0:
        return {"mood": "Neutral", "emoji": "😶", "color": "#475569", "score": 50}

    s_pct  = study         / total * 100
    e_pct  = entertainment / total * 100
    so_pct = social        / total * 100
    sh_pct = shopping      / total * 100

    # Priority rules
    if s_pct >= 45:
        return {"mood": "Focused",     "emoji": "🎯", "color": "#6366f1", "score": min(95, int(50 + s_pct))}
    if e_pct >= 50:
        return {"mood": "Entertained", "emoji": "🎬", "color": "#38bdf8", "score": max(40, int(90 - e_pct * 0.4))}
    if so_pct >= 45:
        return {"mood": "Anxious",     "emoji": "😟", "color": "#ef4444", "score": max(25, int(60 - so_pct))}
    if sh_pct >= 30:
        return {"mood": "Impulsive",   "emoji": "🛍️",  "color": "#f59e0b", "score": max(35, int(70 - sh_pct))}
    if s_pct >= 30 and e_pct < 30:
        return {"mood": "Productive",  "emoji": "💼", "color": "#10b981", "score": min(88, int(55 + s_pct * 0.5))}
    if e_pct >= 30 and s_pct >= 20:
        return {"mood": "Relaxed",     "emoji": "😌", "color": "#a78bfa", "score": 70}
    return     {"mood": "Balanced",    "emoji": "⚖️",  "color": "#38bdf8", "score": 68}

# ── Pydantic models ───────────────────────────────────────────
class ActivityLog(BaseModel):
    user_id:       str  = "default"
    study:         int  = 0
    entertainment: int  = 0
    social:        int  = 0
    shopping:      int  = 0
    other:         int  = 0
    screen_time:   float = 0.0
    sites_visited: int  = 0
    notes:         str  = ""

# ── Helper ────────────────────────────────────────────────────
def today_str():
    return datetime.date.today().isoformat()

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

def ensure_percentage_100(study, entertainment, social, shopping, other):
    """Clamp and normalise so categories never exceed 100%."""
    total = study + entertainment + social + shopping + other
    if total == 0:
        return study, entertainment, social, shopping, other
    if total > 100:
        factor = 100 / total
        study         = round(study         * factor)
        entertainment = round(entertainment * factor)
        social        = round(social        * factor)
        shopping      = round(shopping      * factor)
        other         = max(0, 100 - study - entertainment - social - shopping)
    return study, entertainment, social, shopping, other

# ══════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/api/today")
def get_today(user_id: str = "default"):
    """Return today's actual logged activity. All zeros if nothing logged yet."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM activity_log WHERE user_id=? AND date=?",
        (user_id, today_str())
    ).fetchone()
    conn.close()

    if row is None:
        # Nothing logged today — return honest zeros
        mood = derive_mood(0, 0, 0, 0, 0)
        return {
            "status": "not_logged",
            "message": "No activity logged yet today. Tap 'Log Activity' to add your usage.",
            "date": today_str(),
            "user_id": user_id,
            "study": 0, "entertainment": 0, "social": 0,
            "shopping": 0, "other": 0,
            "screen_time": 0.0, "sites_visited": 0,
            "mood": mood, "notes": "",
        }

    d = row_to_dict(row)
    d["mood"] = derive_mood(d["study"], d["entertainment"], d["social"], d["shopping"], d["other"])
    d["status"] = "logged"
    return d


@app.post("/api/today")
def log_today(payload: ActivityLog):
    """Create or update today's activity log for a user."""
    study, entertainment, social, shopping, other = ensure_percentage_100(
        payload.study, payload.entertainment, payload.social, payload.shopping, payload.other
    )
    now = datetime.datetime.utcnow().isoformat()
    conn = get_db()
    try:
        conn.execute("""
            INSERT INTO activity_log
                (user_id, date, study, entertainment, social, shopping, other,
                 screen_time, sites_visited, notes, mood, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(user_id, date) DO UPDATE SET
                study=excluded.study,
                entertainment=excluded.entertainment,
                social=excluded.social,
                shopping=excluded.shopping,
                other=excluded.other,
                screen_time=excluded.screen_time,
                sites_visited=excluded.sites_visited,
                notes=excluded.notes,
                mood=excluded.mood,
                updated_at=excluded.updated_at
        """, (
            payload.user_id, today_str(),
            study, entertainment, social, shopping, other,
            payload.screen_time, payload.sites_visited,
            payload.notes, "",
            now, now
        ))
        conn.commit()
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    mood = derive_mood(study, entertainment, social, shopping, other)
    return {
        "status": "saved",
        "date": today_str(),
        "user_id": payload.user_id,
        "study": study, "entertainment": entertainment,
        "social": social, "shopping": shopping, "other": other,
        "screen_time": payload.screen_time,
        "sites_visited": payload.sites_visited,
        "mood": mood,
        "notes": payload.notes,
    }


@app.get("/api/week")
def get_week(user_id: str = "default"):
    """Return the last 7 days of logged data (honest zeros for unlogged days)."""
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM activity_log
           WHERE user_id=? AND date >= date('now','-6 days')
           ORDER BY date ASC""",
        (user_id,)
    ).fetchall()
    conn.close()

    # Build a dict by date
    by_date = {r["date"]: row_to_dict(r) for r in rows}

    result = []
    for i in range(6, -1, -1):
        day = (datetime.date.today() - datetime.timedelta(days=i)).isoformat()
        day_label = (datetime.date.today() - datetime.timedelta(days=i)).strftime("%a")
        if day in by_date:
            d = by_date[day]
            d["day_label"] = day_label
            d["mood"] = derive_mood(d["study"], d["entertainment"], d["social"], d["shopping"], d["other"])
            result.append(d)
        else:
            result.append({
                "date": day, "day_label": day_label,
                "user_id": user_id,
                "study": 0, "entertainment": 0, "social": 0,
                "shopping": 0, "other": 0,
                "screen_time": 0.0, "sites_visited": 0,
                "mood": {"mood": "—", "emoji": "○", "color": "#475569", "score": 0},
                "notes": "", "logged": False,
            })
    return {"status": "success", "user_id": user_id, "days": result}


@app.get("/api/insights")
def get_insights(user_id: str = "default"):
    """AI insights derived from the last 7 days of REAL data."""
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM activity_log
           WHERE user_id=? AND date >= date('now','-6 days')
           ORDER BY date ASC""",
        (user_id,)
    ).fetchall()
    conn.close()

    if not rows:
        return {"status": "no_data", "insights": [
            {"icon": "📊", "title": "No data yet", "body": "Log your activity daily for at least 3 days to unlock personalised AI insights.", "tag": "Getting Started"}
        ]}

    rows = [row_to_dict(r) for r in rows]
    avg_study  = sum(r["study"]         for r in rows) / len(rows)
    avg_ent    = sum(r["entertainment"] for r in rows) / len(rows)
    avg_social = sum(r["social"]        for r in rows) / len(rows)
    avg_shop   = sum(r["shopping"]      for r in rows) / len(rows)
    avg_screen = sum(r["screen_time"]   for r in rows) / len(rows)

    insights = []
    if avg_study >= 35:
        insights.append({"icon": "🎯", "gradient": "linear-gradient(135deg,#6366f1,#a78bfa)", "title": "Strong Study Focus!", "body": f"You averaged {avg_study:.0f}% study/work time this week. Your focus habit is excellent — keep going!", "tag": "Productivity"})
    elif avg_study >= 15:
        insights.append({"icon": "📚", "gradient": "linear-gradient(135deg,#6366f1,#38bdf8)", "title": "Build Study Consistency", "body": f"Study averages {avg_study:.0f}% this week. Try adding 30 min extra each morning.", "tag": "Improvement"})
    else:
        insights.append({"icon": "⚡", "gradient": "linear-gradient(135deg,#f59e0b,#ef4444)", "title": "Low Study Activity", "body": "Your study time this week is very low. Dedicate at least 1 hour daily to learning.", "tag": "Action Needed"})

    if avg_ent >= 40:
        insights.append({"icon": "🎬", "gradient": "linear-gradient(135deg,#38bdf8,#6366f1)", "title": "High Entertainment Usage", "body": f"Entertainment averaged {avg_ent:.0f}% this week. Balance it with productive sessions.", "tag": "Balance"})

    if avg_social >= 35:
        insights.append({"icon": "📱", "gradient": "linear-gradient(135deg,#ef4444,#a78bfa)", "title": "Social Media Heavy", "body": f"Social media at {avg_social:.0f}% avg — high social usage can increase anxiety. Try a daily limit.", "tag": "Wellness"})

    if avg_shop >= 20:
        insights.append({"icon": "🛍️", "gradient": "linear-gradient(135deg,#f59e0b,#ef4444)", "title": "Impulse Shopping Alert", "body": f"Shopping usage at {avg_shop:.0f}% avg this week. Monitor your spending habits carefully.", "tag": "Spend Guard"})

    if avg_screen >= 8:
        insights.append({"icon": "😴", "gradient": "linear-gradient(135deg,#a78bfa,#6366f1)", "title": "Screen Time Too High", "body": f"You averaged {avg_screen:.1f}h of screen time daily. Take eye-break every 45 minutes.", "tag": "Health"})

    insights.append({"icon": "🔥", "gradient": "linear-gradient(135deg,#f59e0b,#10b981)", "title": f"{len(rows)}-Day Streak!", "body": f"You've logged your activity for {len(rows)} day(s) in a row. Consistency is the key to self-awareness!", "tag": "Streak"})

    return {"status": "success", "user_id": user_id, "insights": insights}


@app.get("/api/stats")
def get_stats(user_id: str = "default"):
    """Overall stats for a user across all logged days."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM activity_log WHERE user_id=? ORDER BY date DESC LIMIT 30",
        (user_id,)
    ).fetchall()
    conn.close()

    if not rows:
        return {"status": "no_data", "total_days": 0}

    rows = [row_to_dict(r) for r in rows]
    return {
        "status": "success",
        "total_days": len(rows),
        "avg_screen_time": round(sum(r["screen_time"] for r in rows) / len(rows), 1),
        "avg_study":         round(sum(r["study"]         for r in rows) / len(rows)),
        "avg_entertainment": round(sum(r["entertainment"] for r in rows) / len(rows)),
        "avg_social":        round(sum(r["social"]        for r in rows) / len(rows)),
        "avg_shopping":      round(sum(r["shopping"]      for r in rows) / len(rows)),
        "best_day":          max(rows, key=lambda r: r["study"])["date"],
    }


@app.delete("/api/today")
def delete_today(user_id: str = "default"):
    """Delete today's log (reset)."""
    conn = get_db()
    conn.execute("DELETE FROM activity_log WHERE user_id=? AND date=?", (user_id, today_str()))
    conn.commit()
    conn.close()
    return {"status": "deleted", "date": today_str()}


# ── Health check ──────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "3.0.0", "time": datetime.datetime.utcnow().isoformat()}


# ── Serve built React frontend (for production on Render) ─────
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index = os.path.join(DIST_DIR, "index.html")
        return FileResponse(index)
