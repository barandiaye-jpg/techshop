import json
from dataclasses import dataclass
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class Doc:
    doc_id: str
    title: str
    text: str
    meta: Dict

class TfidfRAG:
    def __init__(self, docs: List[Doc]):
        self.docs = docs
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.matrix = self.vectorizer.fit_transform([d.text for d in docs])

    def search(self, query: str, k: int = 5) -> List[Tuple[Doc, float]]:
        qv = self.vectorizer.transform([query])
        sims = cosine_similarity(qv, self.matrix).flatten()
        idx = sims.argsort()[::-1][:k]
        return [(self.docs[i], float(sims[i])) for i in idx]

def load_products_as_docs(path: str) -> List[Doc]:
    with open(path, "r", encoding="utf-8") as f:
        products = json.load(f)

    docs = []
    for p in products:
        text = (
            f"Name: {p.get('name','')}\n"
            f"Category: {p.get('category','')}\n"
            f"Price: {p.get('price','')}\n"
            f"CPU: {p.get('cpu','')}\n"
            f"RAM: {p.get('ram','')}\n"
            f"Storage: {p.get('storage','')}\n"
            f"GPU: {p.get('gpu','')}\n"
            f"Display: {p.get('display','')}\n"
            f"Description: {p.get('description','')}\n"
            f"Use cases: {p.get('use_cases','')}\n"
        )
        docs.append(Doc(
            doc_id=str(p.get("id", p.get("name","unknown"))),
            title=p.get("name","Unknown product"),
            text=text,
            meta=p
        ))
    return docs
