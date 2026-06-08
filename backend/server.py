from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from disease_data import DISEASES, CAUSE_CATEGORIES
from knowledge_base import build_system_message, FORM_QUESTION_HINTS, CAUSE_CATEGORIES as KB_CATEGORIES

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Tıbb-ul Furkan API")
api_router = APIRouter(prefix="/api")

# ===========================
# MODELS
# ===========================

class Ancestor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = ""
    relation: str  # "anne", "baba", "teyze", "amca" veya kullanıcı yazısı
    relation_key: Optional[str] = None  # Sabit anahtar (anne, baba, anneanne vb.)
    side: str  # "maternal" veya "paternal"
    diseases: List[str] = []
    events: List[str] = []  # yaşanan büyük olaylar
    unfulfilled_vows: List[str] = []
    sins_admitted: List[str] = []  # bilinen günahlar (zulüm, faiz vb.)
    is_alive: bool = True
    notes: Optional[str] = ""

class AnimalVow(BaseModel):
    animal: str  # koyun, koç, keçi, sığır, tavuk
    quantity: int = 1
    fulfilled: bool = False
    issue: Optional[str] = ""  # "çalındı", "usulsüz kesildi", "açıkta kaldı"

class ActionVow(BaseModel):
    action_type: str  # "oruç", "namaz", "kuran", "hatim", "yasin", "ziyaret", "hac", "umre", "okuma", "şifa"
    description: Optional[str] = ""
    fulfilled: bool = False

class Allergy(BaseModel):
    allergen: str
    since: Optional[str] = ""  # ne zamandan beri

class Profile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Aşama 1: Kişisel Bilgiler
    first_name: str
    last_name: str
    birth_date: str  # ISO format
    gender: str  # "erkek" / "kadın"
    
    # Aşama 2: Sağlık, Alerji ve Olaylar
    current_diseases: List[str] = []
    symptoms: List[str] = []
    life_events: List[str] = []  # büyük tıkanıklıklar, olaylar
    allergies: List[Allergy] = []
    
    # Aşama 3: Aile Soy Ağacı
    ancestors: List[Ancestor] = []
    
    # Aşama 4: Maneviyat, Adak, Hayvan
    has_animals: bool = False
    animals_kept: List[str] = []  # beslenen hayvanlar
    animal_vows: List[AnimalVow] = []
    action_vows: List[ActionVow] = []
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProfileCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: str
    gender: str
    current_diseases: List[str] = []
    symptoms: List[str] = []
    life_events: List[str] = []
    allergies: List[Allergy] = []
    ancestors: List[Ancestor] = []
    has_animals: bool = False
    animals_kept: List[str] = []
    animal_vows: List[AnimalVow] = []
    action_vows: List[ActionVow] = []

class Disease(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    symptoms: List[str]
    causes: List[Dict[str, Any]]
    remedy: str

class CauseMatch(BaseModel):
    category: str
    category_label: str
    weight: int
    detail: str
    source_side: Optional[str] = None  # "self", "maternal", "paternal"
    source_relation: Optional[str] = None

class DiseaseMatch(BaseModel):
    disease: str
    category: str
    matched_causes: List[CauseMatch]
    total_score: int
    remedy: str

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: str
    matches: List[DiseaseMatch] = []
    maternal_burden_score: int = 0
    paternal_burden_score: int = 0
    self_burden_score: int = 0
    dominant_categories: List[Dict[str, Any]] = []
    llm_analysis: Optional[str] = None
    mind_map: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ===========================
# UTILS
# ===========================

def detect_cause_keywords(text: str) -> List[str]:
    """Metin içinden günah kategorilerini tespit eder."""
    text_lower = (text or "").lower()
    keywords_map = {
        "zekat": ["zekat", "zekât", "zakat"],
        "adak_hayvan": ["hayvan adak", "kurban", "koç", "koyun", "keçi", "sığır", "tavuk adak"],
        "adak_eylem": ["oruç adak", "namaz adak", "kuran adak", "kur'an", "hatim", "yasin", "ziyaret", "hac", "umre"],
        "beddua": ["beddua", "lânet etti", "lanet", "intik"],
        "soy_laneti": ["soy lânet", "soy lanet"],
        "zulum_insan": ["zulüm", "zulm", "dövme", "döv", "şiddet", "işkence"],
        "zulum_hayvan": ["hayvana zulüm", "hayvan döv", "hayvan yak", "hayvan işkence"],
        "zulum_anne_baba": ["anne baba zulüm", "anneye zulüm", "babaya zulüm", "anne baba döv"],
        "isyan": ["isyan", "şükürsüz", "kadere"],
        "sirk": ["şirk", "sirk"],
        "kinama": ["kınama", "kına", "alay"],
        "faiz": ["faiz"],
        "hak_haram": ["hak haram", "haksızlık"],
        "haram_kazanc": ["haram kazanç", "haksız kazanç", "haram para"],
        "hayrat_mali": ["hayrat", "vakıf malı"],
        "zina_ensest": ["zina", "ensest", "tecavüz"],
        "iftira": ["iftira"],
        "yetim_hakki": ["yetim"],
        "miras_laneti": ["miras"],
        "adak_eti": ["adak eti", "kurban eti"],
        "kufur_kainata": ["kâinat", "kainat", "yaratılmış", "tabiata"],
        "cocuk_aldirma": ["çocuk aldır", "kürtaj", "düşürme"],
    }
    found = []
    for cat, kws in keywords_map.items():
        for kw in kws:
            if kw in text_lower:
                found.append(cat)
                break
    return found

def collect_user_cause_signals(profile: dict) -> Dict[str, List[Dict[str, Any]]]:
    """Profilden günah/sebep sinyallerini toplar. Anne/baba/kendi ayrımı yapar."""
    signals: Dict[str, List[Dict[str, Any]]] = {}

    def add_signal(category: str, side: str, relation: str, detail: str):
        signals.setdefault(category, []).append({
            "side": side,
            "relation": relation,
            "detail": detail
        })

    # ----- Kendi profili -----
    # Adaklar
    for av in profile.get("animal_vows", []):
        if not av.get("fulfilled"):
            add_signal("adak_hayvan", "self", "kendisi",
                       f"Yerine getirilmemiş {av.get('animal')} adağı ({av.get('quantity', 1)} adet)")
        if av.get("issue"):
            add_signal("adak_hayvan", "self", "kendisi",
                       f"Adak sorunu: {av.get('animal')} - {av.get('issue')}")

    for ev in profile.get("action_vows", []):
        if not ev.get("fulfilled"):
            add_signal("adak_eylem", "self", "kendisi",
                       f"Yerine getirilmemiş {ev.get('action_type')} adağı")

    # Cinsiyet bazlı adak uyumsuzluğu
    gender = profile.get("gender", "")
    male_animals = ["koç", "boğa", "horoz"]
    female_animals = ["koyun", "inek", "tavuk"]
    for av in profile.get("animal_vows", []):
        animal = (av.get("animal") or "").lower()
        if gender == "erkek" and any(a in animal for a in female_animals):
            add_signal("adak_hayvan", "self", "kendisi",
                       f"Erkek için dişi hayvan adağı uyumsuzluğu ({av.get('animal')})")
        if gender == "kadın" and any(a in animal for a in male_animals):
            add_signal("adak_hayvan", "self", "kendisi",
                       f"Kadın için erkek hayvan adağı uyumsuzluğu ({av.get('animal')})")

    # Olaylar ve semptomlardan kelime tespiti
    for ev in profile.get("life_events", []):
        cats = detect_cause_keywords(ev)
        for cat in cats:
            add_signal(cat, "self", "kendisi", f"Kişinin hayatından: {ev}")

    # ----- Atalar -----
    for anc in profile.get("ancestors", []):
        side = anc.get("side", "maternal")
        relation = anc.get("relation", "ata")
        rel_name = f"{relation}" + (f" ({anc.get('name')})" if anc.get("name") else "")

        # Yerine getirilmemiş adaklar
        for v in anc.get("unfulfilled_vows", []):
            cats = detect_cause_keywords(v) or ["adak_eylem"]
            for cat in cats:
                add_signal(cat, side, rel_name, f"{rel_name}: yarım kalmış adak - {v}")

        # Bilinen günahlar
        for sin in anc.get("sins_admitted", []):
            cats = detect_cause_keywords(sin)
            if not cats:
                cats = ["zulum_insan"]
            for cat in cats:
                add_signal(cat, side, rel_name, f"{rel_name}: {sin}")

        # Olaylar
        for ev in anc.get("events", []):
            cats = detect_cause_keywords(ev)
            for cat in cats:
                add_signal(cat, side, rel_name, f"{rel_name} olayı: {ev}")

    return signals

def analyze_profile(profile: dict) -> AnalysisResult:
    signals = collect_user_cause_signals(profile)
    user_disease_names = [d.lower() for d in profile.get("current_diseases", [])]
    user_symptoms = [s.lower() for s in profile.get("symptoms", [])]

    matches: List[DiseaseMatch] = []
    for disease in DISEASES:
        # Hastalık eşleşmesi: isim veya semptom
        disease_lower = disease["name"].lower()
        name_match = any(disease_lower in d or d in disease_lower for d in user_disease_names)
        symptom_match = False
        for sym in disease.get("symptoms", []):
            sl = sym.lower()
            if any(sl in u or u in sl for u in user_symptoms):
                symptom_match = True
                break

        if not (name_match or symptom_match):
            continue

        # Sebepleri eşleştir
        matched_causes: List[CauseMatch] = []
        total_score = 0
        for cause in disease["causes"]:
            cat = cause["category"]
            if cat in signals:
                for sig in signals[cat]:
                    cm = CauseMatch(
                        category=cat,
                        category_label=CAUSE_CATEGORIES.get(cat, cat),
                        weight=cause["weight"],
                        detail=f"{cause['detail']} | İz: {sig['detail']}",
                        source_side=sig["side"],
                        source_relation=sig["relation"],
                    )
                    matched_causes.append(cm)
                    total_score += cause["weight"]

        if matched_causes:
            matches.append(DiseaseMatch(
                disease=disease["name"],
                category=disease["category"],
                matched_causes=matched_causes,
                total_score=total_score,
                remedy=disease["remedy"]
            ))

    matches.sort(key=lambda m: m.total_score, reverse=True)

    # Skor hesaplamaları
    maternal = sum(c.weight for m in matches for c in m.matched_causes if c.source_side == "maternal")
    paternal = sum(c.weight for m in matches for c in m.matched_causes if c.source_side == "paternal")
    self_score = sum(c.weight for m in matches for c in m.matched_causes if c.source_side == "self")

    # Dominant kategoriler
    cat_scores: Dict[str, int] = {}
    cat_details: Dict[str, set] = {}
    for m in matches:
        for c in m.matched_causes:
            cat_scores[c.category] = cat_scores.get(c.category, 0) + c.weight
            cat_details.setdefault(c.category, set()).add(c.category_label)

    dominant = [
        {"category": k, "label": list(cat_details[k])[0], "score": v}
        for k, v in sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)
    ][:8]

    # Mind map oluştur
    mind_map = build_mind_map(profile, signals)

    return AnalysisResult(
        profile_id=profile["id"],
        matches=matches,
        maternal_burden_score=maternal,
        paternal_burden_score=paternal,
        self_burden_score=self_score,
        dominant_categories=dominant,
        mind_map=mind_map,
    )

def build_mind_map(profile: dict, signals: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Zihin haritası için node ve edge yapısı oluşturur."""
    nodes = []
    edges = []
    
    # Merkez (kullanıcı) node
    center_id = "self"
    nodes.append({
        "id": center_id,
        "label": f"{profile.get('first_name')} {profile.get('last_name')}",
        "type": "self",
        "side": "self",
        "diseases": profile.get("current_diseases", []),
        "allergies": [a.get("allergen") for a in profile.get("allergies", [])],
        "events": profile.get("life_events", []),
        "vows": [f"{v.get('animal')} ({v.get('quantity', 1)})" 
                 for v in profile.get("animal_vows", []) if not v.get("fulfilled")] +
                [f"{v.get('action_type')}" for v in profile.get("action_vows", []) if not v.get("fulfilled")]
    })

    # Anne ve baba düğümleri için yardımcı
    ancestors = profile.get("ancestors", [])
    
    # Atalar
    for i, anc in enumerate(ancestors):
        nid = anc.get("id") or f"anc_{i}"
        nodes.append({
            "id": nid,
            "label": anc.get("name") or anc.get("relation"),
            "relation": anc.get("relation"),
            "relation_key": anc.get("relation_key"),
            "type": "ancestor",
            "side": anc.get("side"),
            "diseases": anc.get("diseases", []),
            "events": anc.get("events", []),
            "unfulfilled_vows": anc.get("unfulfilled_vows", []),
            "sins_admitted": anc.get("sins_admitted", []),
        })
        # Direkt ebeveynse merkeze bağla
        edges.append({"from": center_id, "to": nid, "side": anc.get("side")})

    return {"nodes": nodes, "edges": edges}

# ===========================
# ROUTES
# ===========================

@api_router.get("/")
async def root():
    return {"message": "Tıbb-ul Furkan API çalışıyor", "version": "1.0.0"}

@api_router.get("/diseases", response_model=List[Dict[str, Any]])
async def list_diseases():
    """Hastalık veritabanını döner."""
    return DISEASES

@api_router.get("/cause-categories")
async def list_cause_categories():
    """Sebep kategorilerini döner."""
    return CAUSE_CATEGORIES

@api_router.post("/profiles", response_model=Profile)
async def create_profile(payload: ProfileCreate):
    profile = Profile(**payload.dict())
    doc = profile.dict()
    await db.profiles.insert_one(doc)
    # Otomatik analiz yap ve kaydet
    analysis = analyze_profile(doc)
    await db.analyses.insert_one(analysis.dict())
    return profile

@api_router.get("/profiles/{profile_id}", response_model=Profile)
async def get_profile(profile_id: str):
    doc = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Profil bulunamadı")
    return Profile(**doc)

@api_router.get("/profiles", response_model=List[Profile])
async def list_profiles():
    docs = await db.profiles.find({}, {"_id": 0}).to_list(200)
    return [Profile(**d) for d in docs]

@api_router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    await db.profiles.delete_one({"id": profile_id})
    await db.analyses.delete_many({"profile_id": profile_id})
    return {"ok": True}

@api_router.get("/profiles/{profile_id}/analysis", response_model=AnalysisResult)
async def get_analysis(profile_id: str):
    doc = await db.analyses.find_one({"profile_id": profile_id}, {"_id": 0}, sort=[("created_at", -1)])
    if not doc:
        # Eğer yoksa profili al ve oluştur
        prof = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
        if not prof:
            raise HTTPException(404, "Profil bulunamadı")
        analysis = analyze_profile(prof)
        await db.analyses.insert_one(analysis.dict())
        return analysis
    return AnalysisResult(**doc)

@api_router.post("/profiles/{profile_id}/analyze")
async def reanalyze(profile_id: str):
    prof = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    if not prof:
        raise HTTPException(404, "Profil bulunamadı")
    analysis = analyze_profile(prof)
    await db.analyses.insert_one(analysis.dict())
    return analysis

@api_router.post("/profiles/{profile_id}/llm-analysis")
async def llm_deep_analysis(profile_id: str):
    """LLM ile detaylı analiz yapar."""
    prof = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    if not prof:
        raise HTTPException(404, "Profil bulunamadı")
    
    # Önce rule-based analiz al
    analysis = analyze_profile(prof)
    
    # LLM'e gönderilecek prompt hazırla
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(500, "LLM anahtarı bulunamadı")
        
        system_message = """Sen 'Tıbb-ul Furkan' isimli bir manevi sağlık ve soy yükü analiz uzmanısın.
Görevin: İslami manevi prensiplere göre kişinin hastalık ve sağlık durumlarıyla soyundaki günahlar, adaklar, beddualar, zulümler arasında bağlantı kurarak yorumlamak.
Cevabını Türkçe, saygılı ve şefkatli bir dilde, kişiye özel olarak sun.
Asla tıbbi tavsiye verme - manevi yorum yap ve tövbe, helalleşme, adak kefareti gibi manevi çözümler öner.
Yapı: 
1. Genel Değerlendirme (1-2 paragraf)
2. Anne Soyu Yükleri
3. Baba Soyu Yükleri  
4. Kişisel Yükler
5. Öncelikli Manevi Tavsiyeler (5 madde)
"""
        
        # Verileri özetle
        summary = f"""
KİŞİ: {prof.get('first_name')} {prof.get('last_name')}, {prof.get('gender')}
HASTALIKLAR: {', '.join(prof.get('current_diseases', [])) or 'Belirtilmemiş'}
SEMPTOMLAR: {', '.join(prof.get('symptoms', [])) or 'Belirtilmemiş'}
ALERJİLER: {', '.join([a.get('allergen') for a in prof.get('allergies', [])]) or 'Yok'}
HAYATTAKİ OLAYLAR: {', '.join(prof.get('life_events', [])) or 'Belirtilmemiş'}

ATALAR:
"""
        for anc in prof.get("ancestors", []):
            summary += f"\n- {anc.get('relation')} ({'Anne soyu' if anc.get('side')=='maternal' else 'Baba soyu'}): "
            summary += f"Hastalıklar: {', '.join(anc.get('diseases', []))}; "
            summary += f"Olaylar: {', '.join(anc.get('events', []))}; "
            summary += f"Yarım Adaklar: {', '.join(anc.get('unfulfilled_vows', []))}; "
            summary += f"Bilinen Günahlar: {', '.join(anc.get('sins_admitted', []))}"
        
        summary += "\n\nADAKLAR:\n"
        for av in prof.get("animal_vows", []):
            summary += f"- {av.get('animal')} x{av.get('quantity',1)} {'(yerine getirildi)' if av.get('fulfilled') else '(yarım kaldı)'} {av.get('issue','')}\n"
        for ev in prof.get("action_vows", []):
            summary += f"- {ev.get('action_type')} adağı {'(yerine getirildi)' if ev.get('fulfilled') else '(yarım kaldı)'}\n"
        
        summary += f"\nKURAL TABANLI TESPİT EDİLEN HASTALIK-SEBEP EŞLEŞMELERİ:\n"
        for m in analysis.matches[:10]:
            summary += f"- {m.disease} (skor: {m.total_score}): "
            top_causes = list({c.category_label for c in m.matched_causes})[:3]
            summary += ", ".join(top_causes) + "\n"
        
        summary += f"\nANNE SOYU YÜKÜ: {analysis.maternal_burden_score}, BABA SOYU YÜKÜ: {analysis.paternal_burden_score}, KİŞİSEL YÜK: {analysis.self_burden_score}"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"analysis-{profile_id}",
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-6")
        
        user_msg = UserMessage(text=summary + "\n\nLütfen bu kişi için detaylı manevi analiz hazırla.")
        response = await chat.send_message(user_msg)
        
        # LLM analizini kaydet
        analysis.llm_analysis = response
        await db.analyses.update_one(
            {"id": analysis.id},
            {"$set": {"llm_analysis": response}},
            upsert=True
        )
        # Eğer yeni ise insert ettik, değilse güncellendi - garanti için yeniden insert
        existing = await db.analyses.find_one({"id": analysis.id})
        if not existing:
            await db.analyses.insert_one(analysis.dict())
        
        return {"llm_analysis": response, "analysis_id": analysis.id}
    
    except Exception as e:
        logging.exception("LLM analysis failed")
        msg = str(e)
        if "Budget" in msg or "budget" in msg or "credit" in msg.lower():
            raise HTTPException(503, "Yapay zekâ kredisi tükenmiş. Lütfen Emergent profilinizden Universal Key bakiyenizi yükleyin.")
        raise HTTPException(500, f"LLM analizi şu anda yapılamıyor: {msg[:160]}")

# ===========================
# FORM ANALYSIS (PDF Bilgi Tabanı tabanlı AI analizi)
# ===========================

class FormSubmissionCreate(BaseModel):
    ad_soyad: str
    yas: Optional[str] = ""
    tlf: Optional[str] = ""
    medeni_durum: Optional[str] = ""
    cocuk_sayisi: Optional[str] = ""
    memleket: Optional[str] = ""
    dogum_tarihi: Optional[str] = ""
    cinsiyet: Optional[str] = ""
    anne_durum: Optional[str] = ""
    baba_durum: Optional[str] = ""
    anneanne_durum: Optional[str] = ""
    anne_babasi_durum: Optional[str] = ""
    babaanne_durum: Optional[str] = ""
    baba_babasi_durum: Optional[str] = ""
    zekat_veriyor: Optional[str] = ""
    faizli_kredi: Optional[str] = ""
    anne_hastalik: Optional[str] = ""
    baba_hastalik: Optional[str] = ""
    cocuk_hastalik: Optional[str] = ""
    rahatsizliklar: Optional[str] = ""
    adak_yemin: Optional[str] = ""
    muska_okunmus_su: Optional[str] = ""
    miras_sorunu: Optional[str] = ""
    beddua_hak_haram: Optional[str] = ""
    intihar: Optional[str] = ""
    anne_baba_ofke: Optional[str] = ""
    es_soguklugu: Optional[str] = ""
    sehvet: Optional[str] = ""
    duygusallik: Optional[str] = ""
    kin: Optional[str] = ""
    kusme_alinganlik: Optional[str] = ""
    ofke: Optional[str] = ""
    nefret: Optional[str] = ""
    supheci: Optional[str] = ""
    uyku_sorunu: Optional[str] = ""
    aniden_parlama: Optional[str] = ""
    alaycilik: Optional[str] = ""

class FormSubmission(FormSubmissionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ai_analysis: Optional[str] = None

def _is_positive(text: str) -> bool:
    if not text:
        return False
    t = text.strip().lower()
    if not t or t in ("yok", "hayır", "hayir", "yok.", "-", "0"):
        return False
    return True

def _summarize_signals(form: dict) -> Dict[str, List[str]]:
    signals: Dict[str, List[str]] = {}
    for q_key, cats in FORM_QUESTION_HINTS.items():
        val = form.get(q_key, "")
        if _is_positive(val):
            for c in cats:
                signals.setdefault(c, []).append(f"{q_key}: {val}")
    z = form.get("zekat_veriyor", "").strip().lower()
    if z in ("hayır", "hayir", "yok", "vermiyor"):
        signals.setdefault("zekat", []).append("Zekat verilmiyor")
    if _is_positive(form.get("faizli_kredi", "")):
        signals.setdefault("faiz", []).append(f"Faizli kredi: {form['faizli_kredi']}")
    return signals

@api_router.post("/form-submissions", response_model=FormSubmission)
async def create_form(payload: FormSubmissionCreate):
    fs = FormSubmission(**payload.dict())
    await db.form_submissions.insert_one(fs.dict())
    return fs

@api_router.get("/form-submissions/{fid}", response_model=FormSubmission)
async def get_form(fid: str):
    doc = await db.form_submissions.find_one({"id": fid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Form bulunamadı")
    return FormSubmission(**doc)

@api_router.get("/form-submissions", response_model=List[FormSubmission])
async def list_forms():
    docs = await db.form_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [FormSubmission(**d) for d in docs]

@api_router.delete("/form-submissions/{fid}")
async def delete_form(fid: str):
    await db.form_submissions.delete_one({"id": fid})
    return {"ok": True}

@api_router.post("/form-submissions/{fid}/analyze")
async def analyze_form(fid: str, force: bool = False):
    doc = await db.form_submissions.find_one({"id": fid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Form bulunamadı")
    # Idempotent: cached varsa onu döndür (force=true ile yeniden üretilir)
    if not force and doc.get("ai_analysis"):
        return {"ai_analysis": doc["ai_analysis"], "signals": _summarize_signals(doc), "cached": True}
    try:
        # KURAL TABANLI ANALİZ (AI'sız, ücretsiz, anında)
        from rule_engine import generate_analysis
        result = generate_analysis(doc)
        await db.form_submissions.update_one(
            {"id": fid}, {"$set": {"ai_analysis": result["ai_analysis"]}}
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Form analysis failed")
        raise HTTPException(500, f"Analiz yapılamadı: {str(e)[:200]}")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
