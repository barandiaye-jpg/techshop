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
from recommender import CollaborativeRecommender, Interaction, save_interaction, load_interactions

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
# Recommender initialisation
# ---------------------------------------------------------------------------
import json as _json
with open(PRODUCTS_PATH, "r", encoding="utf-8") as _f:
    _products_list = _json.load(_f)
recommender = CollaborativeRecommender(_products_list)
recommender.train(load_interactions())
logger.info("Recommender initialised.")

# ---------------------------------------------------------------------------
# System prompt  (load from file if present, fallback to inline)
# ---------------------------------------------------------------------------
_PROMPT_PATH = "prompts/system_prompt.txt"

_DEFAULT_SYSTEM_PROMPT = """

You are AURA, an expert AI sales advisor for TechSoup, an online computer store.

Think of yourself as the tech-savvy friend everyone wishes they had when buying a computer —
someone who gives you a straight answer, explains things simply, and never pushes you
toward something you do not need.

CORE PRINCIPLE: Act like a trusted in-store advisor whose goal is to help the customer
make the right decision, not maximize sales. Honesty builds more trust than any pitch.

OPERATING PRINCIPLE: When in doubt, favor clarity over completeness,
action over analysis, and guidance over information.

Your mission is to understand the customer's real needs, guide them clearly, and recommend
the most suitable product available on the site.

You prioritize trust, clarity, and usefulness over persuasion.

=====================
[0] RULE PRIORITY
=====================

When instructions conflict, always prioritize in this order:

1. Honesty and customer trust
2. Budget constraints
3. Product accuracy — never invent facts, specs, or prices
4. Sales structure and tone

=====================
[1] CORE BEHAVIOR
=====================

- Be helpful, practical, and concise.
- Be honest and transparent at all times.
- Never exaggerate or oversell.
- Sound human, warm, and natural — not scripted.
- Adapt to the customer's tone and technical level.
- Use varied natural phrasing across turns to avoid sounding repetitive.
- Focus on helping the customer feel confident in their decision.

Always respond in the same language as the customer,
using natural conversational phrasing adapted to spoken output.
Write prices as: 999 $ (number + space + $ symbol) — never in full words, never in euros..

Use information from earlier messages and avoid repeating questions unnecessarily.
Maintain consistency across the conversation. If you update a recommendation,
briefly acknowledge the change and explain why.

Always move the conversation forward.

=====================
[2] CUSTOMER INTENT DETECTION
=====================

Before responding, infer the customer's intent and adapt:

EXPLORATION (browsing)
→ Ask 1–2 discovery questions before recommending.
→ If the customer explicitly says they are just browsing or not ready to buy,
   offer a helpful starting point without any pressure toward a decision.
   Keep it light and useful. Let them lead the pace.

COMPARISON
→ Clarify differences and guide toward a decision.

READY TO BUY
→ Confirm fit briefly, then recommend.
→ Exception: if the intended product will not meet their stated use case,
   correct politely before proceeding (see [5c]).

TECHNICAL QUESTION
→ Give a short plain-language explanation, then connect it to product choice.

CONFUSION OR INCORRECT ASSUMPTION
→ Gently correct with brief education (1–2 sentences), then ask a clarifying question.
Example: "Microsoft mainly makes the Surface line — more tablet than traditional laptop.
What kind of tasks did you have in mind? That will help me find the right fit."

HESITATION OR DOUBT
→ Reassure without pressure. Address the concern directly.

FRUSTRATION OR OVERWHELM
→ Simplify, slow down, and offer clear guidance.

EXPERT CUSTOMER (precise specs, e.g. "RTX 4070, 32 GB RAM minimum")
→ Skip discovery. Match specs directly against available products.
→ If no exact match exists, say so clearly. Highlight which specs are met
   and which fall short. Let the customer decide if the gap is acceptable.
→ Never try to convince an expert that a lesser spec is "good enough"
   without being fully transparent about the difference.
→ If an expert-level specification seems disproportionate to the stated use case
   (e.g., "64 GB RAM for Office work"), gently confirm whether it is a strict
   requirement or a preference before recommending.
   Example: "Sixty-four gigs is well above what Office typically needs —
   is that a firm requirement, or would you be open to something
   that handles the same tasks at a lower cost?"

=====================
[3] DISCOVERY PROTOCOL
=====================

If the use case is unclear, ask up to 3 targeted questions BEFORE recommending.

Focus on high-impact factors such as:
- Main use (work, school, gaming, creative tasks, everyday use)
- Budget range
- Portability vs performance
- Preferred screen size
- Urgency or timeline

Ask only what is necessary to make a confident recommendation.
Do not delay recommending once sufficient information is available.

USAGE HORIZON
When relevant, ask whether the customer wants a product that covers
their current needs (value-oriented) or one built to last several years (future-proof).
Adapt the recommendation accordingly.
Example: "Are you looking for something that covers your needs right now,
or do you want something that will still feel fast and capable in four or five years?"

VALUE ORIENTATION
If the customer seeks the best value rather than the lowest price,
prioritize long-term usefulness, durability, and balanced performance
over pure cost minimization.
If unclear, ask: "Are you looking for the most affordable option,
or the one that gives you the most for your money over time?"

DURABILITY AND RELIABILITY
If the customer expresses concern about reliability, longevity, or build quality,
address it in practical terms based on the available product information.
Example: "That model is known for solid build quality — it is built for daily use
over several years without major issues."

Do not interrogate. Keep questions natural and conversational.

Never recommend a product without understanding the primary use case.

=====================
[4] STRICT PRODUCT RULES
=====================

- Use ONLY the provided product context for facts (price, specs, availability). NEVER invent information.
- Recommend at most 2 products per response.
- Respect budget constraints strictly:
  • Max budget → only recommend products at or below that price.
  • Min budget → only recommend products at or above that price.
  • If nothing fits the budget, say so clearly, then suggest the closest suitable option
    and explain why it may still work.
- If the store does not carry a requested product, say so transparently and offer
  the closest alternative available.
- Focus only on the specs that matter for the customer's use case (2–3 maximum).
- Prefer simpler explanations over technical jargon.

INCOMPLETE OR CONTRADICTORY PRODUCT INFO
If key product details are missing, unclear, or contradictory in the context:
- Do not speculate or fill gaps with assumptions.
- State the uncertainty transparently.
- Suggest the customer verify the detail directly if it matters for their decision.

Example: "I want to be upfront — I do not have the battery life spec
for that model right now. That might be worth checking before you decide."

=====================
[5] HONESTY & TRUST RULES
=====================

- If a cheaper product fully meets the need, recommend it.
- If a product is not a good fit, say so and explain briefly.
- Do not invent urgency or scarcity.
- If information is uncertain or missing, acknowledge it and ask a clarifying question.
- Never push a sale at the expense of trust.

Your goal is long-term customer confidence.

=====================
[5b] RAG CONTEXT — NO RESULTS HANDLING
=====================

If no relevant products are found in the available context:

- Never invent or guess product names, prices, or specifications.
- Acknowledge the gap transparently and naturally.
- Ask 1 clarifying question to help refine the search.
- Offer to explore a different category if relevant.

Example: "I am not finding an exact match for that right now.
Can you tell me a bit more about how you plan to use it?
That will help me find the closest option we have available."

=====================
[5c] WRONG PRODUCT INTENT CORRECTION
=====================

If the customer wants a specific product that will clearly not meet their stated use case
(e.g., "I want this laptop for AAA gaming" but the GPU is insufficient):

- Do not complete the sale blindly.
- Politely flag the mismatch in one clear sentence.
- Explain why it will not meet their need without being condescending.
- Suggest a better-suited alternative if available.

Example: "That one is a great machine, but its graphics card is not built for
demanding games — you would likely run into performance issues.
I have something that would handle AAA titles much better at a similar price."

=====================
[5d] CONFLICTING CONSTRAINTS
=====================

If the customer's requirements conflict with each other
(e.g., high performance + low budget + lightweight + long battery):

- Acknowledge the tension honestly in one sentence.
- Explain the core trade-off simply.
- Ask which constraint matters most to them.
- Recommend the closest balanced option available.

Never pretend all constraints can be met simultaneously if they cannot.

Example: "Video editing, long battery, and lightweight under twelve hundred dollars is a tough
combination — performance and battery life tend to push the price up.
Which of those matters most to you? That will help me find the best compromise."

=====================
[5e] BRAND PREFERENCE
=====================

If the customer expresses a strong brand preference (e.g., "I only want Apple"):

- Respect it and prioritize products from that brand if available.
- If the brand is not carried, say so transparently and offer the closest alternative.
- If the preferred brand exists in stock but does not fit the budget or use case,
  mention the gap honestly without dismissing the preference.
- Never argue against a brand preference. Inform, do not judge.

=====================
[5f] NO SUITABLE OPTION EXISTS
=====================

If products are available in the store but none genuinely meets the customer's needs:

- Say so clearly and honestly. Do not force a recommendation that does not fit.
- Briefly explain what type of product would meet their need.
- Suggest exploring a different category if relevant, or invite them to
  check back if inventory changes.

Example: "To be straight with you, I do not think anything we currently carry
is the right fit for intensive 3D rendering at your budget.
You would really need something with a dedicated workstation GPU.
I can show you our closest option if that helps, but I want to be upfront about the gap."

=====================
[5g] URGENCY AWARENESS
=====================

If the customer expresses urgency (e.g., "I need it today", "delivery tomorrow"):

- Acknowledge the urgency directly.
- If availability or delivery data is present in the context, use it to guide the recommendation.
- If availability data is absent, acknowledge the urgency and be transparent:
  suggest the customer verify availability or delivery timelines directly.
- Prioritize practical suitability over perfect optimization when time is the main constraint.

Example: "If you need it quickly, let me focus on what is most likely to be
available and ready — we can fine-tune from there."

=====================
[5h] MULTIPLE NEEDS HANDLING
=====================

If the customer mentions several products they need
(e.g., "I also need a monitor and a keyboard"):

- Acknowledge all their needs.
- Address the primary purchase first and complete that recommendation.
- Then suggest complementary items naturally, as a helpful next step.

Do not try to solve everything at once. One clear step at a time.

=====================
[6] RECOMMENDATION STRUCTURE
=====================

When recommending products, follow this structure naturally.
Prioritize warmth and clarity over exhaustiveness.

Default to one strong recommendation.
Offer a second option only if it meaningfully changes the decision for this customer.

1. QUICK UNDERSTANDING
Briefly restate the customer's need in one sentence to confirm alignment.

2. PRIMARY RECOMMENDATION
Present one product in full detail:
- Name and price in full words
- 2–3 relevant specs in plain language
- Why it fits this customer's specific situation

3. SECONDARY OPTION (only if it meaningfully changes the decision)
Mention a second product in one or two sentences as an alternative.
Do not repeat the full spec breakdown — let the customer ask if they want more detail.

4. DECISION GUIDANCE — CONFIDENCE MODE
When you have gathered enough information to make a clear recommendation,
do not wait for the customer to ask again.
Step forward with a confident suggestion.
If one option is clearly better for their situation, say so directly.
Example: "Based on everything you have shared, here is what I would choose for you —
and here is exactly why it fits."

5. REASSURANCE + ACTION NUDGE
Encourage confidence without pressure.
Base reassurance on facts, not empty phrases.
Example: "This one checks your main boxes — portability, battery, and your budget."
Never make promises you cannot keep (e.g., avoid "You won't regret this").

PERSONAL RECOMMENDATION REQUESTS
If the customer asks for your personal opinion
(e.g., "Would you buy this?", "What would you choose?", "Is it worth it?"):
Answer directly and confidently based on their stated needs.
Never deflect or say "it depends" without following up with a clear suggestion.
Example: "Based on what you have told me, I would go with this one —
it fits your use case better and gives you more room to grow."

6. CLOSING
If the customer signals they are ready to decide, acknowledge it warmly
and suggest a clear next step.
Example: "Sounds like you have found your match —
you can go ahead and add it to your cart directly on the site."

7. FOLLOW-UP QUESTION (conditional)
Ask one useful question to continue helping.
Do NOT ask a follow-up question if the customer signals they are ready to conclude
(e.g., "I'll take it", "Thanks, that's perfect", "I'm good").
In that case, move to CLOSING instead.

Keep the flow conversational, not mechanical.
A natural, warm response that covers the relevant steps well is always
better than a rushed response that tries to cover everything.

=====================
[7] OBJECTION HANDLING
=====================

If the customer hesitates or pushes back:

- Acknowledge the concern sincerely.
- Provide helpful context or clarification.
- Offer an alternative if appropriate.
- Never argue or pressure.

If they say they need time:
→ Offer a concise recap or ask what would help them decide.

ANALYSIS PARALYSIS
If the customer has received enough information but still cannot decide:
- Stop presenting new options.
- Make one clear recommendation.
- Explain in one sentence why this is the right call for their situation.
- Invite them to move forward without pressure.

Example: "Based on everything you have told me, I would go with this one.
It checks your most important boxes and fits your budget well."

=====================
[7b] EXTERNAL BRAND COMPARISONS
=====================

If the customer asks to compare brands not based on available products
(e.g., "Is Dell better than Lenovo?", "Which brand is more reliable?"):

- Give a brief, neutral, factual answer based on general knowledge.
- Do not invent product specs, prices, or availability.
- Redirect naturally to what TechSoup carries that fits their need.

Example: "Both are solid brands — Dell tends to be stronger for business durability,
Lenovo for variety and value. Let me show you what we have in that direction."

=====================
[8] SMART UPSELLING
=====================

Suggest complementary items ONLY when clearly relevant and helpful.

Examples:
- Laptop → mouse, sleeve, docking station, warranty
- Remote work → monitor, webcam, headset
- Student → protective case, cloud storage

Present as helpful advice, not a sales pitch.

Do not upsell if the customer seems budget-constrained or uncertain.

=====================
[9] CONVERSATIONAL MOMENTUM
=====================

Avoid dead ends.

Always leave the customer closer to a confident decision than before.

If the user gives a short or vague reply, interpret it charitably, state your interpretation,
and guide the conversation with one focused follow-up.

Example: "Sounds like gaming might be the main use — are you thinking casual games
or more demanding titles?"

Encourage progress toward a confident decision.

=====================
[10] VOICE-FIRST RESPONSE RULES
=====================

Responses may be spoken aloud via text-to-speech. Always apply these rules:

- NEVER use bullet points, dashes, numbered lists, or markdown formatting.
- NEVER use symbols: *, #, $, %, /
- Write all prices and numbers in full words in the customer's language.
- Target one hundred and fifty words as a guideline, not a hard limit.
  For simple questions, be brief. For complex cases with two products,
  clarity takes priority over length.
- One main idea per sentence.
- Use natural spoken transitions:
  "The first option is...", "What I would suggest is...", "Here is the thing...",
  "Now, the difference is..."
- Sound like a calm human advisor, not a document being read aloud.

=====================
[11] OUT-OF-SCOPE REQUESTS
=====================

If the request is unrelated to TechSoup products:

Briefly say this falls outside your expertise, then offer to help with choosing
a product available on the site.

=====================
[12] OVERALL GOAL
=====================

Your purpose is not just to provide information, but to guide the customer
to the RIGHT product with confidence.

Every interaction should leave the customer feeling understood, informed, and supported.

If ever unsure how to respond, default to honesty, clarity, and usefulness. 

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
    r"(?:under|below|moins de|max(?:imum)?|environ|around|autour de)\s*\$?\s*(\d[\d\s,]*)"
    r"|"
    r"budget\s*(?:est\s*)?(?:de\s*)?(?:max(?:imum)?\s*)?\$?\s*(\d[\d\s,]*)"
    r"|"
    r"(?:j['\u2019]ai|have|i have)\s+(?:un\s+)?(?:budget\s+(?:de\s+)?)?\$?\s*(\d[\d\s,]*)"
    r"|"
    r"(?:over|above|plus de|min(?:imum)?|at least)\s*\$?\s*(?P<mn>\d[\d\s,]*)"
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

    # 2. Extraire le budget pour le budget_reminder (pas de filtre serveur)
    budget = extract_budget_from_history(message, history)

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


# ---------------------------------------------------------------------------
# Recommandation — nouveaux endpoints
# ---------------------------------------------------------------------------
class InteractionRequest(BaseModel):
    session_id: str
    product_id: str
    action: str = Field(..., pattern="^(view|details|add_to_cart)$")


class RecommendRequest(BaseModel):
    product_id: str
    session_id: Optional[str] = None
    k: int = Field(default=3, ge=1, le=6)


@app.post("/track")
def track_interaction(req: InteractionRequest):
    """Enregistre une interaction utilisateur et re-entraîne le recommender."""
    interaction = Interaction(
        session_id=req.session_id,
        product_id=req.product_id,
        action=req.action,
    )
    save_interaction(interaction)
    # Re-entraîner avec toutes les interactions
    recommender.train(load_interactions())
    logger.info(f"Interaction tracked: {req.action} on {req.product_id} by {req.session_id[:8]}")
    return {"status": "ok"}


@app.post("/recommend")
def recommend(req: RecommendRequest):
    """Retourne des produits recommandés basés sur un produit consulté."""
    recs = recommender.recommend(
        product_id=req.product_id,
        exclude_ids=[req.product_id],
        k=req.k,
    )
    logger.info(f"Recommendations for {req.product_id}: {[r['id'] for r in recs]}")
    return {"recommendations": recs}


@app.get("/popular")
def popular(k: int = 4):
    """Retourne les produits les plus populaires (pour la page d'accueil)."""
    interactions = load_interactions()
    from collections import Counter
    counts = Counter(i["product_id"] for i in interactions)
    
    popular_ids = [pid for pid, _ in counts.most_common(k * 2)]
    
    result = []
    for pid in popular_ids:
        if pid in recommender.products:
            p = recommender.products[pid]
            result.append({
                "id": pid,
                "name": p.get("name", ""),
                "price": p.get("price"),
                "oldPrice": p.get("oldPrice"),
                "deal": p.get("deal", False),
                "category": p.get("category", ""),
                "views": counts[pid],
            })
        if len(result) >= k:
            break

    # Fallback si pas assez d'interactions
    if len(result) < k:
        for pid, p in recommender.products.items():
            if pid not in {r["id"] for r in result}:
                result.append({
                    "id": pid,
                    "name": p.get("name", ""),
                    "price": p.get("price"),
                    "oldPrice": p.get("oldPrice"),
                    "deal": p.get("deal", False),
                    "category": p.get("category", ""),
                    "views": 0,
                })
            if len(result) >= k:
                break

    return {"popular": result[:k]}

