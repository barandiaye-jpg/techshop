const PRODUCTS = [
  {id:"LAP-001", name:"Ultrabook 14 — i5 / 16Go / 512Go", brand:"Nova", price:999, oldPrice:1199, cpu:"Intel i5", ram:16, ssd:512, gpu:"Intégrée", os:"Windows", rating:4.6, reviews:312, tags:["Études","Travail","Portable","Autonomie"], deal:true, stock:18, image:"assets/ultrabook.jpg"},
  {id:"LAP-002", name:"Creator 15 — i7 / 32Go / 1To / RTX 4060", brand:"Astra", price:1499, oldPrice:1699, cpu:"Intel i7", ram:32, ssd:1024, gpu:"RTX 4060", os:"Windows", rating:4.7, reviews:221, tags:["Création","Montage","Performance"], deal:true, stock:7, image:"assets/creator.jpg"},
  {id:"LAP-003", name:"Gaming 16 — Ryzen 7 / 32Go / 1To / RTX 4070", brand:"Orion", price:1699, oldPrice:null, cpu:"Ryzen 7", ram:32, ssd:1024, gpu:"RTX 4070", os:"Windows", rating:4.5, reviews:540, tags:["Jeux","Performance"], deal:false, stock:4, image:"assets/gaming.jpg"},
  {id:"LAP-004", name:"Budget 15 — i3 / 8Go / 256Go", brand:"Nova", price:749, oldPrice:799, cpu:"Intel i3", ram:8, ssd:256, gpu:"Intégrée", os:"Windows", rating:4.2, reviews:980, tags:["Budget","Bureautique"], deal:true, stock:25, image:"assets/budget.jpg"},
  {id:"LAP-005", name:"Mac-style 13 — M-chip / 16Go / 512Go", brand:"Pear", price:1599, oldPrice:null, cpu:"M-chip", ram:16, ssd:512, gpu:"Intégrée", os:"macOS", rating:4.8, reviews:410, tags:["Études","Portable","Autonomie"], deal:false, stock:9, image:"assets/mac.jpg"},
];

const $ = (id) => document.getElementById(id);

const state = {
  q: "",
  maxPrice: 1800,
  ramMin: 16,
  osWin: true,
  osMac: true,
  sortBy: "reco",
  cart: {}, // id -> qty
};

function money(x){ return `${x.toString().replace(/\B(?=(\d{3})+(?!\d))/g," ")} $`; }
function stars(r){ const full=Math.floor(r); const half=(r-full>=.5)?1:0; const empty=5-full-half; return "★".repeat(full)+(half?"½":"")+"☆".repeat(empty); }

function filteredProducts(){
  const q = state.q.trim().toLowerCase();
  return PRODUCTS.filter(p => {
    if (p.price > state.maxPrice) return false;
    if (p.ram < state.ramMin) return false;
    if (!state.osWin && p.os==="Windows") return false;
    if (!state.osMac && p.os==="macOS") return false;
    if (q){
      const hay = (p.name+" "+p.brand+" "+p.cpu+" "+p.gpu+" "+p.os+" "+p.tags.join(" ")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function scoreReco(p){
  // Simple score "recommandé"
  let s = 0;
  s += p.rating * 2;
  if (p.deal) s += 2;
  if (p.gpu !== "Intégrée") s += 1.5;
  s += (p.ram>=16)?1:0;
  s += (p.ssd>=512)?1:0;
  if (p.stock<=5) s -= 0.5;
  return s;
}

function sortProducts(arr){
  const a = [...arr];
  switch(state.sortBy){
    case "priceAsc": a.sort((x,y)=>x.price-y.price); break;
    case "priceDesc": a.sort((x,y)=>y.price-x.price); break;
    case "rating": a.sort((x,y)=>y.rating-x.rating); break;
    default: a.sort((x,y)=>scoreReco(y)-scoreReco(x));
  }
  return a;
}

function render(){
  const grid = $("grid");
  const items = sortProducts(filteredProducts());

  grid.innerHTML = items.map(p => `
    <div class="card">
	<img src="${p.image}" alt="${p.name}" class="card__img">
      <div class="card__top">
        <div>
          ${p.deal ? `<span class="pill pill--deal">PROMO</span>` : `<span class="pill">NEW</span>`}
          ${p.stock<=5 ? `<span class="pill pill--low">Stock faible</span>` : ``}
        </div>
        <div class="muted tiny">${p.os}</div>
      </div>

      <div class="card__title">${p.name}</div>
      <div class="card__meta">${p.brand} • ${p.cpu} • ${p.ram}Go • ${p.ssd}Go • ${p.gpu}</div>

      <div class="priceRow">
        <div class="price">${money(p.price)}</div>
        ${p.oldPrice ? `<div class="old">${money(p.oldPrice)}</div>` : ``}
      </div>

      <div class="rating">${stars(p.rating)} <span class="muted">(${p.reviews} avis)</span></div>

      <div class="card__actions">
        <button class="btn btn--ghost" onclick="openDetails('${p.id}')">Détails</button>
        <button class="btn btn--primary" onclick="addToCart('${p.id}')">Ajouter</button>
      </div>
    </div>
  `).join("");
}

function openDetails(id){
  const p = PRODUCTS.find(x=>x.id===id);
  alert(
`📌 ${p.name}

CPU: ${p.cpu}
RAM: ${p.ram} Go
SSD: ${p.ssd} Go
GPU: ${p.gpu}
OS: ${p.os}

Note: ${p.rating} (${p.reviews} avis)
Prix: ${money(p.price)}`
  );
}

function addToCart(id){
  state.cart[id] = (state.cart[id] || 0) + 1;
  syncCartUI();
}

function cartCount(){
  return Object.values(state.cart).reduce((a,b)=>a+b, 0);
}

function cartTotal(){
  return Object.entries(state.cart).reduce((sum,[id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return sum + p.price * qty;
  }, 0);
}

function syncCartUI(){
  $("cartCount").textContent = cartCount();
  $("cartTotal").textContent = money(cartTotal());
  const wrap = $("cartItems");

  const rows = Object.entries(state.cart).map(([id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return `
      <div style="display:flex;justify-content:space-between;gap:10px;border:1px solid #eef2f7;border-radius:14px;padding:10px">
        <div>
          <div style="font-weight:800">${p.name}</div>
          <div class="muted tiny">${money(p.price)} x ${qty}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="iconbtn" onclick="decQty('${id}')">−</button>
          <button class="iconbtn" onclick="incQty('${id}')">+</button>
          <button class="iconbtn" onclick="removeItem('${id}')">🗑</button>
        </div>
      </div>
    `;
  });

  wrap.innerHTML = rows.length ? rows.join("") : `<div class="muted">Panier vide.</div>`;
}

function incQty(id){ state.cart[id]=(state.cart[id]||0)+1; syncCartUI(); }
function decQty(id){
  if (!state.cart[id]) return;
  state.cart[id] -= 1;
  if (state.cart[id] <= 0) delete state.cart[id];
  syncCartUI();
}
function removeItem(id){ delete state.cart[id]; syncCartUI(); }

function openDrawer(){ $("drawer").classList.add("drawer--open"); syncCartUI(); }
function closeDrawer(){ $("drawer").classList.remove("drawer--open"); }

function recommend(){
  const usage = $("usage").value;
  const budget = parseInt($("budget").value || "", 10);

  if (!usage || !budget){
    $("recommendOut").textContent = "Choisis un usage et un budget.";
    return;
  }

  // scoring simple selon usage + budget
  const candidates = PRODUCTS.filter(p => p.price <= budget);
  if (!candidates.length){
    $("recommendOut").textContent = "Aucun modèle dans ce budget. Augmente un peu le budget.";
    return;
  }

  const scored = candidates.map(p=>{
    let s = 0;
    if (usage==="Jeux" || usage==="Création"){
      if (p.gpu !== "Intégrée") s += 3;
      if (p.ram >= 16) s += 2;
      if (p.ssd >= 512) s += 1;
    } else {
      if (p.tags.includes("Portable")) s += 2;
      if (p.tags.includes("Autonomie")) s += 2;
      if (p.weight <= 1.6) s += 1;
      s += (budget - p.price) / 500; // plus proche du budget
    }
    s += p.rating;
    return {p, s};
  }).sort((a,b)=>b.s-a.s);

  const best = scored[0].p;
  $("recommendOut").innerHTML =
    `Suggestion: <b>${best.name}</b> — ${money(best.price)} <br/><span class="muted tiny">Pourquoi: adapté à ${usage}, bon rapport qualité/prix.</span>`;
}

// Wire events
window.addEventListener("DOMContentLoaded", ()=>{
  $("q").addEventListener("input", (e)=>{ state.q=e.target.value; render(); });
  $("maxPrice").addEventListener("input", (e)=>{ state.maxPrice=parseInt(e.target.value,10); $("maxPriceOut").textContent=state.maxPrice; render(); });
  $("ramMin").addEventListener("change", (e)=>{ state.ramMin=parseInt(e.target.value,10); render(); });
  $("osWin").addEventListener("change", (e)=>{ state.osWin=e.target.checked; render(); });
  $("osMac").addEventListener("change", (e)=>{ state.osMac=e.target.checked; render(); });
  $("sortBy").addEventListener("change", (e)=>{ state.sortBy=e.target.value; render(); });

  $("cartBtn").addEventListener("click", openDrawer);
  $("closeDrawer").addEventListener("click", closeDrawer);
  $("drawer").addEventListener("click", (e)=>{ if (e.target.id==="drawer") closeDrawer(); });
  $("clearCart").addEventListener("click", ()=>{ state.cart={}; syncCartUI(); });

/* 
 $("recommendBtn").addEventListener("click", recommend);
*/
  render();
  syncCartUI();
});





  // Chat widget
  const fab = document.getElementById("chatFab");
  const widget = document.getElementById("chatWidget");
  const close = document.getElementById("chatClose");

  if (fab && widget && close){
    fab.addEventListener("click", ()=>{
      widget.classList.toggle("chatWidget--open");
      widget.setAttribute("aria-hidden", widget.classList.contains("chatWidget--open") ? "false" : "true");
    });

    close.addEventListener("click", ()=>{
      widget.classList.remove("chatWidget--open");
      widget.setAttribute("aria-hidden", "true");
    });
  }





import streamlit as st

# Lire le paramètre d'URL ?embed=1
params = st.query_params
embed = params.get("embed", "0") == "1"

# Optionnel : enlever l'UI Streamlit (menu/header/footer) seulement en embed
if embed:
    st.markdown("""
        <style>
          header, footer {display:none !important;}
          #MainMenu {visibility:hidden;}
          [data-testid="stToolbar"] {display:none !important;}
          [data-testid="stHeader"] {display:none !important;}
        </style>
    """, unsafe_allow_html=True)

# ---- Ton layout ----
if not embed:
    # ✅ TON CATALOGUE (ce que tu veux cacher dans l'iframe)
    st.title("Ordinateurs portables")
    # ... ici ton code catalogue (cartes, filtres, etc.)

# ✅ TON ASSISTANT (toujours visible)
st.subheader("Assistant d’achat")
# ... ici ton code chatbot
