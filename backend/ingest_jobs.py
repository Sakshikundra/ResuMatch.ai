import pandas as pd
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv
import os

load_dotenv()

def connect_pinecone():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index("resume-matcher")
    return index



def load_jobs(csv_path, limit=5000):
    print("Loading job dataset...")
    df = pd.read_csv(csv_path)
    
    # sirf kaam ki columns rakho
    df = df[["job_id", "title", "company_name", "location", 
             "description", "job_posting_url"]].copy()
    
    # empty rows hata do
    df = df.dropna(subset=["description", "title"])
    
    # sirf 5000 jobs lo
    df = df.head(limit)
    
    print(f"Loaded {len(df)} jobs")
    return df

def ingest_jobs(csv_path, limit=5000):
    # 1. Jobs load karo
    df = load_jobs(csv_path, limit=limit)
    
    # 2. Embedding model load karo
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # 3. Description embed karo
    print("Creating embeddings... (time lagega)")
    descriptions = df["description"].tolist()
    embeddings = model.encode(descriptions, show_progress_bar=True)
    print(f"Embeddings shape: {embeddings.shape}")
    
    # 4. Pinecone mein store karo
    index = connect_pinecone()
    
    vectors = []
    for i, (_, row) in enumerate(df.iterrows()):
        vectors.append({
            "id": f"job-{row['job_id']}",
            "values": embeddings[i].tolist(),
            "metadata": {
                "title": str(row["title"]),
                "company": str(row["company_name"]),
                "location": str(row["location"]),
                "url": str(row["job_posting_url"]),
                "description": str(row["description"])[:500]  # sirf 500 chars
            }
        })
    
    # 5. Batch mein upsert karo — 100 ek baar mein
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i+batch_size]
        index.upsert(vectors=batch)
        print(f"Uploaded {min(i+batch_size, len(vectors))}/{len(vectors)}")
    
    print("All jobs stored in Pinecone successfully.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "..", "data", "postings.csv")
    ingest_jobs(csv_path, limit=5000)

    



