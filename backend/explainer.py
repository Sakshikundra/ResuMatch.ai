from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in your .env file.")

client = genai.Client(api_key=api_key)

# ─── ATS SCORE ────────────────────────────────────────────
def get_ats_score(resume_text):
    prompt = f"""You are an ATS (Applicant Tracking System) expert. Analyze this resume and give a score.

RESUME:
{resume_text}

Respond in this EXACT format — nothing else:

SCORE: (number 0-100)
GOOD: point1 | point2 | point3
IMPROVE: point1 | point2 | point3
SUMMARY: One sentence overall verdict

Rules:
- SCORE: realistic ATS score based on formatting, keywords, sections, achievements
- GOOD: 3 things resume does well (pipe separated)
- IMPROVE: 3 specific improvements needed (pipe separated)
- SUMMARY: one encouraging sentence"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    raw = response.text.strip()

    result = {"score": 0, "good": [], "improve": [], "summary": ""}
    for line in raw.split("\n"):
        if line.startswith("SCORE:"):
            try:
                result["score"] = int(line.replace("SCORE:", "").strip())
            except:
                result["score"] = 70
        elif line.startswith("GOOD:"):
            result["good"] = [x.strip() for x in line.replace("GOOD:", "").split("|") if x.strip()]
        elif line.startswith("IMPROVE:"):
            result["improve"] = [x.strip() for x in line.replace("IMPROVE:", "").split("|") if x.strip()]
        elif line.startswith("SUMMARY:"):
            result["summary"] = line.replace("SUMMARY:", "").strip()

    return result

# ─── SKILLS GAP EXPLAINER ─────────────────────────────────
def explain_match(resume_text, job_description, job_title):
    prompt = f"""You are a career advisor. Compare this candidate's resume with a job description.

RESUME:
{resume_text}

JOB DESCRIPTION ({job_title}):
{job_description}

Respond in this EXACT format — nothing else:

MATCHED_SKILLS: skill1, skill2, skill3
MISSING_SKILLS: skill1, skill2, skill3
LEARNING_SKILLS: skill1, skill2
WHY_MATCH: 2-3 sentences explaining why candidate fits this role
VERDICT: One encouraging sentence

Rules:
- MATCHED_SKILLS: skills from resume that match job requirements
- MISSING_SKILLS: important skills in job but NOT in resume
- LEARNING_SKILLS: nice-to-have skills candidate could learn
- Keep each list to max 4-5 skills
- Be specific, reference actual skills"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text

def parse_explanation(raw_text):
    result = {
        "matched_skills": [],
        "missing_skills": [],
        "learning_skills": [],
        "why_match": "",
        "verdict": "",
    }
    for line in raw_text.strip().split("\n"):
        if line.startswith("MATCHED_SKILLS:"):
            skills = line.replace("MATCHED_SKILLS:", "").strip()
            result["matched_skills"] = [s.strip() for s in skills.split(",") if s.strip()]
        elif line.startswith("MISSING_SKILLS:"):
            skills = line.replace("MISSING_SKILLS:", "").strip()
            result["missing_skills"] = [s.strip() for s in skills.split(",") if s.strip()]
        elif line.startswith("LEARNING_SKILLS:"):
            skills = line.replace("LEARNING_SKILLS:", "").strip()
            result["learning_skills"] = [s.strip() for s in skills.split(",") if s.strip()]
        elif line.startswith("WHY_MATCH:"):
            result["why_match"] = line.replace("WHY_MATCH:", "").strip()
        elif line.startswith("VERDICT:"):
            result["verdict"] = line.replace("VERDICT:", "").strip()
    return result

def explain_top_matches(resume_text, matched_jobs):
    explained_results = []
    for job in matched_jobs:
        print(f"Generating explanation for: {job['title']}...")
        raw_explanation = explain_match(
            resume_text=resume_text,
            job_description=job["description"],
            job_title=job["title"]
        )
        parsed = parse_explanation(raw_explanation)
        job["explanation"] = parsed["why_match"]
        job["verdict"] = parsed["verdict"]
        job["matched_skills"] = parsed["matched_skills"]
        job["missing_skills"] = parsed["missing_skills"]
        job["learning_skills"] = parsed["learning_skills"]
        explained_results.append(job)
    return explained_results