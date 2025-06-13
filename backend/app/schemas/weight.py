# synthetivolve/app/schemas/weight.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class WeightEntry(BaseModel):
    date: date
    weight: float

class WeightDataResponse(BaseModel):
    weight_data: List[WeightEntry]
    current_weight: Optional[float]
    seven_day_average: Optional[float]

class WeightLogRequest(BaseModel):
    weight: float