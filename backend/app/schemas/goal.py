# synthetivolve/backend/app/schemas/goal.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from uuid import UUID

class Goal(BaseModel):
    id: UUID
    user_id: str
    goal_name: str
    start_date: date
    end_date: date
    weight_lb: float
    target_calories: int
    target_protein_g: int
    target_carbs_g: int
    target_fat_g: int
    goal_type: str

    class Config:
        from_attributes = True