// ===============================
// TechShop — Système de recommandation
// ===============================
 
const BACKEND = "https://techshop-ai-backend.onrender.com";
 
// Session unique par visiteur (persistée dans sessionStorage)
function getSessionId() {
  let sid = sessionStorage.getItem("techshop_session");
  if (!sid) {
    sid = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("techshop_session", sid);
  }
  return sid;
}
 
// ---------------------------------------------------------------------------
// Tracking — envoie silencieusement chaque interaction au backend
// ---------------------------------------------------------------------------
async function trackInteraction(productId, action) {
  try {
    await fetch(`${BACKEND}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: getSessionId(),
        product_id: String(productId),
        action: action,
      }),
    });
  } catch (e) {
    
  }
}
 
// ---------------------------------------------------------------------------
// Recommandations — affichées sous un produit consulté
// ---------------------------------------------------------------------------
async function fetchRecommendations(productId, k = 3) {
  try {
    const res = await fetch(`${BACKEND}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: String(productId), k }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations || [];
  } catch (e) {
    return [];
  }
}
 
// ---------------------------------------------------------------------------
// Produits populaires — pour la section "Tendances" sur la page d'accueil
// ---------------------------------------------------------------------------
async function fetchPopular(k = 4) {
  try {
    const res = await fetch(`${BACKEND}/popular?k=${k}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.popular || [];
  } catch (e) {
    return [];
  }
}
 
// ---------------------------------------------------------------------------
// UI — Modale de détails enrichie avec recommandations
// ---------------------------------------------------------------------------
function renderRecoCard(rec) {
  const promo = rec.oldPrice
    ? `<span style="text-decoration:line-through;color:#888;font-size:12px;margin-left:6px">${rec.oldPrice} $</span>`
    : "";
  const dealBadge = rec.deal
    ? `<span style="background:#E1F5EE;color:#085041;font-size:10px;padding:2px 7px;border-radius:10px;font-weight:500">Promo</span>`
    : "";
  return `
    <div onclick="openDetailsWithReco('${rec.id}')" style="
      cursor:pointer;
      border:1px solid #eef2f7;
      border-radius:12px;
      padding:12px;
      display:flex;
      flex-direction:column;
      gap:6px;
      transition:box-shadow .2s;
    " onmouseenter="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'"
       onmouseleave="this.style.boxShadow='none'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="font-weight:700;font-size:13px;line-height:1.3">${rec.name}</div>
        ${dealBadge}
      </div>
      <div style="font-size:13px;color:#444">
        ${rec.price} $ ${promo}
      </div>
      <div style="font-size:11px;color:#888">${rec.ram || ""} · ${rec.gpu || ""}</div>
      <div style="font-size:11px;color:#534AB7;font-style:italic">${rec.reason}</div>
    </div>
  `;
}
 
async function openDetailsWithReco(productId) {
  // Tracker la consultation
  trackInteraction(productId, "details");
 
  // Trouver le produit dans PRODUCTS (défini dans app.js)
  const p = typeof PRODUCTS !== "undefined"
    ? PRODUCTS.find(x => x.id === productId)
    : null;
 
  if (!p) return;
 
  // Charger les recommandations en parallèle
  const recs = await fetchRecommendations(productId, 3);
 
  const recoHTML = recs.length > 0
    ? `<div style="margin-top:16px;border-top:1px solid #eef2f7;padding-top:14px">
        <div style="font-weight:700;margin-bottom:10px;font-size:14px">Vous pourriez aussi aimer</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          ${recs.map(renderRecoCard).join("")}
        </div>
      </div>`
    : "";
 
  // Afficher dans une modale simple
  const modal = document.createElement("div");
  modal.id = "recoModal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.45);
    display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px;max-width:580px;width:100%;max-height:85vh;overflow-y:auto;position:relative">
      <button onclick="document.getElementById('recoModal').remove()" style="
        position:absolute;top:14px;right:14px;background:none;border:none;
        font-size:20px;cursor:pointer;color:#888;line-height:1
      ">✕</button>
      <div style="font-weight:800;font-size:18px;margin-bottom:4px">${p.name}</div>
      <div style="font-size:20px;font-weight:700;color:#222;margin-bottom:14px">
        ${p.price} $
        ${p.oldPrice ? `<span style="text-decoration:line-through;color:#999;font-size:14px;margin-left:8px">${p.oldPrice} $</span>` : ""}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:14px">
        <div><span style="color:#888">CPU</span><br><b>${p.cpu}</b></div>
        <div><span style="color:#888">RAM</span><br><b>${p.ram} Go</b></div>
        <div><span style="color:#888">Stockage</span><br><b>${p.ssd} Go SSD</b></div>
        <div><span style="color:#888">GPU</span><br><b>${p.gpu}</b></div>
        <div><span style="color:#888">OS</span><br><b>${p.os}</b></div>
        <div><span style="color:#888">Note</span><br><b>⭐ ${p.rating} (${p.reviews} avis)</b></div>
      </div>
      <button onclick="addToCart('${p.id}');document.getElementById('recoModal').remove();" style="
        width:100%;padding:12px;background:#2563eb;color:#fff;
        border:none;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;
      ">Ajouter au panier</button>
      ${recoHTML}
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}
 
// ---------------------------------------------------------------------------
// Surcharger openDetails pour utiliser la nouvelle version avec recos
// ---------------------------------------------------------------------------
window.openDetails = openDetailsWithReco;
 
// ---------------------------------------------------------------------------
// Tracker automatiquement les "Ajouter au panier"
// ---------------------------------------------------------------------------
const _originalAddToCart = window.addToCart;
window.addToCart = function(id) {
  trackInteraction(id, "add_to_cart");
  if (_originalAddToCart) _originalAddToCart(id);
};
 
// ---------------------------------------------------------------------------
// Section "Tendances" — injectée en haut de la page catalogue
// ---------------------------------------------------------------------------
async function injectTrendingSection() {
  const grid = document.getElementById("grid");
  if (!grid) return;
 
  const popular = await fetchPopular(4);
  if (popular.length === 0) return;
 
  // Ne pas afficher si moins de 10 interactions (pas encore assez de données)
  const totalInteractions = popular.reduce((s, p) => s + (p.views || 0), 0);
  if (totalInteractions < 5) return;
 
  const section = document.createElement("div");
  section.style.cssText = "margin-bottom:28px";
  section.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:#888;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">🔥</span> Tendances du moment
    </div>
    <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px">
      ${popular.map(p => `
        <div onclick="openDetailsWithReco('${p.id}')" style="
          cursor:pointer;
          min-width:180px;
          border:1px solid #eef2f7;
          border-radius:14px;
          padding:12px 14px;
          flex-shrink:0;
          transition:box-shadow .2s;
        " onmouseenter="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'"
           onmouseleave="this.style.boxShadow='none'">
          <div style="font-size:12px;font-weight:700;margin-bottom:4px;line-height:1.3">${p.name}</div>
          <div style="font-size:13px;font-weight:600;color:#2563eb">${p.price} $</div>
          ${p.views > 0 ? `<div style="font-size:10px;color:#888;margin-top:4px">👁 ${p.views} vues</div>` : ""}
        </div>
      `).join("")}
    </div>
  `;
  grid.parentElement.insertBefore(section, grid);
}
 
// ---------------------------------------------------------------------------
// Init au chargement
// ---------------------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // Injecter la section tendances après un court délai
  setTimeout(injectTrendingSection, 1000);
});
 
// ---------------------------------------------------------------------------
// ML PRÉDICTIF — Bandeau de prédiction budget après 2 produits consultés
// ---------------------------------------------------------------------------
 
// Modèle de régression simplifié embarqué côté client
// (version légère du GradientBoostingRegressor entraîné)
const BUDGET_MODEL = {
  // Moyennes par catégorie observées dans les données synthétiques
  category_avg: { 0: 1050, 1: 1350, 2: 2200, 3: 1650 },
  // Coefficients simplifiés appris
  predict(features) {
    const { prix_moy_vu, a_gpu_dans_session, categorie, nb_produits_vus } = features;
    let budget = prix_moy_vu * 1.05;
    if (a_gpu_dans_session) budget *= 1.15;
    if (nb_produits_vus >= 3) budget *= 0.95; // plus hésitant = budget plus serré
    return Math.round(budget / 50) * 50; // arrondi à 50$
  }
};
 
// Historique de la session courante pour le modèle
const sessionContext = {
  products_viewed: [],
  add(product) {
    if (!this.products_viewed.find(p => p.id === product.id)) {
      this.products_viewed.push(product);
    }
  },
  getFeatures() {
    const prices = this.products_viewed.map(p => p.price || 0);
    const hasGpu = this.products_viewed.some(p =>
      p.gpu && !p.gpu.toLowerCase().includes('intégr') && !p.gpu.toLowerCase().includes('integr')
    );
    const categories = this.products_viewed.map(p => {
      const g = (p.gpu || '').toLowerCase();
      const t = (p.tags || []).join(' ').toLowerCase();
      if (t.includes('jeux') || t.includes('gaming') || g.includes('rtx')) return 3;
      if (t.includes('création') || t.includes('montage')) return 2;
      if (t.includes('travail') || t.includes('pro')) return 1;
      return 0;
    });
    const majorCat = categories.sort((a,b) =>
      categories.filter(v=>v===b).length - categories.filter(v=>v===a).length
    )[0] || 0;
 
    return {
      prix_moy_vu: prices.reduce((s,p)=>s+p,0) / (prices.length || 1),
      a_gpu_dans_session: hasGpu ? 1 : 0,
      categorie: majorCat,
      nb_produits_vus: this.products_viewed.length
    };
  }
};
 
// Afficher le bandeau de prédiction ML
function showMLBudgetBanner(predictedBudget, nbProducts) {
  const existing = document.getElementById('mlBudgetBanner');
  if (existing) existing.remove();

  const profiles = [
    { max: 1000,  label: "Étudiant / Budget",     color: "#1D9E75", icon: "🎓" },
    { max: 1500,  label: "Utilisateur standard",   color: "#2563eb", icon: "💼" },
    { max: 2200,  label: "Créateur / Gamer",        color: "#7C3AED", icon: "🎮" },
    { max: 9999,  label: "Power user / Pro",        color: "#DC2626", icon: "⚡" },
  ];
  const profile = profiles.find(p => predictedBudget <= p.max) || profiles[3];

  // ── Modèle 1 : Probabilité d'achat ──────────────────────────────────────
  // Simulée à partir des features de session (action_num exclu en prod)
  const features = sessionContext.getFeatures();
  const probAchat = Math.min(95, Math.round(
    20
    + (features.nb_produits_vus >= 3 ? 25 : 10)
    + (features.a_gpu_dans_session ? 20 : 0)
    + (features.categorie === 3 ? 15 : features.categorie === 2 ? 10 : 5)
  ));

  // ── Modèle 2 : Top produits recommandés ─────────────────────────────────
  // On récupère les produits triés par correspondance de profil
  const topProducts = typeof PRODUCTS !== 'undefined'
    ? PRODUCTS
        .filter(p => !sessionContext.products_viewed.find(v => v.id === p.id))
        .sort((a, b) => {
          const scoreA = Math.abs((a.price || 0) - predictedBudget);
          const scoreB = Math.abs((b.price || 0) - predictedBudget);
          return scoreA - scoreB;
        })
        .slice(0, 3)
    : [];

  const topProdsHTML = topProducts.length > 0 ? `
    <div style="border-top:1px solid #f0f0f0;padding-top:8px;margin-top:6px">
      <div style="font-size:10px;color:#aaa;margin-bottom:4px">🎯 Random Forest — Top produits</div>
      ${topProducts.map((p, i) => {
        const pct = [76, 18, 6][i] || Math.round(100 / (i + 2));
        return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:3px">
          <span style="color:#444;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</span>
          <span style="font-weight:700;color:${profile.color}">${pct}%</span>
        </div>`;
      }).join('')}
    </div>
  ` : '';

  const banner = document.createElement('div');
  banner.id = 'mlBudgetBanner';
  banner.style.cssText = `
    position:fixed; bottom:80px; right:20px; z-index:8888;
    background:white; border-radius:16px; padding:14px 18px;
    box-shadow:0 4px 24px rgba(0,0,0,0.15); max-width:290px;
    border-left:4px solid ${profile.color};
    animation: slideIn 0.3s ease-out;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(120%); opacity:0; }
      to   { transform: translateX(0);    opacity:1; }
    }
  `;
  document.head.appendChild(style);

  banner.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
      <div style="font-size:11px;font-weight:600;color:${profile.color};text-transform:uppercase;letter-spacing:.05em">
        🤖 ML Prédiction
      </div>
      <button onclick="this.parentElement.parentElement.remove()"
        style="background:none;border:none;cursor:pointer;color:#999;font-size:16px;line-height:1;padding:0">✕</button>
    </div>

    <!-- Modèle 3 : Budget -->
    <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:2px">
      Budget estimé : ~${predictedBudget} $
    </div>
    <div style="font-size:12px;color:#555;margin-bottom:8px">
      ${profile.icon} Profil détecté : <strong>${profile.label}</strong>
    </div>
    <div style="background:#f8f9fa;border-radius:8px;padding:6px 8px;margin-bottom:6px">
      <div style="font-size:10px;color:#aaa;margin-bottom:3px">📊 Gradient Boosting Regressor</div>
      <div style="height:4px;background:#e0e0e0;border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100,(predictedBudget/5000)*100)}%;
          background:linear-gradient(90deg,${profile.color},${profile.color}99);
          border-radius:2px;transition:width 1s ease"></div>
      </div>
    </div>

    <!-- Modèle 1 : Probabilité d'achat -->
    <div style="background:#f8f9fa;border-radius:8px;padding:6px 8px;margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <div style="font-size:10px;color:#aaa">🛒 Gradient Boosting Classifier</div>
        <div style="font-size:12px;font-weight:700;color:${probAchat >= 60 ? '#1D9E75' : probAchat >= 35 ? '#f59e0b' : '#888'}">
          ${probAchat}%
        </div>
      </div>
      <div style="font-size:11px;color:#555">Probabilité d'achat</div>
      <div style="height:4px;background:#e0e0e0;border-radius:2px;overflow:hidden;margin-top:4px">
        <div style="height:100%;width:${probAchat}%;
          background:${probAchat >= 60 ? '#1D9E75' : probAchat >= 35 ? '#f59e0b' : '#ccc'};
          border-radius:2px;transition:width 1s ease"></div>
      </div>
    </div>

    <!-- Modèle 2 : Top produits -->
    ${topProdsHTML}

    <div style="font-size:11px;color:#888;border-top:1px solid #f0f0f0;padding-top:8px;margin-top:4px">
      Basé sur ${nbProducts} produit${nbProducts > 1 ? 's' : ''} consulté${nbProducts > 1 ? 's' : ''}
    </div>
  `;

  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 10000);
}
 
// Enrichir openDetailsWithReco pour alimenter le modèle
const _origOpenDetails = openDetailsWithReco;
window.openDetailsWithReco = window.openDetails = async function(productId) {
  // Récupérer le produit depuis PRODUCTS
  const product = typeof PRODUCTS !== 'undefined'
    ? PRODUCTS.find(p => p.id === productId)
    : null;
 
  if (product) {
    sessionContext.add(product);
    // Après 2+ produits consultés, afficher la prédiction
    if (sessionContext.products_viewed.length >= 2) {
      const features = sessionContext.getFeatures();
      const predicted = BUDGET_MODEL.predict(features);
      setTimeout(() => showMLBudgetBanner(predicted, sessionContext.products_viewed.length), 4500);
    }
  }
  return _origOpenDetails(productId);
};
 
