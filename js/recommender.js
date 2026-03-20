// ===============================
// TechShop — Système de recommandation
// À inclure dans index.html après app.js
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
    // Silencieux — ne jamais bloquer l'UI pour le tracking
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
// Attendre que app.js soit chargé avant de surcharger
document.addEventListener('DOMContentLoaded', () => {
  window.openDetails = openDetailsWithReco;
});

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
