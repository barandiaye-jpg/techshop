// ===============================
// TechShop - app.js (COMPLET)
// - Catalogue + Panier
// - Chat widget texte
// - Chat vocal avec Whisper backend
// - Conversation continue + auto-stop silence
// - TTS Web Speech API (réponse vocale)
// ===============================

const PRODUCTS = [
  {id:"p001", brand:"ASUS",    name:"ASUS ProArt Studiobook 16",      price:1899.99,oldPrice:2099,  deal:false,cpu:"AMD Ryzen 9 7940HS",   ram:32,  ssd:1024, gpu:"AMD Radeon 780M",          os:"Windows",rating:4.6,reviews:210, tags:["Création","Design","Productivité"],  stock:10, image:"assets/creator.jpg"},
  {id:"p002", brand:"Corsair", name:"Corsair One i300",                price:2799.99,oldPrice:null,  deal:false,cpu:"AMD Ryzen 9 7950X",    ram:64,  ssd:2048, gpu:"RTX 4080",                 os:"Windows",rating:4.8,reviews:95,  tags:["Jeux","Streaming"],                  stock:3,  image:"assets/WorkStation Ultra i9.jpg"},
  {id:"p003", brand:"Dell",    name:"Dell XPS 14",                     price:999,    oldPrice:1199,  deal:true, cpu:"Intel Core i5-1335U",   ram:16,  ssd:512,  gpu:"Intel Iris Xe Graphics",   os:"Windows",rating:4.6,reviews:312, tags:["Études","Travail","Portable"],       stock:18, image:"assets/ultrabook.jpg"},
  {id:"p004", brand:"HP",      name:"HP EliteBook 850 G10",            price:1099,   oldPrice:null,  deal:false,cpu:"Intel Core i5-12450H",  ram:16,  ssd:1024, gpu:"Intel UHD Graphics",       os:"Windows",rating:4.4,reviews:180, tags:["Travail","Bureau","Multitâche"],     stock:12, image:"assets/Business 15 i5.jpg"},
  {id:"p005", brand:"ASUS",    name:"ASUS ZenBook 14 OLED",            price:949,    oldPrice:null,  deal:false,cpu:"Intel Core i5-1235U",   ram:16,  ssd:512,  gpu:"Intel Iris Xe Graphics",   os:"Windows",rating:4.3,reviews:140, tags:["Études","Voyage"],                   stock:20, image:"assets/p005 SlimBook 14 i5.jpg"},
  {id:"p006", brand:"ASUS",    name:"ASUS ProArt Studio 15",           price:1499,   oldPrice:1699,  deal:true, cpu:"Intel Core i7-12700H",  ram:32,  ssd:1024, gpu:"RTX 4060",                 os:"Windows",rating:4.7,reviews:221, tags:["Création","Montage","Gaming"],       stock:7,  image:"assets/p006 Creator 15.jpg"},
  {id:"p007", brand:"Lenovo",  name:"Lenovo ThinkPad X1 Carbon",       price:1399,   oldPrice:null,  deal:false,cpu:"Intel Core i7-1360P",   ram:16,  ssd:1024, gpu:"Intel Iris Xe Graphics",   os:"Windows",rating:4.5,reviews:160, tags:["Travail","Productivité"],            stock:9,  image:"assets/p007 performance 14 i7.jpg"},
  {id:"p008", brand:"ASUS",    name:"ASUS ROG Strix G16",              price:1799,   oldPrice:null,  deal:false,cpu:"Intel Core i7-13700H",  ram:32,  ssd:1024, gpu:"RTX 4070",                 os:"Windows",rating:4.5,reviews:540, tags:["Jeux","Performance"],                stock:4,  image:"assets/p008 Gaming 16 RTX 4070.jpg"},
  {id:"p009", brand:"ASUS",    name:"ASUS TUF Gaming A15",             price:1599,   oldPrice:1799,  deal:true, cpu:"AMD Ryzen 7 7840HS",    ram:16,  ssd:1024, gpu:"RTX 4060",                 os:"Windows",rating:4.6,reviews:310, tags:["Jeux","Performance"],                stock:6,  image:"assets/p009 Gaming Ryzen 7.jpg"},
  {id:"p010", brand:"Apple",   name:"Apple MacBook Air M2",            price:1499,   oldPrice:null,  deal:false,cpu:"Apple M2",              ram:16,  ssd:512,  gpu:"Apple M2 GPU 8 cores",     os:"macOS",  rating:4.8,reviews:410, tags:["Études","Portable","Autonomie"],    stock:9,  image:"assets/p010 MacBook Air M2.jpg"},
  {id:"p011", brand:"Apple",   name:"Apple MacBook Pro M3",            price:2199,   oldPrice:null,  deal:false,cpu:"Apple M3",              ram:18,  ssd:1024, gpu:"Apple M3 GPU 10 cores",    os:"macOS",  rating:4.9,reviews:280, tags:["Création","Développement"],          stock:5,  image:"assets/p011 MacBook Pro M3.jpg"},
  {id:"p012", brand:"Acer",    name:"Acer Aspire 5",                   price:899,    oldPrice:999,   deal:true, cpu:"Intel Core i5-1135G7",  ram:16,  ssd:512,  gpu:"Intel Iris Xe Graphics",   os:"Windows",rating:4.2,reviews:980, tags:["Études","Budget"],                   stock:25, image:"assets/p012 student 15 i5.jpg"},
  {id:"p013", brand:"HP",      name:"HP 15s Ryzen 5",                  price:799,    oldPrice:899,   deal:true, cpu:"AMD Ryzen 5 5500U",     ram:16,  ssd:512,  gpu:"AMD Radeon Vega 7",        os:"Windows",rating:4.3,reviews:750, tags:["Bureau","Budget"],                   stock:30, image:"assets/p013 everyday ryzen 5.jpg"},
  {id:"p014", brand:"Dell",    name:"Dell Latitude 5440",              price:1199,   oldPrice:null,  deal:false,cpu:"Intel Core i5-1340P",   ram:16,  ssd:1024, gpu:"Intel Iris Xe Graphics",   os:"Windows",rating:4.4,reviews:200, tags:["Travail","Autonomie"],               stock:14, image:"assets/p014 workmate 14 i5 evo.jpg"},
  {id:"p015", brand:"Lenovo",  name:"Lenovo ThinkPad E14 AMD",         price:1399,   oldPrice:null,  deal:false,cpu:"AMD Ryzen 7 7730U",     ram:32,  ssd:1024, gpu:"AMD Radeon 780M",          os:"Windows",rating:4.6,reviews:190, tags:["Développement","Multitâche"],        stock:8,  image:"assets/p015 developper ryzen 7.jpg"},
  {id:"p016", brand:"ASUS",    name:"ASUS ROG Strix GT35",             price:3499,   oldPrice:null,  deal:false,cpu:"AMD Ryzen 9 7950X",     ram:64,  ssd:2048, gpu:"RTX 4080",                 os:"Windows",rating:4.8,reviews:75,  tags:["Jeux","Création","Développement"],   stock:2,  image:"assets/p016 ProStation.jpg"},
  {id:"p017", brand:"Apple",   name:"Apple MacBook Pro M3 Max",        price:4299,   oldPrice:null,  deal:false,cpu:"Apple M3 Max",          ram:36,  ssd:1024, gpu:"Apple M3 Max GPU 30 cores",os:"macOS",  rating:4.9,reviews:120, tags:["Création","Développement","Vidéo"], stock:3,  image:"assets/mac.jpg"},
  {id:"p018", brand:"HP",      name:"HP Z4 G5 Workstation",            price:5999,   oldPrice:null,  deal:false,cpu:"Intel Core i9-14900K",  ram:128, ssd:4096, gpu:"RTX 4090",                 os:"Windows",rating:4.9,reviews:45,  tags:["Développement","Création","IA"],    stock:2,  image:"assets/WorkStation Ultra i9.jpg"},
  {id:"p019", brand:"ASUS",    name:"ASUS TUF Gaming F15",             price:1349,   oldPrice:1499,  deal:true, cpu:"AMD Ryzen 5 7535HS",    ram:16,  ssd:512,  gpu:"RTX 4060",                 os:"Windows",rating:4.5,reviews:280, tags:["Jeux","Performance","Streaming"],    stock:11, image:"assets/p019 Gaming 15 RTX 4060.jpg"},
  {id:"p020", brand:"Apple",   name:"Apple MacBook Pro M3 14 pouces",  price:1799,   oldPrice:1999,  deal:true, cpu:"Apple M3",              ram:8,   ssd:512,  gpu:"Apple M3 GPU 10 cores",    os:"macOS",  rating:4.8,reviews:165, tags:["Création","Développement","Productivité"],stock:6,image:"assets/p010 MacBook Air M2.jpg"},
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
      <div class="card__brand">${p.brand}</div><div class="card__title">${p.name}</div>
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
// TTS — Web Speech API
// ===============================
const tts = {
  enabled: true,
  voice: null,

  init(){
    if (!window.speechSynthesis) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      this.voice =
        voices.find(v => v.lang === "fr-FR" && v.localService) ||
        voices.find(v => v.lang.startsWith("fr") && v.localService) ||
        voices.find(v => v.lang === "fr-FR") ||
        voices.find(v => v.lang.startsWith("fr")) ||
        null;
      console.log("Voix TTS choisie :", this.voice?.name, this.voice?.lang);
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  },

  clean(text){
    return text
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  speak(text, onEnd){
    if (!window.speechSynthesis || !this.enabled) {
      if (onEnd) onEnd(); return;
    }
    window.speechSynthesis.cancel();
    const cleaned = this.clean(text);
    if (!cleaned) { if (onEnd) onEnd(); return; }

    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.lang  = "fr-FR";
    utt.rate  = 1.08;
    utt.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const frVoice =
      voices.find(v => v.lang === "fr-FR" && v.localService) ||
      voices.find(v => v.lang.startsWith("fr") && v.localService) ||
      voices.find(v => v.lang === "fr-FR") ||
      voices.find(v => v.lang.startsWith("fr"));
    if (frVoice) utt.voice = frVoice;

    if (onEnd) utt.onend = onEnd;
    utt.onerror = () => { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utt);
  },

  stop(){
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
};

tts.init();

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

  let chatHistory       = [];    // ← stocke tous les échanges pour la mémoire budget
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
  let stopped           = false;

  const THRESH_SPEECH  = 0.01;
  const THRESH_SILENCE = 0.008;
  const SILENCE_MS     = 1800;
  const MIN_RECORD_MS  = 800;
  const MAX_WAIT_MS    = 9000;
  const RESTART_MS     = 1200;

  function getSupportedMimeType(){
    const types=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"];
    for(const t of types){ if(MediaRecorder.isTypeSupported(t)) return t; }
    return "";
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
    if(messages.children.length === 0){
      appendMsg("bot","👋 Bonjour ! Je suis l'assistant AURA. Dis-moi ton budget et ton usage (études, jeux, travail, création) et je te recommande le meilleur ordinateur. Tu peux écrire ou cliquer sur 🎤 pour parler !");
    }
  }

  function closeChat(){
    tts.stop();
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

  function getRMS(){
    if (!analyser) return 0;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for(let i=0;i<buf.length;i++) sum+=buf[i]*buf[i];
    return Math.sqrt(sum/buf.length);
  }

  function monitor(){
    if(!isRecording||!analyser) return;
    const rms=getRMS();
    const now=Date.now();
    const age=now-(recordStart||now);

    if(!speechStarted){
      if(rms>=THRESH_SPEECH){
        speechStarted=true; silenceStart=null;
        stopWaitAnim();
        const m=lastBotMsg(); if(m) m.textContent="🎙️ Je t'écoute...";
      } else if(age>=MAX_WAIT_MS){ doStop(true); return; }
      rafId=requestAnimationFrame(monitor); return;
    }

    if(age<MIN_RECORD_MS){ rafId=requestAnimationFrame(monitor); return; }

    if(rms<THRESH_SILENCE){
      if(!silenceStart) silenceStart=now;
      const dur=now-silenceStart;
      const remaining = Math.max(0, SILENCE_MS - dur);
      const rem = (remaining/1000).toFixed(1);
      const m=lastBotMsg();
      if(m&&dur>300) m.textContent=`🔇 Envoi dans ${rem}s...`;
      if(dur>=SILENCE_MS){ doStop(false); return; }
    } else {
      silenceStart=null;
      const m=lastBotMsg();
      if(m&&m.textContent.startsWith("🔇")) m.textContent="🎙️ Je t'écoute...";
    }
    rafId=requestAnimationFrame(monitor);
  }

  function doStop(cancel){
    if(stopped) return;
    stopped=true;
    if(!mediaRecorder||!isRecording) return;
    if(cancel){ audioChunks=[]; speechStarted=false; }
    try{ mediaRecorder.requestData(); }catch(e){}
    setTimeout(()=>{ try{ mediaRecorder.stop(); }catch(e){} },200);
  }

  async function startVoiceRecording(){
    if(isRecording||isProcessingVoice) return;
    try{
      openChat();
      streamRef=await navigator.mediaDevices.getUserMedia({
        audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true }
      });
      audioChunks=[]; speechStarted=false; silenceStart=null;
      stopped=false; recordStart=Date.now();

      const mime=getSupportedMimeType();
      mediaRecorder=mime ? new MediaRecorder(streamRef,{mimeType:mime}) : new MediaRecorder(streamRef);

      mediaRecorder.ondataavailable=(e)=>{
        if(e.data&&e.data.size>0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop=async()=>{
        isRecording=false;
        const hadSpeech=speechStarted;
        const usedMime=mediaRecorder.mimeType||"audio/webm";
        const blob=new Blob(audioChunks,{type:usedMime});
        cleanupAudio();

        if(!hadSpeech){
          if(conversationMode) setTimeout(()=>{ if(!isRecording&&!isProcessingVoice&&conversationMode) startVoiceRecording(); },RESTART_MS);
          return;
        }
        if(blob.size<3000){
          appendMsg("bot","Je n'ai pas bien entendu, peux-tu répéter ?");
          if(conversationMode) setTimeout(()=>{ if(!isRecording&&!isProcessingVoice&&conversationMode) startVoiceRecording(); },RESTART_MS);
          return;
        }
        await sendVoiceMessage(blob,usedMime);
      };

      audioContext=new (window.AudioContext||window.webkitAudioContext)();
      analyser=audioContext.createAnalyser();
      analyser.fftSize=2048;
      sourceNode=audioContext.createMediaStreamSource(streamRef);
      sourceNode.connect(analyser);

      mediaRecorder.start(250);
      isRecording=true;

      const waitMsg=appendMsg("bot","🎙️ En attente...");
      startWaitAnim(waitMsg);
      setTimeout(()=>{ if(isRecording) monitor(); },300);

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
    const timer=setTimeout(()=>ctrl.abort(),60000);

    try{
      const ext=mimeType.includes("mp4")?"mp4":mimeType.includes("ogg")?"ogg":"webm";
      const fd=new FormData();
      fd.append("audio",blob,`voice.${ext}`);
      fd.append("k","5");
      fd.append("history", JSON.stringify(chatHistory));  // ← AJOUT : envoie l'historique

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
      const botMsg=appendMsg("bot","🔊 ...");
      botMsg.innerHTML=renderMiniMarkdown(answer);
      scrollToBottom();

      // ← AJOUT : mémorise l'échange vocal dans l'historique
      chatHistory.push({ role: "user",      content: transcript });
      chatHistory.push({ role: "assistant", content: answer     });
      if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);

      // ── TTS : lecture de la réponse, puis relance écoute ──
      tts.enabled=true;
      tts.speak(answer, ()=>{
        if(conversationMode){
          const tryRestart = () => {
            if(!isRecording && !isProcessingVoice && conversationMode){
              setTimeout(()=>startVoiceRecording(), 400);
            } else if(conversationMode){
              setTimeout(tryRestart, 300);
            }
          };
          tryRestart();
        }
      });
      return;

    }catch(e){
      clearTimeout(timer);
      bubble.textContent=e.name==="AbortError"
        ?" Le serveur met trop longtemps. Réessaie."
        :"Erreur : backend vocal inaccessible.";
      console.error(e); scrollToBottom();
    }finally{
      sendBtn.disabled=false; isProcessingVoice=false; input.focus();
      if(conversationMode && !window.speechSynthesis){
        setTimeout(()=>{ if(!isRecording&&!isProcessingVoice&&conversationMode) startVoiceRecording(); },RESTART_MS);
      }
    }
  }

  // Chat texte
  async function sendMessage(){
    const text = input.value.trim();
    if (!text) return;

    tts.stop();
    appendMsg("user", text);
    input.value = "";
    appendMsg("bot", "…");
    const bubble = messages.lastElementChild;
    sendBtn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory,  // ← AJOUT : envoie l'historique
          k: 5
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer = data?.answer || "Pas de réponse.";

      bubble.innerHTML = renderMiniMarkdown(answer);
      scrollToBottom();

      //  mémorise l'échange texte dans l'historique
      chatHistory.push({ role: "user",      content: text   });
      chatHistory.push({ role: "assistant", content: answer });
      if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);

    } catch(e) {
      bubble.textContent = "Erreur : backend inaccessible.";
      console.error(e);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  fab.addEventListener("click",openChat);
  closeBtn.addEventListener("click",closeChat);

  chatMic.addEventListener("click",async()=>{
    openChat();
    if(!conversationMode){
      tts.stop();
      conversationMode=true; updateMicButton();
      if(!isRecording&&!isProcessingVoice) await startVoiceRecording();
    } else {
      conversationMode=false; updateMicButton();
      tts.stop();
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

// ── KEEP-ALIVE — ping toutes les 10 min ──
(function keepAlive(){
  const BACKEND = "https://techshop-ai-backend.onrender.com/health";
  const INTERVAL = 10 * 60 * 1000;

  async function ping(){
    try{
      await fetch(BACKEND, { method:"GET" });
      console.log("Keep-alive ping OK");
    }catch(e){
      console.log("Keep-alive ping failed:", e.message);
    }
  }

  setTimeout(()=>{
    ping();
    setInterval(ping, INTERVAL);
  }, 30000);
})();
