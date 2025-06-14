# synthetivolve/backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import ORIGINS, API_V1_STR
from app.api.endpoints import goals, weight, nutrition, fitness # Import your new routers

app = FastAPI(title="Synthetivolve API")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(goals.router, prefix=f"{API_V1_STR}/goals", tags=["goals"])
app.include_router(weight.router, prefix=f"{API_V1_STR}/weight", tags=["weight"])
app.include_router(nutrition.router, prefix=f"{API_V1_STR}/nutrition", tags=["nutrition"])
app.include_router(fitness.router, prefix=f"{API_V1_STR}/fitness", tags=["fitness"])


@app.get("/")
def read_root():
    return {"status": "Synthetivolve API is running!"}