# backend/app/api/endpoints/fitness.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID

from app.api import deps
from app.services.fitness_service import FitnessService
from app.schemas.fitness import (
    Exercise, ExerciseCreate, ExerciseUpdate,
    Mesocycle, MesocycleCreate, MesocycleWithDays,
    WorkoutSession, WorkoutExercise,
    ExerciseHistory, ExerciseHistoryCreate
)

router = APIRouter()

# Exercise endpoints
@router.get("/exercises", response_model=List[Exercise])
def get_exercises(
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id),
    muscle_group: Optional[str] = None,
    equipment: Optional[str] = None
):
    """Get all exercises for the user with optional filtering"""
    return service.get_exercises(user_id, muscle_group, equipment)

@router.post("/exercises", response_model=Exercise)
def create_exercise(
    exercise: ExerciseCreate,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Create a new exercise"""
    return service.create_exercise(user_id, exercise)

@router.put("/exercises/{exercise_id}", response_model=Exercise)
def update_exercise(
    exercise_id: UUID,
    exercise: ExerciseUpdate,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Update an exercise"""
    return service.update_exercise(user_id, exercise_id, exercise)

@router.delete("/exercises/{exercise_id}")
def delete_exercise(
    exercise_id: UUID,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Delete an exercise"""
    return service.delete_exercise(user_id, exercise_id)

# Mesocycle endpoints
@router.get("/mesocycles", response_model=List[Mesocycle])
def get_mesocycles(
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id),
    status: Optional[str] = None
):
    """Get all mesocycles for the user"""
    return service.get_mesocycles(user_id, status)

@router.get("/mesocycles/{mesocycle_id}", response_model=MesocycleWithDays)
def get_mesocycle_details(
    mesocycle_id: UUID,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Get detailed mesocycle with all days, sessions, and exercises"""
    return service.get_mesocycle_details(user_id, mesocycle_id)

@router.post("/mesocycles", response_model=Mesocycle)
def create_mesocycle(
    mesocycle_data: MesocycleCreate,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Create a new mesocycle with all its days and exercises"""
    return service.create_mesocycle(user_id, mesocycle_data)

@router.put("/mesocycles/{mesocycle_id}/activate")
def activate_mesocycle(
    mesocycle_id: UUID,
    start_date: Optional[date] = None,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Activate a mesocycle (make it the current training plan)"""
    return service.activate_mesocycle(user_id, mesocycle_id, start_date)

@router.delete("/mesocycles/{mesocycle_id}")
def delete_mesocycle(
    mesocycle_id: UUID,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Delete a mesocycle"""
    return service.delete_mesocycle(user_id, mesocycle_id)

# Exercise history endpoints
@router.post("/exercise-history", response_model=ExerciseHistory)
def log_exercise(
    history: ExerciseHistoryCreate,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Log completed exercise sets"""
    return service.log_exercise(user_id, history)

@router.get("/exercise-history/{exercise_id}")
def get_exercise_history(
    exercise_id: UUID,
    limit: int = 10,
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Get exercise history for progress tracking"""
    return service.get_exercise_history(user_id, exercise_id, limit)

# Today's workout endpoint
@router.get("/today-workout")
def get_today_workout(
    service: FitnessService = Depends(deps.get_fitness_service),
    user_id: str = Depends(deps.get_user_id)
):
    """Get today's scheduled workout from active mesocycle"""
    return service.get_today_workout(user_id)