from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth, projects, admin
import os

# Vytvor tabuľky
Base.metadata.create_all(bind=engine)

app = FastAPI(title="3D Rekon Backend")

# CORS konfigurácia
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:19007",
        "*"  # Len pre vývoj!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Zaregistruj routery
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "3D Rekon Backend API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
