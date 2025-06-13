# backend/main.py

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Configuration & Initialization ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
USER_ID = os.getenv("USER_ID")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase URL and Key must be set in the .env file")

if not USER_ID:
    raise Exception("USER_ID must be set in the .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI()

# --- CORS Middleware ---
# This allows your frontend (running on a different port/domain) to talk to this backend
origins = [
    "http://localhost",
    "http://localhost:8080", # Or whatever port your local server runs on
    "http://127.0.0.1:5500", # Common for VS Code Live Server
    # Add your production frontend URL here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Synthetivolve API is running!"}

# Example: Migrating the "fetchCurrentGoal" logic from dashboard.js
@app.get("/api/goals/current")
async def get_current_goal():
    try:
        response = supabase.from_("nutrition_goals") \
            .select("*") \
            .eq("user_id", USER_ID) \
            .eq("is_active", True) \
            .single() \
            .execute()

        # The new supabase-py v2 returns a different structure
        if response.data:
            return response.data
        # If no goal is found, single() doesn't error, it just returns no data
        return None

    except Exception as e:
        # Log the error for debugging
        print(f"Error fetching current goal: {e}")
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail="Error fetching goal from database.")