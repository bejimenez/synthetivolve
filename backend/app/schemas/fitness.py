# backend/app/schemas/fitness.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID

# Exercise schemas
class ExerciseBase(BaseModel):
    name: str
    primary_muscle_group: str
    target_muscle: str
    secondary_muscles: Optional[List[str]] = []
    movement_type: str = Field(..., pattern="^(compound|isolation)$")
    equipment: str
    unilateral: bool = False
    force_type: Optional[str] = Field(None, pattern="^(push|pull|static)$")
    difficulty: Optional[str] = Field("intermediate", pattern="^(beginner|intermediate|advanced)$")
    notes: Optional[str] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    primary_muscle_group: Optional[str] = None
    target_muscle: Optional[str] = None
    secondary_muscles: Optional[List[str]] = None
    movement_type: Optional[str] = None
    equipment: Optional[str] = None
    unilateral: Optional[bool] = None
    force_type: Optional[str] = None
    difficulty: Optional[str] = None
    notes: Optional[str] = None

class Exercise(ExerciseBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Workout exercise schemas
class WorkoutExerciseBase(BaseModel):
    exercise_id: UUID
    order_index: int
    sets: int
    reps: Optional[int] = None
    reps_min: Optional[int] = None
    reps_max: Optional[int] = None
    rir: Optional[int] = Field(None, ge=0, le=5)
    percentage_1rm: Optional[float] = Field(None, ge=0, le=100)
    weight_lb: Optional[float] = None
    rest_seconds: Optional[int] = None
    tempo: Optional[str] = None
    notes: Optional[str] = None

class WorkoutExerciseCreate(WorkoutExerciseBase):
    pass

class WorkoutExercise(WorkoutExerciseBase):
    id: UUID
    workout_session_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Workout session schemas
class WorkoutSessionBase(BaseModel):
    session_type: str = Field("main", pattern="^(main|secondary)$")
    name: Optional[str] = None
    notes: Optional[str] = None

class WorkoutSessionCreate(WorkoutSessionBase):
    exercises: List[WorkoutExerciseCreate]

class WorkoutSession(WorkoutSessionBase):
    id: UUID
    mesocycle_day_id: UUID
    exercises: List[WorkoutExercise] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Mesocycle day schemas
class MesocycleDayBase(BaseModel):
    day_number: int
    name: Optional[str] = None
    is_rest_day: bool = False
    has_two_sessions: bool = False
    notes: Optional[str] = None

class MesocycleDayCreate(MesocycleDayBase):
    sessions: List[WorkoutSessionCreate]

class MesocycleDay(MesocycleDayBase):
    id: UUID
    mesocycle_id: UUID
    sessions: List[WorkoutSession] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Mesocycle schemas
class MesocycleBase(BaseModel):
    name: str
    duration_weeks: int = Field(..., ge=2, le=16)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

class MesocycleCreate(MesocycleBase):
    days: List[MesocycleDayCreate]

class Mesocycle(MesocycleBase):
    id: UUID
    user_id: UUID
    status: str = Field("draft", pattern="^(draft|active|completed|archived)$")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MesocycleWithDays(Mesocycle):
    days: List[MesocycleDay]

# Exercise history schemas
class ExerciseHistoryBase(BaseModel):
    exercise_id: UUID
    workout_date: date
    sets_completed: int
    reps: List[int]
    weight_lb: List[float]
    rir: Optional[List[int]] = None
    notes: Optional[str] = None

class ExerciseHistoryCreate(ExerciseHistoryBase):
    pass

class ExerciseHistory(ExerciseHistoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Response schemas
class TodayWorkoutResponse(BaseModel):
    mesocycle_name: str
    day_number: int
    day_name: str
    sessions: List[WorkoutSession]
    
class ExerciseProgressResponse(BaseModel):
    exercise_name: str
    history: List[Dict[str, Any]]
    personal_records: Dict[str, Any]