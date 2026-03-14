import os
import json
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from openai import OpenAI

from rag import TfidfRAG, load_products_as_docs

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="TechStore AI Backend (LLM+RAG)")

# ✅ Garde un seul bloc CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://techshop-rmo8.onrender.com",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Init RAG au démarrage ---
PRODUCTS_PATH = os.getenv("PRODUCTS_PATH", "data/products.json")
docs = load_products_as_docs(PRODUCTS_PATH)
rag = TfidfRAG(docs)

SYSTEM_PROMPT = """
Tu es l'assistant IA de TechShop, une boutique d'ordinateurs.
Règles strictes :
- Réponds TOUJOURS en français, peu importe la langue de la question.
- Utilise UNIQUEMENT le contexte fourni pour les prix et les specs. N'invente rien.
- Affiche les prix TOUJOURS avec le symbole $ (ex: 999 $). Jamais €, jamais EUR.
- Si le contexte est insuffisant, pose une question de clarification.
- Recommande au maximum 3 produits en justifiant chaque choix avec des specs concrètes.
- Sois concis, pratique et chaleureux.
"""

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    k: int = 5

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

class VoiceChatResponse(BaseModel):
    transcript: str
    answer: str
    sources: List[Dict[str, Any]]

def build_context(hits):
    blocks = []
    for doc, score in hits:
        blocks.append(
            f"[{doc.doc_id}] {doc.title} (score={score:.3f})\n{doc.text}"
        )
    return "\n\n---\n\n".join(blocks)

def transcribe_audio_file(upload: UploadFile) -> str:
    try:
        upload.file.seek(0)

        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=(upload.filename or "audio.webm", upload.file, upload.content_type or "audio/webm")
        )

        text = transcription.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Transcription vide.")

        return text

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription audio: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    hits = rag.search(req.message, k=req.k)
    context = build_context(hits)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if req.history:
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

@app.post("/voice-chat", response_model=VoiceChatResponse)
def voice_chat(
    audio: UploadFile = File(...),
    history: Optional[str] = Form(None),
    k: int = Form(5)
):
    # 1) transcription audio -> texte
    transcript = transcribe_audio_file(audio)

    # 2) historique optionnel
    parsed_history = []
    if history:
        try:
            parsed_history = json.loads(history)
            if not isinstance(parsed_history, list):
                parsed_history = []
        except Exception:
            parsed_history = []

    # 3) recherche RAG
    hits = rag.search(transcript, k=k)
    context = build_context(hits)

    # 4) construction du prompt
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if parsed_history:
        messages.extend(parsed_history[-8:])

    messages.append({
        "role": "user",
        "content": f"User question:\n{transcript}\n\nContext:\n{context}"
    })

    # 5) appel LLM
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.2
    )

    answer = completion.choices[0].message.content

    # 6) sources
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

    return VoiceChatResponse(
        transcript=transcript,
        answer=answer,
        sources=sources
    )

@app.get("/health")
def health():
    return {"status": "ok", "docs_indexed": len(docs)}



