# backend/app/api/deps.py
from fastapi import Depends, HTTPException, status
from supabase import create_client, Client
from app.core import config
from app.services.data_service import DataService
from app.services.fitness_service import FitnessService

# Create a single Supabase client instance
if config.SUPABASE_URL is None or config.SUPABASE_KEY is None:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the environment")

supabase_client: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

def get_db() -> Client:
    return supabase_client

def get_user_id() -> str:
    # I am the only user, so we can use the hardcoded USER_ID from the config
    if config.USER_ID is None:
        raise ValueError("USER_ID must be set in the environment")
    return config.USER_ID

def get_data_service(db: Client = Depends(get_db)) -> DataService:
    return DataService(db)

def get_fitness_service(db: Client = Depends(get_db)) -> FitnessService:
    return FitnessService(db)