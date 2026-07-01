from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

from ingest import extract_text_from_pdf
from matcher import match_resume_to_jobs
from explainer import explain_top_matches, get_ats_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ResuMatch.ai API is live!"}

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    save_path = os.path.join(script_dir, "..", "data", "resume.pdf")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "Resume uploaded successfully", "filename": file.filename}

@app.get("/ats-score")
async def ats_score():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    resume_path = os.path.join(script_dir, "..", "data", "resume.pdf")
    resume_text = extract_text_from_pdf(resume_path)
    result = get_ats_score(resume_text)
    return result

@app.get("/match")
async def get_matches(location: str = Query(None)):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    resume_path = os.path.join(script_dir, "..", "data", "resume.pdf")
    resume_text = extract_text_from_pdf(resume_path)
    matched_jobs = match_resume_to_jobs(resume_text, location=location)
    results = explain_top_matches(resume_text, matched_jobs)
    return {"matches": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
