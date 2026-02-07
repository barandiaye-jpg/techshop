import os
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from openai import OpenAI

from rag import TfidfRAG, load_products_as_docs

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="TechStore AI Backend (LLM+RAG)")

# ✅ CORS: autorise Bolt + Streamlit à appeler l’API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # en prod, tu mets tes vrais domaines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Init RAG au démarrage ---
PRODUCTS_PATH = os.getenv("PRODUCTS_PATH", "data/products.json")
docs = load_products_as_docs(PRODUCTS_PATH)
rag = TfidfRAG(docs)

SYSTEM_PROMPT = """
You are an AI shopping assistant for a computer store.
Rules:
- Use ONLY the provided context for product facts (price/specs). Do not invent.
- If the context is insufficient, ask a clarifying question.
- Recommend at most 3 products, and justify each recommendation with concrete specs.
- Be concise, practical, and friendly.
- Output in the same language as the user.
"""

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None  # [{"role":"user","content":"..."}, ...]
    k: int = 5

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

def build_context(hits):
    blocks = []
    for doc, score in hits:
        blocks.append(
            f"[{doc.doc_id}] {doc.title} (score={score:.3f})\n{doc.text}"
        )
    return "\n\n---\n\n".join(blocks)

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    hits = rag.search(req.message, k=req.k)
    context = build_context(hits)

    # On garde un mini-historique si fourni
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if req.history:
        # limite simple pour éviter un prompt trop long
        messages.extend(req.history[-8:])

    messages.append({
        "role": "user",
        "content": f"User question:\n{req.message}\n\nContext:\n{context}"
    })

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.2
    )

    answer = completion.choices[0].message.content

    sources = []
    for doc, score in hits:
        meta = doc.meta
        sources.append({
            "id": doc.doc_id,
            "title": doc.title,
            "score": round(score, 4),
            "price": meta.get("price"),
            "category": meta.get("category"),
        })

    return ChatResponse(answer=answer, sources=sources)

@app.get("/health")
def health():
    return {"status": "ok", "docs_indexed": len(docs)}






from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
