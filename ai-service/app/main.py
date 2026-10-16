from fastapi import FastAPI

from .config import ENGINE_VERSION
from .engine import analyze
from .schemas import AnalyzeRequest

app = FastAPI(title="Farm AMU AI service", version=ENGINE_VERSION)


@app.get("/health")
def health():
    return {"ok": True, "engine": ENGINE_VERSION}


@app.post("/analyze")
def analyze_endpoint(body: AnalyzeRequest):
    return analyze(body)