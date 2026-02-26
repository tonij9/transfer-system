from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth_router, zendesk_router, atlas_router, t2220_router, jira_router, users_router
from startup import run_startup

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Transfer Status Workflow System",
    description="Wealthsimple-style transfer management with Zendesk, Atlas, T2220, and JIRA integration",
    version="1.0.0"
)

# CORS configuration - allow all origins for Cloud Run deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(zendesk_router)
app.include_router(atlas_router)
app.include_router(t2220_router)
app.include_router(jira_router)


@app.on_event("startup")
async def startup_event():
    run_startup()


@app.get("/")
def root():
    return {"message": "Transfer Status Workflow System API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
