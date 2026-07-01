import fitz                          
from sentence_transformers import SentenceTransformer  
from pinecone import Pinecone        
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv       
import os                            

load_dotenv()             

if not os.getenv("PINECONE_API_KEY"):
    raise ValueError("PINECONE_API_KEY environment variable is not set.")


def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def chunk_text(text, chunk_size=200, overlap=50):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks

def load_embedder():
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model

def connect_pinecone():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index("resume-matcher")
    return index

def ingest_resume(pdf_path):
    print("Extracting text from PDF...")
    text = extract_text_from_pdf(pdf_path)
    print(f"Extracted {len(text)} characters")

    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks")

    model = load_embedder()
    embeddings = model.encode(chunks)
    print(f"Embeddings shape: {embeddings.shape}")

    index = connect_pinecone()

    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"chunk-{i}",
            "values": embedding.tolist(),
            "metadata": {
                "text": chunk
            }
        })

    index.upsert(vectors=vectors)
    print(f"Stored {len(vectors)} vectors in Pinecone successfully.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, "..", "data", "resume.pdf")
    ingest_resume(pdf_path)