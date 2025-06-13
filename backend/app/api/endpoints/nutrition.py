# synthetivolve/backend/app/api/endpoints/nutrition.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.api import deps
from app.services.data_service import DataService
from app.schemas.nutrition import TodayNutritionResponse, AdherenceDay

router = APIRouter()

@router.get(
    "/today",
    response_model=TodayNutritionResponse,
    summary="Get Today's Nutrition Totals"
)
def get_today_nutrition(
    service: DataService = Depends(deps.get_data_service),
    user_id: str = Depends(deps.get_user_id)
) -> TodayNutritionResponse:
    """
    Retrieves the summed total of calories, protein, carbs, and fat
    from all food entries logged for the current day.
    """
    # The complex logic is handled by the service layer.
    # The endpoint's job is just to call it and return the data.
    totals = service.get_today_nutrition_totals(user_id=user_id)
    return TodayNutritionResponse(**totals)

@router.get(
    "/weekly-adherence",
    response_model=List[AdherenceDay],
    summary="Get Weekly Nutritional Adherence"
)
def get_weekly_adherence(
    service: DataService = Depends(deps.get_data_service),
    user_id: str = Depends(deps.get_user_id)
) -> List[AdherenceDay]:
    """
    Calculates the nutritional adherence for the last 7 days against
    the user's current active goal.

    - Fetches the current goal to get target macros.
    - If no active goal is found, returns an empty list.
    - Otherwise, calculates and returns the daily adherence percentages.
    """
    # Adherence calculation requires an active goal for targets.
    current_goal = service.get_current_goal(user_id=user_id)

    if not current_goal:
        # If there's no goal, there's nothing to measure adherence against.
        # Returning an empty list is the correct behavior for the frontend chart.
        return []

    # Pass the goal to the service, which contains the calculation logic.
    adherence_data = service.get_weekly_adherence(user_id=user_id, goal=current_goal)
    return [AdherenceDay(**day) for day in adherence_data]