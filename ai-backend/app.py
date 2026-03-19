import os
import re
import json
import logging
import time
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from openai import OpenAI
from rag import HybridRAG, load_products_as_docs

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="TechStore AI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://techshop-rmo8.onrender.com",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# RAG initialisation
# ---------------------------------------------------------------------------
PRODUCTS_PATH = os.getenv("PRODUCTS_PATH", "data/products.json")
docs = load_products_as_docs(PRODUCTS_PATH)
rag = HybridRAG(docs)
logger.info(f"RAG initialised — {len(docs)} products indexed.")

# ---------------------------------------------------------------------------
# System prompt  (load from file if present, fallback to inline)
# ---------------------------------------------------------------------------
_PROMPT_PATH = "prompts/system_prompt.txt"

_DEFAULT_SYSTEM_PROMPT = """
You are an expert AI shopping assistant for a computer and tech store.

## Core rules
- Base ALL product facts (price, specs) ONLY on the provided context. Never invent.
- If the context is empty or insufficient, say so clearly and offer to help differently.
- Recommend at most 2 products per response; justify each with concrete, relevant specs.
- Always display prices with the $ symbol (e.g. 999 $). Never use € or EUR.
- Be concise, warm, and practical — like a knowledgeable friend, not a salesperson.
- Reply in the SAME language as the user (French or English).

## Budget rules  ← enforced strictly
- ## Budget rules  ← enforced strictly
- MAX budget: recommend ONLY products whose CURRENT price (the "price" field) 
  is strictly below the stated ceiling.
- A product on promotion is NOT an exception — if its current price exceeds 
  the budget, do NOT recommend it, regardless of its original price.
- NEVER recommend a product above budget, even to show it as an alternative..
- MIN budget: recommend ONLY products strictly above the stated floor.
- If NO product in the context meets the constraint, respond:
  "Je n'ai pas de produit correspondant à ce critère dans notre catalogue actuel."
  / "I don't have a product matching that criterion in our current catalogue."

## Promotions
- If a product has "On promotion: Yes" in its context, mention the discount and original price — it's a strong selling point.
- If a product is "Featured / coup de coeur: Yes", highlight it as a staff pick when recommending it.

## Format
- Use short bullet points for specs.
- Mention promo price and savings if applicable (e.g. "currently on sale: 1299 $ instead of 1499 $, save 200 $").
- End with one follow-up question to refine the recommendation.
""".strip()

def load_system_prompt() -> str:
    if os.path.exists(_PROMPT_PATH):
        with open(_PROMPT_PATH, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                logger.info(f"System prompt loaded from {_PROMPT_PATH}")
                return content
    return _DEFAULT_SYSTEM_PROMPT

SYSTEM_PROMPT = load_system_prompt()

# ---------------------------------------------------------------------------
# Budget guard — server-side extraction + filtering
# ---------------------------------------------------------------------------
_BUDGET_RE = re.compile(
    r"(?:"
    r"(?:under|below|moins de|max(?:imum)?|budget[:\s]+)\s*\$?\s*(\d[\d\s,]*)"   # max
    r"|"
    r"(?:over|above|plus de|min(?:imum)?|at least)\s*\$?\s*(\d[\d\s,]*)"          # min
    r")",
    re.IGNORECASE,
)


def _parse_price(raw: str) -> float:
    return float(raw.replace(",", "").replace(" ", ""))


def extract_budget(text: str) -> Dict[str, Optional[float]]:
    """Return {'max': float|None, 'min': float|None}."""
    result: Dict[str, Optional[float]] = {"max": None, "min": None}
    for m in _BUDGET_RE.finditer(text):
        if m.group(1):
            result["max"] = _parse_price(m.group(1))
        if m.group(2):
            result["min"] = _parse_price(m.group(2))
    return result


def filter_by_budget(
    hits: List[tuple],
    budget: Dict[str, Optional[float]],
) -> List[tuple]:
    """Remove docs that violate the detected budget constraint."""
    if budget["max"] is None and budget["min"] is None:
        return hits

    filtered = []
    for doc, score in hits:
        price_raw = doc.meta.get("price")
        try:
            price = float(str(price_raw).replace(",", "").replace(" ", "").replace("$", ""))
        except (ValueError, TypeError):
            filtered.append((doc, score))   # keep if price unknown
            continue

        if budget["max"] is not None and price > budget["max"]:
            continue
        if budget["min"] is not None and price < budget["min"]:
            continue
        filtered.append((doc, score))

    return filtered

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def build_context(hits: List[tuple]) -> str:
    if not hits:
        return "(no matching products found)"
    blocks = []
    for doc, score in hits:
        blocks.append(
            f"[{doc.doc_id}] {doc.title} (relevance={score:.3f})\n{doc.text}"
        )
    return "\n\n---\n\n".join(blocks)


def hits_to_sources(hits: List[tuple]) -> List[Dict[str, Any]]:
    return [
        {
            "id": doc.doc_id,
            "title": doc.title,
            "score": round(score, 4),
            "price": doc.meta.get("price"),
            "category": doc.meta.get("category"),
        }
        for doc, score in hits
    ]


def call_llm(messages: List[Dict], temperature: float = 0.2) -> str:
    completion = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=messages,
        temperature=temperature,
        max_tokens=600,
    )
    return completion.choices[0].message.content


def transcribe_audio_file(upload: UploadFile) -> str:
    try:
        upload.file.seek(0)
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=(
                upload.filename or "audio.webm",
                upload.file,
                upload.content_type or "audio/webm",
            ),
        )
        text = transcription.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Empty transcription.")
        return text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {e}")


def extract_budget_from_history(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Optional[float]]:
    """
    Cherche un budget dans le message courant d'abord,
    puis remonte l'historique si rien n'est trouvé.
    """
    budget = extract_budget(message)
    if budget["max"] is not None or budget["min"] is not None:
        return budget

    if history:
        for turn in reversed(history):
            content = turn.get("content", "")
            budget = extract_budget(content)
            if budget["max"] is not None or budget["min"] is not None:
                return budget

    return {"max": None, "min": None}


def run_rag_pipeline(
    message: str,
    history: Optional[List[Dict[str, str]]],
    k: int,
) -> tuple:
    """Shared logic for /chat and /voice-chat."""
    t0 = time.perf_counter()

    # 1. Retrieve
    hits = rag.search(message, k=k)

    # 2. Server-side budget guard — cherche aussi dans l'historique
    budget = extract_budget_from_history(message, history)
    hits = filter_by_budget(hits, budget)

    # 3. Build context
    context = build_context(hits)

    # 4. Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history[-8:])
    messages.append({
        "role": "user",
        "content": f"User question:\n{message}\n\nContext:\n{context}",
    })

    # 5. LLM
    answer = call_llm(messages)

    elapsed = time.perf_counter() - t0
    logger.info(
        f"Pipeline | query={message[:60]!r} | hits={len(hits)} "
        f"| budget={budget} | time={elapsed:.2f}s"
    )

    return answer, hits


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: Optional[List[Dict[str, str]]] = None
    k: int = Field(default=5, ge=1, le=15)

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

class VoiceChatResponse(BaseModel):
    transcript: str
    answer: str
    sources: List[Dict[str, Any]]

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    answer, hits = run_rag_pipeline(req.message, req.history, req.k)
    return ChatResponse(answer=answer, sources=hits_to_sources(hits))


@app.post("/voice-chat", response_model=VoiceChatResponse)
def voice_chat(
    audio: UploadFile = File(...),
    history: Optional[str] = Form(None),
    k: int = Form(5),
):
    transcript = transcribe_audio_file(audio)

    parsed_history = []
    if history:
        try:
            parsed_history = json.loads(history)
            if not isinstance(parsed_history, list):
                parsed_history = []
        except Exception:
            parsed_history = []

    answer, hits = run_rag_pipeline(transcript, parsed_history, k)
    return VoiceChatResponse(
        transcript=transcript,
        answer=answer,
        sources=hits_to_sources(hits),
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "docs_indexed": len(docs),
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "rag": "HybridRAG (TF-IDF + BM25)",
    }
