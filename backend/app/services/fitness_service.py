# backend/app/services/fitness_service.py
from datetime import datetime, date, timedelta
from supabase import Client
from typing import List, Dict, Any, Optional
from uuid import UUID

from app.schemas.fitness import (
    ExerciseCreate, ExerciseUpdate,
    MesocycleCreate, ExerciseHistoryCreate
)

class FitnessService:
    def __init__(self, db: Client):
        self.db = db

    # Exercise management
    def get_exercises(self, user_id: str, muscle_group: Optional[str] = None, 
                     equipment: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.from_("exercises").select("*").eq("user_id", user_id)
        
        if muscle_group:
            query = query.eq("primary_muscle_group", muscle_group)
        if equipment:
            query = query.eq("equipment", equipment)
            
        response = query.order("name").execute()
        return response.data or []

    def create_exercise(self, user_id: str, exercise: ExerciseCreate) -> Dict[str, Any]:
        exercise_data = exercise.dict()
        exercise_data["user_id"] = user_id
        
        response = self.db.from_("exercises").insert(exercise_data).execute()
        return response.data[0] if response.data else {}

    def update_exercise(self, user_id: str, exercise_id: UUID, 
                       exercise: ExerciseUpdate) -> Dict[str, Any]:
        update_data = exercise.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()
        
        response = (self.db.from_("exercises")
                   .update(update_data)
                   .eq("id", str(exercise_id))
                   .eq("user_id", user_id)
                   .execute())
        
        if not response.data:
            raise ValueError("Exercise not found or unauthorized")
        return response.data[0]

    def delete_exercise(self, user_id: str, exercise_id: UUID) -> bool:
        response = (self.db.from_("exercises")
                   .delete()
                   .eq("id", str(exercise_id))
                   .eq("user_id", user_id)
                   .execute())
        return True

    # Mesocycle management
    def get_mesocycles(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.from_("mesocycles").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
            
        response = query.order("created_at", desc=True).execute()
        return response.data or []

    def get_mesocycle_details(self, user_id: str, mesocycle_id: UUID) -> Dict[str, Any]:
        # Get mesocycle with all nested data
        response = (self.db.from_("mesocycles")
                   .select("""
                       *,
                       mesocycle_days (
                           *,
                           workout_sessions (
                               *,
                               workout_exercises (
                                   *,
                                   exercises (*)
                               )
                           )
                       )
                   """)
                   .eq("id", str(mesocycle_id))
                   .eq("user_id", user_id)
                   .single()
                   .execute())
        
        if not response.data:
            raise ValueError("Mesocycle not found")
            
        # Sort days and exercises by their order
        mesocycle = response.data
        if mesocycle.get("mesocycle_days"):
            mesocycle["days"] = sorted(mesocycle.pop("mesocycle_days"), 
                                      key=lambda x: x["day_number"])
            for day in mesocycle["days"]:
                if day.get("workout_sessions"):
                    day["sessions"] = day.pop("workout_sessions")
                    for session in day["sessions"]:
                        if session.get("workout_exercises"):
                            session["exercises"] = sorted(
                                session.pop("workout_exercises"),
                                key=lambda x: x["order_index"]
                            )
        
        return mesocycle

    def create_mesocycle(self, user_id: str, mesocycle_data: MesocycleCreate) -> Dict[str, Any]:
        # Extract days before creating mesocycle
        days_data = mesocycle_data.days
        mesocycle_dict = mesocycle_data.dict(exclude={"days"})
        mesocycle_dict["user_id"] = user_id
        
        # Calculate end date if start date is provided
        if mesocycle_dict.get("start_date"):
            start = mesocycle_dict["start_date"]
            if isinstance(start, str):
                start = date.fromisoformat(start)
            end_date = start + timedelta(weeks=mesocycle_dict["duration_weeks"])
            mesocycle_dict["end_date"] = end_date.isoformat()
        
        # Create mesocycle
        response = self.db.from_("mesocycles").insert(mesocycle_dict).execute()
        if not response.data:
            raise ValueError("Failed to create mesocycle")
            
        mesocycle = response.data[0]
        
        # Create days, sessions, and exercises
        for day_data in days_data:
            sessions_data = day_data.sessions
            day_dict = day_data.dict(exclude={"sessions"})
            day_dict["mesocycle_id"] = mesocycle["id"]
            
            # Create day
            day_response = self.db.from_("mesocycle_days").insert(day_dict).execute()
            if not day_response.data:
                continue
                
            day = day_response.data[0]
            
            # Create sessions
            for session_data in sessions_data:
                exercises_data = session_data.exercises
                session_dict = session_data.dict(exclude={"exercises"})
                session_dict["mesocycle_day_id"] = day["id"]
                
                # Create session
                session_response = self.db.from_("workout_sessions").insert(session_dict).execute()
                if not session_response.data:
                    continue
                    
                session = session_response.data[0]
                
                # Create exercises
                if exercises_data:
                    exercises_to_insert = []
                    for ex_data in exercises_data:
                        ex_dict = ex_data.dict()
                        ex_dict["workout_session_id"] = session["id"]
                        exercises_to_insert.append(ex_dict)
                    
                    self.db.from_("workout_exercises").insert(exercises_to_insert).execute()
        
        return mesocycle

    def activate_mesocycle(self, user_id: str, mesocycle_id: UUID, 
                          start_date: Optional[date] = None) -> Dict[str, Any]:
        # Deactivate any currently active mesocycle
        self.db.from_("mesocycles").update({"status": "archived"}).eq("user_id", user_id).eq("status", "active").execute()
        
        # Prepare update data
        update_data = {"status": "active", "updated_at": datetime.now().isoformat()}
        
        if start_date:
            update_data["start_date"] = start_date.isoformat()
            # Get mesocycle to calculate end date
            mesocycle = self.db.from_("mesocycles").select("duration_weeks").eq("id", str(mesocycle_id)).single().execute()
            if mesocycle.data:
                end_date = start_date + timedelta(weeks=mesocycle.data["duration_weeks"])
                update_data["end_date"] = end_date.isoformat()
        
        # Activate the selected mesocycle
        response = (self.db.from_("mesocycles")
                   .update(update_data)
                   .eq("id", str(mesocycle_id))
                   .eq("user_id", user_id)
                   .execute())
        
        return response.data[0] if response.data else {}

    def delete_mesocycle(self, user_id: str, mesocycle_id: UUID) -> bool:
        response = (self.db.from_("mesocycles")
                   .delete()
                   .eq("id", str(mesocycle_id))
                   .eq("user_id", user_id)
                   .execute())
        return True

    # Exercise history and tracking
    def log_exercise(self, user_id: str, history: ExerciseHistoryCreate) -> Dict[str, Any]:
        history_data = history.dict()
        history_data["user_id"] = user_id
        
        response = self.db.from_("exercise_history").insert(history_data).execute()
        return response.data[0] if response.data else {}

    def get_exercise_history(self, user_id: str, exercise_id: UUID, 
                            limit: int = 10) -> List[Dict[str, Any]]:
        response = (self.db.from_("exercise_history")
                   .select("*")
                   .eq("user_id", user_id)
                   .eq("exercise_id", str(exercise_id))
                   .order("workout_date", desc=True)
                   .limit(limit)
                   .execute())
        
        return response.data or []

    def get_today_workout(self, user_id: str) -> Optional[Dict[str, Any]]:
        # Get active mesocycle
        active_mesocycle = (self.db.from_("mesocycles")
                           .select("*")
                           .eq("user_id", user_id)
                           .eq("status", "active")
                           .single()
                           .execute())
        
        if not active_mesocycle.data:
            return None
            
        mesocycle = active_mesocycle.data
        
        # Calculate which day we're on
        if not mesocycle.get("start_date"):
            return None
            
        start_date = date.fromisoformat(mesocycle["start_date"])
        days_elapsed = (date.today() - start_date).days
        
        # Get total training days (non-rest days)
        days_response = (self.db.from_("mesocycle_days")
                        .select("*")
                        .eq("mesocycle_id", mesocycle["id"])
                        .eq("is_rest_day", False)
                        .order("day_number")
                        .execute())
        
        if not days_response.data:
            return None
            
        training_days = days_response.data
        current_day_index = days_elapsed % len(training_days)
        today_day = training_days[current_day_index]
        
        # Get full workout details
        workout_response = (self.db.from_("mesocycle_days")
                           .select("""
                               *,
                               workout_sessions (
                                   *,
                                   workout_exercises (
                                       *,
                                       exercises (*)
                                   )
                               )
                           """)
                           .eq("id", today_day["id"])
                           .single()
                           .execute())
        
        if not workout_response.data:
            return None
            
        workout = workout_response.data
        workout["mesocycle_name"] = mesocycle["name"]
        workout["sessions"] = workout.pop("workout_sessions", [])
        
        # Sort exercises by order
        for session in workout["sessions"]:
            if session.get("workout_exercises"):
                session["exercises"] = sorted(
                    session.pop("workout_exercises"),
                    key=lambda x: x["order_index"]
                )
        
        return workout