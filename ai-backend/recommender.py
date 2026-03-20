"""
Système de recommandation collaborative pour TechShop.
Enregistre les interactions utilisateurs et calcule les recommandations.
"""
import json
import os
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional
from pathlib import Path


# ---------------------------------------------------------------------------
# Stockage des interactions
# ---------------------------------------------------------------------------
INTERACTIONS_PATH = os.getenv("INTERACTIONS_PATH", "data/interactions.json")


@dataclass
class Interaction:
    session_id: str
    product_id: str
    action: str          # "view", "add_to_cart", "details"
    timestamp: float = field(default_factory=time.time)


def load_interactions() -> List[Dict]:
    path = Path(INTERACTIONS_PATH)
    if not path.exists():
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_interaction(interaction: Interaction):
    interactions = load_interactions()
    interactions.append(asdict(interaction))
    # Garde seulement les 10 000 dernières interactions
    if len(interactions) > 10_000:
        interactions = interactions[-10_000:]
    path = Path(INTERACTIONS_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(interactions, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Algorithme de recommandation — Co-occurrence + popularité
# ---------------------------------------------------------------------------
class CollaborativeRecommender:
    """
    Recommandation basée sur la co-occurrence :
    'Les utilisateurs qui ont regardé A ont aussi regardé B'
    
    Complétée par la popularité globale si pas assez de données.
    """

    MIN_INTERACTIONS = 5  # Nombre minimum d'interactions pour être fiable

    def __init__(self, products: List[Dict]):
        self.products = {str(p["id"]): p for p in products}
        self._co_occurrence: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self._popularity: Dict[str, int] = defaultdict(int)
        self._trained = False

    def train(self, interactions: List[Dict]):
        """Reconstruit les matrices de co-occurrence depuis les interactions."""
        self._co_occurrence = defaultdict(lambda: defaultdict(int))
        self._popularity = defaultdict(int)

        # Grouper par session
        sessions: Dict[str, List[str]] = defaultdict(list)
        for interaction in interactions:
            sid = interaction.get("session_id", "")
            pid = interaction.get("product_id", "")
            action = interaction.get("action", "")
            if sid and pid:
                # Pondérer selon l'action
                weight = {"view": 1, "details": 2, "add_to_cart": 3}.get(action, 1)
                for _ in range(weight):
                    sessions[sid].append(pid)
                self._popularity[pid] += weight

        # Calculer la co-occurrence
        for session_products in sessions.values():
            unique = list(set(session_products))
            for i, p1 in enumerate(unique):
                for p2 in unique[i+1:]:
                    self._co_occurrence[p1][p2] += 1
                    self._co_occurrence[p2][p1] += 1

        self._trained = True

    def recommend(
        self,
        product_id: str,
        exclude_ids: Optional[List[str]] = None,
        k: int = 3,
    ) -> List[Dict]:
        """
        Retourne k produits recommandés pour un produit donné.
        Fallback sur la popularité si pas assez de données.
        """
        exclude = set(exclude_ids or [])
        exclude.add(product_id)

        candidates = {}

        # 1. Co-occurrence
        if self._trained and product_id in self._co_occurrence:
            for pid, score in self._co_occurrence[product_id].items():
                if pid not in exclude and pid in self.products:
                    candidates[pid] = score

        # 2. Popularité en fallback
        if len(candidates) < k:
            for pid, score in sorted(
                self._popularity.items(), key=lambda x: x[1], reverse=True
            ):
                if pid not in exclude and pid not in candidates and pid in self.products:
                    candidates[pid] = score * 0.1  # Poids plus faible

        # 3. Si vraiment pas assez, compléter avec des produits similaires
        if len(candidates) < k:
            ref = self.products.get(product_id, {})
            ref_category = ref.get("category", "")
            for pid, product in self.products.items():
                if pid not in exclude and pid not in candidates:
                    score = 0.5 if product.get("category") == ref_category else 0.1
                    candidates[pid] = score

        # Trier et retourner les k meilleurs
        sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
        result = []
        for pid, score in sorted_candidates[:k]:
            product = self.products.get(pid, {})
            result.append({
                "id": pid,
                "name": product.get("name", ""),
                "price": product.get("price"),
                "oldPrice": product.get("oldPrice"),
                "deal": product.get("deal", False),
                "category": product.get("category", ""),
                "gpu": product.get("gpu", ""),
                "ram": product.get("ram", ""),
                "score": round(score, 3),
                "reason": _get_reason(score, product_id in self._co_occurrence),
            })
        return result


def _get_reason(score: float, has_cooccurrence: bool) -> str:
    if has_cooccurrence and score > 1:
        return "Les clients ont aussi regardé"
    elif score > 0.5:
        return "Populaire dans cette catégorie"
    else:
        return "Vous pourriez aimer"
