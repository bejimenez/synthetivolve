# synthetivolve/backend/app/schemas/nutrition.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class TodayNutritionResponse(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0

class AdherenceDay(BaseModel):
    date: date
    day: str
    caloriesAdherence: float
    proteinAdherence: float

    class Config:
        orm_mode = True