# synthetivolve/backend/app/core/config.py
import os

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
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]