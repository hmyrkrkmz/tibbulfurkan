"""
Şablon Tabanlı Cevap Üretici (AI'sız, ücretsiz)

Bu dosya kullanıcının form cevaplarına karşılık üretilecek cümle şablonlarını içerir.
İlerde yeni şablon eklemek için, ilgili listeye yeni dict ekleyin — kod değişikliği gerekmez.

Yapı:
  TEMPLATES_*  → Bölümlere göre şablon listeleri.
  Her şablon dict: { "match": {...}, "text": "..." (veya "text_fn": fn) }
"""

from typing import Dict, List, Callable, Optional

# ============================================================
# A. AİLE BÜYÜKLERİ & SOY YÜKÜ
# ============================================================
# Kullanıcının elder alanlarında "Sağ" / "Vefat" olarak verdiklerine göre üretilir.
TEMPLATES_AILE: List[Dict] = [
    # Tüm vefat kontrolleri kişi kişi yapılır
    {
        "id": "vefat_genel",
        "text_fn": "render_aile_vefat",  # dinamik fonksiyon; aşağıda
    },
    {
        "id": "sag_genel",
        "text_fn": "render_aile_sag",
    },
    {
        "id": "her_iki_dede_vefat",
        "match_fn": lambda s: ("vefat" in (s.get("anne_babasi_durum") or "").lower()
                                and "vefat" in (s.get("baba_babasi_durum") or "").lower()),
        "text": "Her iki dedenin de vefat etmiş olması durumunda; soy hattından gelen olası adak, beddua veya hak helalleşmesi yüklerinin gözden geçirilmesi faydalı olabilir.",
    },
]

# ============================================================
# B. MALİ DURUM
# ============================================================
TEMPLATES_MALI: List[Dict] = [
    {
        "id": "zekat_hayir",
        "match": {"field": "zekat_veriyor", "equals_lower": "hayır"},
        "text": "Zekatın verilmediği bildirilmiştir; bilgi tabanında zekat eksiği; bağırsak, böbrek, diyabet, alzheimer ve uyku sorunları gibi rahatsızlıklarla ilişkilendirilen önemli bir kategoridir. Zekat eksiğinin tespiti ve tamamlanması öncelikli bir adım olabilir.",
    },
    {
        "id": "zekat_evet",
        "match": {"field": "zekat_veriyor", "equals_lower": "evet"},
        "text": "Zekatın düzenli verilmesi olumlu bir işarettir; geçmişe dönük unutulmuş bir eksik kalıp kalmadığını gözden geçirmek faydalı olabilir.",
    },
    {
        "id": "faiz_evet",
        "match": {"field": "faizli_kredi", "starts_with_lower": "evet"},
        "text": "Faizli kredi bildirilmiştir; faiz, bilgi tabanında bağırsak hastalıkları, kabızlık, otizm ve kolera gibi tablolarla bağlantılı bir kategoridir. Mümkün olan en kısa sürede faiz yükünden çıkış ve tövbe önerilmektedir.",
    },
    {
        "id": "faiz_hayir",
        "match": {"field": "faizli_kredi", "equals_lower": "hayır"},
        "text": "Faizli kredi bildirilmemiştir; bu olumlu bir işarettir.",
    },
]

# ============================================================
# C. SORULARDAN ÇIKAN MANEVİ İŞARETLER
# Her soru için "Evet" cevabına özel cümle.
# ============================================================
TEMPLATES_SORULAR: Dict[str, str] = {
    "adak_yemin": "Geçmişte adanmış bir adak veya bozulmuş bir yemin olabileceği bildirilmiştir; türünün (hayvan/eylem) ve durumunun tespiti önemli olabilir. Yerine getirilmemiş adak yükü bedende kalıcı bir manevi iz bırakabilir.",
    "muska_okunmus_su": "Muska takma veya okunmuş su içme bilgi tabanında şirk kategorisi ile ilişkilendirilebilir; bu yükün tespiti ve tövbe ile arındırılması önerilmektedir.",
    "miras_sorunu": "Akrabalar arası miras sorunu bildirilmiştir; miras lâneti ve hak helalleşmesi kategorileri; bağırsak hastalıkları, kabızlık ve kalp rahatsızlıkları ile ilişkilendirilebilir. Helalleşme süreci öncelikli olabilir.",
    "beddua_hak_haram": "Geçmişte yapılan beddua veya hak haram etme; bilgi tabanında pek çok rahatsızlığın (otizm, böbrek, körlük, ödem, saç dökülmesi) tetikleyicisi olarak yer alır. Hangi kişi/durum için olduğunun hatırlanması ve tövbe edilmesi tavsiye edilir.",
    "intihar": "İntihar girişimi; kendine zulüm ve isyan kategorisinde yer alır; bu yükten tövbe ve manevi destek süreci önemlidir.",
    "anne_baba_ofke": "Anne-babaya öfke; bilgi tabanında migren, kalp hastalıkları, bipolar bozukluk ve öfke krizleri ile sıkça ilişkilendirilen bir kategoridir. Helalleşme süreci en güçlü hafifletici adımlardan biridir.",
    "es_soguklugu": "Eşe karşı soğukluk; özellikle adak hayvanı uyuşmazlığı (erkekte dişi adak / kadında erkek adak), zina ve iftira gibi kategorilerle bağlantılı olabilir; adak tespiti faydalı olabilir.",
    "sehvet": "Yüksek şehvet; bilgi tabanında zina/ensest soy izleriyle ilişkilendirilebilir; bu konuda manevi temizlenme önerilmektedir.",
    "duygusallik": "Yoğun duygusallık; bilgi tabanında soy lâneti veya geçmiş kuşak yüklerinin yansıması olabilir.",
    "kin": "Geçmişi unutamama ve kin; kul hakkı kategorisini gündeme getirir; ilgili kişilerle helalleşme önerilmektedir.",
    "kusme_alinganlik": "Küsme ve alınganlık; kul hakkı ve kırgınlık kategorisinde yer alır; gönül kazanma ve helalleşme adımları bu yükü hafifletebilir.",
    "ofke": "Sık ve kontrolsüz öfke; bilgi tabanında adak hayvanı yükü ve anne-baba zulmü kategorileri ile bağlantılıdır. Adak tespiti ve helalleşme öncelikli olabilir.",
    "nefret": "Nefret duygusu; kul hakkı ve kınama kategorilerinde yer alır; ilgili kişilerle helalleşme süreci tavsiye edilir.",
    "supheci": "Şüphecilik; bilgi tabanında şirk kategorisi ile ilişkilendirilebilir; tevhid bilincinin yeniden inşası önerilir.",
    "uyku_sorunu": "Uyku düzensizliği; adak hayvanı yükü, zekat eksiği veya beddua kategorileriyle ilişkilendirilebilir; bu alanların gözden geçirilmesi faydalı olabilir.",
    "aniden_parlama": "Aniden parlama; adak hayvanı yükü ve anne-babaya öfke kategorileri ile bağlantılı olabilir; bu yüklerin tespiti önemlidir.",
    "alaycilik": "Alaycılık; kınama kategorisinde yer alır; bilgi tabanında alzheimer, diyabet, kellik ve obeziteyle ilişkilendirilir. Tövbe ve dilin terbiyesi önerilmektedir.",
}

# ============================================================
# D. AİLE HASTALIKLARI ŞABLONU
# Her bir alan için (anne/baba/çocuklar) eğer dolduysa, semptom eşleştirmesi yapılır.
# ============================================================
# Aile hastalıkları text DISEASE_PATTERNS üzerinden dinamik üretilir (rule_engine içinde).

# ============================================================
# E. GENEL DEĞERLENDİRME (kapanış)
# ============================================================
TEMPLATES_GENEL: List[Dict] = [
    {
        "id": "ust_kategori_ozet",
        "text_fn": "render_genel_ozet",
    },
]

# Standart kapanış
KAPANIS = "Lütfen seans alınız."
