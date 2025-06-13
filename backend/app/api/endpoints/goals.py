# synthetivolve/backend/app/api/endpoints/goals.py
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.services.data_service import DataService
from app.schemas.goal import Goal
from typing import Optional

router = APIRouter()

@router.get("/current", response_model=Optional[Goal])
def get_current_goal(
    service: DataService = Depends(deps.get_data_service),
    user_id: str = Depends(deps.get_user_id)
):
    goal = service.get_current_goal(user_id)
    if not goal:
        return None # FastAPI will correctly return null
    return goal