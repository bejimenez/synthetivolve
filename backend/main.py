# backend/main.py

import os
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# --- UTILITY FUNCTIONS ---

def format_date(date):
    """Format date to YYYY-MM-DD format"""
    return date.strftime("%Y-%m-%d")

# --- PYDANTIC MODELS ---

class WeightLogRequest(BaseModel):
    weight: float

# --- CORS Middleware ---
# This allows your frontend (running on a different port/domain) to talk to this backend
origins = [
    "http://localhost",
    "http://localhost:3000",  # React/Next.js dev server
    "http://localhost:8080",  # Common dev server port
    "http://127.0.0.1:5500",  # VS Code Live Server
    "http://127.0.0.1:8080",  # Alternative
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

# --- WEIGHT ENDPOINTS ---

@app.get("/api/weight/data")
async def get_weight_data():
    """Get weight data for the last 30 days"""
    try:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        response = supabase.from_("weight_entries") \
            .select("*") \
            .eq("user_id", USER_ID) \
            .gte("date", format_date(thirty_days_ago)) \
            .order("date", desc=False) \
            .execute()
        
        weight_data = response.data or []
        
        # Calculate current weight and 7-day average
        current_weight = None
        seven_day_average = None
        
        if weight_data:
            current_weight = weight_data[-1]["weight_lb"]
            
            # Calculate 7-day average from last 7 entries
            last_7_days = weight_data[-7:] if len(weight_data) >= 7 else weight_data
            if last_7_days:
                seven_day_average = sum(entry["weight_lb"] for entry in last_7_days) / len(last_7_days)
        
        return {
            "weight_data": weight_data,
            "current_weight": current_weight,
            "seven_day_average": seven_day_average
        }
        
    except Exception as e:
        print(f"Error fetching weight data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching weight data from database.")

@app.post("/api/weight/log")
async def log_weight(request: WeightLogRequest):
    """Log weight entry for today"""
    try:
        today = format_date(datetime.now())
        
        # Check if entry already exists for today
        existing_response = supabase.from_("weight_entries") \
            .select("*") \
            .eq("user_id", USER_ID) \
            .eq("date", today) \
            .execute()
        
        if existing_response.data:
            # Update existing entry
            existing_entry = existing_response.data[0]
            response = supabase.from_("weight_entries") \
                .update({
                    "weight_lb": request.weight,
                    "updated_at": datetime.now().isoformat()
                }) \
                .eq("id", existing_entry["id"]) \
                .execute()
            
            result = response.data[0] if response.data else None
            print(f"Updated weight entry: {result}")
        else:
            # Create new entry
            response = supabase.from_("weight_entries") \
                .insert([{
                    "user_id": USER_ID,
                    "date": today,
                    "weight_lb": request.weight
                }]) \
                .execute()
            
            result = response.data[0] if response.data else None
            print(f"Created new weight entry: {result}")
        
        return result
        
    except Exception as e:
        print(f"Error logging weight: {e}")
        raise HTTPException(status_code=500, detail="Error logging weight to database.")

# --- NUTRITION ENDPOINTS ---

@app.get("/api/nutrition/today")
async def get_today_nutrition():
    """Get today's nutrition totals"""
    try:
        today = datetime.now()
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        print(f"Fetching nutrition for: {start_of_day} to {end_of_day}")
        
        response = supabase.from_("logged_entries") \
            .select("""
                *,
                foods (
                    calories,
                    protein_g,
                    carbs_g,
                    fat_g,
                    serving_size_g
                )
            """) \
            .eq("user_id", USER_ID) \
            .gte("logged_at", start_of_day.isoformat()) \
            .lte("logged_at", end_of_day.isoformat()) \
            .execute()
        
        entries = response.data or []
        print(f"Today's entries: {entries}")
        
        # Calculate totals
        totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0
        }
        
        for entry in entries:
            food = entry.get("foods")
            if food:
                quantity = entry.get("quantity", 1)
                totals["calories"] += (food.get("calories") or 0) * quantity
                totals["protein"] += (food.get("protein_g") or 0) * quantity
                totals["carbs"] += (food.get("carbs_g") or 0) * quantity
                totals["fat"] += (food.get("fat_g") or 0) * quantity
        
        print(f"Today's nutrition totals: {totals}")
        return totals
        
    except Exception as e:
        print(f"Error fetching today's nutrition: {e}")
        raise HTTPException(status_code=500, detail="Error fetching nutrition data from database.")

@app.get("/api/nutrition/weekly-adherence")
async def get_weekly_adherence():
    """Get weekly adherence data for the last 7 days"""
    try:
        # First get the current goal
        goal_response = supabase.from_("nutrition_goals") \
            .select("*") \
            .eq("user_id", USER_ID) \
            .eq("is_active", True) \
            .single() \
            .execute()
        
        if not goal_response.data:
            return []
        
        current_goal = goal_response.data
        
        today = datetime.now()
        week_ago = today - timedelta(days=6)
        week_ago = week_ago.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Fetch all entries for the last 7 days
        response = supabase.from_("logged_entries") \
            .select("*, foods (calories, protein_g)") \
            .eq("user_id", USER_ID) \
            .gte("logged_at", week_ago.isoformat()) \
            .execute()
        
        entries = response.data or []
        
        # Create a map to store totals for each day
        daily_totals = {}
        
        # Initialize the map with all 7 days
        for i in range(7):
            date = week_ago + timedelta(days=i)
            date_string = format_date(date)
            daily_totals[date_string] = {
                "day": date.strftime("%a"),
                "calories": 0,
                "protein": 0
            }
        
        # Process the fetched entries
        for entry in entries:
            entry_date = format_date(datetime.fromisoformat(entry["logged_at"].replace("Z", "+00:00")))
            if entry_date in daily_totals:
                food = entry.get("foods")
                if food:
                    quantity = entry.get("quantity", 1)
                    daily_totals[entry_date]["calories"] += (food.get("calories") or 0) * quantity
                    daily_totals[entry_date]["protein"] += (food.get("protein_g") or 0) * quantity
        
        # Convert to adherence data
        adherence_data = []
        for date_string, totals in daily_totals.items():
            calories_adherence = 0
            protein_adherence = 0
            
            if current_goal.get("target_calories", 0) > 0:
                calories_adherence = min((totals["calories"] / current_goal["target_calories"]) * 100, 120)
            
            if current_goal.get("target_protein_g", 0) > 0:
                protein_adherence = min((totals["protein"] / current_goal["target_protein_g"]) * 100, 120)
            
            adherence_data.append({
                "date": date_string,
                "day": totals["day"],
                "caloriesAdherence": calories_adherence,
                "proteinAdherence": protein_adherence
            })
        
        print(f"Weekly adherence data: {adherence_data}")
        return adherence_data
        
    except Exception as e:
        print(f"Error fetching weekly adherence: {e}")
        raise HTTPException(status_code=500, detail="Error fetching weekly adherence from database.")
