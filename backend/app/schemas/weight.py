# synthetivolve/backend/app/schemas/weight.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class WeightEntry(BaseModel):
    """
    Defines a single weight entry coming FROM the database.
    The field name must match the database column name.
    """
    date: date
    weight_lb: float  # <--- THIS MUST MATCH the database column 'weight_lb'

    class Config:
        from_attributes = True # Replaces orm_mode in Pydantic V2


class WeightDataResponse(BaseModel):
    weight_data: List[WeightEntry]
    current_weight: Optional[float]
    seven_day_average: Optional[float]


class WeightLogRequest(BaseModel):
    """
    Defines the request body for POSTing a new weight.
    The field name 'weight' here is fine, as it's defined in the endpoint.
    """
    weight: float