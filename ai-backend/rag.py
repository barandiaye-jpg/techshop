import json
import re
import math
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
 
 
@dataclass
class Doc:
    doc_id: str
    title: str
    text: str          # full text for TF-IDF
    text_weighted: str # boosted text for better recall
    meta: Dict
    tags: List[str] = field(default_factory=list)
 
 
class BM25:
    """Lightweight BM25 implementation — better than TF-IDF for short queries."""
 
    def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus = corpus
        self.N = len(corpus)
        self.avgdl = sum(len(d) for d in corpus) / max(self.N, 1)
        self.df: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self._build_index()
 
    def _build_index(self):
        for doc in self.corpus:
            for term in set(doc):
                self.df[term] = self.df.get(term, 0) + 1
        for term, freq in self.df.items():
            self.idf[term] = math.log((self.N - freq + 0.5) / (freq + 0.5) + 1)
 
    def score(self, query_terms: List[str], doc_idx: int) -> float:
        doc = self.corpus[doc_idx]
        dl = len(doc)
        tf_map: Dict[str, int] = {}
        for t in doc:
            tf_map[t] = tf_map.get(t, 0) + 1
 
        score = 0.0
        for term in query_terms:
            if term not in self.idf:
                continue
            tf = tf_map.get(term, 0)
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * (1 - self.b + self.b * dl / self.avgdl)
            score += self.idf[term] * numerator / denominator
        return score
 
    def search(self, query: str, k: int = 5) -> List[Tuple[int, float]]:
        terms = query.lower().split()
        scores = [(i, self.score(terms, i)) for i in range(self.N)]
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:k]
 
 
def _tokenize(text: str) -> List[str]:
    return re.findall(r"\w+", text.lower())
 
 
class HybridRAG:
    """
    Hybrid retriever: TF-IDF cosine + BM25, merged with Reciprocal Rank Fusion.
    Falls back gracefully if a query has zero similarity across all docs.
    """
 
    MIN_SCORE = 0.05          # below this → doc is irrelevant
    TFIDF_WEIGHT = 0.4
    BM25_WEIGHT = 0.6
 
    def __init__(self, docs: List[Doc]):
        self.docs = docs
 
        # TF-IDF on weighted text (field-boosted)
        self.vectorizer = TfidfVectorizer(
            stop_words=None,           # keep FR + EN words
            ngram_range=(1, 2),        # bigrams capture "gaming laptop", "16 GB"
            min_df=1,
            sublinear_tf=True,         # log normalization
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(
            [d.text_weighted for d in docs]
        )
 
        # BM25 on full text
        corpus_tokens = [_tokenize(d.text) for d in docs]
        self.bm25 = BM25(corpus_tokens)
 
    # ------------------------------------------------------------------
    def search(self, query: str, k: int = 5) -> List[Tuple[Doc, float]]:
        # --- TF-IDF ---
        qv = self.vectorizer.transform([query])
        tfidf_sims = cosine_similarity(qv, self.tfidf_matrix).flatten()
 
        # --- BM25 ---
        bm25_raw = self.bm25.search(query, k=len(self.docs))
        bm25_scores = np.zeros(len(self.docs))
        max_bm25 = max((s for _, s in bm25_raw), default=1.0) or 1.0
        for idx, score in bm25_raw:
            bm25_scores[idx] = score / max_bm25   # normalize 0-1
 
        # --- Fusion ---
        combined = self.TFIDF_WEIGHT * tfidf_sims + self.BM25_WEIGHT * bm25_scores
 
        # --- Filter + rank ---
        ranked = sorted(enumerate(combined), key=lambda x: x[1], reverse=True)
        results = []
        for idx, score in ranked[:k]:
            if score < self.MIN_SCORE:
                break
            results.append((self.docs[idx], float(score)))
 
        return results
 
 
# ---------------------------------------------------------------------------
# Field-boosted text builder
# ---------------------------------------------------------------------------
FIELD_WEIGHTS = {
    "use_cases":   4,   # most discriminative
    "description": 3,
    "category":    3,
    "name":        2,
    "cpu":         2,
    "gpu":         2,
    "ram":         1,
    "storage":     1,
    "display":     1,
    "price":       1,
}
 
 
def _build_weighted_text(p: Dict) -> str:
    """Repeat high-signal fields to boost TF-IDF weight."""
    parts = []
    for field, weight in FIELD_WEIGHTS.items():
        value = str(p.get(field, "")).strip()
        if value:
            parts.extend([value] * weight)
    return " ".join(parts)
 
 
def _build_plain_text(p: Dict) -> str:
    old_price = p.get("oldPrice") or p.get("old_price")
    saving = int(old_price - p.get("price", 0)) if old_price and old_price > p.get("price", 0) else 0
    discount = f"On sale, save {saving}$, was {old_price}$" if saving else ""
    promo_flag    = "Yes — currently on promotion" if p.get("deal") or old_price else "No"
    featured_flag = "Yes — staff pick, highly recommended" if p.get("featured") else "No"
    return (
        f"Name: {p.get('name','')}\n"
        f"Category: {p.get('category','')}\n"
        f"Price: {p.get('price','')}\n"
        f"Original price: {old_price or 'N/A'}\n"
        f"Discount: {discount}\n"
        f"On promotion: {promo_flag}\n"
        f"Featured / coup de coeur: {featured_flag}\n"
        f"CPU: {p.get('cpu','')}\n"
        f"RAM: {p.get('ram','')}\n"
        f"Storage: {p.get('storage','')}\n"
        f"GPU: {p.get('gpu','')}\n"
        f"Display: {p.get('display','')}\n"
        f"Description: {p.get('description','')}\n"
        f"Use cases: {p.get('use_cases','')}\n"
    )
 
 
def load_products_as_docs(path: str) -> List[Doc]:
    with open(path, "r", encoding="utf-8") as f:
        products = json.load(f)
 
    docs = []
    for p in products:
        use_cases_raw = p.get("use_cases", "")
        if isinstance(use_cases_raw, list):
            tags = [t.strip().lower() for t in use_cases_raw if t]
        else:
            tags = [t.strip().lower() for t in use_cases_raw.split(",")] if use_cases_raw else []
 
        # Normalise use_cases en string dans le produit avant d'indexer
        p_norm = {**p, "use_cases": ", ".join(tags)}
 
        docs.append(Doc(
            doc_id=str(p.get("id", p.get("name", "unknown"))),
            title=p.get("name", "Unknown product"),
            text=_build_plain_text(p_norm),
            text_weighted=_build_weighted_text(p_norm),
            meta=p,
            tags=tags,
        ))
    return docs
 
 
# Keep old name as alias so app.py import doesn't break
TfidfRAG = HybridRAG
 
