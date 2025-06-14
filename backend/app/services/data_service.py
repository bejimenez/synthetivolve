# synthetivolve/backend/app/services/data_service.py
from datetime import datetime, timedelta
from supabase import Client
from typing import List, Dict, Any, Optional

class DataService:
    def __init__(self, db: Client):
        self.db = db

    def get_current_goal(self, user_id: str) -> Optional[Dict[str, Any]]:
        response = self.db.from_("nutrition_goals").select("*").eq("user_id", user_id).eq("is_active", True).single().execute()
        return response.data

    def get_weight_data_last_30_days(self, user_id: str) -> Dict[str, Any]:
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        response = self.db.from_("weight_entries").select("date, weight_lb").eq("user_id", user_id).gte("date", thirty_days_ago).order("date", desc=False).execute()
        
        weight_data = response.data or []
        current_weight = weight_data[-1]["weight_lb"] if weight_data else None
        
        last_7_entries = weight_data[-7:]
        seven_day_average = sum(e["weight_lb"] for e in last_7_entries) / len(last_7_entries) if last_7_entries else None
        
        return {
            "weight_data": weight_data,
            "current_weight": current_weight,
            "seven_day_average": seven_day_average
        }

    def log_weight(self, user_id: str, weight: float) -> Dict[str, Any]:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Upsert functionality: update if exists, insert if not
        response = self.db.from_("weight_entries").upsert({
            "user_id": user_id,
            "date": today,
            "weight_lb": weight
        }, on_conflict="user_id, date").execute()
        
        return response.data[0] if response.data else {}

    def get_today_nutrition_totals(self, user_id: str) -> Dict[str, float]:
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        response = self.db.rpc('get_daily_nutrition_totals_for_user', {
            'p_user_id': user_id,
            'p_date': start_of_day.strftime("%Y-%m-%d")
        }).execute()

        # Assuming the RPC returns a single row with totals
        if response.data:
            return response.data[0]
        return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}

    def get_weekly_adherence(self, user_id: str, goal: Dict[str, Any]) -> List[Dict[str, Any]]:
        # This logic is complex and a great candidate for a Postgres Function (RPC call)
        # For now, we keep the Python logic but acknowledge it's better in the DB.
        
        # (The original Python logic from your main.py would go here, but it's more efficient
        # to create a single RPC call in Supabase to calculate this on the database side)
        response = self.db.rpc('get_weekly_adherence_for_user', {
             'p_user_id': user_id,
             'p_target_calories': goal.get('target_calories', 0),
             'p_target_protein': goal.get('target_protein_g', 0),
             'p_target_carbs': goal.get('target_carbs_g', 0),
             'p_target_fat': goal.get('target_fat_g', 0)
        }).execute()
        
        return response.data or []