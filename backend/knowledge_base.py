"""
Tıbb-ul Furkan Bilgi Tabanı (Knowledge Base)
Güncellenmiş ve Kapsamlı Versiyon

Bu modül; analiz motoruna ve Yapay Zeka katmanına sabit bilgi (context) sağlar.
LLM çağrılarında 'system_message' içine eklenir.
"""

# ============================================================
# 1. GÜNAH / RUHSAT KATEGORİLERİ
# ============================================================
CAUSE_CATEGORIES = {
    "zekat": "Verilmeyen veya Eksik Zekât",
    "adak_hayvan": "Yerine Getirilmeyen Hayvan Adağı",
    "adak_eylem": "Yerine Getirilmeyen Eylemsel Adak (oruç, namaz, Kur'an, hatim, ziyaret, hac, dağıtma, giydirme vb.)",
    "beddua": "Beddua / Lânet",
    "lanet": "Yaratılmışlara (güneş, yağmur, su vb.) Lanet Okuma",
    "soy_laneti": "Soy Lâneti",
    "miras_laneti": "Miras Üzerine Kavga / Lânet / 'Zehir Zıkkım Olsun' Sözü",
    "zulum_insan": "İnsana Zulüm (dövme, ah alma, işkence)",
    "zulum_hayvan": "Hayvana Zulüm / İşkence / Yakma",
    "zulum_anne_baba": "Anne-Babaya Zulüm / İsyan / Dövme / Terk Etme",
    "isyan": "Allah'a / Kadere İsyan, Şükürsüzlük, İntizar",
    "sirk": "Şirk",
    "kinama": "Kınama / Alay / Dalga Geçme",
    "faiz": "Faiz Yeme veya Yedirme",
    "hak_haram": "Hak Haramlığı",
    "haram_kazanc": "Haksız Kazanç",
    "hayrat_mali": "Hayrat / Vakıf Malı Yeme",
    "zina_ensest": "Zina / Ensest / Tecavüz",
    "iftira": "İftira / Yalancı Şahitlik",
    "yetim_hakki": "Yetim Hakkı Yeme / Yetime Zulüm",
    "adak_eti": "Adak Eti Yeme",
    "kufur": "Küfür / Lanet / İnkâr Sözleri",
    "cocuk_aldirma": "Çocuk Aldırma (kürtaj) / Çocuk Düşürme",
    "haramzade": "Haramzade Olmak",
    "insan_oldurme": "İnsan Öldürme / Cinayet / İşkence ile Öldürme",
    "cocuk_oldurme": "Çocuk Öldürme / Çocuklara Zulüm",
    "hamile_zulum": "Hamile Kadına Zulüm / Hakaret / Taciz",
    "alim_evliya_zulum": "Âlim ve Evliya Zulmü / Öldürme / Kur'an Talebelerine Zulüm",
    "hasta_zulum": "Hasta / Engelli / Mahkûma Zulüm",
    "hayvan_yakma": "Hayvan Yakma / Diri Diri Gömme",
    "suda_bogma": "Hayvanı Suda Boğma",
    "tarla_yakma": "Tarla / Buğday Yakma",
    "mezarci": "Mezarcı Ruhsatı (Soydan Ağır Zulüm)",
    "yuva_yikma": "Yuva Yıkma / Sevenleri Ayırma / Aşk Acısı Çektirme",
    "yol_kesme": "Yol Kesme / Eşkıyalık / İnsanları Bekletme",
    "savastan_kacma": "Savaştan Kaçma / Hainlik",
    "kiz_kacirma": "Kız Kaçırma",
    "soz_tutmama": "Allah'a Yürüme / Türbe / Umre Sözünü Tutmama",
}

# ============================================================
# 2. FİZİKSEL VE GENETİK HASTALIKLAR VE SEBEPLERİ
# ============================================================
DISEASE_PATTERNS = [
    # === FİZİKSEL VE GENETİK HASTALIKLAR ===
    
    {
        "name": "Acı Yetimi (Acı Hissetmeme, Elini/Dilini Yeme)",
        "category": "Nadir Genetik",
        "symptoms": ["acı hissetmeme", "elini yeme", "dilini yeme", "ağrı duyumsuzluğu"],
        "causes": ["adak_hayvan", "beddua"],
        "description": "Adanmış hayvanı çalıp yeme, malı çalınan kişinin 'Zehir zıkkım olsun, kendi başını, elini, dilini yesin' bedduası."
    },
    
    {
        "name": "Akdeniz Anemisi",
        "category": "Hematolojik/Genetik",
        "symptoms": ["kansızlık", "akdeniz anemisi", "talasemi", "kan bozukluğu"],
        "causes": ["beddua", "isyan", "lanet", "zekat", "adak_eylem"],
        "description": "Beddua, kahır, intizar, isyan, lanet ('Zehir zıkkım olsun, ben yiyemedim siz de yiyemeyin' sözü) ve verilmeyen veya eksik verilen zekât. Yerine getirilmeyen adak."
    },
    
    {
        "name": "Alzheimer",
        "category": "Nörolojik",
        "symptoms": ["unutkanlık", "hafıza kaybı", "bilinç bulanıklığı", "alzheimer"],
        "causes": ["kinama", "zekat", "adak_eylem", "zulum_anne_baba"],
        "description": "Unutkan insanları kınama, zekât (özellikle anne babanın vermediği zekât), yerine getirilmeyen adaklar, anne babayı terk etme/unutma ve ahını alma."
    },
    
    {
        "name": "Astım ve KOAH (Solunum Sıkıntıları)",
        "category": "Solunum",
        "symptoms": ["astım", "koah", "nefes darlığı", "boğulma hissi", "solunum güçlüğü"],
        "causes": ["isyan", "beddua", "adak_eylem", "zulum_insan", "zulum_hayvan", "adak_eti", "kinama"],
        "description": (
            "Astım, KOAH ve nefes darlığı gibi solunum sıkıntılarının temel manevi sebebi isyan ve hayata karşı duyulan memnuniyetsizliktir. "
            "(1) Nefese ve Hayata İsyan: Kişinin kendisinin veya soyunun hayata, yaşamaya lanet okuması; 'Böyle hayata lanet olsun' veya 'Bir nefes almak haram olsun' gibi sözler sarf etmesi ciğerleri etkileyerek astıma yol açar. "
            "(2) Duman, Gaz ve Boğma Zulmü: İnsanları veya hayvanları havasız yerde hapsederek ateşle, dumanla, gazla veya suda boğmaya çalışmak; onları uykusunda zehirlemek. "
            "(3) Soğukta Bırakma: Yaşlıları, çocukları veya hayvanları karda, kışta dondurarak ciğerlerinin hastalanmasına sebep olmak. "
            "(4) Ağaç Dikme Adağı: Dünyanın akciğerleri sayılan ağaçları dikme adağının verilip yerine getirilmemesi nefes darlığı, bronşit ve astım belirtilerine kapı açar. "
            "(5) Adak Eti ve Beddualar: Adak hayvanının ciğerini yemek; 'Ciğerin yansın/kurusun/kanser olsun' gibi beddualar. "
            "(6) Kınama: Astım/bronşit veya nefes darlığı çeken insanlarla alay etmek, onları kınamak. "
            "Şifa için: Hayata ve nefese yönelik isyan/küfür sözlerinden tövbe, boğma–duman–soğukta zulüm helalleşmesi, ağaç dikme adağının yerine getirilmesi, adak eti ve ciğere yönelik beddualardan helalleşme."
        )
    },
    
    {
        "name": "Bağırsak Kanseri",
        "category": "Onkolojik/Sindirim",
        "symptoms": ["bağırsak kanseri", "kolon kanseri", "bağırsak tümörü"],
        "causes": ["faiz", "beddua", "lanet", "miras_laneti", "haram_kazanc", "hak_haram"],
        "description": "Faiz günahı, beddua, lanet, miras laneti, haksız kazanç, hak haramlığı."
    },
    
    {
        "name": "Basur (Hemoroid)",
        "category": "Sindirim",
        "symptoms": ["basur", "hemoroid", "makat kanaması"],
        "causes": ["faiz", "beddua", "lanet", "miras_laneti", "haram_kazanc", "hak_haram"],
        "description": "Faiz günahı, beddua, lanet, miras laneti, haksız kazanç, hak haramlığı."
    },
    
    {
        "name": "Bağırsak Hastalıkları",
        "category": "Sindirim",
        "symptoms": ["bağırsak rahatsızlığı", "kabızlık", "ishal", "bağırsak iltihabı"],
        "causes": ["faiz", "beddua", "lanet", "miras_laneti", "haram_kazanc", "hak_haram"],
        "description": "Faiz günahı, beddua, lanet, miras laneti, haksız kazanç, hak haramlığı."
    },
    
    {
        "name": "Beyin Tümörü",
        "category": "Onkolojik/Nörolojik",
        "symptoms": ["beyin tümörü", "kafa tümörü", "beyinde kitle", "şiddetli baş ağrısı"],
        "causes": ["hayrat_mali", "zulum_insan", "zekat"],
        "description": "Hayrat malı yeme, kafaya vurarak yapılan zulüm, zekâtsızlık."
    },
    
    {
        "name": "Böbrek Rahatsızlıkları",
        "category": "Üriner",
        "symptoms": ["böbrek yetmezliği", "böbrek rahatsızlığı", "böbrek ağrısı"],
        "causes": ["zekat", "beddua"],
        "description": "Kendi veya soyunun vermediği zekât (özellikle tarla zekâtı), kana ve suya edilen beddualar."
    },
    
    {
        "name": "Böbrek Taşı",
        "category": "Üriner",
        "symptoms": ["böbrek taşı", "idrar yolu taşı", "böbrekte kum"],
        "causes": ["zekat", "beddua"],
        "description": "Kendi veya soyunun vermediği zekât (özellikle tarla zekâtı), kana ve suya edilen beddualar."
    },
    
    {
        "name": "Boyun Düzleşmesi",
        "category": "Ortopedik",
        "symptoms": ["boyun düzleşmesi", "servikal düzleşme", "boyun ağrısı"],
        "causes": ["yetim_hakki"],
        "description": "Yetime zulüm."
    },
    
    {
        "name": "Boyun Fıtığı",
        "category": "Ortopedik",
        "symptoms": ["boyun fıtığı", "servikal fıtık", "boyun ağrısı"],
        "causes": ["yetim_hakki"],
        "description": "Yetime zulüm."
    },
    
    {
        "name": "Burun Tıkanıklığı",
        "category": "KBB",
        "symptoms": ["burun tıkanıklığı", "burun akıntısı", "nefes alamama"],
        "causes": ["suda_bogma", "beddua", "adak_hayvan"],
        "description": "Kediyi veya başka hayvanları suda boğma. 'Nefesin kesilsin, ağzın burnun tıkansın' bedduası. Büyükbaş hayvan adakları."
    },
    
    {
        "name": "Sinüzit",
        "category": "KBB",
        "symptoms": ["sinüzit", "burun tıkanıklığı", "yüz ağrısı"],
        "causes": ["suda_bogma", "beddua", "adak_hayvan"],
        "description": "Kediyi veya başka hayvanları suda boğma. 'Nefesin kesilsin, ağzın burnun tıkansın' bedduası. Büyükbaş hayvan adakları."
    },
    
    {
        "name": "Cam Kemik Hastalığı",
        "category": "Genetik/Kemik",
        "symptoms": ["cam kemik", "kolay kırılan kemikler", "kemik kırılganlığı"],
        "causes": ["cocuk_oldurme"],
        "description": "Bebekken çocukların kemiklerini kırarak öldürme zulmü."
    },
    
    {
        "name": "Ciğer Rahatsızlıkları",
        "category": "İç Hastalık",
        "symptoms": ["ciğer rahatsızlığı", "akciğer problemi", "karaciğer sorunu"],
        "causes": ["beddua", "adak_eti"],
        "description": "Ciğere okunan beddualar, adak hayvanının ciğerini yemek."
    },
    
    {
        "name": "Zatürre",
        "category": "Solunum",
        "symptoms": ["zatürre", "pnömoni", "akciğer iltihabı"],
        "causes": ["beddua", "adak_eti"],
        "description": "Ciğere okunan beddualar, adak hayvanının ciğerini yemek."
    },
    
    {
        "name": "Cilt Kuruluğu",
        "category": "Dermatolojik",
        "symptoms": ["cilt kuruluğu", "kuru cilt", "ciltte çatlama"],
        "causes": ["adak_eylem"],
        "description": "Ağaç dikme adağının yerine getirilmemesi."
    },
    
    {
        "name": "Çıban / Abse Yaraları",
        "category": "Dermatolojik",
        "symptoms": ["çıban", "apse", "abse", "deri yaraları", "iltihaplı yara", "furonkül"],
        "causes": ["zulum_insan", "zulum_anne_baba", "zulum_hayvan"],
        "description": (
            "Abse ve çıban yaraları, kişinin kendisinin veya soyunun geçmişte yaptığı fiziksel zulümlerle doğrudan ilişkilidir. "
            "(1) Zulmün Yansıması: Kişi veya atası, bir insanın veya hayvanın vücudunun neresine vurduysa veya neresine silah sıktıysa, çıbanlar genellikle o bölgede çıkar. Bu durum 'sen bu bölgeye vurarak zulmettin' şeklinde manevi bir işarettir. "
            "(2) Anne ve Babaya Vurma: Anne ve babaya fiziksel şiddet uygulanması da vücutta bu tür yaraların çıkmasına sebep olabilmektedir. "
            "Şifa için: Vurma/silah sıkma yapılan kişi-bölge tespit edilerek helalleşme; anne-babaya el-kol kaldırma için tövbe ve helalleşme."
        )
    },
    
    {
        "name": "Çölyak Hastalığı",
        "category": "Sindirim/Otoimmün",
        "symptoms": ["çölyak", "glüten alerjisi", "glüten intoleransı", "buğday hassasiyeti"],
        "causes": ["adak_eylem", "tarla_yakma"],
        "description": "Un ve buğday dağıtma adağı, buğday tarlalarını yakma zulmü."
    },
    
    {
        "name": "Glüten Alerjisi",
        "category": "Alerji/Sindirim",
        "symptoms": ["glüten alerjisi", "buğday alerjisi", "un alerjisi"],
        "causes": ["adak_eylem", "tarla_yakma"],
        "description": "Un ve buğday dağıtma adağı, buğday tarlalarını yakma zulmü."
    },
    
    {
        "name": "Dalak Şişmesi",
        "category": "İç Hastalık",
        "symptoms": ["dalak şişmesi", "splenomegali", "dalak büyümesi"],
        "causes": ["beddua", "zulum_insan"],
        "description": "Kendi veya soydan okunan 'Dalağın şişsin, patlasın' bedduaları, zulüm ile ah alma."
    },
    
    {
        "name": "Damar Tıkanıklığı",
        "category": "Kardiyovasküler",
        "symptoms": ["damar tıkanıklığı", "ateroskleroz", "tromboz"],
        "causes": ["beddua", "zekat"],
        "description": "Damara okunan beddualar ('Damarın tıkansın'), altın zekâtının verilmemesi."
    },
    
    {
        "name": "Varis",
        "category": "Kardiyovasküler",
        "symptoms": ["varis", "bacak varisi", "toplardamar genişlemesi"],
        "causes": ["beddua", "zekat"],
        "description": "Damara okunan beddualar ('Damarın tıkansın'), altın zekâtının verilmemesi."
    },
    
    {
        "name": "Deri Kanseri",
        "category": "Onkolojik/Dermatolojik",
        "symptoms": ["deri kanseri", "cilt kanseri", "melanom"],
        "causes": ["adak_eti", "zekat", "kinama", "adak_eylem", "hayrat_mali"],
        "description": "Adak eti yemek, verilmeyen veya eksik verilen zekât, kınama zulmü, çocuk giydirme/sevindirme adakları, hayrat derisi gasp edip yeme."
    },
    
    {
        "name": "Deri Hastalıkları",
        "category": "Dermatolojik",
        "symptoms": ["deri hastalığı", "cilt problemi", "deri döküntüsü"],
        "causes": ["adak_eti", "zekat", "kinama", "adak_eylem", "hayrat_mali"],
        "description": "Adak eti yemek, verilmeyen veya eksik verilen zekât, kınama zulmü, çocuk giydirme/sevindirme adakları, hayrat derisi gasp edip yeme."
    },
    
    {
        "name": "Dil Felci",
        "category": "Nörolojik",
        "symptoms": ["dil felci", "dil tutulması", "konuşamama"],
        "causes": ["kufur", "iftira", "beddua"],
        "description": "Küfür, yalan, lanet, beddua okumak, masuma iftira atmak, inkâr sözleri. 'Dilin tutulsun' bedduası."
    },
    
    {
        "name": "Diş Çürümesi",
        "category": "Dental",
        "symptoms": ["diş çürümesi", "diş çürüğü", "çürük diş"],
        "causes": ["zulum_insan", "haram_kazanc", "kinama", "adak_eti", "zulum_anne_baba", "beddua"],
        "description": "İnsanların dişlerine vurarak kırma, haram yeme, dişi çürüyenleri kınama, adak etini yeme, anne babayı ısırma, dişe ve kemiğe beddua."
    },
    
    {
        "name": "Diş Dökülmesi",
        "category": "Dental",
        "symptoms": ["diş dökülmesi", "diş kaybı"],
        "causes": ["zulum_insan", "haram_kazanc", "kinama", "adak_eti", "zulum_anne_baba", "beddua"],
        "description": "İnsanların dişlerine vurarak kırma, haram yeme, dişi çürüyenleri kınama, adak etini yeme, anne babayı ısırma, dişe ve kemiğe beddua."
    },
    
    {
        "name": "Diyabet (Şeker Hastalığı)",
        "category": "Endokrin",
        "symptoms": ["diyabet", "şeker hastalığı", "yüksek şeker", "kan şekeri yüksekliği"],
        "causes": ["zekat", "kinama", "beddua", "miras_laneti", "adak_eylem", "adak_eti"],
        "description": "Verilmeyen veya eksik verilen zekât, kınama, beddua, miras/soy laneti, 'Şeker bana haram olsun' sözü, şeker/tatlı dağıtma adakları, bolca yenilmiş hayvan adakları."
    },
    
    {
        "name": "Down Sendromu",
        "category": "Genetik",
        "symptoms": ["down sendromu", "genetik bozukluk", "gelişimsel gecikme"],
        "causes": ["zekat", "isyan", "adak_hayvan", "adak_eti", "haramzade"],
        "description": "Eksik zekât, Allah'a isyan ve iftiralar, çok fazla küçükbaş/büyükbaş adak, adak eti yemek, haramzade olmak, 'Çocuğum olsun da nasıl olursa olsun' sözü."
    },
    
    {
        "name": "Egzama",
        "category": "Dermatolojik",
        "symptoms": ["egzama", "dermatit", "cilt tahrişi", "kaşıntı"],
        "causes": ["adak_eti", "zekat", "zulum_insan"],
        "description": "Yenmiş adak eti, zekât, zulüm."
    },
    
    {
        "name": "Ensafalit Lethargica",
        "category": "Nörolojik/Nadir",
        "symptoms": ["ensefalit", "uyku hastalığı", "letarji"],
        "causes": ["adak_hayvan"],
        "description": "Erkekte çok fazla dişi adak (5-6 tane), kadında çok fazla erkek adak, koyun adaklarının çokluğu."
    },
    
    {
        "name": "Epilepsi (Sara)",
        "category": "Nörolojik",
        "symptoms": ["epilepsi", "sara", "nöbet", "kasılma"],
        "causes": ["zekat", "insan_oldurme", "kinama", "beddua", "alim_evliya_zulum", "adak_eylem"],
        "description": "Eksik zekât, soydan insan öldürme (özellikle güneşte bekleterek), kınama, beddua, Kur'an talebelerine/alimlere zulüm, 'Çocuğum düşmezse...' adağı, zehirleyerek öldürme."
    },
    
    {
        "name": "Ergenlik Sivilceleri",
        "category": "Dermatolojik",
        "symptoms": ["sivilce", "akne", "ergenlik sivilcesi"],
        "causes": ["adak_hayvan", "zekat", "kinama"],
        "description": "Erkekte koyun adağı, kadında koç adağı, verilmeyen veya eksik verilen zekât, sivilceli insanları kınama, 'Sakal bırakacağım' adağı."
    },
    
    {
        "name": "Felç İnmesi",
        "category": "Nörolojik",
        "symptoms": ["felç", "inme", "vücut tutmaz", "paraliz"],
        "causes": ["zulum_insan", "beddua", "lanet", "adak_eylem", "sirk", "isyan", "zekat", "zulum_hayvan"],
        "description": "Başkalarına yapılan zulüm, beddua, lanet, adak, şirk, isyan, aşırı zekâtsızlık, hayvana zulüm/yakma."
    },
    
    {
        "name": "Göbek Düşmesi",
        "category": "Jinekolojik",
        "symptoms": ["göbek düşmesi", "rahim düşmesi"],
        "causes": ["hamile_zulum"],
        "description": "Hamile kadının karnına vurarak çocuk düşürme, hamileye hakaret, taciz ve zulüm."
    },
    
    {
        "name": "Sebepsiz Kusma",
        "category": "Sindirim",
        "symptoms": ["kusma", "mide bulantısı", "sebepsiz kusma"],
        "causes": ["hamile_zulum"],
        "description": "Hamile kadının karnına vurarak çocuk düşürme, hamileye hakaret, taciz ve zulüm."
    },
    
    {
        "name": "Göğüs Sarkması",
        "category": "Fiziksel",
        "symptoms": ["göğüs sarkması", "meme sarkması"],
        "causes": ["zulum_insan", "insan_oldurme"],
        "description": "Göğüsleri/göğüs uçlarını keserek ve kopararak yapılan zulüm ve öldürme."
    },
    
    {
        "name": "Göğüs Kanseri",
        "category": "Onkolojik",
        "symptoms": ["göğüs kanseri", "meme kanseri"],
        "causes": ["zulum_insan", "hayrat_mali", "isyan", "soy_laneti", "zekat"],
        "description": "Göğse şiş batırma/hançerleme, hayrat malı yeme, hayata isyan, soy laneti, zekâtsızlık."
    },
    
    {
        "name": "Meme Kanseri",
        "category": "Onkolojik",
        "symptoms": ["meme kanseri", "göğüs kitlesi"],
        "causes": ["zulum_insan", "hayrat_mali", "isyan", "soy_laneti", "zekat"],
        "description": "Göğse şiş batırma/hançerleme, hayrat malı yeme, hayata isyan, soy laneti, zekâtsızlık."
    },
    
    {
        "name": "Göz Altı Morluğu",
        "category": "Oftalmolojik",
        "symptoms": ["göz altı morluğu", "göz altı halkaları", "morluk"],
        "causes": ["lanet", "zulum_insan", "zekat", "insan_oldurme", "hak_haram"],
        "description": "Lanet okumak, göze zulüm, zekât, soydan cinayetler, alınan ahlar ve kul hakları."
    },
    
    {
        "name": "Göz Kanlanması",
        "category": "Oftalmolojik",
        "symptoms": ["göz kanlanması", "kırmızı göz", "gözde kızarıklık"],
        "causes": ["beddua", "adak_eylem", "adak_hayvan"],
        "description": "Göze okunan beddualar, hatim ve Yasin okuma adakları, normal hayvan adakları."
    },
    
    {
        "name": "Göz Hastalıkları",
        "category": "Oftalmolojik",
        "symptoms": ["göz hastalığı", "görme kaybı", "miyop", "hipermetrop"],
        "causes": ["adak_eylem", "kinama", "zulum_insan", "beddua", "zekat", "zina_ensest"],
        "description": "Kur'an/Yasin okuma adağı, kör insanı kınama, göze zulüm, 'Gözün kör olsun' bedduaları, zekâtsızlık, göz zinası."
    },
    
    {
        "name": "Körlük",
        "category": "Oftalmolojik",
        "symptoms": ["körlük", "görme kaybı", "kör olma"],
        "causes": ["adak_eylem", "kinama", "zulum_insan", "beddua", "zekat", "zina_ensest"],
        "description": "Kur'an/Yasin okuma adağı, kör insanı kınama, göze zulüm, 'Gözün kör olsun' bedduaları, zekâtsızlık, göz zinası."
    },
    
    {
        "name": "Miyop",
        "category": "Oftalmolojik",
        "symptoms": ["miyop", "yakını görememe", "görme bozukluğu"],
        "causes": ["adak_eylem", "kinama", "zulum_insan", "beddua", "zekat"],
        "description": "Kur'an/Yasin okuma adağı, kör insanı kınama, göze zulüm, 'Gözün kör olsun' bedduaları, zekâtsızlık."
    },
    
    {
        "name": "Tavukkarası (Gece Körlüğü)",
        "category": "Oftalmolojik",
        "symptoms": ["tavukkarası", "gece körlüğü", "gece görememe"],
        "causes": ["adak_eylem"],
        "description": "'Her gece Yasin okuyacağım' adağı tavukkarası göz hastalığına sebep olur."
    },
    
    {
        "name": "İç Organların Yanması",
        "category": "Genel",
        "symptoms": ["iç yanma", "organ yanması", "içten yanma hissi"],
        "causes": ["beddua", "isyan"],
        "description": "'İçin yansın, bağrın yansın' bedduaları ve isyan."
    },
    
    {
        "name": "Kendiliğinden Yanma",
        "category": "Nadir",
        "symptoms": ["spontan yanma", "kendiliğinden tutuşma"],
        "causes": ["beddua", "isyan"],
        "description": "'İçin yansın, bağrın yansın' bedduaları ve isyan."
    },
    
    {
        "name": "Kalbi Delik Doğan Çocuklar",
        "category": "Kardiyak/Doğumsal",
        "symptoms": ["kalp deliği", "doğumsal kalp hastalığı", "VSD", "ASD"],
        "causes": ["beddua", "kufur", "zulum_insan", "zekat", "adak_eylem"],
        "description": "Kalp kırma, 'Kalbinden vurulasın/delik deşik olasın' bedduaları, Müslümanlara 'kâfir/gâvur' demek, 'Kalbin dursun/ölsün' bedduası, çocuğu istememek, soydan silahla kalp vurma cinayeti, zekât, adak."
    },
    
    {
        "name": "Kalp Ritmi Bozukluğu",
        "category": "Kardiyak",
        "symptoms": ["kalp ritmi bozukluğu", "aritmi", "çarpıntı"],
        "causes": ["zulum_anne_baba", "isyan", "kinama", "miras_laneti"],
        "description": "Anne-baba hukukunu çiğneme, isyan (kadere rızasızlık, şükürsüzlük), Müslümanları eleştirmek, miras laneti ('Zehir zıkkım olsun' sözü)."
    },
    
    {
        "name": "Kalp Çarpıntısı",
        "category": "Kardiyak",
        "symptoms": ["kalp çarpıntısı", "taşikardi", "palpitasyon"],
        "causes": ["zulum_anne_baba", "isyan", "kinama", "miras_laneti"],
        "description": "Anne-baba hukukunu çiğneme, isyan (kadere rızasızlık, şükürsüzlük), Müslümanları eleştirmek, miras laneti ('Zehir zıkkım olsun' sözü)."
    },
    
    {
        "name": "Kamburluk",
        "category": "Ortopedik",
        "symptoms": ["kamburluk", "kifoz", "sırt eğriliği"],
        "causes": ["zulum_anne_baba", "adak_hayvan", "yetim_hakki"],
        "description": "Anne babanın sırtına/kafasına vurmak, deve adağı, yetime zulüm."
    },
    
    {
        "name": "Skolyoz",
        "category": "Ortopedik",
        "symptoms": ["skolyoz", "omurga eğriliği", "sırt sorunu"],
        "causes": ["zulum_anne_baba", "adak_hayvan", "yetim_hakki"],
        "description": "Anne babanın sırtına/kafasına vurmak, deve adağı, yetime zulüm."
    },
    
    {
        "name": "Kan Kanseri (Lösemi)",
        "category": "Onkolojik/Hematolojik",
        "symptoms": ["lösemi", "kan kanseri", "kemik iliği kanseri"],
        "causes": ["adak_eylem", "adak_eti", "zekat", "beddua", "zulum_insan"],
        "description": "Kan akıtma sözü/adağı, adak eti yeme, eksik zekât ('zekâtçı'), 'Kanın kurusun/kanser olasın' bedduaları, zulümle kan akıtma."
    },
    
    {
        "name": "Kas Erimesi",
        "category": "Nörolojik/Kas",
        "symptoms": ["kas erimesi", "kas zayıflığı", "kas kaybı", "atrofi"],
        "causes": ["zulum_anne_baba", "hasta_zulum", "beddua", "zina_ensest"],
        "description": "Anne babaya/hastalara/engellilere yapılan zulüm ve öldürme (mezarcı), 'Kasların erisin' bedduası, tacizle alınan beddua."
    },
    
    {
        "name": "Kas Zayıflığı",
        "category": "Nörolojik/Kas",
        "symptoms": ["kas zayıflığı", "güçsüzlük", "halsizlik"],
        "causes": ["zulum_anne_baba", "hasta_zulum", "beddua", "zina_ensest"],
        "description": "Anne babaya/hastalara/engellilere yapılan zulüm ve öldürme (mezarcı), 'Kasların erisin' bedduası, tacizle alınan beddua."
    },
    
    {
        "name": "Kelebek Hastalığı",
        "category": "Dermatolojik",
        "symptoms": ["kelebek hastalığı", "lupus", "yüzde kızarıklık"],
        "causes": ["adak_eylem", "zulum_anne_baba", "beddua"],
        "description": "Kelle paça adağı, anne babaya zulüm edip dövme/beddua alma, un/ekmek/bulgur dağıtma adağı."
    },
    
    {
        "name": "Kekemelik",
        "category": "Konuşma",
        "symptoms": ["kekemelik", "konuşma bozukluğu", "takılma"],
        "causes": ["beddua", "adak_hayvan", "kinama"],
        "description": "Zulümle alınan ah ve beddualar ('Çenen batsın/sussun'), hindi, tavuk, horoz, kaz adakları, peltek insanları kınama."
    },
    
    {
        "name": "Dilde Pelteklik",
        "category": "Konuşma",
        "symptoms": ["pelteklik", "S harfi zorluğu", "konuşma güçlüğü"],
        "causes": ["beddua", "adak_hayvan", "kinama"],
        "description": "Zulümle alınan ah ve beddualar ('Çenen batsın/sussun'), hindi, tavuk, horoz, kaz adakları, peltek insanları kınama."
    },
    
    {
        "name": "Kellik",
        "category": "Dermatolojik",
        "symptoms": ["kellik", "saç dökülmesi", "kel"],
        "causes": ["adak_eylem", "kinama", "beddua", "zulum_insan", "yetim_hakki", "zulum_anne_baba"],
        "description": "Yerine getirilmeyen adak, kel insanı kınama/dalga geçme, 'Saçın dökülsün, kel kalasın' bedduası, saçı yolarak zulmetme, yetimi dövme, anne babanın kafasına vurma."
    },
    
    {
        "name": "Saç Dökülmesi",
        "category": "Dermatolojik",
        "symptoms": ["saç dökülmesi", "alopesi", "saç kaybı"],
        "causes": ["adak_eylem", "kinama", "beddua", "zulum_insan", "yetim_hakki", "zulum_anne_baba"],
        "description": "Yerine getirilmeyen adak, kel insanı kınama/dalga geçme, 'Saçın dökülsün, kel kalasın' bedduası, saçı yolarak zulmetme, yetimi dövme, anne babanın kafasına vurma."
    },
    
    {
        "name": "Kemik Erimesi",
        "category": "Kemik",
        "symptoms": ["kemik erimesi", "osteoporoz", "kemik zayıflığı"],
        "causes": ["adak_eti", "beddua", "zulum_insan"],
        "description": "Adak etini yeme veya kemiklerini kaynatıp suyunu içme, zulümle alınan ah, 'İliğin kemiğin kurusun' bedduası."
    },
    
    {
        "name": "Kolera",
        "category": "Enfeksiyon",
        "symptoms": ["kolera", "şiddetli ishal", "kusma"],
        "causes": ["zina_ensest", "soy_laneti", "haramzade", "faiz"],
        "description": "Büyük zina (evliyken), soy laneti, haramzade olmak, faiz günahı."
    },
    
    {
        "name": "Kramplar",
        "category": "Kas",
        "symptoms": ["kramp", "kas krampı", "çekme"],
        "causes": ["zulum_insan", "adak_eylem", "zekat", "beddua"],
        "description": "İnsan ve hayvanları el/ayaklarından asarak zulmetme, adak enerjisi, eksik zekât, ete/kemiğe/damara okunan lanet ve beddualar."
    },
    
    {
        "name": "Kuduz",
        "category": "Enfeksiyon",
        "symptoms": ["kuduz", "rabies", "hayvan ısırığı hastalığı"],
        "causes": ["zulum_hayvan"],
        "description": "Soyda hayvana zulmün aşırı derecede olması."
    },
    
    {
        "name": "Ön Çapraz Bağ Zedelenmesi / Menisküs / Diz Bağ Sorunları",
        "category": "Ortopedik",
        "symptoms": [
            "menisküs", "ön çapraz bağ", "çapraz bağ", "diz bağı", "diz yırtığı",
            "dizde yırtık", "diz sorunu", "diz ağrısı", "diz tutulması",
            "diz kapağı", "diz bağ kopması", "öçb", "acl"
        ],
        "causes": [
            "savastan_kacma", "zulum_anne_baba", "adak_hayvan", "soz_tutmama",
            "beddua", "kiz_kacirma", "adak_eylem"
        ],
        "description": (
            "Diz bölgesini etkileyen rahatsızlıklar (ön çapraz bağ zedelenmesi, menisküs yırtığı, diz bağ ve eklem sorunları) Tıbb-ul Furkan ilmine göre kişinin kendisinin veya atalarının işlediği belirli günahlar, zulümler ve yerine getirilmemiş adaklar ile ilişkilendirilir. Temel manevi sebepler şunlardır: "
            "(1) Savaştan Kaçma ve Hainlik: Soyda veya kişinin kendisinde savaştan kaçma, vatan hainliği yapma veya insanların yerinden yurdundan olmasına sebep olma eylemleri (özellikle menisküs ve benzeri yırtıkların en önemli sebebidir). "
            "(2) Anne ve Babaya Yapılan Zulümler: Yaşlı anne ve babanın dizlerine veya ayaklarına vurmak, onları fiziksel olarak incitmek veya bakıma muhtaç olduklarında onları terk ederek yol gözletmek dizlerde manevi 'ruhsat' (hasar) oluşturur. "
            "(3) Yerine Getirilmeyen Adaklar: Deve adağı (kendisinin veya atalarının bir deve adayıp da yerine getirmemesi veya zengin olduğu halde adak etinden yemesi); Allah yolunda 'yürüyeceğim' deyip yürümemek, türbe ziyareti veya umre adayıp bu sözü tutmamak (diz kapaklarında ve bağlarında kilitlenmelere sebep olur). "
            "(4) Beddualar ve Ahlar: Birine dizle vurarak zulmetmek veya birinin bacağını kırarak ahını almak. 'Dizlerin sızlasın', 'Dizlerin tutmaz olsun', 'Dizlerin bükülmesin' gibi edilen veya alınan beddualar bağların zayıflamasına ve zedelenmesine yol açar. "
            "(5) Kız Kaçırma: Soyda veya kişinin hayatında bulunan kız kaçırma eylemi de dizlere yerleşen manevi yükler arasındadır. "
            "Şifa için: Soyda ve kişide savaştan kaçma/hainlik, anne-babaya diz/ayak zulmü, terk etme; ödenmemiş deve adağı, yürüyüş–türbe–umre sözleri, kız kaçırma ve dize yönelik beddualar tek tek tespit edilip tövbe ve adak iadesi yapılır."
        )
    },
    
    {
        "name": "Kulak Duymaması (İşitme Kaybı, Sağırlık)",
        "category": "Kulak",
        "symptoms": [
            "kulak duymaması", "kulak duymuyor", "işitme kaybı", "isitme kaybi",
            "sağırlık", "sagirlik", "duymama", "kulak rahatsızlığı",
            "kulak zarı patlaması", "kulak iltihabı", "kulak ağrısı", "işitme güçlüğü"
        ],
        "causes": [
            "zulum_anne_baba", "yetim_hakki", "zulum_hayvan", "zulum_insan",
            "iftira", "kinama", "beddua"
        ],
        "description": (
            "Tıbb-ul Furkan ilmine göre kulak duymaması, işitme kayıpları ve kulakla ilgili rahatsızlıkların temelinde kişinin kendisinin veya soyunun işlediği belirli zulümler, yanlış davranışlar ve alınan beddualar yatmaktadır. Manevi sebepler: "
            "(1) Fiziksel Zulümler: Geçmişte veya soyda; anne, baba, yetim, yaşlı veya hayvanların kulaklarına vurmak, kulaklarına şiş/mil/bıçak sokmak, kulaklarını çekip koparmak veya kulak zarlarını patlatmak gibi işkenceler yapılması. Kulaklara mum tıkamak veya asit, kurşun, kaynar su gibi maddeler dökmek de bu ruhsatlar arasındadır. "
            "(2) Sessiz Kalma ve Onaylama (Kulak Misafirliği): Dine, kitaba sövüldüğünde veya gıybet, kınama, iftira yapıldığında buna şahit olup sessiz kalmak. "
            "(3) Sözlü Zulüm ve Sesle Taciz: İnsanlara veya hayvanlara yüksek sesle bağırarak zulmetmek, gürültü yaparak rahatsızlık vermek. "
            "(4) Beddualar ve Ahlar: 'Kulakların çınlasın', 'Kulağın duymaz olsun', 'Kulağının zarı patlasın', 'Kulağın tıkansın/aksın' gibi edilen veya alınan beddualar kulaklarda manevi kilitler oluşturur. "
            "(5) Kınama ve Alay Etme: Sağır olan veya işitme güçlüğü çeken insanlarla alay etmek, onları kınamak. Özellikle anne ve babanın yaşlılıktan dolayı duymamasına veya yüksek sesle konuşmasına kızmak, onları bu durumdan dolayı azarlamak veya beddua etmek kulak sağlığını doğrudan etkileyen büyük günahlardan biri olarak sayılır. "
            "Şifa için: Kulak zulümleri (anne–baba–yetim–hayvan), gıybet/iftiraya sessiz kalma, kulağa edilen/alınan beddualar ve sağır/işitme güçlüğü çekenlerle alay tespit edilip helalleşme ve tövbe yapılır."
        )
    },
    
    {
        "name": "Safra Kesesi (Taş, İltihap, Hastalıkları)",
        "category": "Sindirim",
        "symptoms": [
            "safra kesesi", "safra taşı", "safra kesesi taşı", "kolesistit",
            "safra iltihabı", "safra yolu", "safra ağrısı", "safra"
        ],
        "causes": [
            "zekat", "beddua", "miras_laneti", "haram_kazanc", "hak_haram",
            "adak_eti", "adak_hayvan"
        ],
        "description": (
            "Safra kesesi rahatsızlıklarının (taş, iltihap, kum birikmesi) manevi sebepleri Tıbb-ul Furkan ilminin temel ilkeleri ve organlardaki taş oluşumu / karaciğer bağlantısı üzerinden açıklanır: "
            "(1) Taş Oluşumu ve Tarla Zekâtı: Kişinin kendisinin veya atasının sahip olduğu tarlanın zekâtını vermemesi, o tarlanın taş ve toprağının manevi bir yansıma olarak vücutta (böbrek, safra kesesi vb.) taş oluşmasına neden olur. 'Tarla, taş ve toprak olduğu için genelde organlarda taş ve toprak sıkıntısına sebep olabilmektedir.' "
            "(2) Beddualar ve 'Taş' İle İlgili Sözler: 'Midene, böbreğine taş otursun', 'Yediğin taş olsun' gibi beddualar sindirim sistemi ve ona bağlı organlarda (mide, safra kesesi, böbrek) taş oluşmasına manevi bir ruhsat oluşturur. Kefareti için 'Yediğin İçtiğinden Hayır Gör Niyeti' uygulaması tavsiye edilir. "
            "(3) Zekât ve Genel Organ Rahatsızlıkları: Zekât ruhsatı vücudun patronudur ve tüm hastalıkların temelidir. Soydan gelen yüksek zekât borçları vücudun en zayıf noktasında hastalık başlatabilir. Haram lokma ve miras malları üzerindeki hak haramlıkları veya haksız kazançlar, karaciğer ve sindirim sistemine bağlı organlarda (safra kesesi dahil) rahatsızlıklara yol açabilir. "
            "(4) Karaciğer ve Adak Bağlantısı: Safra kesesi karaciğer ile doğrudan bağlantılı bir organ olduğu için ciğere yönelik 'Ciğerin şişsin, patlasın' gibi beddualar ve adak hayvanının ciğerinin yenmesi safra yollarını da etkileyebilir. "
            "Şifa için: Tarla zekâtı borçlarını araştır, soydan gelen miras ve mal beddualarına karşı tövbe et, varsa adak borçlarını (özellikle büyükbaş veya yenmiş adaklar) tespit ettirip yerine getir; yenmiş adak eti ve 'taş olsun' tipi bedduaların helalleşmesi yapılır."
        )
    },
    
    {
        "name": "Menisküs",
        "category": "Ortopedik",
        "symptoms": ["menisküs yırtığı"],
        "causes": ["savastan_kacma"],
        "description": "Savaştan kaçma ve hainlik. (Detaylı sebepler için 'Ön Çapraz Bağ Zedelenmesi / Menisküs / Diz Bağ Sorunları' kaydına bakınız.)"
    },
    
    {
        "name": "Mide Kanseri",
        "category": "Onkolojik",
        "symptoms": ["mide kanseri", "mide tümörü"],
        "causes": ["zekat", "zulum_insan", "adak_eti"],
        "description": "Soy zekâtı, karından bıçaklama zulmü, yenmiş adakların çokluğu."
    },
    
    {
        "name": "Mide Ülseri",
        "category": "Sindirim",
        "symptoms": ["mide ülseri", "ülser", "mide yanması"],
        "causes": ["zekat", "zulum_insan", "adak_eti"],
        "description": "Soy zekâtı, karından bıçaklama zulmü, yenmiş adakların çokluğu."
    },
    
    {
        "name": "Moebius Sendromu (Yüz Felci)",
        "category": "Nörolojik/Nadir",
        "symptoms": ["yüz felci", "moebius sendromu", "mimik kaybı"],
        "causes": ["beddua", "zulum_anne_baba", "yetim_hakki", "miras_laneti", "kinama"],
        "description": "Yüze okunan beddualar, anne-babanın veya yetimin yüzüne vurma, miras kavgası, yüzü felçliyi kınamak, anne babanın yüzünü yamsılama (taklit etme)."
    },
    
    {
        "name": "Obezite (Aşırı Kilo)",
        "category": "Metabolik",
        "symptoms": ["obezite", "aşırı kilo", "şişmanlık"],
        "causes": ["adak_eylem", "zekat", "hak_haram", "kinama", "beddua"],
        "description": "İnek, düve, fakir doyurma adakları, harami eşme, verilmeyen veya eksik verilen zekât, hak haramlığı, kınama, beddua."
    },
    
    {
        "name": "Ödem ve Şişlikler",
        "category": "Genel",
        "symptoms": ["ödem", "şişlik", "su tutma"],
        "causes": ["lanet", "beddua"],
        "description": "Suya lanet okumak, 'Şişesin' bedduası."
    },
    
    {
        "name": "Parkinson",
        "category": "Nörolojik",
        "symptoms": ["parkinson", "titreme", "el titremesi"],
        "causes": ["beddua", "zulum_anne_baba", "sirk"],
        "description": "'Elin ayağın batsın' bedduası, anne baba bedduası, şirk, anne babaya el kaldırma."
    },
    
    {
        "name": "Titreme",
        "category": "Nörolojik",
        "symptoms": ["titreme", "tremor", "el titremesi"],
        "causes": ["beddua", "zulum_anne_baba", "sirk"],
        "description": "'Elin ayağın batsın' bedduası, anne baba bedduası, şirk, anne babaya el kaldırma."
    },
    
    {
        "name": "Patlayan Kafa Sendromu",
        "category": "Nörolojik/Nadir",
        "symptoms": ["patlayan kafa sendromu", "kafada patlama hissi", "gece patlama sesi"],
        "causes": ["adak_hayvan"],
        "description": "İki veya üç tane büyükbaş adak bulunması."
    },
    
    {
        "name": "Progeria (Erken Yaşlanma)",
        "category": "Genetik/Nadir",
        "symptoms": ["progerya", "erken yaşlanma", "çocukta yaşlılık belirtileri"],
        "causes": ["zulum_anne_baba", "insan_oldurme", "kinama", "iftira"],
        "description": "Yaşlı bir kimseyi çok döverek zulmetmek, aşağılamak/kınamak, ölmüş birine ağır iftira atmak, anne babayı diri diri toprağa gömmek."
    },
    
    {
        "name": "Prostat Kanseri",
        "category": "Onkolojik/Ürolojik",
        "symptoms": ["prostat kanseri", "prostat tümörü"],
        "causes": ["zekat", "kinama", "adak_eylem"],
        "description": "Soy zekâtı, kınama, su dağıtma ve çeşme yaptırma adakları."
    },
    
    {
        "name": "Romatizma",
        "category": "Romatolojik",
        "symptoms": ["romatizma", "eklem ağrısı", "eklem iltihabı"],
        "causes": ["isyan", "beddua", "zulum_insan", "adak_eylem", "zekat", "zulum_anne_baba"],
        "description": "Yağmura intizar ('Bir bitmedin'), 'Dizin batsın' bedduası, hayata isyan, dizle vurarak zulüm, su adağı, deve adakları, verilmeyen veya eksik verilen zekât, anne babayı soğukta dondurma."
    },
    
    {
        "name": "Bacak Ağrısı",
        "category": "Ortopedik",
        "symptoms": ["bacak ağrısı", "baldır ağrısı"],
        "causes": ["isyan", "beddua", "zulum_insan", "adak_eylem", "zekat", "zulum_anne_baba"],
        "description": "Yağmura intizar ('Bir bitmedin'), 'Dizin batsın' bedduası, hayata isyan, dizle vurarak zulüm, su adağı, deve adakları, verilmeyen veya eksik verilen zekât, anne babayı soğukta dondurma."
    },
    
    {
        "name": "Baldır Ağrısı",
        "category": "Ortopedik",
        "symptoms": ["baldır ağrısı", "baldırda çekme"],
        "causes": ["isyan", "beddua", "zulum_insan", "adak_eylem", "zekat", "zulum_anne_baba"],
        "description": "Yağmura intizar, 'Dizin batsın' bedduası, hayata isyan, dizle vurarak zulüm, su adağı, deve adakları, verilmeyen veya eksik verilen zekât, anne babayı soğukta dondurma."
    },
    
    {
        "name": "Saçkıran",
        "category": "Dermatolojik",
        "symptoms": ["saçkıran", "alopesi areata", "yuvarlak kellik"],
        "causes": ["beddua", "lanet", "isyan", "kinama", "zulum_insan"],
        "description": "Beddua, lanet okumak, kahırlanmak, kınamak, anne babanın veya başkasının saçını yolarak zulmetmek."
    },
    
    {
        "name": "Sandof Hastalığı",
        "category": "Genetik/Nadir",
        "symptoms": ["sandof hastalığı", "lizozomal depo hastalığı"],
        "causes": ["adak_hayvan", "zekat", "zulum_anne_baba"],
        "description": "'Çocuğum olsun kurban keseceğim' adaklarının çokluğu, yüklü zekât borcu, anne baba zulmü ('Çocuklarınız ölsün' bedduası)."
    },
    
    {
        "name": "Sarılık (Bebeklerde)",
        "category": "Pediatrik",
        "symptoms": ["yenidoğan sarılığı", "bebek sarılığı", "sarılık"],
        "causes": ["adak_eylem"],
        "description": "'...doğduğunu görürsem altın takacağım' diyip sözü yerine getirmeme."
    },
    
    {
        "name": "Sedef Hastalığı",
        "category": "Dermatolojik",
        "symptoms": ["sedef", "psoriasis", "deri kabuklanması"],
        "causes": ["adak_eti", "zulum_hayvan", "hayvan_yakma", "beddua"],
        "description": "Adak eti yeme, eşeğe zulüm, köpek ve eşek yakma/kesme/diri diri gömme, 'Derin kurusun' bedduası."
    },
    
    {
        "name": "Serebral Palsi",
        "category": "Nörolojik",
        "symptoms": ["serebral palsi", "beyin felci", "hareket bozukluğu"],
        "causes": ["hasta_zulum", "zulum_anne_baba"],
        "description": "Hasta çocuğa/mahkûma zulüm, yaşlı anne babayı terk etme/aç bırakma ve bedduasını alma."
    },
    
    {
        "name": "SMA",
        "category": "Nörolojik/Genetik",
        "symptoms": ["SMA", "spinal musküler atrofi", "kas erimesi"],
        "causes": ["hasta_zulum", "zulum_anne_baba"],
        "description": "Hasta çocuğa/mahkûma zulüm, yaşlı anne babayı terk etme/aç bırakma ve bedduasını alma."
    },
    
    {
        "name": "MS",
        "category": "Nörolojik",
        "symptoms": ["MS", "multipl skleroz", "sinir sistemi hastalığı"],
        "causes": ["hasta_zulum", "zulum_anne_baba"],
        "description": "Hasta çocuğa/mahkûma zulüm, yaşlı anne babayı terk etme/aç bırakma ve bedduasını alma."
    },
    
    {
        "name": "Ses Kaybı",
        "category": "KBB",
        "symptoms": ["ses kaybı", "afoni", "konuşamama"],
        "causes": ["isyan", "beddua", "lanet"],
        "description": "Aşırı isyan, sese beddua/lanet okuma, 'Sesin kısılsın' bedduası."
    },
    
    {
        "name": "Tansiyon",
        "category": "Kardiyovasküler",
        "symptoms": ["tansiyon", "hipertansiyon", "yüksek tansiyon", "kan basıncı yüksekliği"],
        "causes": ["isyan", "zulum_anne_baba", "zekat", "adak_eylem", "sirk", "beddua"],
        "description": (
            "Tıbb-ul Furkan ilmine göre tansiyon hastalığının (hipertansiyon) temelinde yatan manevi sebepler, kişinin kaderine, imtihanlarına veya çevresine karşı gösterdiği isyan ve yerine getirilmeyen manevi yükümlülüklerdir: "
            "(1) İsyan: Tansiyonun en temel manevi sebebi isyandır. Kişinin başına gelen olaylara, yaşadığı imtihanlara veya hayatın kendisine 'bıktım artık', 'dayanamıyorum', 'neden hep benim başıma geliyor?' diyerek itiraz etmesi tansiyona yol açar. Hatta sabah namazını kaçırdığı için kendisine çok kızarak isyan etmesi dahi tansiyonunun yükselmesine sebep olabilir. "
            "(2) Anne ve Babaya İsyan: İslam'da en büyük günahlardan biri sayılan anne ve babaya karşı gelmek, onlara isyankâr davranmak tansiyonun nedenlerinden biridir. "
            "(3) Zekât ve Adak Borçları: Verilmeyen zekâtlar ve Allah'a verilip de yerine getirilmeyen adak sözleri vücutta bu tür hastalıklara zemin hazırlayan manevi yükler (ruhsatlar) oluşturur. "
            "(4) Şirk: Allah'ın sıfatlarını veya kudretini başkalarına ya da maddelere yüklemek (şirk) tansiyonun manevi kökenleri arasında sayılmaktadır. "
            "(5) Beddua ve Lanet Okumak: Kişinin kendi vücuduna, aklına, beynine veya çevresindekilere okuduğu beddua, küfür ve lanetlerin tansiyon üzerinde doğrudan etkisi olduğu belirtilir. "
            "Şifa için: İsyandan (kadere, imtihanlara, anne-babaya) tövbe edilir; zekât ve adak borçları tespit edilerek ödenir, şirk niteliğindeki bağlılıklardan ve kendine/çevreye edilen beddualardan helalleşme ve tövbe ile arınılır. Zekât ve adak borçlarının tespit edilerek ödenmesi şifa kapısını açan önemli bir adımdır."
        )
    },
    
    {
        "name": "Tırnak Mantarı",
        "category": "Dermatolojik",
        "symptoms": ["tırnak mantarı", "onikomikoz"],
        "causes": ["zulum_insan", "zulum_hayvan"],
        "description": "Tırnakları kopararak yapılan zulüm, ayak tırnaklarını kırma, at ve eşeklerin tırnaklarına zulüm."
    },
    
    {
        "name": "Tırnak Hastalıkları",
        "category": "Dermatolojik",
        "symptoms": ["tırnak hastalığı", "tırnak bozukluğu"],
        "causes": ["zulum_insan", "zulum_hayvan"],
        "description": "Tırnakları kopararak yapılan zulüm, ayak tırnaklarını kırma, at ve eşeklerin tırnaklarına zulüm."
    },
    
    {
        "name": "Uyuz Hastalığı",
        "category": "Dermatolojik/Enfeksiyon",
        "symptoms": ["uyuz", "scabies", "kaşıntı"],
        "causes": ["adak_eylem", "adak_eti", "kinama"],
        "description": "Fakir giydirme/yıkama adağı, adak eti yemek, uyuz insanları kınamak."
    },
    
    {
        "name": "Vampir Sendromu (Güneşe Çıkamama)",
        "category": "Dermatolojik/Nadir",
        "symptoms": ["güneş hassasiyeti", "fotosensitivite", "güneşten kaçma"],
        "causes": ["lanet", "beddua", "zulum_insan"],
        "description": "Güneşe küfür etmek, lanet/beddua okumak, güneşle insanlara eziyet etmek."
    },
    
    {
        "name": "Veba",
        "category": "Enfeksiyon",
        "symptoms": ["veba", "plague"],
        "causes": ["beddua", "zulum_insan"],
        "description": "Okunan beddualar, soydan insanlara hastalık bulaştırma zulmü."
    },
    
    {
        "name": "Vitiligo",
        "category": "Dermatolojik",
        "symptoms": ["vitiligo", "deri renk kaybı", "beyaz lekeler"],
        "causes": ["zulum_insan", "tarla_yakma", "lanet", "kinama"],
        "description": "Ev/tarla/insan/hayvan yakma, güneşe/yağmura lanet, kınama."
    },
    
    {
        "name": "Alaca",
        "category": "Dermatolojik",
        "symptoms": ["alaca", "vitiligo", "renk değişimi"],
        "causes": ["zulum_insan", "tarla_yakma", "lanet", "kinama"],
        "description": "Ev/tarla/insan/hayvan yakma, güneşe/yağmura lanet, kınama."
    },
    
    {
        "name": "Et Beni",
        "category": "Dermatolojik",
        "symptoms": ["et beni", "nevüs", "cilt beni"],
        "causes": ["zulum_insan", "tarla_yakma", "lanet", "kinama"],
        "description": "Ev/tarla/insan/hayvan yakma, güneşe/yağmura lanet, kınama."
    },
    
    {
        "name": "Zayıflama (Aşırı)",
        "category": "Metabolik",
        "symptoms": ["aşırı zayıflık", "kilo kaybı", "zayıflama"],
        "causes": ["adak_eylem", "mezarci"],
        "description": "Fakir doyurma adağı, mezarcı (soydan gelen zulüm enerjisi)."
    },
    
    {
        "name": "Zona",
        "category": "Dermatolojik/Enfeksiyon",
        "symptoms": ["zona", "herpes zoster", "ateşli döküntü"],
        "causes": ["zulum_insan"],
        "description": "İnsan ve hayvanlara zehirli okla zulüm, kaynar suyla veya güneşte bekleterek yakma, sıcak çorba/yemek dökerek yakma (örneğin eşin üstüne)."
    },
    
    # === PSİKOLOJİK, DAVRANIŞSAL VE CİNSEL DURUMLAR ===
    
    {
        "name": "Alis Harikalar Diyarı Sendromu",
        "category": "Nörolojik/Psikiyatrik",
        "symptoms": ["algı bozukluğu", "boyut sapması", "çevre algı bozukluğu"],
        "causes": ["kufur"],
        "description": "Kâinata küfür etmek, tabiata, evlere, yaratılan dünyaya ve içindekilere küfür ve alay etmek."
    },
    
    {
        "name": "Anksiyete",
        "category": "Psikiyatrik",
        "symptoms": ["anksiyete", "kaygı", "endişe"],
        "causes": ["beddua", "miras_laneti", "hak_haram"],
        "description": "Soydan veya akrabaların mal/miras üzerine okudukları beddualar, hak haramlıkları (miras laneti)."
    },
    
    {
        "name": "Aşırı Şehvet",
        "category": "Cinsel/Davranışsal",
        "symptoms": ["aşırı şehvet", "cinsel dürtü fazlalığı"],
        "causes": ["zina_ensest", "adak_hayvan", "zekat", "beddua"],
        "description": "Soydan yapılan tecavüzler, ensest, zekât, erkekte dişi adakların (kadına yönlendirmemesi), kadında erkek adakların çokluğu, lanet ve beddualar."
    },
    
    {
        "name": "Cinsel Sapma (Eşcinsellik)",
        "category": "Cinsel",
        "symptoms": ["cinsel sapma", "eşcinsellik", "hemcinse meyil"],
        "causes": ["zina_ensest", "adak_hayvan", "zekat", "beddua"],
        "description": "Soydan yapılan tecavüzler, ensest, zekât, erkekte dişi adakların (kadına yönlendirmemesi), kadında erkek adakların çokluğu, lanet ve beddualar."
    },
    
    {
        "name": "Bipolar Bozukluk",
        "category": "Psikiyatrik",
        "symptoms": ["bipolar", "manik depresif", "duygudurum bozukluğu"],
        "causes": ["zekat", "adak_eylem", "zulum_anne_baba", "zulum_hayvan"],
        "description": "Verilmeyen veya eksik verilen zekât (özellikle anne babanın vermediği zekât), yerine getirilmeyen adak, anne babaya zulüm (dövme, işkence) ve hayvan zulümleri."
    },
    
    {
        "name": "Cinsel İsteksizlik",
        "category": "Cinsel",
        "symptoms": ["cinsel isteksizlik", "cinsel soğukluk", "libido düşüklüğü"],
        "causes": ["adak_hayvan", "zina_ensest", "kinama", "iftira"],
        "description": "Erkekte dişi hayvan adağı, kadında erkek hayvan adağı, soydan ensest, cinsel soğukluk yaşayanları kınamak, eşler arası soğukluk iftirası."
    },
    
    {
        "name": "Cinsel Soğukluk",
        "category": "Cinsel",
        "symptoms": ["cinsel soğukluk", "eşten soğuma"],
        "causes": ["adak_hayvan", "zina_ensest", "kinama", "iftira"],
        "description": "Erkekte dişi hayvan adağı, kadında erkek hayvan adağı, soydan ensest, cinsel soğukluk yaşayanları kınamak, eşler arası soğukluk iftirası."
    },
    
    {
        "name": "Emmeyen Çocuk",
        "category": "Pediatrik",
        "symptoms": ["emme güçlüğü", "emmeme", "beslenme güçlüğü"],
        "causes": ["hak_haram", "beddua", "haram_kazanc"],
        "description": "Annenin hak haram etmesi, beddua etmesi, haram yeme."
    },
    
    {
        "name": "Ereksiyon Sorunu",
        "category": "Cinsel/Ürolojik",
        "symptoms": ["ereksiyon sorunu", "sertleşme problemi", "iktidarsızlık"],
        "causes": ["beddua", "adak_hayvan", "kinama", "zina_ensest"],
        "description": "Taciz ile alınan beddualar, horoz adakları, organa alınan beddualar, iktidarsızları kınama."
    },
    
    {
        "name": "İktidarsızlık",
        "category": "Cinsel/Ürolojik",
        "symptoms": ["iktidarsızlık", "erektil disfonksiyon"],
        "causes": ["beddua", "adak_hayvan", "kinama", "zina_ensest"],
        "description": "Taciz ile alınan beddualar, horoz adakları, organa alınan beddualar, iktidarsızları kınama."
    },
    
    {
        "name": "Erken Boşalma",
        "category": "Cinsel/Ürolojik",
        "symptoms": ["erken boşalma", "prematür ejakülasyon"],
        "causes": ["beddua", "adak_hayvan", "kinama", "zina_ensest"],
        "description": "Taciz ile alınan beddualar, horoz adakları, organa alınan beddualar, iktidarsızları kınama."
    },
    
    {
        "name": "Korku",
        "category": "Psikiyatrik",
        "symptoms": ["korku", "fobi", "aşırı korku"],
        "causes": ["adak_eylem", "miras_laneti"],
        "description": "Korku üzerine verilen söz/adaklar (örn: 'Sınavı geçersem şunu yapacağım'), miras laneti, abdestsiz yiyip içme, kerahet vakti uyuma."
    },
    
    {
        "name": "Evham",
        "category": "Psikiyatrik",
        "symptoms": ["evham", "vehim", "kuruntu"],
        "causes": ["adak_eylem", "miras_laneti"],
        "description": "Korku üzerine verilen söz/adaklar (örn: 'Sınavı geçersem şunu yapacağım'), miras laneti, abdestsiz yiyip içme, kerahet vakti uyuma."
    },
    
    {
        "name": "Takıntı",
        "category": "Psikiyatrik",
        "symptoms": ["takıntı", "OKB", "obsesyon"],
        "causes": ["adak_eylem", "miras_laneti"],
        "description": "Korku üzerine verilen söz/adaklar (örn: 'Sınavı geçersem şunu yapacağım'), miras laneti, abdestsiz yiyip içme, kerahet vakti uyuma."
    },
    
    {
        "name": "Narsist Kişilik Bozukluğu",
        "category": "Psikiyatrik",
        "symptoms": ["narsisizm", "empati yokluğu", "manipülasyon"],
        "causes": ["yuva_yikma", "zulum_insan", "iftira"],
        "description": "Soydan gelen sevenleri ayırma, yuva yıkma, aşk acısı çektirip beddua alma, iftirayla insanları ayırma zulmü."
    },
    
    {
        "name": "Otizm",
        "category": "Nörogelişimsel",
        "symptoms": ["otizm", "otizm spektrum bozukluğu", "iletişim sorunu"],
        "causes": ["beddua", "lanet", "zulum_insan", "faiz", "cocuk_aldirma", "zulum_hayvan"],
        "description": "Beddua, lanet, zulüm, faiz yeme/yedirme, çocuk aldırma (kürtaj), hayvan ve engelli zulümleri."
    },
    
    {
        "name": "Öfke Krizi",
        "category": "Psikiyatrik",
        "symptoms": ["öfke krizi", "kontrolsüz öfke", "aniden parlama"],
        "causes": ["adak_hayvan", "zulum_anne_baba", "zekat", "haramzade"],
        "description": "Büyükbaş adak (boğa, dana, öküz), anne babaya kin/isyan, verilmeyen veya eksik verilen zekât, haramzade olmak."
    },
    
    {
        "name": "Panik Atak",
        "category": "Psikiyatrik",
        "symptoms": ["panik atak", "korku atağı", "anksiyete atağı"],
        "causes": ["miras_laneti", "adak_eylem"],
        "description": "Miras laneti ('Hakkım haram olsun, yiyemeyin' bedduası), korku üzerine verilen adaklar."
    },
    
    {
        "name": "Şizofreni",
        "category": "Psikiyatrik",
        "symptoms": ["şizofreni", "hayal görme", "sanrı"],
        "causes": ["alim_evliya_zulum", "zulum_anne_baba", "zekat", "adak_hayvan"],
        "description": "Âlim ve evliya zulmü (öldürme), anne babanın kafasına vurma, aşırı yüklü zekât borcu, büyükbaş hayvan adakları."
    },
    
    {
        "name": "Uyurgezerlik",
        "category": "Uyku/Nörolojik",
        "symptoms": ["uyurgezerlik", "gece yürüme", "uyku sırasında hareket"],
        "causes": ["adak_eylem", "mezarci"],
        "description": "Ölmüş birine ziyaret adağı, mezarcı ruhsatı."
    },
    
    {
        "name": "Vajinismus",
        "category": "Cinsel/Jinekolojik",
        "symptoms": ["vajinismus", "cinsel ilişki ağrısı", "kasılma"],
        "causes": ["beddua", "lanet"],
        "description": "Soyun kadın olmaya okuduğu lanet ve beddualar."
    },
    
    {
        "name": "Yürüyen Ceset Sendromu",
        "category": "Psikiyatrik/Nadir",
        "symptoms": ["cotard sendromu", "yürüyen ceset", "ölü olduğunu düşünme"],
        "causes": ["iftira", "beddua", "hak_haram"],
        "description": "Ağır iftira atılan kişinin ah edip, beddua edip, hak haram edip ölmesi."
    },
    
    # === SOSYAL VE HAYATSAL OLAYLAR ===
    
    {
        "name": "Ev Satılamaması",
        "category": "Sosyal/Mali",
        "symptoms": ["ev satılmıyor", "gayrimenkul satış sorunu"],
        "causes": ["beddua", "zekat", "faiz"],
        "description": "Eve/Alım-satıma okunan lanet/beddua, zekâtsızlık, faiz, rüşvet."
    },
    
    {
        "name": "Borç Alınamaması",
        "category": "Mali",
        "symptoms": ["borç alamama", "kredi sorunu"],
        "causes": ["beddua", "zekat", "faiz"],
        "description": "Eve/Alım-satıma okunan lanet/beddua, zekâtsızlık, faiz, rüşvet."
    },
    
    {
        "name": "Evlenememe (Kısmet Kapanması)",
        "category": "Sosyal",
        "symptoms": ["evlenememe", "evlilik kapısının kapanması", "kısmet bağlı"],
        "causes": ["zina_ensest", "yuva_yikma", "adak_eylem", "iftira", "kinama", "isyan"],
        "description": "Zina, ensest, narsist (ayrılık ruhsatı), lanet, adak, kınama, isyan."
    },
    
    {
        "name": "Evden Sürekli Taşınma",
        "category": "Sosyal",
        "symptoms": ["sürekli taşınma", "bir yerde duramama", "barınamama"],
        "causes": ["zulum_insan", "beddua"],
        "description": "İnsanları yerinden yurdundan etme zulmü, 'Yersiz yurtsuz kalasın' bedduası."
    },
    
    {
        "name": "Barınamama",
        "category": "Sosyal",
        "symptoms": ["barınamama", "yersiz yurtsuz", "ev tutamama"],
        "causes": ["zulum_insan", "beddua"],
        "description": "İnsanları yerinden yurdundan etme zulmü, 'Yersiz yurtsuz kalasın' bedduası."
    },
    
    {
        "name": "Kilitlenmiş Trafik / Bekleme Sıkıntısı",
        "category": "Sosyal",
        "symptoms": ["trafikte bekleme", "işlerin gecikmesi", "her yerde bekleme"],
        "causes": ["yol_kesme", "zulum_insan"],
        "description": "Soydan yol kesme, insanları bekletme, eşkıyalık, insanların işlerini bozma."
    },
    
    {
        "name": "Sürekli İflas",
        "category": "Mali",
        "symptoms": ["iflas", "iş batması", "mali çöküş"],
        "causes": ["zekat", "hak_haram", "adak_eylem"],
        "description": "Kendi veya ataların zekât vermemesi, işçiye borç ödememe / işçi hakkı yeme, 'Tüm malımı Allah yolunda harcayacağım' adağını yerine getirmeme."
    },
    
    {
        "name": "Borç Verip Alamama",
        "category": "Mali",
        "symptoms": ["alacak tahsil edememe", "borç takibi", "para geri alamama"],
        "causes": ["zekat", "hak_haram", "adak_eylem"],
        "description": "Kendi veya ataların zekât vermemesi, işçiye borç ödememe / işçi hakkı yeme, 'Tüm malımı Allah yolunda harcayacağım' adağını yerine getirmeme."
    },
    
    {
        "name": "Trafik Kazası Geçirme",
        "category": "Kaza",
        "symptoms": ["trafik kazası", "araba kazası", "yol kazası"],
        "causes": ["adak_eylem", "beddua"],
        "description": "'Kaza bela gelmesin' diye adanan ancak kesilmeyen adaklar, 'Arabaların altında kalasın' bedduası."
    },
    
    {
        "name": "Sürekli Ağlayan Çocuk",
        "category": "Pediatrik",
        "symptoms": ["sürekli ağlama", "çocuk ağlaması", "huzursuz bebek"],
        "causes": ["hak_haram", "adak_hayvan"],
        "description": "Anne ve babanın yaptığı hak haramlığı, koyun adağı."
    },
    
    {
        "name": "Yuvayı Yıkan / Rezil Eden Evlat",
        "category": "Aile",
        "symptoms": ["sorunlu evlat", "aileyi rezil eden çocuk", "huzursuz evlat"],
        "causes": ["adak_eylem", "beddua", "zulum_insan"],
        "description": "'Yuvam ve çocuklarım olursa...' diye adanan adak. İnsanları toplum içinde rezil ederek, soyarak/döverek alınan beddua."
    },
    
    {
        "name": "Asi / Küfürbaz Evlat",
        "category": "Aile",
        "symptoms": ["asi çocuk", "küfürbaz evlat", "isyankâr çocuk"],
        "causes": ["haram_kazanc", "zulum_anne_baba"],
        "description": "Ataların haksız kazanç elde edip yedirmesi, anne babaya isyan bedduası."
    },
    
    {
        "name": "Sınavda (Dışarıda) Başarısızlık",
        "category": "Eğitim",
        "symptoms": ["sınav başarısızlığı", "dışarıda başarılı sınavda başarısız"],
        "causes": ["beddua", "adak_eylem"],
        "description": "Sınava, sınav yapana, okula, üniversiteye okunan lanet ve beddualar veya bu kurumlar üzerine yapılan adaklar."
    },

    {
        "name": "Adet Görememe / Erken Menopoz / Rahim Tıkanıklığı",
        "category": "Kadın Sağlığı",
        "symptoms": [
            "adet görememe", "adet kesilmesi", "erken menopoz", "menopoz",
            "rahim tıkanıklığı", "rahim sorunları", "regl olmama", "amenore",
            "buluğa girememe", "kısırlık"
        ],
        "causes": ["cocuk_aldirma", "cocuk_oldurme", "beddua", "isyan", "hamile_zulum", "zekat"],
        "description": (
            "Tıbb-ul Furkan ilmine göre adet görememe, erken menopoz veya rahim bölgesindeki tıkanıklıkların temelinde kişinin kendisinin veya soyunun işlediği belirli günahlar ve alınan ağır beddualar yatar. "
            "(1) Kürtaj ve Çocuk Öldürme: Kişinin kendisinin veya soyundaki kadınların kürtaj yapması veya çocuk öldürmesi, erken menopoza sebep olan en temel manevi yüklerden (ruhsatlardan) biridir. Çocuk cinayetinin işlendiği yer rahim olduğu için bu günahın negatif enerjisi doğrudan rahme yerleşir ve oradaki sistemi kilitler. "
            "(2) Ağır Beddualar ve Lanetler: Soydan gelen veya kişinin kendisine edilen 'Rahmin kapansın', 'Rahmin çürüsün', 'Kilitlensin', 'Dölünüz kurusun', 'Zürriyetiniz kesilsin', 'Kadınlığın alınsın' gibi beddualar rahim bölgesinde manevi kilitler oluşturur. "
            "(3) Doğuma ve Çocuğa İsyan: Hamile kalmaya, doğuma veya çocuğun olmasına karşı dille yapılan isyanlar ('Böyle hamileliğe/doğuma lanet olsun' gibi sözler) rahim sağlığını olumsuz etkiler. Ayrıca anne-babanın çocuğu istememesi veya ona lanet etmesi de üreme sisteminde manevi hasara yol açar. "
            "(4) Buluğa Girememe Tuzağı: Şeytanın kurduğu tuzaklardan biri olarak, kişinin manevi yükleri nedeniyle buluğa girememesi veya sistemin kilitlenmesi durumu söz konusu olabilir. "
            "(5) Hamile Kadına Zulüm: Geçmişte veya soyda hamile bir kadına fiziksel veya sözlü zulüm yapılması, o kadının ahının alınması rahimle ilgili sistemlerin bozulmasına neden olur. "
            "(6) Zekât Borcu: Zekât ruhsatı vücuttaki tüm hastalıkların temelidir; yüksek miktardaki zekât borcu rahim bölgesinde hastalık veya kilitlenme başlatabilir. "
            "Şifa için: Kürtaj ve çocuk düşürme için tövbe, rahme/zürriyete edilen-alınan beddualardan helalleşme, doğum-çocuk-anne baba isyanından tövbe, hamile kadına zulüm helalleşmesi, zekât borçlarının tespit edilip ödenmesi."
        )
    },

    {
        "name": "Adale Romatizması / Artrit (Kas ve Eklem Rahatsızlıkları)",
        "category": "Kas-İskelet",
        "symptoms": [
            "adale romatizması", "romatizma", "artrit", "kas ağrısı", "eklem ağrısı",
            "eklem iltihabı", "kas tutulması", "iltihaplı romatizma"
        ],
        "causes": ["zulum_anne_baba", "zulum_hayvan", "zulum_insan", "beddua", "adak_hayvan", "zekat"],
        "description": (
            "Romatizmal ağrıların ve artritin temelinde soğukla yapılan eziyetler ve belirli beddualar yatar. "
            "(1) Soğukla Yapılan Zulüm: Anne, baba veya bir canlıyı karda, kışta, soğukta dondurarak eziyet etmek veya bu şekilde ölmelerine sebep olmak en temel sebeptir. "
            "(2) Diz ve Bacağa Yapılan Zulümler: Birinin dizine vurmak, bacağını kırmak veya dizle birine vurarak zulmetmek romatizmayı tetikler. "
            "(3) Beddualar: 'Dizin batsın', 'Dizlerin sızlasın', 'Elin ayağın tutmaz olsun' gibi edilen veya alınan beddualar adale ve eklem bölgelerinde kilitlenmelere yol açar. "
            "(4) Adaklar ve Zekât: Yerine getirilmemiş deve adakları ve yüksek miktardaki zekât borcu (zekât enerjisi) vücutta romatizmal ağrılara neden olabilir. "
            "Şifa için: Soğukta zulüm helalleşmesi (anne-baba, çocuk, hayvan), diz-bacak zulmü, adale/diz bedduaları, deve adağının iadesi, zekât borçlarının ödenmesi."
        )
    },

    {
        "name": "Adenit (Beze ve Nodüller)",
        "category": "Lenfatik",
        "symptoms": [
            "adenit", "beze", "nodül", "yağ bezesi", "lenf bezi şişmesi",
            "boyunda beze", "göğüste nodül", "lipom"
        ],
        "causes": ["isyan", "zekat", "beddua"],
        "description": (
            "Bezelerin ve nodüllerin manevi kökeni isyandır. "
            "(1) İsyanın Fiziksel Etkisi: Kişi başına gelen imtihanlara karşı 'Bıktım artık, dayanamıyorum' diyerek eliyle elbisesini silkeleme hareketi yaptığında, bu hareketin yapıldığı noktada (genellikle göğüs ve boyun çevresi) nodüller ve yağ bezeleri oluşabilir. "
            "(2) Hastalık İlerlemesi: Bu isyan hali devam ederse ve temelindeki diğer ruhsatlarla (zekâtsızlık gibi) birleşirse, bu bezelerin göğüs kanserine kadar ilerleyebileceği belirtilmiştir. "
            "Şifa için: İsyandan tövbe ve şükür, zekât borçlarının tespit edilip ödenmesi; beze bölgesine yönelik bedduaların helalleşmesi."
        )
    },

    {
        "name": "Ağız Yaraları (Aft, Behçet)",
        "category": "Ağız-Diş",
        "symptoms": [
            "ağız yarası", "aft", "behçet", "ağızda yara",
            "dil yarası", "damak yarası", "afte"
        ],
        "causes": ["zulum_insan", "zulum_hayvan", "zulum_anne_baba", "beddua"],
        "description": (
            "Ağızda çıkan yaraların ve Behçet gibi rahatsızlıkların temelinde ağıza yönelik zulümler ve ağır beddualar bulunur. "
            "(1) Yiyecek ve İçecekle Yapılan Zulüm: İnsanlara veya hayvanlara acı biber, taş, diken yedirmek; kaynar su, kaynar yağ, asit veya erimiş metal (kalay, bakır vb.) içirerek ağız ve sindirim yollarını yakmak. "
            "(2) Ağıza Beddua: 'Ağzından yaralar çıksın', 'Yediğin zehir zıkkım olsun', 'Ağzından burnundan gelsin', 'Ağzın dilin tutulsun' gibi beddualar almak veya etmek. "
            "(3) Fiziksel Müdahale: İnsanların veya anne-babanın ağzına, dişlerine vurarak kırmak; ağızlarına pislik doldurmak veya zehirli maddeler sürmek. "
            "Şifa için: Yedirme-içirme zulümlerinden tövbe, ağza-dile yönelik bedduaların helalleşmesi, anne-baba ve insanlara ağıza vurma için helalleşme."
        )
    },

    {
        "name": "Akciğer Kanseri",
        "category": "Onkolojik/Solunum",
        "symptoms": [
            "akciğer kanseri", "ciğer kanseri", "akciğer tümörü", "akciğerde kitle"
        ],
        "causes": ["isyan", "zulum_insan", "zulum_hayvan", "adak_eylem", "beddua", "kinama"],
        "description": (
            "Akciğer ve ciğer rahatsızlıkları, yaşam enerjisine ve nefese yönelik ağır ihlallerden kaynaklanır. "
            "(1) Nefese ve Hayata İsyan: Hayata ve yaşamaya lanet okumak, 'Böyle hayata lanet olsun' demek veya 'Bir nefes almak haram olsun' gibi sözler ciğerleri etkiler. "
            "(2) Duman ve Gazla Zulüm: İnsanları veya hayvanları havasız yerde hapsederek ateşle, dumanla veya gazla boğmaya çalışmak; onları uykusunda zehirlemek. "
            "(3) Soğukta Bırakma: Yaşlıları, çocukları veya hayvanları karda, kışta dondurarak ciğerlerinin hastalanmasına sebep olmak. "
            "(4) Ağaç Dikme Sözü: 'Ağaç dikeceğim' deyip bu adağı yerine getirmemek de ciğer rahatsızlıklarına manevi bir kapı açar; çünkü ağaçlar dünyanın akciğerleridir. "
            "(5) Beddualar ve Kınama: 'Ciğerin kanser olsun', 'Ciğerin yansın' gibi beddualar almak veya kanser hastalarını kınamak/alay etmek. "
            "Şifa için: Hayata-nefese isyandan tövbe, duman/gaz/soğukta boğma zulmü helalleşmesi, ağaç dikme adağının yerine getirilmesi, ciğere edilen-alınan bedduaların helalleşmesi."
        )
    },

    {
        "name": "Akrep / Yılan Sokması ve Zehirlenme",
        "category": "Zehirlenme",
        "symptoms": [
            "akrep sokması", "yılan sokması", "zehirlenme", "yılan zehri", "akrep zehri"
        ],
        "causes": ["zulum_insan", "zulum_hayvan", "soy_laneti"],
        "description": (
            "Akrep sokması veya zehirlenme vakaları, soydan gelen belirli zulüm enerjileriyle ilişkilidir. "
            "(1) Hayvanla Zehirleme Zulmü: Geçmişte veya soyda; insanların veya hayvanların yılanlı, akrepli, çıyanlı kuyulara atılması; akrep ve yılanlara sokturularak işkence edilmesi veya öldürülmesi bu ruhsatın temelidir. "
            "(2) Zehir İçirme: İnsanlara veya mahkûmlara yılan/akrep zehri içirilerek eziyet edilmesi veya felç edilmesine sebep olunması. "
            "(3) Cinsel Organa Zulüm: Özellikle erkeklik organına akrep veya yılan sokturularak yapılan taciz ve zulümler. "
            "Şifa için: Soyda yapılmış akrep/yılanla zehirleme-işkence vakaları için pişmanlık ve helalleşme; mahkûm-tutsak zulmü için tövbe."
        )
    },

    {
        "name": "Akut Böbrek İltihabı / Nefrit",
        "category": "Böbrek",
        "symptoms": [
            "akut böbrek iltihabı", "nefrit", "böbrek iltihabı",
            "böbrek enfeksiyonu", "piyelonefrit"
        ],
        "causes": ["zekat", "beddua"],
        "description": (
            "Böbrek rahatsızlıklarının 'patronu' olarak zekât ruhsatı gösterilir. "
            "(1) Zekât Borcu: Kişinin kendisinin veya atasının vermediği zekât yükü (zekâtçı görevlisi) doğrudan böbreklere yerleşerek oranın iflasına veya iltihaplanmasına sebep olabilir. Zekât verilmediğinde mallar 'ateş' olup böğürlere (böbrek bölgesine) basılır. "
            "(2) Suya ve Kana Beddua: Suya veya kana edilen beddualar ile 'idrar damarların tıkansın, iltihaplansın' şeklindeki lanetler böbrek sistemini kilitler. "
            "Şifa için: Kişinin ve soyundaki zekât borçlarının tespit edilip ödenmesi; suya/kana/idrar yoluna edilen-alınan bedduaların helalleşmesi."
        )
    },

    {
        "name": "Akut Bronşit",
        "category": "Solunum",
        "symptoms": [
            "bronşit", "akut bronşit", "öksürük", "balgam",
            "solunum yolu iltihabı"
        ],
        "causes": ["isyan", "zulum_insan", "zulum_hayvan", "adak_eylem", "kinama"],
        "description": (
            "Akciğer ve solunum yolu rahatsızlıkları (bronşit, astım, KOAH), yaşam enerjisine yönelik ihlallerden kaynaklanır. "
            "(1) Nefese İsyan: Hayata ve yaşamaya lanet okumak, 'Bir nefes almak bana/sana haram olsun' demek ciğerleri hasta eder. "
            "(2) Boğma ve Duman Zulmü: İnsanları veya hayvanları havasız yerde hapsederek ateş, duman veya gazla boğmaya çalışmak; onları suda boğarak ciğerlerine su dolmasına sebep olmak. "
            "(3) Ağaç Dikme Adağı: Dünyanın akciğerleri olan ağaçları dikme sözü verip tutmamak bronşit ve akciğer sorunlarına yol açabilir. "
            "(4) Kınama: Bronşit veya nefes darlığı olan insanlarla alay etmek/kınamak. "
            "Şifa için: Hayata-nefese isyandan tövbe, boğma/duman/suda boğma zulmü helalleşmesi, ağaç dikme adağının yerine getirilmesi, hasta kınamasından tövbe."
        )
    },

    {
        "name": "Albüminüri (İdrarda Protein Kaçağı)",
        "category": "Böbrek",
        "symptoms": [
            "albüminüri", "idrarda protein", "protein kaçağı", "böbrek süzgeci sorunu"
        ],
        "causes": ["zekat", "beddua", "kinama", "zulum_anne_baba"],
        "description": (
            "İdrar ve böbrek sistemini ilgilendiren tüm rahatsızlıklar şu nedenlere bağlanır. "
            "(1) Zekât Yükü: Böbrek süzgecinin bozulması, verilmeyen tarla veya mal zekâtının bir yansımasıdır. "
            "(2) İdrar Üzerine Beddua: 'İdrarını yapamayasın', 'İdrar damarların tıkansın/iltihaplansın' gibi edilen veya alınan beddualar. "
            "(3) Kınama: Altını ıslatan çocukları, yatağını kirleten yaşlı anne-babayı kınamak veya onlara bu yüzden kızıp bağırmak idrar yolu sisteminde ruhsat oluşturur. "
            "Şifa için: Tarla ve mal zekâtı borçlarının tespit edilip ödenmesi; idrar yoluna edilen-alınan bedduaların helalleşmesi; altını ıslatanları kınamadan tövbe ve helalleşme."
        )
    },

    {
        "name": "Alerji Hastalıkları (Polen, Glüten, Güneş, Toz, Bahar)",
        "category": "Alerji",
        "symptoms": [
            "alerji", "polen alerjisi", "saman nezlesi", "glüten alerjisi", "çölyak",
            "güneş alerjisi", "vampir sendromu", "toz alerjisi", "bahar alerjisi"
        ],
        "causes": ["tarla_yakma", "hayvan_yakma", "adak_eylem", "lanet", "zulum_insan"],
        "description": (
            "Alerjilerin türüne göre farklı manevi sebepler vardır. "
            "(1) Polen Alerjisi: Anız yakarak, tarla yakarak hayvanları, arıları veya böcekleri yakmak bu alerjinin temel sebebidir. "
            "(2) Glüten Alerjisi ve Çölyak: Geçmişte buğday, arpa tarlalarını yakmak veya un/buğday dağıtma adaklarını yerine getirmemek bu alerjiye yol açar. "
            "(3) Güneş Alerjisi (Vampir Sendromu): Güneşe küfür etmek, lanet okumak veya insanları güneşin altında işleterek/bağlayarak işkence etmekten kaynaklanır. "
            "(4) Toz ve Bahar Alerjisi: Bahara, yaza, doğaya veya havaya okunan lanet ve beddualar ile hayvanları dumanda boğma zulümleri sebep olabilir. "
            "Şifa için: Tarla/anız/buğday yakma ve hayvan/arı yakma için tövbe, un-buğday dağıtma adağının ödenmesi, güneşe-havaya-doğaya edilen lanetlerden tövbe, güneşte/bağlı işletme zulmü helalleşmesi."
        )
    },

    {
        "name": "Altını Islatma (Enürezis)",
        "category": "Üroloji",
        "symptoms": [
            "altını ıslatma", "enürezis", "yatak ıslatma", "idrar kaçırma",
            "çocukta altını ıslatma"
        ],
        "causes": ["zulum_anne_baba", "kinama"],
        "description": (
            "Bu durum genellikle anne ve baba hakkı ile ilişkilendirilir. "
            "(1) Anne-Babaya Bakımda Kınama: Hasta veya yaşlı anne ve babaya bakarken, onların altını ıslatmasına veya yatağını kirletmesine kızmak, onlara bu sebeple bağırmak veya 'pisliğinden bıktım' gibi hakaretlerde bulunmak, kişinin kendi evladının veya sonraki nesillerinin altını ıslatmasına sebep olan bir manevi yük oluşturur. "
            "(2) Çocuğu/Yaşlıyı Kınama: Altını ıslatan çocukları veya bu durumdaki yaşlıları kınamak da idrar yollarında manevi bir kilitlenme (ruhsat) oluşmasına yol açabilir. "
            "Şifa için: Anne-baba bakımındaki kınama-bağırma-hakaret için tövbe ve helalleşme; altını ıslatanları (çocuk-yaşlı) kınamaktan tövbe."
        )
    },

    {
        "name": "Amipli Dizanteri (İshal ve Bağırsak Sorunları)",
        "category": "Sindirim",
        "symptoms": [
            "amipli dizanteri", "dizanteri", "ishal", "bağırsak iltihabı",
            "amip", "kanlı ishal"
        ],
        "causes": ["faiz", "hak_haram", "kinama", "zulum_insan", "zulum_hayvan", "beddua"],
        "description": (
            "İshal ve bağırsak rahatsızlıklarının temelinde faiz, haram lokma ve kınama yatar. "
            "(1) Faiz ve Haram Lokma: Faiz yemek, faize bulaşmak ve haram kazançtan yemek bağırsak sistemini bozar. "
            "(2) Hasta Kınaması: Özellikle ishal olan insanları kınamak, onlarla alay etmek. "
            "(3) Bağırsağa Fiziksel Zulüm: İnsanların veya hayvanların bağırsak bölgesine şiş veya bıçakla zulmetmek. "
            "(4) Beddualar: 'Bağırsağın kurtlansın', 'Bağırsağın tıkansın' veya 'Yediğin su olsun çıksın' gibi edilen veya alınan beddualar bağırsak sistemini bozar. "
            "Şifa için: Faiz ve haram lokmadan tövbe ve helalleşme, hasta kınamasından tövbe, bağırsağa yönelik bedduaların helalleşmesi, soyda yapılmış zulümler için pişmanlık."
        )
    },

    {
        "name": "Anne Sütünün Azlığı / Kesilmesi",
        "category": "Annelik",
        "symptoms": [
            "anne sütü azlığı", "süt yetersizliği", "süt kesilmesi",
            "sütü gelmeme", "emzirme sorunu"
        ],
        "causes": ["beddua", "lanet", "zulum_insan", "zulum_hayvan", "adak_eti"],
        "description": (
            "Anne sütünün kesilmesi veya yetersizliği, genellikle süte ve emzirmeye okunan lanetler ile yapılan zulümlerle açıklanır. "
            "(1) Süte Edilen Beddua: Bir annenin 'Sütüm sana haram olsun' diyerek beddua etmesi veya bir bebeği annesinin sütünden haksız yere mahrum bırakmak bu rahmetin kesilmesine neden olabilir. "
            "(2) Göğse Yapılan Fiziksel Zulüm: Geçmişte veya soyda hamile kadınların veya hayvanların göğüslerine yapılan fiziksel zulümler (vurma, kesme, yakma). "
            "(3) Adak Hayvanının Sütü: Adak hayvanının sütünü hak etmediği halde içmek sütle ilgili bereketin kaçmasına sebep olan ruhsatlar arasındadır. "
            "Şifa için: Süte edilen-alınan beddualardan helalleşme, bebeği anne sütünden mahrum bırakmaktan tövbe, göğse vurma/kesme/yakma zulmü helalleşmesi, adak hayvanı sütünün haksız tüketimi için tövbe."
        )
    },

    {
        "name": "Anüs (Makat) Kaşıntısı ve Rahatsızlıkları",
        "category": "Sindirim",
        "symptoms": [
            "anüs kaşıntısı", "makat kaşıntısı", "anüs rahatsızlığı",
            "makat ağrısı", "anüs yarası"
        ],
        "causes": ["zulum_insan", "zulum_hayvan", "adak_eylem", "adak_eti"],
        "description": (
            "Bu tür kaşıntıların ve makat bölgesi rahatsızlıklarının temelinde, o bölgeye yönelik yapılmış fiziksel zulümler bulunur. "
            "(1) Makata Fiziksel Zulüm: Geçmişte veya soyda; insan veya hayvanların makat bölgelerine kızgın şiş veya bıçakla eziyet edilmesi bu rahatsızlığın en belirgin manevi sebebidir. "
            "(2) Fakir Giydirme Adağı: Yerine getirilmeyen 'Fakir Giydirme Adağı' vücudun ilgili bölgelerinde şiddetli kaşıntılara yol açabilir. "
            "(3) Kelle Paça Adağı: Adanıp da fakire verilmeyerek kişinin kendisi tarafından yenen 'Kelle Paça' adakları, hayvanın neresi yendiyse orada (özellikle makat bölgesi) şiddetli kaşıntılara sebep olur. "
            "Şifa için: Makata yönelik soy-zulüm helalleşmesi; fakir giydirme adağının yerine getirilmesi; yenmiş kelle-paça adaklarının iadesi / kefareti."
        )
    },

    {
        "name": "Apandisit",
        "category": "Sindirim",
        "symptoms": [
            "apandisit", "apandis iltihabı", "apandis patlaması", "apandis ağrısı"
        ],
        "causes": ["hak_haram", "beddua"],
        "description": (
            "Apandisitin patlamasına veya iltihaplanmasına sebep olan en büyük zulüm 'Hak Haramlığı'dır. "
            "(1) Hak Haramlığı ve Kin: Bir kimseye hakkını helal etmemek, kin gütmek ve bu sebeple 'Hakkım haram olsun' diyerek beddua etmek vücuttaki fıtıkları yırttığı gibi apandisin de zarar görmesine yol açabilmektedir. "
            "Şifa için: Hak yenmiş kişilerle helalleşme, kin tutmaktan tövbe, 'hakkım haram olsun' tipi bedduaların geri alınması için karşılıklı helalleşme."
        )
    },

    {
        "name": "Arı / Böcek Sokması",
        "category": "Zehirlenme",
        "symptoms": [
            "arı sokması", "böcek sokması", "arı zehri alerjisi", "yaban arısı"
        ],
        "causes": ["tarla_yakma", "hayvan_yakma", "zulum_hayvan"],
        "description": (
            "Arı, akrep veya yılan gibi hayvanlar tarafından sokulmak, soydan gelen bir 'Zulüm Ruhsatı' ile ilişkilidir. "
            "(1) Anız ve Tarla Yakma: Anız veya tarla yakarak o bölgedeki arıları, böcekleri ve diğer canlıları kasten yakmak, bu hayvanların manevi korumasının (ruhsatının) kişiye zarar verecek şekilde açılmasına neden olur. "
            "(2) Soy Etkisi: Bu tür bir geçmişe sahip olanların bu canlılar tarafından zarar görme ihtimalinin arttığı belirtilir. "
            "Şifa için: Anız/tarla yakma için tövbe, soyda yapılmış böcek/arı yakma için pişmanlık ve helalleşme; çevreye-doğaya zarar verme niyetinden tövbe."
        )
    },

    {
        "name": "Astigmatlık / Göz Kusurları",
        "category": "Göz",
        "symptoms": [
            "astigmat", "miyop", "hipermetrop", "göz kusuru", "görme bozukluğu",
            "uzağı görememe", "yakını görememe", "bulanık görme"
        ],
        "causes": ["adak_eylem", "zulum_anne_baba", "kinama", "beddua", "zina_ensest"],
        "description": (
            "Genel göz rahatsızlıkları ve görme kusurlarının manevi temelleri şunlardır. "
            "(1) Yerine Getirilmeyen Adaklar: Kişinin kendisinin veya soyunun adadığı ancak yerine getirmediği Kur'an-ı Kerim okuma, Yasin veya hatim adakları görme bozukluklarına sebep olur (Kur'an gözle okunduğu için görevli varlık göze yerleşir). "
            "(2) Anne-Baba Hakkı: Yaşlı anne ve babayı terk edip onları yol gözletmek, uzağı görememe veya genel görme kusurlarına yol açan manevi bir yüktür. "
            "(3) Günahlar ve Beddualar: Göz zinası yapmak, kör insanlarla alay etmek veya 'Gözün kör olsun/batsın' gibi beddualar almak göz sağlığını doğrudan etkiler. "
            "Şifa için: Kur'an/Yasin/hatim adaklarının yerine getirilmesi, anne-baba terk-yol gözletme için tövbe ve helalleşme, göz zinasından tövbe, kör/görmeyenleri kınamadan tövbe, göze edilen-alınan bedduaların helalleşmesi."
        )
    },
]

# ============================================================
# 3. ADAK HAYVANLARININ ÖZELLİKLERİ
# ============================================================
ADAK_HAYVANLARI = """
ADAK HAYVANLARININ ÖZELLİKLERİ:
- Adak hayvanı adanır ve usulüne uygun kesilmezse, bedenden ayrılmayan ve hastalık üreten bir 'ruhsat'a (görevli enerji) dönüşür.
- Erkekte DİŞİ adak çoksa: cinsel isteksizlik, eşine soğukluk, hemcinse meyil riskleri artar.
- Kadında ERKEK adak çoksa: aynı şekilde ters cinsiyet etkisi.
- Adak yerine getirilmemiş ise: 'açıkta kalmış adak' olarak vücuda yerleşir.
- 5-6 adetten fazla adak (çoklu adak) ağır hastalık tetikleyebilir (örn. ensefalit, bipolar, otizm).
- Adak hayvanın ciğeri, kemiği, kafası yenirse o organa yönelik rahatsızlık tetiklenebilir.
- Hayvan adakları yendiği zaman egzamaya, reflüye sebep olur.
- Rüyada sıçrama olursa büyükbaş hayvan adağı işaretidir.
- Büyükbaş hayvan adakları gece uyutmaz.

HAYVAN ADAĞI TESPİTİ İÇİN SEANS ALINMASI GEREKİR.
"""

# ============================================================
# 4. YARDIMCI FONKSİYONLAR
# ============================================================

def get_disease_by_name(name: str):
    """Hastalık adına göre bilgi döndürür"""
    name_lower = name.lower().strip()
    for disease in DISEASE_PATTERNS:
        if disease["name"].lower() == name_lower:
            return disease
        # Alternatif isimlerle de eşleştir
        for symptom in disease.get("symptoms", []):
            if symptom.lower() == name_lower:
                return disease
    return None

def search_diseases(query: str):
    """Sorguya göre hastalık arar"""
    query_lower = query.lower().strip()
    results = []
    for disease in DISEASE_PATTERNS:
        # İsimde ara
        if query_lower in disease["name"].lower():
            results.append(disease)
            continue
        # Semptomlarda ara
        for symptom in disease.get("symptoms", []):
            if query_lower in symptom.lower():
                results.append(disease)
                break
    return results

def get_causes_description(cause_codes: list):
    """Sebep kodlarından açıklama listesi döndürür"""
    descriptions = []
    for code in cause_codes:
        if code in CAUSE_CATEGORIES:
            descriptions.append(CAUSE_CATEGORIES[code])
    return descriptions

def get_all_disease_names():
    """Tüm hastalık isimlerini döndürür"""
    return [d["name"] for d in DISEASE_PATTERNS]

def get_diseases_by_cause(cause_code: str):
    """Belirli bir sebebe bağlı hastalıkları döndürür"""
    results = []
    for disease in DISEASE_PATTERNS:
        if cause_code in disease.get("causes", []):
            results.append(disease)
    return results


# ============================================================
# 5. FORM SORU → SEBEP İLİŞKİLERİ
# ============================================================
FORM_QUESTION_HINTS = {
    "adak_yemin": ["adak_eylem", "adak_hayvan"],
    "muska_okunmus_su": ["sirk"],
    "miras_sorunu": ["miras_laneti", "hak_haram"],
    "beddua_hak_haram": ["beddua", "hak_haram"],
    "intihar": ["isyan"],
    "anne_baba_ofke": ["zulum_anne_baba"],
    "es_soguklugu": ["adak_hayvan", "zina_ensest"],
    "sehvet": ["adak_hayvan", "zina_ensest"],
    "duygusallik": ["adak_hayvan"],
    "kin": ["beddua"],
    "kusme_alinganlik": ["adak_hayvan"],
    "ofke": ["adak_hayvan", "zekat"],
    "nefret": ["beddua"],
    "supheci": ["adak_hayvan"],
    "uyku_sorunu": ["adak_hayvan", "zekat"],
    "aniden_parlama": ["adak_hayvan"],
    "alaycilik": ["kinama"],
}


# ============================================================
# 6. SİSTEM MESAJI OLUŞTURMA (LLM İÇİN)
# ============================================================
def build_system_message() -> str:
    """LLM'e gönderilecek sistem mesajını oluşturur"""
    diseases_summary = []
    for d in DISEASE_PATTERNS[:50]:  # En önemli 50 hastalık
        causes = ", ".join(d.get("causes", []))
        diseases_summary.append(f"- {d['name']}: {causes}")
    
    diseases_text = "\n".join(diseases_summary)
    
    causes_text = "\n".join([f"- {code}: {desc}" for code, desc in CAUSE_CATEGORIES.items()])
    
    return f"""Sen Tıbb-ul Furkan bilgi sistemine dayalı bir manevi sağlık analistisin.

SEBEP KATEGORİLERİ:
{causes_text}

ÖNEMLİ HASTALIK-SEBEP İLİŞKİLERİ:
{diseases_text}

ADAK HAYVANLARI:
{ADAK_HAYVANLARI}

GÖREV:
Kullanıcının form yanıtlarını yukarıdaki bilgi tabanıyla eşleştirerek manevi bir değerlendirme yap.
Her hastalık veya belirti için olası manevi sebepleri belirt.
Çıktını Türkçe, profesyonel ve yapıcı bir dille oluştur.
"""
