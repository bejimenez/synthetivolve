# synthetivolve/backend/app/api/endpoints/weight.py
from fastapi import APIRouter, Depends
from app.api import deps
from app.services.data_service import DataService
from app.schemas.weight import WeightDataResponse, WeightLogRequest, WeightEntry

router = APIRouter()

@router.get("/data", response_model=WeightDataResponse)
def get_weight_data(
    service: DataService = Depends(deps.get_data_service),
    user_id: str = Depends(deps.get_user_id)
):
    return service.get_weight_data_last_30_days(user_id)


@router.post("/log")
def log_weight_entry(
    request: WeightLogRequest,
    service: DataService = Depends(deps.get_data_service),
    user_id: str = Depends(deps.get_user_id)
):
    return service.log_weight(user_id=user_id, weight=request.weight)