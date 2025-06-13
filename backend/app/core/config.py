# synthetivolve/backend/app/core/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

API_V1_STR = "/api"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
USER_ID = os.getenv("USER_ID")

if not all([SUPABASE_URL, SUPABASE_KEY, USER_ID]):
    raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, USER_ID")

# CORS origins
ORIGINS = [
    "http://localhost",
    "http://127.0.0.1:5500",
]