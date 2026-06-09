"""
Tıbb-ul Furkan Analiz Motoru

Kullanıcının form yanıtlarını knowledge_base.py'deki bilgilerle eşleştirerek
insani, sıcak ve samimi bir dille analiz çıktısı üretir.
"""

from typing import Dict, List
from collections import Counter

from knowledge_base import (
    DISEASE_PATTERNS,
    FORM_QUESTION_HINTS,
    CAUSE_CATEGORIES,
)
from templates import (
    TEMPLATES_MALI,
    TEMPLATES_SORULAR,
    KAPANIS,
)


# ============================================================
# Yardımcılar
# ============================================================
def _f(doc: Dict, key: str) -> str:
    v = (doc.get(key) or "")
    return v.strip() if isinstance(v, str) else ""


def _is_evet(value: str) -> bool:
    return value.strip().lower().startswith("evet")


def _is_hayir(value: str) -> bool:
    return value.strip().lower().startswith("hayır")


# ============================================================
# Hastalık Eşleştirme
# ============================================================
def _match_diseases(text: str) -> List[Dict]:
    """Verilen metinde geçen hastalıkları bulur."""
    if not text:
        return []
    t = text.lower()
    matched = []
    seen_names = set()
    
    # Çok genel kelimeler - bunları tek başına eşleştirme
    SKIP_WORDS = {'hastalık', 'hastalığı', 'ağrı', 'ağrısı', 'sorun', 'sorunu', 
                  'bozukluk', 'bozukluğu', 'yüksek', 'düşük', 'aşırı', 'şeker',
                  'kan', 'kalp', 'baş', 'göz', 'deri', 'cilt', 'kemik', 'kas'}
    
    for d in DISEASE_PATTERNS:
        name_l = d["name"].lower()
        hit = False
        
        # 1. Tam isim eşleşmesi (en güvenilir)
        if name_l in t:
            hit = True
        
        # 2. İsmin önemli ve uzun kelimelerini ara
        if not hit:
            clean_name = name_l.split("(")[0].strip()
            name_words = [w.strip() for w in clean_name.replace("/", " ").split() if len(w) > 4 and w not in SKIP_WORDS]
            # En az bir önemli kelime eşleşmeli
            for word in name_words:
                if word in t:
                    hit = True
                    break
        
        # 3. Semptom tam eşleşmesi (sadece uzun semptomlar)
        if not hit:
            for sym in d.get("symptoms", []):
                sym_lower = sym.lower()
                # Sadece 5+ karakter semptomlarla tam eşleşme
                if len(sym_lower) > 5 and sym_lower in t:
                    hit = True
                    break
        
        if hit and name_l not in seen_names:
            matched.append(d)
            seen_names.add(name_l)
    
    return matched


# ============================================================
# Rızık ve Bereketteki Engeller
# ============================================================
def build_rizik(doc: Dict) -> List[str]:
    """Mali durumu ve rızık engellerini analiz eder."""
    bullets = []
    
    faiz = _f(doc, "faizli_kredi").lower()
    zekat = _f(doc, "zekat_veriyor").lower()
    miras = _is_evet(_f(doc, "miras_sorunu"))
    
    if faiz.startswith("evet"):
        bullets.append(
            "**Faiz Yükü:** Hayatınıza giren faizli kredi, manevi anlamda büyük bir yıkımın işaretidir. "
            "Faiz günahı; doğrudan bağırsak hastalıkları, basur (hemoroid), bağırsak kanseri, otizm ve kolera ile ilişkilidir. "
            "Mümkün olan en kısa sürede faiz yükünden çıkış yapılması ve samimi bir tövbe edilmesi elzemdir."
        )
    
    if zekat == "hayır":
        bullets.append(
            "**Zekât Eksikliği:** Verilmeyen veya eksik verilen zekât, pek çok hastalığın kökeninde yatan temel sebeplerdendir. "
            "Böbrek rahatsızlıkları, tansiyon, diyabet, epilepsi, bipolar bozukluk ve şizofreni gibi rahatsızlıklar "
            "doğrudan zekât eksikliği ile ilişkilidir. Birikmiş zekât borcunun hesaplanıp ödenmesi tavsiye edilir."
        )
    
    if miras:
        bullets.append(
            "**Miras ve Kul Hakkı:** Akrabalar arasında yaşanan miras sorunu, miras laneti ve hak helalleşmesi eksikliğinden kaynaklanır. "
            "Bu durum; bağırsak hastalıkları, basur (hemoroid), kalp ritmi bozukluğu ve anksiyete ile doğrudan ilişkilidir. "
            "Üzerinizdeki bu ağırlığın kalkması için helalleşme süreci öncelikli adım olmalıdır."
        )
    
    return bullets


# ============================================================
# Ailede Yaşanan Sıkıntılar
# ============================================================
def build_aile_sikinti(doc: Dict) -> List[str]:
    """Anne, baba ve çocuklardaki hastalıkları analiz eder."""
    bullets = []
    
    # Anne hastalıkları
    anne_txt = _f(doc, "anne_hastalik")
    if anne_txt:
        diseases = _match_diseases(anne_txt)
        if diseases:
            for d in diseases[:3]:
                desc = d.get('description', '')
                bullets.append(
                    f"**Annede {d['name']}:** {desc} Şifa için bu günahlardan tövbe edilmesi gerekir."
                )
        else:
            bullets.append(
                f"**Annede Bildirilen Rahatsızlıklar:** \"{anne_txt[:80]}{'…' if len(anne_txt) > 80 else ''}\" — "
                f"Bu durumların manevi sebeplerinin tespiti için seans alınması önerilir."
            )
    
    # Baba hastalıkları
    baba_txt = _f(doc, "baba_hastalik")
    if baba_txt:
        diseases = _match_diseases(baba_txt)
        if diseases:
            for d in diseases[:3]:
                desc = d.get('description', '')
                bullets.append(
                    f"**Babada {d['name']}:** {desc} Anne-baba helalleşmesi ve tövbe gerekir."
                )
        else:
            bullets.append(
                f"**Babada Bildirilen Rahatsızlıklar:** \"{baba_txt[:80]}{'…' if len(baba_txt) > 80 else ''}\" — "
                f"Bu durumların manevi sebeplerinin tespiti için seans alınması önerilir."
            )
    
    # Çocuk hastalıkları
    cocuk_txt = _f(doc, "cocuk_hastalik")
    if cocuk_txt:
        diseases = _match_diseases(cocuk_txt)
        if diseases:
            for d in diseases[:3]:
                desc = d.get('description', '')
                bullets.append(
                    f"**Çocuklarda {d['name']}:** {desc}"
                )
        else:
            bullets.append(
                f"**Çocuklarda Bildirilen Rahatsızlıklar:** \"{cocuk_txt[:80]}{'…' if len(cocuk_txt) > 80 else ''}\" — "
                f"Bu durumların manevi sebeplerinin tespiti için seans alınması önerilir."
            )
    
    return bullets


# ============================================================
# Gönül ve Ruh Halindeki İşaretler
# ============================================================
GONUL_ACIKLAMALARI = {
    "ofke": (
        "**Öfke ve Aniden Parlama:** Sık ve kontrolsüz yaşadığınız öfke ve aniden parlama halleri; "
        "adak hayvanı yükü (boğa, dana, öküz) ve anne-baba zulmü ile ilişkilidir. "
        "Adaklarınızı tespit etmeniz ve helalleşmeniz gerekir."
    ),
    "es_soguklugu": (
        "**Eş Soğukluğu:** Eşinize karşı hissettiğiniz soğukluk; adak hayvanı uyuşmazlığı "
        "(erkekte dişi adak / kadında erkek adak), zina ve iftira ile ilişkilidir."
    ),
    "sehvet": (
        "**Şehvet:** Yaşanan yüksek şehvet halleri, soydan yapılan tecavüzler, ensest ve soy izleri ile doğrudan bağlantılıdır."
    ),
    "kin": (
        "**Kin:** Geçmişi unutamama ve kin tutma; kul hakkı, kırgınlık ve beddua enerjisi ile ilişkilidir. "
        "İlgili kişilerle muhakkak helalleşme süreci başlatılmalıdır."
    ),
    "kusme_alinganlik": (
        "**Küsme ve Alınganlık:** Bu durum, adak hayvanı yükü ile ilişkilidir. "
        "Adakların tespit edilip yerine getirilmesi gerekir."
    ),
    "nefret": (
        "**Nefret:** İçinizdeki nefret duygusu, beddua ve hak haramlığı enerjisiyle bağlantılıdır. "
        "Helalleşme ve af dileme süreci başlatılmalıdır."
    ),
    "uyku_sorunu": (
        "**Uyku Sorunları:** Uyku düzensizliğiniz; adak hayvanı yükü (koyun/dişi kuzu), zekât eksiği veya beddua ile ilişkilidir. "
        "Büyükbaş hayvan adakları özellikle gece uyutmaz."
    ),
    "supheci": (
        "**Şüphecilik:** İçinize düşen şüphecilik; inek/düve adak yükü ve şirk ile ilişkilidir. "
        "Adakların tespiti ve şirkten tövbe gerekir."
    ),
    "alaycilik": (
        "**Alaycılık:** İnsanlara karşı olan alaycılığınız, kınama ile ilgilidir ve ileride alzheimer, diyabet, kellik ve obeziteyle sonuçlanabilir. "
        "Dilin terbiyesi ve tövbe şarttır."
    ),
    "duygusallik": (
        "**Aşırı Duygusallık:** Yaşadığınız duygusallık, adak hayvanı yükü ile ilişkilidir."
    ),
    "anne_baba_ofke": (
        "**Anne-Babaya Öfke:** Anne-babaya karşı hissedilen öfke, manevi açıdan ağır bir yüktür. "
        "Bu durum felç, parkinson, kamburluk ve kalp hastalıklarıyla ilişkilidir. Derhal helalleşme gerekir."
    ),
    "intihar": (
        "**İntihar Düşüncesi:** Bu düşünceler, aşırı isyan ve kadere rızasızlık enerjisiyle ilişkilidir. "
        "Tövbe ve manevi destek şarttır."
    ),
}


def build_gonul(doc: Dict) -> List[str]:
    """Ruhsal ve duygusal durumları analiz eder."""
    bullets = []

    # "ofke" ya da "aniden_parlama" form alanlarından herhangi biri Evet ise birleşik bullet'ı ekle
    if _is_evet(_f(doc, "ofke")) or _is_evet(_f(doc, "aniden_parlama")):
        bullets.append(GONUL_ACIKLAMALARI["ofke"])

    for key, aciklama in GONUL_ACIKLAMALARI.items():
        if key == "ofke":
            continue  # yukarıda halledildi
        val = _f(doc, key)
        if _is_evet(val):
            bullets.append(aciklama)

    return bullets


# ============================================================
# Şifaya Açılan Kapı
# ============================================================
def build_sifa(doc: Dict) -> List[str]:
    """Kişinin bildirdiği rahatsızlıkları ve şifa yollarını açıklar."""
    bullets = []
    
    txt = _f(doc, "rahatsizliklar")
    if not txt:
        return bullets
    
    diseases = _match_diseases(txt)
    if not diseases:
        bullets.append(
            f"Bildirdiğiniz rahatsızlıklar (\"{txt[:100]}{'…' if len(txt) > 100 else ''}\") "
            "için daha detaylı manevi değerlendirme yapılabilmesi adına seans alınması önerilir."
        )
        return bullets
    
    bullets.append(
        "Hayat yolunda yaşadığınız rahatsızlıklar ve düğümler, soyunuzdan gelen ve şifaya kavuşmayı bekleyen manevi yüklerdir:"
    )
    
    for d in diseases[:10]:
        name = d['name']
        desc = d.get('description', '')
        
        # Açıklamayı düzelt - nokta ile bitir
        if desc and not desc.endswith('.'):
            desc = desc + '.'
        
        bullets.append(f"**{name}:** {desc}")
    
    return bullets


# ============================================================
# Manevi Yükler (Adak, Muska, Beddua)
# ============================================================
def build_manevi_yukler(doc: Dict) -> List[str]:
    """Adak, muska, beddua gibi manevi yükleri analiz eder."""
    bullets = []
    
    # Adak/Yemin
    if _is_evet(_f(doc, "adak_yemin")):
        bullets.append(
            "**Adak ve Yemin:** Yerine getirilmemiş adaklar bedende kalıcı bir manevi iz bırakır. "
            "Adak ve zekât eksiklerinizin tamamlanması gerekir. Hayvan adağı tespiti için seans alınması şarttır."
        )
    
    # Muska/Okunmuş su
    if _is_evet(_f(doc, "muska_okunmus_su")):
        bullets.append(
            "**Muska ve Okunmuş Su:** Üzerinizde bulunan muska veya okunmuş su kullanımı; "
            "şifayı Allah'tan başka vesilelerde arama yanılgısı olup şirk ile ilişkilidir. "
            "Bu yükün de tövbe ile arındırılması şarttır."
        )
    
    # Beddua/Hak haram
    if _is_evet(_f(doc, "beddua_hak_haram")):
        bullets.append(
            "**Beddua ve Hak Haramlığı:** Geçmişte edilen beddua veya hak haram etme durumları; "
            "otizm, böbrek rahatsızlıkları, körlük, ödem, saç dökülmesi gibi pek çok rahatsızlığın tetikleyicisidir. "
            "Kimlerin ahının alındığını hatırlayıp derhal helalleşme yoluna gidilmelidir."
        )
    
    return bullets


# ============================================================
# Genel Değerlendirme
# ============================================================
def build_genel(doc: Dict) -> List[str]:
    """En güçlü kategorileri tespit eder."""
    counter = Counter()
    
    # Sorular → kategoriler
    for q_key, hints in FORM_QUESTION_HINTS.items():
        if _is_evet(_f(doc, q_key)):
            for c in hints:
                counter[c] += 2
    
    # Hastalıklar → kategoriler
    all_text = " ".join([_f(doc, k) for k in ["rahatsizliklar", "anne_hastalik", "baba_hastalik", "cocuk_hastalik"]])
    diseases = _match_diseases(all_text)
    for d in diseases:
        for c in d["causes"]:
            counter[c] += 1
    
    # Mali sinyaller
    if _f(doc, "zekat_veriyor").lower() == "hayır":
        counter["zekat"] += 3
    if _f(doc, "faizli_kredi").lower().startswith("evet"):
        counter["faiz"] += 3
    
    bullets = []
    if not counter:
        return bullets
    
    top = counter.most_common(3)
    labels = [CAUSE_CATEGORIES.get(c, c) for c, _ in top]
    
    # Daha insani bir özet
    if len(labels) >= 3:
        bullets.append(
            f"Tüm bilgileriniz değerlendirildiğinde, en belirgin manevi yükler: "
            f"**{labels[0]}**, **{labels[1]}** ve **{labels[2]}** olarak tespit edilmiştir."
        )
    elif len(labels) == 2:
        bullets.append(
            f"Tüm bilgileriniz değerlendirildiğinde, en belirgin manevi yükler: "
            f"**{labels[0]}** ve **{labels[1]}** olarak tespit edilmiştir."
        )
    elif len(labels) == 1:
        bullets.append(
            f"Tüm bilgileriniz değerlendirildiğinde, en belirgin manevi yük: "
            f"**{labels[0]}** olarak tespit edilmiştir."
        )
    
    bullets.append(
        "Bu yüklerin kaldırılması için tövbe, helalleşme ve varsa eksik adak/zekâtların tamamlanması öncelikli adımlardır."
    )
    
    return bullets


# ============================================================
# ANA ÜRETİCİ
# ============================================================
def generate_analysis(doc: Dict) -> Dict:
    """Form bilgilerini alır, insani ve sıcak bir analiz metni üretir."""
    sections = []
    
    # Giriş
    giris = [
        "Yaşadığınız sıkıntıları ve ailenizdeki hastalıkları Tıbb-ul Furkan ilminin ışığında incelediğimizde, "
        "hayatınızda tesadüf gibi görünen olayların aslında geçmişten günümüze uzanan manevi düğümler olduğunu görüyoruz. "
        "Bedeninizdeki ve hanenizdeki bu işaretlerin asıl sebeplerini ve arınma yollarını aşağıda dikkatinize sunuyorum:"
    ]
    sections.append(("", giris))
    
    # Rızık ve Bereket
    rizik = build_rizik(doc)
    if rizik:
        sections.append(("Rızık ve Bereketteki Engeller", rizik))
    
    # Ailede Yaşanan Sıkıntılar
    aile = build_aile_sikinti(doc)
    if aile:
        sections.append(("Ailede Yaşanan Sıkıntılar", aile))
    
    # Gönül ve Ruh Hali
    gonul = build_gonul(doc)
    if gonul:
        sections.append(("Gönül ve Ruh Halindeki İşaretler", gonul))
    
    # Manevi Yükler
    manevi = build_manevi_yukler(doc)
    if manevi:
        sections.append(("Manevi Yükler", manevi))
    
    # Şifaya Açılan Kapı
    sifa = build_sifa(doc)
    if sifa:
        sections.append(("Şifaya Açılan Kapı", sifa))
    
    # Genel Değerlendirme
    genel = build_genel(doc)
    if genel:
        sections.append(("Genel Değerlendirme", genel))
    
    # Markdown oluştur
    lines = []
    for title, bullets in sections:
        if title:
            lines.append(f"## {title}")
            lines.append("")
        for b in bullets:
            if b.startswith("**") or b.startswith("Yaşadığınız") or b.startswith("Hayat") or b.startswith("Tüm") or b.startswith("Bu"):
                lines.append(b)
            else:
                lines.append(f"- {b}")
            lines.append("")
    
    # Kapanış
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("**Adak, zekât ve genel soy yüklerinin doğru tespitinin yapılabilmesi ve kefaretleri uygulamaya yönelik yönlendirmeler için seans alınması önerilir.**")
    
    markdown = "\n".join(lines)
    
    # Sinyal özeti
    signals: Dict[str, List[str]] = {}
    for q_key, hints in FORM_QUESTION_HINTS.items():
        if _is_evet(_f(doc, q_key)):
            for c in hints:
                signals.setdefault(c, []).append(q_key)
    
    return {"ai_analysis": markdown, "signals": signals}
