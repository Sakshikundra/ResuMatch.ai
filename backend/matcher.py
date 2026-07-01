from sentence_transformers import SentenceTransformer, CrossEncoder
from pinecone import Pinecone
from dotenv import load_dotenv
import os

load_dotenv()

def connect_pinecone():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index("resume-matcher")
    return index

def get_top_matches(resume_text, top_k=50, location=None):  # ← location add kiya
    print("Embedding resume...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    resume_embedding = model.encode(resume_text).tolist()

    print("Searching jobs in Pinecone...")
    index = connect_pinecone()

    # Pinecone filters do not support partial string/contains matches.
    # We query extra candidates and perform case-insensitive substring filtering in-memory.
    query_k = top_k * 3 if location else top_k

    results = index.query(
        vector=resume_embedding,
        top_k=query_k,
        include_metadata=True
    )

    matches = results["matches"]

    if location:
        loc_lower = location.lower()
        filtered_matches = []
        for match in matches:
            metadata = match.get("metadata", {})
            job_location = str(metadata.get("location", "")).lower()
            if loc_lower in job_location:
                filtered_matches.append(match)
        print(f"Location filter '{location}' filtered candidates from {len(matches)} down to {len(filtered_matches)}")
        return filtered_matches[:top_k]

    return matches

def rerank_matches(resume_text, matches, top_n=5):
    print("Re-ranking with cross-encoder...")
    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    pairs = []
    filtered_matches = []
    for match in matches:
        metadata = match.get("metadata", {})
        if "description" in metadata:
            pairs.append([resume_text, metadata["description"]])
            match_dict = {
                "id": match.get("id"),
                "score": match.get("score"),
                "metadata": metadata
            }
            filtered_matches.append(match_dict)

    if not filtered_matches:
        print("No job matches found with description metadata.")
        return []

    scores = cross_encoder.predict(pairs)

    for i, match in enumerate(filtered_matches):
        match["cross_score"] = float(scores[i])

    reranked = sorted(filtered_matches, key=lambda x: x["cross_score"], reverse=True)
    return reranked[:top_n]

def match_resume_to_jobs(resume_text, location=None):
    matches = get_top_matches(resume_text, top_k=50, location=location)  # ← location pass kiya
    top_jobs = rerank_matches(resume_text, matches, top_n=5)

    if not top_jobs:
        return []

    scores = [job["cross_score"] for job in top_jobs]
    min_score = min(scores)
    max_score = max(scores)
    score_range = max_score - min_score

    results = []
    for job in top_jobs:
        raw_score = job["cross_score"]
        if score_range > 0:
            normalized = (raw_score - min_score) / score_range
            display_score = round(70.0 + normalized * 28.0, 2)
        else:
            display_score = 85.0

        metadata = job.get("metadata", {})
        results.append({
            "title": metadata.get("title", "N/A"),
            "company": metadata.get("company", "N/A"),
            "location": metadata.get("location", "N/A"),
            "url": metadata.get("url", "N/A"),
            "match_score": display_score,
            "description": metadata.get("description", "N/A")
        })
    return results

if __name__ == "__main__":
    from ingest import extract_text_from_pdf
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, "..", "data", "resume.pdf")
    resume_text = extract_text_from_pdf(pdf_path)

    print("Matching your resume to jobs...")
    results = match_resume_to_jobs(resume_text)

    print(f"\nTop {len(results)} matches:\n")
    for i, job in enumerate(results):
        print(f"{i+1}. {job['title']} @ {job['company']}")
        print(f"   Location: {job['location']}")
        print(f"   Match Score: {job['match_score']}%")
        print(f"   Apply: {job['url']}")
        print()