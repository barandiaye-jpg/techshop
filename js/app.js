// ===============================
// TechShop - app.js (PROPRE)
// - Catalogue + Panier
// - Chat widget (professionnel)
// ===============================

const PRODUCTS = [
  {id:"LAP-001", name:"Ultrabook 14 — i5 / 16Go / 512Go", brand:"Nova",  price:999,  oldPrice:1199, cpu:"Intel i5", ram:16, ssd:512,  gpu:"Intégrée", os:"Windows", rating:4.6, reviews:312, tags:["Études","Travail","Portable","Autonomie"], deal:true,  stock:18, image:"assets/ultrabook.jpg"},
  {id:"LAP-002", name:"Creator 15 — i7 / 32Go / 1To / RTX 4060", brand:"Astra", price:1499, oldPrice:1699, cpu:"Intel i7", ram:32, ssd:1024, gpu:"RTX 4060", os:"Windows", rating:4.7, reviews:221, tags:["Création","Montage","Performance"], deal:true,  stock:7,  image:"assets/creator.jpg"},
  {id:"LAP-003", name:"Gaming 16 — Ryzen 7 / 32Go / 1To / RTX 4070", brand:"Orion", price:1699, oldPrice:null, cpu:"Ryzen 7", ram:32, ssd:1024, gpu:"RTX 4070", os:"Windows", rating:4.5, reviews:540, tags:["Jeux","Performance"], deal:false, stock:4,  image:"assets/gaming.jpg"},
  {id:"LAP-004", name:"Budget 15 — i3 / 8Go / 256Go", brand:"Nova",  price:749,  oldPrice:799,  cpu:"Intel i3", ram:8,  ssd:256,  gpu:"Intégrée", os:"Windows", rating:4.2, reviews:980, tags:["Budget","Bureautique"], deal:true,  stock:25, image:"assets/budget.jpg"},
  {id:"LAP-005", name:"Mac-style 13 — M-chip / 16Go / 512Go", brand:"Pear",  price:1599, oldPrice:null, cpu:"M-chip",  ram:16, ssd:512,  gpu:"Intégrée", os:"macOS",   rating:4.8, reviews:410, tags:["Études","Portable","Autonomie"], deal:false, stock:9,  image:"assets/mac.jpg"},
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

function money(x){
  return `${x.toString().replace(/\B(?=(\d{3})+(?!\d))/g," ")} $`;
}

function filteredProducts(){
  const q = (state.q || "").trim().toLowerCase();
  return PRODUCTS.filter(p => {
    if (p.price > state.maxPrice) return false;
    if (p.ram < state.ramMin) return false;
    if (!state.osWin && p.os === "Windows") return false;
    if (!state.osMac && p.os === "macOS") return false;

    if (q){
      const hay = (p.name+" "+p.brand+" "+p.cpu+" "+p.gpu+" "+p.os+" "+p.tags.join(" ")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function scoreReco(p){
  let s = 0;
  s += p.rating * 2;
  if (p.deal) s += 2;
  if (p.gpu !== "Intégrée") s += 1.5;
  s += (p.ram >= 16) ? 1 : 0;
  s += (p.ssd >= 512) ? 1 : 0;
  if (p.stock <= 5) s -= 0.5;
  return s;
}

function sortProducts(arr){
  const a = [...arr];
  switch(state.sortBy){
    case "priceAsc":  a.sort((x,y)=>x.price-y.price); break;
    case "priceDesc": a.sort((x,y)=>y.price-x.price); break;
    case "rating":    a.sort((x,y)=>y.rating-x.rating); break;
    default:          a.sort((x,y)=>scoreReco(y)-scoreReco(x));
  }
  return a;
}

function render(){
  const grid = $("grid");
  if (!grid) return;

  const items = sortProducts(filteredProducts());

  grid.innerHTML = items.map(p => `
    <div class="card">
      <img src="${p.image}" alt="${p.name}" class="card__img">
      <div class="card__top">
        <div></div>
        <div class="muted tiny">${p.os}</div>
      </div>

      <div class="card__title">${p.name}</div>

      <div class="priceRow">
        <div class="price">${money(p.price)}</div>
        ${p.oldPrice ? `<div class="old">${money(p.oldPrice)}</div>` : ``}
      </div>

      <div class="card__actions">
        <button class="btn btn--ghost" onclick="openDetails('${p.id}')">Détails</button>
        <button class="btn btn--primary" onclick="addToCart('${p.id}')">Ajouter</button>
      </div>
    </div>
  `).join("");
}

function openDetails(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if (!p) return;
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
    if (!p) return sum;
    return sum + p.price * qty;
  }, 0);
}

function syncCartUI(){
  const countEl = $("cartCount");
  const totalEl = $("cartTotal");
  const wrap = $("cartItems");

  if (countEl) countEl.textContent = cartCount();
  if (totalEl) totalEl.textContent = money(cartTotal());
  if (!wrap) return;

  const rows = Object.entries(state.cart).map(([id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    if (!p) return "";
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
  }).filter(Boolean);

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

function openDrawer(){ $("drawer")?.classList.add("drawer--open"); syncCartUI(); }
function closeDrawer(){ $("drawer")?.classList.remove("drawer--open"); }

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Petit "markdown" minimal : **gras**, *italique*, retours ligne
function renderMiniMarkdown(text) {
  let s = escapeHTML(text);

  // **bold**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // *italic*
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // sauts de ligne
  s = s.replace(/\n/g, "<br>");

  return s;
}


// ===============================
// CHATBOT (widget)
// ===============================
(function initChatbot(){
  const API_URL = "https://techshop-api-gt69.onrender.com/chat";

  const fab = $("chatFab");
  const widget = $("chatWidget");
  const closeBtn = $("chatClose");
  const messages = $("chatMessages");
  const input = $("chatInput");
  const sendBtn = $("chatSend");

  if (!fab || !widget || !closeBtn || !messages || !input || !sendBtn) return;

  function openChat(){
    widget.classList.add("chatWidget--open");
    widget.setAttribute("aria-hidden", "false");
    setTimeout(()=>input.focus(), 50);
  }

  function closeChat(){
    widget.classList.remove("chatWidget--open");
    widget.setAttribute("aria-hidden", "true");
  }

  function scrollToBottom(){
    const body = widget.querySelector(".chatWidget__body");
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }

  function appendMsg(role, text){
    const div = document.createElement("div");
    div.className = `msg ${role}`; // .msg.user / .msg.bot (match CSS)
    div.textContent = text;
    messages.appendChild(div);
    scrollToBottom();
  }

  async function sendMessage(){
    const text = input.value.trim();
    if (!text) return;

    appendMsg("user", text);
    input.value = "";

    // typing bubble
    appendMsg("bot", "…");
    const typingBubble = messages.lastElementChild;

    sendBtn.disabled = true;

    try{
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const answer = (data && data.answer) ? data.answer : "Je n’ai pas de réponse pour le moment.";
typingBubble.innerHTML = renderMiniMarkdown(answer);

      scrollToBottom();
    } catch (e){
      typingBubble.textContent = "Erreur: backend inaccessible. Vérifie FastAPI + CORS sur http://127.0.0.1:8000.";
      console.error(e);
      scrollToBottom();
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  fab.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e)=>{
    if (e.key === "Enter"){
      e.preventDefault();
      sendMessage();
    }
  });

  // message d'accueil (optionnel)
  // appendMsg("bot", "Salut 👋 Dis-moi ton budget et ton usage, je te recommande un PC.");
})();

// ===============================
// DOM Ready
// ===============================
window.addEventListener("DOMContentLoaded", ()=>{
  $("q")?.addEventListener("input", (e)=>{ state.q = e.target.value; render(); });
  $("maxPrice")?.addEventListener("input", (e)=>{
    state.maxPrice = parseInt(e.target.value,10);
    const out = $("maxPriceOut");
    if (out) out.textContent = state.maxPrice;
    render();
  });
  $("ramMin")?.addEventListener("change", (e)=>{ state.ramMin=parseInt(e.target.value,10); render(); });
  $("osWin")?.addEventListener("change", (e)=>{ state.osWin=e.target.checked; render(); });
  $("osMac")?.addEventListener("change", (e)=>{ state.osMac=e.target.checked; render(); });
  $("sortBy")?.addEventListener("change", (e)=>{ state.sortBy=e.target.value; render(); });

  $("cartBtn")?.addEventListener("click", openDrawer);
  $("closeDrawer")?.addEventListener("click", closeDrawer);
  $("drawer")?.addEventListener("click", (e)=>{ if (e.target.id==="drawer") closeDrawer(); });
  $("clearCart")?.addEventListener("click", ()=>{ state.cart={}; syncCartUI(); });

  render();
  syncCartUI();
});
