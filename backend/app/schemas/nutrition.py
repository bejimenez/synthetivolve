# synthetivolve/backend/app/schemas/nutrition.py
from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import date

# Helper function to convert snake_case to camelCase
def to_camel(snake_str: str) -> str:
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

class TodayNutritionResponse(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0

class AdherenceDay(BaseModel):
    date: date
    day: str
    calories_adherence: float
    protein_adherence: float
    carbs_adherence: float
    fat_adherence: float

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )