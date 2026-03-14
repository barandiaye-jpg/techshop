// ===============================
// TechShop - app.js (COMPLET)
// - Catalogue + Panier
// - Chat widget texte
// - Chat vocal avec Whisper backend
// - Conversation continue
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
  cart: {},
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
      const hay = (p.name + " " + p.brand + " " + p.cpu + " " + p.gpu + " " + p.os + " " + p.tags.join(" ")).toLowerCase();
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
    case "priceAsc":  a.sort((x,y) => x.price - y.price); break;
    case "priceDesc": a.sort((x,y) => y.price - x.price); break;
    case "rating":    a.sort((x,y) => y.rating - x.rating); break;
    default:          a.sort((x,y) => scoreReco(y) - scoreReco(x));
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
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  alert(`📌 ${p.name}\n\nCPU: ${p.cpu}\nRAM: ${p.ram} Go\nSSD: ${p.ssd} Go\nGPU: ${p.gpu}\nOS: ${p.os}\n\nNote: ${p.rating} (${p.reviews} avis)\nPrix: ${money(p.price)}`);
}

function addToCart(id){
  state.cart[id] = (state.cart[id] || 0) + 1;
  syncCartUI();
}

function cartCount(){
  return Object.values(state.cart).reduce((a,b) => a + b, 0);
}

function cartTotal(){
  return Object.entries(state.cart).reduce((sum,[id,qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return sum;
    return sum + p.price * qty;
  }, 0);
}

function syncCartUI(){
  const countEl = $("cartCount");
  const totalEl = $("cartTotal");
  const wrap    = $("cartItems");
  if (countEl) countEl.textContent = cartCount();
  if (totalEl) totalEl.textContent = money(cartTotal());
  if (!wrap) return;
  const rows = Object.entries(state.cart).map(([id,qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
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

function incQty(id){ state.cart[id] = (state.cart[id] || 0) + 1; syncCartUI(); }
function decQty(id){
  if (!state.cart[id]) return;
  state.cart[id] -= 1;
  if (state.cart[id] <= 0) delete state.cart[id];
  syncCartUI();
}
function removeItem(id){ delete state.cart[id]; syncCartUI(); }
function openDrawer(){  $("drawer")?.classList.add("drawer--open"); syncCartUI(); }
function closeDrawer(){ $("drawer")?.classList.remove("drawer--open"); }

function escapeHTML(str){
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function renderMiniMarkdown(text){
  let s = escapeHTML(text);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/\n/g, "<br>");
  return s;
}

// ===============================
// CHATBOT (widget)
// ===============================
(function initChatbot(){
  const API_URL       = "https://techshop-ai-backend.onrender.com/chat";
  const VOICE_API_URL = "https://techshop-ai-backend.onrender.com/voice-chat";

  const fab      = $("chatFab");
  const widget   = $("chatWidget");
  const closeBtn = $("chatClose");
  const messages = $("chatMessages");
  const input    = $("chatInput");
  const sendBtn  = $("chatSend");
  const chatMic  = $("chatMic");

  if (!fab || !widget || !closeBtn || !messages || !input || !sendBtn || !chatMic) return;

  let mediaRecorder    = null;
  let audioChunks      = [];
  let isRecording      = false;
  let conversationMode = false;
  let isProcessingVoice = false;

  let streamRef         = null;
  let audioContext      = null;
  let analyser          = null;
  let sourceNode        = null;
  let silenceStartedAt  = null;
  let animationFrameId  = null;
  let speechStarted     = false;
  let recordingStartedAt = null;
  let waitFeedbackInterval = null;

  // ── Seuils calibrés pour la voix française ──
  const SPEECH_THRESHOLD      = 8;     // volume min pour détecter la parole
  const SILENCE_THRESHOLD     = 6;     // volume sous lequel = silence
  const SILENCE_DURATION_MS   = 1800;  // durée silence avant arrêt
  const MIN_RECORDING_MS      = 2500;  // durée min d'enregistrement
  const MAX_WAIT_FOR_SPEECH_MS = 8000; // max attente avant abandon
  const MIN_BLOB_SIZE         = 5000;  // taille min du blob audio (octets)
  const RESTART_DELAY         = 1200;  // délai entre deux sessions vocales

  // ── Détection dynamique du format audio supporté ──
  function getSupportedMimeType(){
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const t of types){
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  }

  function updateMicButton(){
    if (conversationMode){
      chatMic.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2"></rect>
        </svg>`;
      chatMic.title = "Arrêter la conversation";
    } else {
      chatMic.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 14C13.657 14 15 12.657 15 11V5C15 3.343 13.657 2 12 2C10.343 2 9 3.343 9 5V11C9 12.657 10.343 14 12 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 11C19 15 16 18 12 18C8 18 5 15 5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M9 22H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      chatMic.title = "Parler au chatbot";
    }
  }

  function openChat(){
    widget.classList.add("chatWidget--open");
    widget.setAttribute("aria-hidden","false");
    setTimeout(() => input.focus(), 50);
  }

  function closeChat(){
    widget.classList.remove("chatWidget--open");
    widget.setAttribute("aria-hidden","true");
  }

  function scrollToBottom(){
    const body = widget.querySelector(".chatWidget__body");
    if (body) body.scrollTop = body.scrollHeight;
  }

  function appendMsg(role, text){
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  // ── Feedback animé "En attente..." ──
  function startWaitFeedback(){
    const lastMsg = messages.lastElementChild;
    if (!lastMsg) return;
    let dots = 0;
    waitFeedbackInterval = setInterval(() => {
      if (speechStarted || !isRecording){
        clearInterval(waitFeedbackInterval);
        waitFeedbackInterval = null;
        return;
      }
      dots = (dots + 1) % 4;
      const current = messages.lastElementChild;
      if (current && current.classList.contains("bot")){
        current.textContent = "🎙️ En attente" + ".".repeat(dots);
      }
    }, 500);
  }

  function stopWaitFeedback(){
    if (waitFeedbackInterval){
      clearInterval(waitFeedbackInterval);
      waitFeedbackInterval = null;
    }
  }

  function cleanupAudioMonitoring(){
    stopWaitFeedback();
    if (animationFrameId){ cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    if (sourceNode){ try { sourceNode.disconnect(); } catch(e){} sourceNode = null; }
    if (analyser){   try { analyser.disconnect();   } catch(e){} analyser = null; }
    if (audioContext){ try { audioContext.close();  } catch(e){} audioContext = null; }
    silenceStartedAt  = null;
    speechStarted     = false;
    recordingStartedAt = null;
  }

  function stopStreamTracks(){
    if (streamRef){ streamRef.getTracks().forEach(t => t.stop()); streamRef = null; }
  }

  // ── Analyse volume sur les fréquences vocales uniquement (80Hz-3000Hz) ──
  function getAverageVolume(){
    if (!analyser || !audioContext) return 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const binSize = audioContext.sampleRate / analyser.fftSize;
    const lowBin  = Math.floor(80   / binSize);
    const highBin = Math.floor(3000 / binSize);
    let sum = 0, count = 0;
    for (let i = lowBin; i <= highBin && i < data.length; i++){
      sum += data[i];
      count++;
    }
    return count > 0 ? sum / count : 0;
  }

  function monitorSilence(){
    if (!isRecording || !analyser) return;
    const vol = getAverageVolume();
    const now = Date.now();
    const age = recordingStartedAt ? (now - recordingStartedAt) : 0;

    if (!speechStarted){
      if (vol >= SPEECH_THRESHOLD){
        speechStarted = true;
        silenceStartedAt = null;
        stopWaitFeedback(); // stop le feedback d'attente
        // met à jour le message d'écoute
        const last = messages.lastElementChild;
        if (last && last.classList.contains("bot")){
          last.textContent = "🎙️ J'écoute... Parlez normalement.";
        }
      } else if (age >= MAX_WAIT_FOR_SPEECH_MS){
        stopVoiceRecording(true);
        return;
      }
      animationFrameId = requestAnimationFrame(monitorSilence);
      return;
    }

    if (age < MIN_RECORDING_MS){
      animationFrameId = requestAnimationFrame(monitorSilence);
      return;
    }

    if (vol < SILENCE_THRESHOLD){
      if (!silenceStartedAt) silenceStartedAt = now;
      else if ((now - silenceStartedAt) >= SILENCE_DURATION_MS){
        stopVoiceRecording(false);
        return;
      }
    } else {
      silenceStartedAt = null;
    }

    animationFrameId = requestAnimationFrame(monitorSilence);
  }

  async function startVoiceRecording(){
    try {
      openChat();
      streamRef = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunks      = [];
      speechStarted    = false;
      silenceStartedAt = null;
      recordingStartedAt = Date.now();

      // Détection dynamique du format
      const mimeType = getSupportedMimeType();
      mediaRecorder = mimeType
        ? new MediaRecorder(streamRef, { mimeType })
        : new MediaRecorder(streamRef);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const hadSpeech = speechStarted;
        const usedMime  = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunks, { type: usedMime });

        cleanupAudioMonitoring();
        stopStreamTracks();
        isRecording = false;

        // Pas de parole détectée
        if (!hadSpeech){
          if (conversationMode){
            setTimeout(() => {
              if (!isRecording && !isProcessingVoice && conversationMode) startVoiceRecording();
            }, RESTART_DELAY);
          }
          return;
        }

        // Blob trop petit = audio vide ou bruit
        if (audioBlob.size < MIN_BLOB_SIZE){
          appendMsg("bot", "Je n'ai pas bien entendu. Peux-tu répéter ?");
          if (conversationMode){
            setTimeout(() => {
              if (!isRecording && !isProcessingVoice && conversationMode) startVoiceRecording();
            }, RESTART_DELAY);
          }
          return;
        }

        await sendVoiceMessage(audioBlob, usedMime);
      };

      // Analyser calibré pour la voix
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512; // plus précis pour la voix que 2048
      sourceNode = audioContext.createMediaStreamSource(streamRef);
      sourceNode.connect(analyser);

      mediaRecorder.start(100); // collecte des chunks toutes les 100ms
      isRecording = true;

      appendMsg("bot", "🎙️ En attente...");
      scrollToBottom();
      startWaitFeedback();
      monitorSilence();

    } catch(err){
      console.error(err);
      appendMsg("bot", "Impossible d'accéder au micro. Vérifie les permissions.");
      conversationMode = false;
      updateMicButton();
    }
  }

  function stopVoiceRecording(cancelOnly = false){
    if (!mediaRecorder || !isRecording) return;
    if (cancelOnly){
      audioChunks   = [];
      speechStarted = false;
    }
    mediaRecorder.stop();
  }

  async function sendVoiceMessage(audioBlob, mimeType){
    appendMsg("bot", "⏳ Transcription en cours...");
    const typingBubble = messages.lastElementChild;
    sendBtn.disabled  = true;
    isProcessingVoice = true;

    try {
      // Extension correcte selon le mimeType réel
      const ext = mimeType.includes("mp4") ? "mp4"
                : mimeType.includes("ogg") ? "ogg"
                : "webm";

      const formData = new FormData();
      formData.append("audio", audioBlob, `voice.${ext}`);
      formData.append("k", "5");

      const res = await fetch(VOICE_API_URL, { method:"POST", body:formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const transcript     = (data && data.transcript) ? data.transcript.trim() : "";
      const answer         = (data && data.answer)     ? data.answer : "Je n'ai pas de réponse pour le moment.";
      const lowerTranscript = transcript.toLowerCase();

      // Transcriptions trop courtes ou parasites → ignorer
      const ignoredTranscripts = ["thank you","thanks","ok","okay","oui","hum","hmm","merci","ah","euh"];
      if (!transcript || transcript.length < 3 || ignoredTranscripts.includes(lowerTranscript)){
        typingBubble.textContent = "Je n'ai pas bien compris. Peux-tu répéter ?";
        return;
      }

      // Affichage de la transcription + réponse
      typingBubble.remove();
      appendMsg("user", `🎤 ${transcript}`);
      const botMsg = appendMsg("bot", answer);
      botMsg.innerHTML = renderMiniMarkdown(answer);
      scrollToBottom();

    } catch(e){
      typingBubble.textContent = "Erreur : backend vocal inaccessible.";
      console.error(e);
      scrollToBottom();
    } finally {
      sendBtn.disabled  = false;
      isProcessingVoice = false;
      input.focus();

      if (conversationMode){
        setTimeout(() => {
          if (!isRecording && !isProcessingVoice && conversationMode) startVoiceRecording();
        }, RESTART_DELAY);
      } else {
        updateMicButton();
      }
    }
  }

  async function sendMessage(){
    const text = input.value.trim();
    if (!text) return;
    appendMsg("user", text);
    input.value = "";
    appendMsg("bot", "…");
    const typingBubble = messages.lastElementChild;
    sendBtn.disabled = true;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer = (data && data.answer) ? data.answer : "Je n'ai pas de réponse pour le moment.";
      typingBubble.innerHTML = renderMiniMarkdown(answer);
      scrollToBottom();
    } catch(e){
      typingBubble.textContent = "Erreur : backend inaccessible. Vérifie le service Render du backend.";
      console.error(e);
      scrollToBottom();
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Événements ──
  fab.addEventListener("click", openChat);
  closeBtn.addEventListener("click", closeChat);

  chatMic.addEventListener("click", async () => {
    openChat();
    if (!conversationMode){
      conversationMode = true;
      updateMicButton();
      if (!isRecording && !isProcessingVoice) await startVoiceRecording();
    } else {
      conversationMode = false;
      updateMicButton();
      if (isRecording) stopVoiceRecording();
      appendMsg("bot", "Conversation vocale arrêtée.");
    }
  });

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){ e.preventDefault(); sendMessage(); }
  });

  updateMicButton();
})();

// ===============================
// DOM Ready
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  $("q")?.addEventListener("input",  (e) => { state.q = e.target.value; render(); });
  $("maxPrice")?.addEventListener("input", (e) => {
    state.maxPrice = parseInt(e.target.value, 10);
    const out = $("maxPriceOut");
    if (out) out.textContent = state.maxPrice;
    render();
  });
  $("ramMin")?.addEventListener("change", (e) => { state.ramMin = parseInt(e.target.value, 10); render(); });
  $("osWin")?.addEventListener("change",  (e) => { state.osWin = e.target.checked; render(); });
  $("osMac")?.addEventListener("change",  (e) => { state.osMac = e.target.checked; render(); });
  $("sortBy")?.addEventListener("change", (e) => { state.sortBy = e.target.value; render(); });

  $("cartBtn")?.addEventListener("click",     openDrawer);
  $("closeDrawer")?.addEventListener("click", closeDrawer);
  $("drawer")?.addEventListener("click", (e) => { if (e.target.id === "drawer") closeDrawer(); });
  $("clearCart")?.addEventListener("click",   () => { state.cart = {}; syncCartUI(); });

  render();
  syncCartUI();
});
