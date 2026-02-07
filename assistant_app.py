import streamlit as st

st.set_page_config(page_title="Assistant IA", layout="wide")

# --- Detect embed mode robustly ---
def get_param(name: str, default: str = "0") -> str:
    qp = st.query_params
    val = qp.get(name, default)
    # Streamlit peut renvoyer une liste ou une string selon versions/usages
    if isinstance(val, list):
        return str(val[0]) if val else default
    return str(val)

embed = (get_param("embed", "0") == "1")

# --- Hide Streamlit chrome in embed ---
if embed:
    st.markdown("""
        <style>
          #MainMenu, footer, header {display:none !important;}
          [data-testid="stToolbar"] {display:none !important;}
          [data-testid="stHeader"] {display:none !important;}
          [data-testid="stSidebar"] {display:none !important;}
          .block-container {padding-top: 0.6rem !important;}
        </style>
    """, unsafe_allow_html=True)

# --- Session state for chat ---
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Salut ! Dis-moi ton usage (études/travail/jeux/création) et ton budget max 🙂"}
    ]

# --- (OPTIONNEL) Page complète : catalogue + chat ---
# Si tu n’as pas besoin du catalogue dans Streamlit, tu peux enlever tout ce bloc.
if not embed:
    st.title("Ordinateurs portables")
    
    st.divider()

# --- Chatbot (toujours visible, y compris en embed) ---
st.subheader("Assistant d’achat")

# Afficher l'historique
for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.markdown(m["content"])

# Entrée utilisateur
user_msg = st.chat_input("Ex: Je veux un laptop pour études, budget 1200$")

def simple_reply(text: str) -> str:
    t = text.lower()

    # mini logique très simple (à toi d’améliorer après)
    usage = "études" if "étud" in t else "travail" if "trav" in t else "jeux" if "jeu" in t or "gaming" in t else "création" if "créa" in t or "montage" in t else None

    # récupérer budget (chiffres)
    import re
    nums = re.findall(r"\d{3,4}", t)
    budget = int(nums[0]) if nums else None

    if usage is None or budget is None:
        return "Je peux t’aider 👍. Donne-moi 2 infos : **usage** (études/travail/jeux/création) + **budget max** (ex: 1200)."

    if usage in ["jeux", "création"] and budget < 1300:
        return f"Pour **{usage}**, avec **{budget}$**, vise au minimum **16 Go RAM** et idéalement une **GPU dédiée** (RTX). Ton budget est un peu serré : soit tu montes vers ~1400$, soit tu acceptes des compromis (RTX 3050/4050)."
    if usage in ["études", "travail"] and budget <= 1200:
        return f"Pour **{usage}** et **{budget}$**, je recommande : **i5/Ryzen 5**, **16 Go RAM**, **512 Go SSD**, écran 14–15\". Priorité : légèreté + autonomie."
    return f"OK 👍 Pour **{usage}** et **{budget}$**, je te propose 3 options : 1) bon rapport qualité/prix, 2) autonomie/portable, 3) performance. Tu préfères écran 14\" ou 15.6\" ?"

if user_msg:
    st.session_state.messages.append({"role": "user", "content": user_msg})
    with st.chat_message("user"):
        st.markdown(user_msg)

    reply = simple_reply(user_msg)
    st.session_state.messages.append({"role": "assistant", "content": reply})
    with st.chat_message("assistant"):
        st.markdown(reply)
