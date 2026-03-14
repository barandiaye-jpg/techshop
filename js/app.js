// ===============================
// TechShop - app.js (COMPLET)
// - Catalogue + Panier
// - Chat widget texte
// - Chat vocal avec Whisper backend
// - Conversation continue + auto-stop silence
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

function addToCart(id){ state.cart[id] = (state.cart[id]||0)+1; syncCartUI(); }
function cartCount(){ return Object.values(state.cart).reduce((a,b)=>a+b,0); }
function cartTotal(){
  return Object.entries(state.cart).reduce((sum,[id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return p ? sum+p.price*qty : sum;
  },0);
}
function syncCartUI(){
  const countEl=$("cartCount"), totalEl=$("cartTotal"), wrap=$("cartItems");
  if (countEl) countEl.textContent = cartCount();
  if (totalEl) totalEl.textContent = money(cartTotal());
  if (!wrap) return;
  const rows = Object.entries(state.cart).map(([id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    if (!p) return "";
    return `<div style="display:flex;justify-content:space-between;gap:10px;border:1px solid #eef2f7;border-radius:14px;padding:10px">
      <div><div style="font-weight:800">${p.name}</div><div class="muted tiny">${money(p.price)} x ${qty}</div></div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="iconbtn" onclick="decQty('${id}')">−</button>
        <button class="iconbtn" onclick="incQty('${id}')">+</button>
        <button class="iconbtn" onclick="removeItem('${id}')">🗑</button>
      </div></div>`;
  }).filter(Boolean);
  wrap.innerHTML = rows.length ? rows.join("") : `<div class="muted">Panier vide.</div>`;
}
function incQty(id){ state.cart[id]=(state.cart[id]||0)+1; syncCartUI(); }
function decQty(id){
  if (!state.cart[id]) return;
  state.cart[id]-=1;
  if (state.cart[id]<=0) delete state.cart[id];
  syncCartUI();
}
function removeItem(id){ delete state.cart[id]; syncCartUI(); }
function openDrawer(){  $("drawer")?.classList.add("drawer--open"); syncCartUI(); }
function closeDrawer(){ $("drawer")?.classList.remove("drawer--open"); }

function escapeHTML(str){
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function renderMiniMarkdown(text){
  let s = escapeHTML(text);
  s = s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g,"<em>$1</em>");
  s = s.replace(/\n/g,"<br>");
  return s;
}

// ===============================
// CHATBOT
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
  if (!fab||!widget||!closeBtn||!messages||!input||!sendBtn||!chatMic) return;

  let conversationMode  = false;
  let isProcessingVoice = false;
  let isRecording       = false;
  let mediaRecorder     = null;
  let audioChunks       = [];
  let streamRef         = null;
  let audioContext      = null;
  let analyser          = null;
  let sourceNode        = null;
  let rafId             = null;
  let speechStarted     = false;
  let silenceStart      = null;
  let recordStart       = null;
  let waitTimer         = null;
  let stopped           = false; // garde-fou unique stop

  // ── Seuils — simples et robustes ──
  // On utilise TimeDomain (RMS) : fonctionne sur TOUS les navigateurs
  const THRESH_SPEECH  = 0.01;  // RMS minimum pour "c'est de la parole"
  const THRESH_SILENCE = 0.008; // RMS sous lequel = silence
  const SILENCE_MS     = 1800;  // silence continu avant envoi
  const MIN_RECORD_MS  = 800;   // durée mini avant de surveiller le silence
  const MAX_WAIT_MS    = 9000;  // abandon si pas de parole après 9s
  const RESTART_MS     = 1200;  // délai entre sessions

  function getSupportedMimeType(){
    const types=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"];
    for(const t of types){ if(MediaRecorder.isTypeSupported(t)) return t; }
    return "";
  }

  // ── Calcul RMS (Root Mean Square) sur signal temporel ──
  // Plus fiable que FrequencyData pour la détection voix cross-browser
  function getRMS(){
    if (!analyser) return 0;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for(let i=0;i<buf.length;i++) sum += buf[i]*buf[i];
    return Math.sqrt(sum / buf.length);
  }

  function updateMicButton(){
    if(conversationMode){
      chatMic.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>`;
      chatMic.title="Arrêter la conversation";
    } else {
      chatMic.innerHTML=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 14C13.657 14 15 12.657 15 11V5C15 3.343 13.657 2 12 2C10.343 2 9 3.343 9 5V11C9 12.657 10.343 14 12 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 11C19 15 16 18 12 18C8 18 5 15 5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 22H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
      chatMic.title="Parler au chatbot";
    }
  }

  function openChat(){
    widget.classList.add("chatWidget--open");
    widget.setAttribute("aria-hidden","false");
    setTimeout(()=>input.focus(),50);
  }
  function closeChat(){
    widget.classList.remove("chatWidget--open");
    widget.setAttribute("aria-hidden","true");
  }
  function scrollToBottom(){
    const body=widget.querySelector(".chatWidget__body");
    if(body) body.scrollTop=body.scrollHeight;
  }
  function appendMsg(role,text){
    const div=document.createElement("div");
    div.className=`msg ${role}`;
    div.textContent=text;
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }
  function lastBotMsg(){
    const all=messages.querySelectorAll(".msg.bot");
    return all.length ? all[all.length-1] : null;
  }

  function startWaitAnim(el){
    let d=0;
    waitTimer=setInterval(()=>{
      if(!isRecording||speechStarted){ clearInterval(waitTimer); waitTimer=null; return; }
      d=(d+1)%4;
      el.textContent="🎙️ En attente"+".".repeat(d);
    },500);
  }
  function stopWaitAnim(){
    if(waitTimer){ clearInterval(waitTimer); waitTimer=null; }
  }

  function cleanupAudio(){
    stopWaitAnim();
    if(rafId){ cancelAnimationFrame(rafId); rafId=null; }
    if(sourceNode){ try{sourceNode.disconnect();}catch(e){} sourceNode=null; }
    if(analyser){   try{analyser.disconnect();  }catch(e){} analyser=null; }
    if(audioContext){ try{audioContext.close();  }catch(e){} audioContext=null; }
    if(streamRef){ streamRef.getTracks().forEach(t=>t.stop()); streamRef=null; }
    speechStarted=false; silenceStart=null; recordStart=null; stopped=false;
  }

  // ── Boucle de monitoring — utilise RMS ──
  function monitor(){
    if(!isRecording||!analyser){ return; }

    const rms = getRMS();
    const now = Date.now();
    const age = now - (recordStart||now);

    // DEBUG — à retirer après validation
    // console.log("RMS:", rms.toFixed(4), "speech:", speechStarted, "age:", age);

    // Phase 1 : attente de la parole
    if(!speechStarted){
      if(rms >= THRESH_SPEECH){
        speechStarted=true;
        silenceStart=null;
        stopWaitAnim();
        const m=lastBotMsg(); if(m) m.textContent="🎙️ Je t'écoute...";
      } else if(age >= MAX_WAIT_MS){
        doStop(true); return;
      }
      rafId=requestAnimationFrame(monitor); return;
    }

    // Phase 2 : durée mini d'enregistrement
    if(age < MIN_RECORD_MS){
      rafId=requestAnimationFrame(monitor); return;
    }

    // Phase 3 : surveillance silence
    if(rms < THRESH_SILENCE){
      if(!silenceStart) silenceStart=now;
      const dur=now-silenceStart;
      const rem=((SILENCE_MS-dur)/1000).toFixed(1);
      const m=lastBotMsg();
      if(m && dur > 300) m.textContent=`🔇 Envoi dans ${rem}s...`;
      if(dur >= SILENCE_MS){ doStop(false); return; }
    } else {
      silenceStart=null;
      const m=lastBotMsg();
      if(m && m.textContent.startsWith("🔇")) m.textContent="🎙️ Je t'écoute...";
    }

    rafId=requestAnimationFrame(monitor);
  }

  function doStop(cancel){
    if(stopped) return;
    stopped=true;
    if(!mediaRecorder||!isRecording) return;
    if(cancel){ audioChunks=[]; speechStarted=false; }
    // requestData force la collecte du dernier chunk
    try{ mediaRecorder.requestData(); }catch(e){}
    setTimeout(()=>{ try{ mediaRecorder.stop(); }catch(e){} }, 200);
  }

  async function startVoiceRecording(){
    if(isRecording||isProcessingVoice) return;

    try{
      openChat();
      // PAS de sampleRate forcé — le navigateur choisit le meilleur
      streamRef = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true }
      });

      audioChunks=[]; speechStarted=false; silenceStart=null;
      stopped=false; recordStart=Date.now();

      const mime = getSupportedMimeType();
      mediaRecorder = mime ? new MediaRecorder(streamRef,{mimeType:mime}) : new MediaRecorder(streamRef);

      mediaRecorder.ondataavailable=(e)=>{
        if(e.data&&e.data.size>0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop=async()=>{
        isRecording=false;
        const hadSpeech=speechStarted;
        const usedMime=mediaRecorder.mimeType||"audio/webm";
        const blob=new Blob(audioChunks,{type:usedMime});
        cleanupAudio();

        console.log("STOP — hadSpeech:", hadSpeech, "blob size:", blob.size, "mime:", usedMime);

        if(!hadSpeech){
          if(conversationMode) setTimeout(()=>{ if(!isRecording&&!isProcessingVoice&&conversationMode) startVoiceRecording(); },RESTART_MS);
          return;
        }
        if(blob.size < 3000){
          appendMsg("bot","Je n'ai pas bien entendu, peux-tu répéter ?");
          if(conversationMode) setTimeout(()=>{ if(!isRecording&&!isProcessingVoice&&conversationMode) startVoiceRecording(); },RESTART_MS);
          return;
        }
        await sendVoiceMessage(blob, usedMime);
      };

      // AudioContext — fftSize 2048 + Float32 TimeDomain = meilleure précision RMS
      audioContext=new (window.AudioContext||window.webkitAudioContext)();
      analyser=audioContext.createAnalyser();
      analyser.fftSize=2048;
      sourceNode=audioContext.createMediaStreamSource(streamRef);
      sourceNode.connect(analyser);

      mediaRecorder.start(250); // chunk toutes les 250ms
      isRecording=true;

      const waitMsg=appendMsg("bot","🎙️ En attente...");
      startWaitAnim(waitMsg);
      // Petit délai pour que l'AudioContext soit stable avant de monitorer
      setTimeout(()=>{ if(isRecording) monitor(); }, 300);

    }catch(err){
      console.error("Micro erreur:",err);
      appendMsg("bot","Impossible d'accéder au micro. Vérifie les permissions.");
      conversationMode=false; isRecording=false; cleanupAudio(); updateMicButton();
    }
  }

  async function sendVoiceMessage(blob, mimeType){
    const bubble=appendMsg("bot","⏳ Transcription en cours...");
    sendBtn.disabled=true; isProcessingVoice=true;

    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),20000);

    try{
      const ext=mimeType.includes("mp4")?"mp4":mimeType.includes("ogg")?"ogg":"webm";
      const fd=new FormData();
      fd.append("audio",blob,`voice.${ext}`);
      fd.append("k","5");

      const res=await fetch(VOICE_API_URL,{method:"POST",body:fd,signal:ctrl.signal});
      clearTimeout(timer);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();

      const transcript=(data?.transcript||"").trim();
      const answer=data?.answer||"Je n'ai pas de réponse pour le moment.";
      const lower=transcript.toLowerCase();
      const ignored=["thank you","thanks","ok","okay","oui","hum","hmm","merci","ah","euh"];

      if(transcript.length<3||ignored.includes(lower)){
        bubble.textContent="Je n'ai pas bien compris, peux-tu répéter ?";
        return;
      }

      bubble.remove();
      appendMsg("user",`🎤 ${transcript}`);
      const bot=appendMsg("bot",answer);
      bot.innerHTML=renderMiniMarkdown(answer);
      scrollToBottom();

    }catch(e){
      clearTimeout(timer);
      bubble.textContent=e.name==="AbortError"
        ?"⏱️ Le serveur met trop longtemps. Réessaie."
        :"Erreur : backend vocal inaccessible.";
      console.error(e); scrollToBottom();
    }finally{
      sendBtn.disabled=false; isProcessingVoice=false; input.focus();
      if(conversationMode){
        setTimeout(()=>{ if(!isRecording&&!isProcessingVoice&&conversationMode) startVoiceRecording(); },RESTART_MS);
      } else {
        updateMicButton();
      }
    }
  }

  async function sendMessage(){
    const text=input.value.trim(); if(!text) return;
    appendMsg("user",text); input.value="";
    appendMsg("bot","…");
    const bubble=messages.lastElementChild;
    sendBtn.disabled=true;
    try{
      const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      bubble.innerHTML=renderMiniMarkdown(data?.answer||"Pas de réponse.");
      scrollToBottom();
    }catch(e){
      bubble.textContent="Erreur : backend inaccessible.";
      console.error(e);
    }finally{
      sendBtn.disabled=false; input.focus();
    }
  }

  fab.addEventListener("click",openChat);
  closeBtn.addEventListener("click",closeChat);

  chatMic.addEventListener("click",async()=>{
    openChat();
    if(!conversationMode){
      conversationMode=true; updateMicButton();
      if(!isRecording&&!isProcessingVoice) await startVoiceRecording();
    } else {
      conversationMode=false; updateMicButton();
      if(isRecording) doStop(false);
      cleanupAudio(); isRecording=false;
      appendMsg("bot","Conversation vocale arrêtée. Tu peux continuer par écrit.");
    }
  });

  sendBtn.addEventListener("click",sendMessage);
  input.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ e.preventDefault(); sendMessage(); } });

  updateMicButton();
})();

// ===============================
// DOM Ready
// ===============================
window.addEventListener("DOMContentLoaded",()=>{
  $("q")?.addEventListener("input",(e)=>{ state.q=e.target.value; render(); });
  $("maxPrice")?.addEventListener("input",(e)=>{
    state.maxPrice=parseInt(e.target.value,10);
    const out=$("maxPriceOut"); if(out) out.textContent=state.maxPrice;
    render();
  });
  $("ramMin")?.addEventListener("change",(e)=>{ state.ramMin=parseInt(e.target.value,10); render(); });
  $("osWin")?.addEventListener("change",(e)=>{ state.osWin=e.target.checked; render(); });
  $("osMac")?.addEventListener("change",(e)=>{ state.osMac=e.target.checked; render(); });
  $("sortBy")?.addEventListener("change",(e)=>{ state.sortBy=e.target.value; render(); });
  $("cartBtn")?.addEventListener("click",openDrawer);
  $("closeDrawer")?.addEventListener("click",closeDrawer);
  $("drawer")?.addEventListener("click",(e)=>{ if(e.target.id==="drawer") closeDrawer(); });
  $("clearCart")?.addEventListener("click",()=>{ state.cart={}; syncCartUI(); });
  render(); syncCartUI();
});
