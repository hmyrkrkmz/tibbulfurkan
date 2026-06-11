"""
Tıbb-ul Furkan Hastalık Bilgi Tabanı
Problem statement'tan alınan hastalık-günah-soy yükü ilişkileri.
"""

# Günah/Sebep kategorileri
CAUSE_CATEGORIES = {
    "zekat": "Verilmeyen veya Eksik Zekat",
    "adak_hayvan": "Yerine Getirilmeyen Hayvan Adağı",
    "adak_eylem": "Yerine Getirilmeyen Eylemsel Adak (oruç, namaz, Kur'an, ziyaret)",
    "beddua": "Beddua / Lânet",
    "soy_laneti": "Soy Lâneti",
    "zulum_insan": "İnsana Yapılan Zulüm",
    "zulum_hayvan": "Hayvana Yapılan Zulüm",
    "zulum_anne_baba": "Anne-Babaya Zulüm",
    "isyan": "Allah'a İsyan / Kadere İsyan",
    "sirk": "Şirk",
    "kinama": "Kınama / Alay",
    "faiz": "Faiz Günahı",
    "hak_haram": "Hak Haramlığı",
    "haram_kazanc": "Haksız Kazanç",
    "hayrat_mali": "Hayrat Malı Yeme",
    "zina_ensest": "Zina / Ensest",
    "iftira": "İftira",
    "yetim_hakki": "Yetim Hakkı",
    "miras_laneti": "Miras Lâneti",
    "adak_eti": "Adak Eti Yeme",
    "kufur_kainata": "Kâinata Küfür / Yaratılmışları Beğenmeme",
    "narsist_zulum": "Aşıkları Ayırma / Yuva Yıkma",
    "kul_hakki": "Kul Hakkı",
    "cocuk_aldirma": "Çocuk Aldırma",
    "harami_esme": "Harami Eşme",
    "haramzade": "Haramzade",
    "savastan_kacma": "Savaştan Kaçma / Hainlik",
    "kiz_kacirma": "Kız Kaçırma",
    "soz_tutmama": "Allah'a Yürüme / Türbe / Umre Sözünü Tutmama",
}

# Hastalık veritabanı
DISEASES = [
    {
        "name": "Alis Harikalar Diyarı Sendromu",
        "category": "Nörolojik / Psikiyatrik",
        "symptoms": ["Evleri küçük, böcekleri büyük görme", "Algı bozukluğu", "Boyut sapması"],
        "causes": [
            {"category": "kufur_kainata", "weight": 10, "detail": "Kâinata küfür etme, tabiata, yaratılmışları beğenmemek"},
            {"category": "isyan", "weight": 8, "detail": "Allah'ın yarattıklarıyla alay etme"},
        ],
        "remedy": "Kâinatın sahibine tövbe, yaratılmışlara saygı, kibirden arınma."
    },
    {
        "name": "Alzheimer",
        "category": "Nörolojik",
        "symptoms": ["Unutkanlık", "Hafıza kaybı", "Bilinç bulanıklığı"],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Kişinin ve soyunun verilmeyen veya eksik verilen zekâtı yüksek"},
            {"category": "adak_eylem", "weight": 9, "detail": "Zamanı geçmiş yerine getirilmemiş adaklar"},
            {"category": "sirk", "weight": 8, "detail": "Şirk devreye girer"},
            {"category": "zulum_anne_baba", "weight": 9, "detail": "Anne babayı terk etme, onları unutma, ah alma"},
            {"category": "kinama", "weight": 6, "detail": "Unutkan insanları kınama"},
        ],
        "remedy": "Zekat tamamlanır, adaklar tespit edilir, kişi üzerinden tek tek ruhsatlar kaldırılır."
    },
    {
        "name": "Astım ve KOAH",
        "category": "Solunum",
        "symptoms": ["Nefes alamama", "Boğulma hissi", "Kriz"],
        "causes": [
            {"category": "isyan", "weight": 10, "detail": "Hayata, yaşamaya lânet okuma ve isyan"},
            {"category": "zekat", "weight": 8, "detail": "Zekat enerjisi ile sistemli çalışır"},
        ],
        "remedy": "Hayata isyandan tövbe, zekat eksiklerini tamamlama."
    },
    {
        "name": "Bağırsak Hastalıkları (Kanser, Basur)",
        "category": "Sindirim",
        "symptoms": ["Bağırsak rahatsızlıkları", "Hemoroid", "Kanama"],
        "causes": [
            {"category": "faiz", "weight": 10, "detail": "Faiz günahı - midenin sol tarafına azılı şeytan yerleşir"},
            {"category": "beddua", "weight": 8, "detail": "Beddua, lânet"},
            {"category": "miras_laneti", "weight": 8, "detail": "Miras lâneti"},
            {"category": "haram_kazanc", "weight": 9, "detail": "Haksız kazanç"},
            {"category": "hak_haram", "weight": 9, "detail": "Hak haramlığı - midenin sağ tarafına azılı şeytan"},
        ],
        "remedy": "Faiz tövbesi, hak helalleşmesi, miras helalleşmesi."
    },
    {
        "name": "Beyin Tümörü",
        "category": "Onkolojik",
        "symptoms": ["Baş ağrısı", "Tümör"],
        "causes": [
            {"category": "hayrat_mali", "weight": 10, "detail": "Hayrat malı yeme"},
            {"category": "zulum_insan", "weight": 8, "detail": "Kafaya zulüm"},
            {"category": "zekat", "weight": 9, "detail": "Verilmeyen veya eksik verilen zekât"},
        ],
        "remedy": "Hayrat malı iadesi, zekat tövbesi."
    },
    {
        "name": "Bipolar Bozukluk",
        "category": "Psikiyatrik",
        "symptoms": ["Manik dönemler", "Depresif dönemler", "Ruh hali dalgalanması"],
        "causes": [
            {"category": "zekat", "weight": 9, "detail": "Kişinin ve anne babasının verilmediği zekat"},
            {"category": "adak_eylem", "weight": 8, "detail": "Yerine getirilmeyen adak"},
            {"category": "zulum_anne_baba", "weight": 10, "detail": "Anne babaya zulüm, dövme, işkence, beddua alma"},
            {"category": "zulum_hayvan", "weight": 8, "detail": "Hayvan zulümleri"},
        ],
        "remedy": "Anne baba ile helalleşme, zekat tamamlama, adak yerine getirme."
    },
    {
        "name": "Böbrek Hastalıkları",
        "category": "Üriner",
        "symptoms": ["Böbrek yetmezliği", "Mide-böbrek bağlantılı rahatsızlıklar"],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Kendi veya soyunun vermediği zekat - zekatçı mide ve böbreklere yerleşir"},
            {"category": "beddua", "weight": 7, "detail": "Kana edilen beddualar, suya edilen beddualar"},
        ],
        "remedy": "Zekat kefareti verildiği an ölür. Beddua tövbesi."
    },
    {
        "name": "Burun Tıkanıklığı",
        "category": "Solunum",
        "symptoms": ["Nefes alamama", "Tıkanıklık"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Nefesin kesilsin, burnun tıkansın bedduaları"},
            {"category": "zulum_hayvan", "weight": 7, "detail": "Hayvan ve insanların burnuna vurma zulmü"},
            {"category": "adak_hayvan", "weight": 6, "detail": "Büyükbaş hayvan adakları"},
        ],
        "remedy": "Beddua tövbesi, hayvan haklarını helalleşme."
    },
    {
        "name": "Cinsel İsteksizlik ve Soğukluk",
        "category": "Cinsel",
        "symptoms": ["İlişkide isteksizlik", "Eşten soğuma"],
        "causes": [
            {"category": "adak_hayvan", "weight": 9, "detail": "Erkekte dişi adak, kadında erkek adak (cinsiyet uyumsuzluğu)"},
            {"category": "zina_ensest", "weight": 8, "detail": "Soydan ensest"},
            {"category": "iftira", "weight": 7, "detail": "Eşler arası iftira"},
            {"category": "kinama", "weight": 6, "detail": "Eşler arası soğukluk yaşayanları kınama"},
        ],
        "remedy": "Adak tespiti ve yerine getirme, helalleşme."
    },
    {
        "name": "Çıban ve Yaralar",
        "category": "Dermatolojik",
        "symptoms": ["Vücutta çıbanlar", "Yaralar"],
        "causes": [
            {"category": "zulum_insan", "weight": 9, "detail": "Vücutta nereye vurduysa orada çıkar"},
            {"category": "zulum_anne_baba", "weight": 10, "detail": "Anne babaya vurma"},
        ],
        "remedy": "Helalleşme, anne baba haklarına dönüş."
    },
    {
        "name": "Dalak Şişmesi",
        "category": "İç Hastalıkları",
        "symptoms": ["Dalakta şişme", "Ağrı"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Dalağın şişsin, patlasın bedduaları"},
            {"category": "zulum_insan", "weight": 7, "detail": "Zulüm ile ah alma"},
        ],
        "remedy": "Beddua tövbesi, helalleşme."
    },
    {
        "name": "Deri Kanseri ve Cilt Hastalıkları",
        "category": "Onkolojik / Dermatolojik",
        "symptoms": ["Cilt lezyonları", "Kanser"],
        "causes": [
            {"category": "adak_eti", "weight": 9, "detail": "Adak eti yeme"},
            {"category": "zekat", "weight": 10, "detail": "Verilmeyen veya eksik verilen zekât (kanserde zekat yüksek)"},
            {"category": "kinama", "weight": 7, "detail": "Kınama zulmü"},
            {"category": "adak_eylem", "weight": 6, "detail": "Çocuk giydirme ve sevindirme adakları"},
            {"category": "hayrat_mali", "weight": 8, "detail": "Hayrat derisi gasp edip yeme"},
        ],
        "remedy": "Adak tespiti, zekat kefareti, helalleşme."
    },
    {
        "name": "Dil Felci",
        "category": "Nörolojik",
        "symptoms": ["Konuşamama", "Dilde uyuşma"],
        "causes": [
            {"category": "beddua", "weight": 10, "detail": "Küfür sözleri, yalan, lânet, beddua, iftira, inkâr"},
            {"category": "iftira", "weight": 9, "detail": "Masuma iftira atma"},
        ],
        "remedy": "Dil tövbesi, helalleşme."
    },
    {
        "name": "Diyabet (Şeker Hastalığı)",
        "category": "Endokrin",
        "symptoms": ["Yüksek şeker", "Tatlı kontrolsüzlüğü"],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "kinama", "weight": 7, "detail": "Kınama"},
            {"category": "soy_laneti", "weight": 9, "detail": "Soy lâneti - tövbe etmeden ölen yakının tutan bedduası"},
            {"category": "beddua", "weight": 8, "detail": "Şeker bana haram olsun sözü"},
            {"category": "adak_eylem", "weight": 7, "detail": "Şeker, çikolata, helva, tatlı dağıtma adakları"},
            {"category": "adak_eti", "weight": 6, "detail": "Bolca yenilmiş hayvan adakları"},
        ],
        "remedy": "Zekat tamamlama, soy lâneti tövbesi, adakları yerine getirme."
    },
    {
        "name": "Down Sendromu",
        "category": "Genetik",
        "symptoms": ["Genetik bozukluk", "Gelişimsel gecikme"],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Eksik zekat"},
            {"category": "isyan", "weight": 9, "detail": "Allah'a isyan ve iftiralar"},
            {"category": "adak_hayvan", "weight": 8, "detail": "Çok fazla küçükbaş veya büyükbaş adak"},
            {"category": "adak_eti", "weight": 7, "detail": "Adak eti yeme"},
            {"category": "haramzade", "weight": 8, "detail": "Haramzade"},
            {"category": "beddua", "weight": 6, "detail": "Çocuğum olsun da, nasıl olursa olsun sözü"},
        ],
        "remedy": "Zekat tamamlama, isyandan tövbe, adak tespiti."
    },
    {
        "name": "Egzama",
        "category": "Dermatolojik",
        "symptoms": ["Cilt iltihabı", "Kaşıntı"],
        "causes": [
            {"category": "adak_eti", "weight": 8, "detail": "Yenmiş adak eti"},
            {"category": "zekat", "weight": 8, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "zulum_insan", "weight": 7, "detail": "Zulüm"},
        ],
        "remedy": "Adak, zekat ve zulüm tövbesi."
    },
    {
        "name": "Emmeyen Çocuk",
        "category": "Çocuk Sağlığı",
        "symptoms": ["Bebeğin annesini emmeyi reddetmesi"],
        "causes": [
            {"category": "hak_haram", "weight": 9, "detail": "Annenin hak haram etmesi"},
            {"category": "beddua", "weight": 8, "detail": "Annenin çocuğa beddua etmesi"},
        ],
        "remedy": "Anne helal yiyecek tüketmeli, soy zürriyet ağacı tövbesi."
    },
    {
        "name": "Ensefalit Lethargica",
        "category": "Nörolojik",
        "symptoms": ["Sürekli uyku veya uykusuzluk", "Sağa sola yürüme"],
        "causes": [
            {"category": "adak_hayvan", "weight": 10, "detail": "Karşı cins çoklu adaklar (5-6 tane)"},
            {"category": "zekat", "weight": 9, "detail": "Eksik zekat"},
            {"category": "zulum_insan", "weight": 8, "detail": "İnsan öldürme, Kur'an talebelerine zulüm"},
            {"category": "beddua", "weight": 7, "detail": "Çocuğum düşmesin diye adak"},
            {"category": "kinama", "weight": 6, "detail": "Kınama"},
        ],
        "remedy": "Adak tespiti tek tek kesim, kefaretler."
    },
    {
        "name": "Ergenlik Sivilceleri",
        "category": "Dermatolojik",
        "symptoms": ["Yüzde sivilce"],
        "causes": [
            {"category": "adak_hayvan", "weight": 8, "detail": "Erkekte koyun, kadında koç adağı"},
            {"category": "zekat", "weight": 7, "detail": "Verilmeyen veya eksik verilen zekât, adaklarınızı tespit ettirmeniz gerekmektedir. Tespit için lütfen seans alınız"},
            {"category": "kinama", "weight": 9, "detail": "Sivilceli insanlarla alay etme, kınama"},
        ],
        "remedy": "Adak ve zekat tespiti, kınama tövbesi."
    },
    {
        "name": "Eşcinsellik (Sebep Olan Günahlar)",
        "category": "Cinsel",
        "symptoms": ["Hemcinsine yönelim"],
        "causes": [
            {"category": "zina_ensest", "weight": 10, "detail": "Soydan tecavüzler"},
            {"category": "adak_hayvan", "weight": 9, "detail": "Karşı cins yoğun adaklar"},
            {"category": "zekat", "weight": 8, "detail": "Verilmeyen veya eksik verilen zekât (kişinin veya anne babasının)"},
            {"category": "beddua", "weight": 7, "detail": "Lânet ve beddualar"},
        ],
        "remedy": "Zekat tamamlama, adak tespiti, soy ensest tövbesi."
    },
    {
        "name": "Evlenememe",
        "category": "Sosyal / Manevi",
        "symptoms": ["Evlilik kapısının kapanması"],
        "causes": [
            {"category": "zina_ensest", "weight": 9, "detail": "Zina, ensest"},
            {"category": "narsist_zulum", "weight": 8, "detail": "Narsist lânet"},
            {"category": "adak_eylem", "weight": 7, "detail": "Yerine getirilmemiş adak"},
            {"category": "iftira", "weight": 7, "detail": "İftira"},
            {"category": "kinama", "weight": 7, "detail": "Kınama"},
            {"category": "isyan", "weight": 6, "detail": "İsyan"},
        ],
        "remedy": "Tüm bu günahlardan tövbe ve helalleşme."
    },
    {
        "name": "Felç ve İnme",
        "category": "Nörolojik",
        "symptoms": ["Vücut tutmaz", "İnme"],
        "causes": [
            {"category": "zulum_insan", "weight": 9, "detail": "Başkalarına zulüm"},
            {"category": "beddua", "weight": 8, "detail": "Beddua, lânet"},
            {"category": "adak_eylem", "weight": 7, "detail": "Adak"},
            {"category": "sirk", "weight": 8, "detail": "Şirk"},
            {"category": "isyan", "weight": 7, "detail": "İsyan"},
            {"category": "zekat", "weight": 8, "detail": "Çok verilmeyen veya eksik verilen zekât"},
            {"category": "zulum_hayvan", "weight": 9, "detail": "Hayvana zulüm, işkence, yakma"},
        ],
        "remedy": "Tüm zulümlerden helalleşme, zekat tamamlama."
    },
    {
        "name": "Göz Altı Morluğu",
        "category": "Dermatolojik",
        "symptoms": ["Göz altı kararması"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Lânet okuyanların soyları"},
            {"category": "zulum_insan", "weight": 8, "detail": "Göze zulüm"},
            {"category": "zekat", "weight": 7, "detail": "Zekat"},
            {"category": "kul_hakki", "weight": 8, "detail": "Soydan cinayet ahları, kul hakları, zulümler"},
        ],
        "remedy": "Detaylı tespit ve kefaretler."
    },
    {
        "name": "Göz Kanlanması",
        "category": "Oftalmolojik",
        "symptoms": ["Gözlerde kızarıklık"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Göze okunan beddualar"},
            {"category": "adak_eylem", "weight": 9, "detail": "Yerine getirilmeyen hatim ve yasin adakları"},
            {"category": "adak_hayvan", "weight": 6, "detail": "Hayvan adağı"},
        ],
        "remedy": "Anne baba beddua tövbesi, adak yerine getirme."
    },
    {
        "name": "İç Organların Yanması",
        "category": "İç Hastalıkları",
        "symptoms": ["İçten yanma hissi"],
        "causes": [
            {"category": "beddua", "weight": 10, "detail": "İçin yansın, bağrın yansın bedduaları"},
            {"category": "isyan", "weight": 8, "detail": "İsyan ile birleştiğinde"},
        ],
        "remedy": "Beddua ve isyan tövbesi."
    },
    {
        "name": "Kabızlık",
        "category": "Sindirim",
        "symptoms": ["Bağırsak tıkanıklığı"],
        "causes": [
            {"category": "zekat", "weight": 8, "detail": "Zekat"},
            {"category": "faiz", "weight": 9, "detail": "Faiz"},
            {"category": "hak_haram", "weight": 9, "detail": "Mal veya miras üzerine hak haram etme"},
            {"category": "beddua", "weight": 7, "detail": "Bağırsağın dolansın, tıkansın bedduaları"},
        ],
        "remedy": "Zekat, faiz, hak helalleşmesi."
    },
    {
        "name": "Kalbi Delik Doğan Çocuklar",
        "category": "Kardiyak (Doğumsal)",
        "symptoms": ["Konjenital kalp deliği"],
        "causes": [
            {"category": "zulum_insan", "weight": 10, "detail": "Soyda kalp kırma"},
            {"category": "beddua", "weight": 9, "detail": "Delinesin, kalbinden vurulasın bedduaları"},
            {"category": "kinama", "weight": 8, "detail": "Müslümanlara kâfir-gâvur deme, kalp hastası çocukları kınama"},
            {"category": "zekat", "weight": 7, "detail": "Zekat"},
            {"category": "adak_eylem", "weight": 6, "detail": "Adak"},
        ],
        "remedy": "Helalleşme, kınama tövbesi."
    },
    {
        "name": "Kalp Ritmi Bozukluğu",
        "category": "Kardiyak",
        "symptoms": ["Düzensiz kalp atışı"],
        "causes": [
            {"category": "zulum_anne_baba", "weight": 10, "detail": "Anne-baba hukukunu çiğneme"},
            {"category": "isyan", "weight": 9, "detail": "Kadere rızasızlık, şükürsüzlük"},
            {"category": "kinama", "weight": 7, "detail": "Müslümanların Müslümanlığını eleştirme"},
        ],
        "remedy": "Anne-baba helalleşmesi, isyan tövbesi."
    },
    {
        "name": "Kan Kanseri (Lösemi)",
        "category": "Onkolojik",
        "symptoms": ["Kan kanseri"],
        "causes": [
            {"category": "adak_eylem", "weight": 10, "detail": "Adanıp yerine getirilmeyen adak"},
            {"category": "adak_eti", "weight": 9, "detail": "Adak etini yeme"},
            {"category": "zekat", "weight": 10, "detail": "Zekat çok eksik - zekatçı enerji merkezidir"},
            {"category": "beddua", "weight": 9, "detail": "Kanın kurusun, kanser olasın bedduaları"},
            {"category": "zulum_insan", "weight": 8, "detail": "Zulümle kan akıtma"},
        ],
        "remedy": "Adak yerine getirme, zekat kefareti, helalleşme."
    },
    {
        "name": "Karaciğer Büyümesi",
        "category": "İç Hastalıkları",
        "symptoms": ["Karaciğer şişmesi"],
        "causes": [
            {"category": "zekat", "weight": 9, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "beddua", "weight": 9, "detail": "Ciğerin şişsin, patlasın bedduaları"},
            {"category": "adak_eti", "weight": 8, "detail": "Adak hayvanının ciğerini yeme"},
        ],
        "remedy": "Adak tespiti, kefaretler."
    },
    {
        "name": "Karaciğer Kanseri",
        "category": "Onkolojik",
        "symptoms": ["Karaciğer kanseri"],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "beddua", "weight": 9, "detail": "Ciğerin kurusun, yansın, batsın bedduaları"},
            {"category": "adak_eti", "weight": 8, "detail": "Adak ciğeri yeme"},
        ],
        "remedy": "Zekat ve beddua tövbesi."
    },
    {
        "name": "Kaza Belâ Geçiren Çocuklar",
        "category": "Çocuk Sağlığı",
        "symptoms": ["Sık kaza geçirme"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Elin ayağın kırılsın gibi beddualar"},
            {"category": "adak_eti", "weight": 8, "detail": "Adak eti yeme"},
            {"category": "adak_eylem", "weight": 8, "detail": "Yerine getirilmeyen adak"},
            {"category": "zekat", "weight": 8, "detail": "Verilmeyen veya eksik verilen zekât"},
        ],
        "remedy": "Anne baba beddua tövbesi, adak yerine getirme."
    },
    {
        "name": "Kekemelik",
        "category": "Konuşma",
        "symptoms": ["Konuşma takıntısı"],
        "causes": [
            {"category": "beddua", "weight": 10, "detail": "Çenen batsın, sussun bedduaları"},
            {"category": "zulum_insan", "weight": 8, "detail": "Zulüm ile alınan ah"},
            {"category": "adak_hayvan", "weight": 5, "detail": "Nadiren tavuk adakları"},
        ],
        "remedy": "Beddua tövbesi, helalleşme."
    },
    {
        "name": "Kuduz",
        "category": "Enfeksiyon",
        "symptoms": ["Kuduz hastalığı"],
        "causes": [
            {"category": "zulum_hayvan", "weight": 10, "detail": "Soyda aşırı hayvana zulüm - vücutta ruhsat hazır"},
        ],
        "remedy": "Soy hayvan zulüm tövbesi."
    },
    {
        "name": "Kulak Çınlaması (Tinnitus)",
        "category": "Kulak",
        "symptoms": ["Kulak çınlaması"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Kulağın çınlasın bedduası"},
            {"category": "iftira", "weight": 8, "detail": "Gıybet dinleyip iftira atma"},
            {"category": "zulum_insan", "weight": 8, "detail": "Kulağa vurma zulmü"},
        ],
        "remedy": "Beddua ve iftira tövbesi."
    },
    {
        "name": "Moebius Sendromu",
        "category": "Nörolojik (Doğumsal)",
        "symptoms": ["Yüz felci", "Yüz oynatamama"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Yüze okunan beddualar"},
            {"category": "zulum_anne_baba", "weight": 10, "detail": "Anne babanın yüzüne vurma"},
            {"category": "yetim_hakki", "weight": 9, "detail": "Yetimin yüzüne vurma"},
            {"category": "miras_laneti", "weight": 8, "detail": "Miras üzerine kavga edip dövme"},
        ],
        "remedy": "Helalleşme, miras tövbesi."
    },
    {
        "name": "Meme Kanseri",
        "category": "Onkolojik",
        "symptoms": ["Meme kanseri"],
        "causes": [
            {"category": "hayrat_mali", "weight": 9, "detail": "Hayrat malı yeme"},
            {"category": "isyan", "weight": 9, "detail": "Hayata isyan"},
            {"category": "soy_laneti", "weight": 9, "detail": "Soy lâneti"},
            {"category": "zekat", "weight": 10, "detail": "Zekat enerjisi"},
            {"category": "zulum_insan", "weight": 7, "detail": "Göğüs bıçaklama"},
        ],
        "remedy": "El-Hayy, El-Kayyum isimlerinden tövbe, zekat ve beddua kefareti."
    },
    {
        "name": "Mide Kanseri",
        "category": "Onkolojik",
        "symptoms": ["Mide kanseri"],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Soy zekatı"},
            {"category": "zulum_insan", "weight": 8, "detail": "Mide bıçaklama zulmü"},
            {"category": "beddua", "weight": 9, "detail": "Beddua"},
        ],
        "remedy": "Zekat ve beddua kefareti."
    },
    {
        "name": "Migren",
        "category": "Nörolojik",
        "symptoms": ["Şiddetli baş ağrısı"],
        "causes": [
            {"category": "sirk", "weight": 9, "detail": "Şirk"},
            {"category": "zulum_anne_baba", "weight": 9, "detail": "Anne babaya sesle zulüm"},
            {"category": "zulum_hayvan", "weight": 8, "detail": "Hayvan zulümleri"},
        ],
        "remedy": "Şirk tövbesi, anne baba helalleşmesi."
    },
    {
        "name": "Narsist Kişilik Bozukluğu",
        "category": "Psikiyatrik",
        "symptoms": ["Empati yokluğu", "Manipülasyon", "Karşıdakini yıpratma"],
        "causes": [
            {"category": "kinama", "weight": 9, "detail": "Soydan insanları kafirlikle itham etme"},
            {"category": "narsist_zulum", "weight": 10, "detail": "Aşıkları ayırma, yuva yıkma"},
            {"category": "kul_hakki", "weight": 9, "detail": "Mahkumlar yuvasından ayırma, kadın kaçırma, çocuk kaçırma"},
        ],
        "remedy": "Helalleşme, soydaki zulümlerden tövbe."
    },
    {
        "name": "Obezite",
        "category": "Metabolik",
        "symptoms": ["Aşırı kilo"],
        "causes": [
            {"category": "harami_esme", "weight": 9, "detail": "Harami eşme"},
            {"category": "zekat", "weight": 9, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "hak_haram", "weight": 8, "detail": "Hak haramlığı"},
            {"category": "kinama", "weight": 7, "detail": "Kınama"},
            {"category": "beddua", "weight": 7, "detail": "Beddua"},
        ],
        "remedy": "Zekat ve helalleşme."
    },
    {
        "name": "Otizm",
        "category": "Nörolojik (Gelişimsel)",
        "symptoms": ["İletişim sorunu", "Sosyal etkileşim güçlüğü"],
        "causes": [
            {"category": "beddua", "weight": 9, "detail": "Beddua, lânet"},
            {"category": "zulum_insan", "weight": 9, "detail": "Zulümler"},
            {"category": "faiz", "weight": 8, "detail": "Faiz yediler veya yedirdiler"},
            {"category": "cocuk_aldirma", "weight": 9, "detail": "Çocuk aldırma"},
            {"category": "zulum_hayvan", "weight": 8, "detail": "Hayvan zulümleri"},
            {"category": "kinama", "weight": 8, "detail": "Hasta, engelli kınama"},
        ],
        "remedy": "Tüm bu günahlardan tövbe."
    },
    {
        "name": "Ödem ve Şişlikler",
        "category": "Genel",
        "symptoms": ["Vücutta su tutulması", "Şişlik"],
        "causes": [
            {"category": "beddua", "weight": 10, "detail": "Suya lânet 'şişesin' bedduası"},
        ],
        "remedy": "Suya beddua tövbesi."
    },
    {
        "name": "Öfke Krizi",
        "category": "Psikiyatrik",
        "symptoms": ["Kontrolsüz öfke"],
        "causes": [
            {"category": "adak_hayvan", "weight": 9, "detail": "Büyükbaş adak, küçükbaş çok adak"},
            {"category": "zulum_anne_baba", "weight": 9, "detail": "Anne babaya kin ve öfke"},
            {"category": "zekat", "weight": 8, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "haramzade", "weight": 8, "detail": "Haramzade"},
        ],
        "remedy": "Adak ve helalleşme."
    },
    {
        "name": "Kelebek Hastalığı",
        "category": "Dermatolojik (Genetik)",
        "symptoms": ["Deride kıpkırmızı yanıklar"],
        "causes": [
            {"category": "zulum_anne_baba", "weight": 10, "detail": "Anne babaya zulüm, dövme, ah, beddua alma"},
            {"category": "zulum_insan", "weight": 9, "detail": "İnsanları dövme, ah alma"},
            {"category": "adak_eylem", "weight": 8, "detail": "Un, ekmek, bulgur dağıtma adakları"},
        ],
        "remedy": "Anne baba helalleşmesi, adakları yerine getirme."
    },
    {
        "name": "Kellik ve Saç Dökülmesi",
        "category": "Dermatolojik",
        "symptoms": ["Kellik", "Saç kaybı"],
        "causes": [
            {"category": "adak_eylem", "weight": 8, "detail": "Yerine getirilmeyen adak"},
            {"category": "kinama", "weight": 9, "detail": "Kel biriyle dalga geçme, kınama"},
            {"category": "beddua", "weight": 9, "detail": "Kel kalasın, saçın dökülsün"},
            {"category": "zulum_insan", "weight": 8, "detail": "Saç baş yolma, yetimi dövme, anne baba kafasına vurma"},
            {"category": "yetim_hakki", "weight": 9, "detail": "Yetimi dövme"},
        ],
        "remedy": "Beddua, kınama tövbesi, helalleşme."
    },
    {
        "name": "Kemik Erimesi (Osteoporoz)",
        "category": "Kemik",
        "symptoms": ["Kemiklerde zayıflama"],
        "causes": [
            {"category": "adak_eti", "weight": 9, "detail": "Kendi adadığı adağı yeme, kemiklerini kaynatma"},
            {"category": "zulum_insan", "weight": 9, "detail": "Soydan zulümler, ah alma"},
            {"category": "beddua", "weight": 9, "detail": "İliğin kemiğin kurusun bedduaları"},
        ],
        "remedy": "Adak ve beddua tövbesi."
    },
    {
        "name": "Kolera",
        "category": "Enfeksiyon",
        "symptoms": ["Kolera"],
        "causes": [
            {"category": "zina_ensest", "weight": 10, "detail": "Büyük zina (evliyken)"},
            {"category": "soy_laneti", "weight": 9, "detail": "Soy lâneti"},
            {"category": "haramzade", "weight": 9, "detail": "Haramzade"},
            {"category": "faiz", "weight": 8, "detail": "Faiz günahı"},
        ],
        "remedy": "Zina, faiz tövbesi."
    },
    {
        "name": "Körlük ve Göz Hastalıkları",
        "category": "Oftalmolojik",
        "symptoms": ["Görme kaybı", "Göz hastalıkları"],
        "causes": [
            {"category": "adak_eylem", "weight": 10, "detail": "Kur'an okuma ve hatim adakları"},
            {"category": "kinama", "weight": 9, "detail": "Kör insanı kınama"},
            {"category": "zulum_insan", "weight": 9, "detail": "Gözü kör etme zulmü"},
            {"category": "beddua", "weight": 9, "detail": "Gözün batsın, kör olsun bedduaları"},
            {"category": "zekat", "weight": 8, "detail": "Verilmeyen veya eksik verilen zekât"},
            {"category": "zina_ensest", "weight": 7, "detail": "Göz zinası"},
        ],
        "remedy": "Adak yerine getirme, kınama tövbesi."
    },
    {
        "name": "Kramplar",
        "category": "Kas-İskelet",
        "symptoms": ["Kas krampları"],
        "causes": [
            {"category": "zulum_insan", "weight": 9, "detail": "İnsan ve hayvanları el-ayaktan asarak zulüm"},
            {"category": "zulum_hayvan", "weight": 9, "detail": "Hayvana zulüm"},
            {"category": "adak_eylem", "weight": 7, "detail": "Adak enerjisi"},
            {"category": "zekat", "weight": 8, "detail": "Verilmeyen veya eksik zekat"},
            {"category": "beddua", "weight": 8, "detail": "Ete, kemiğe, damara lânet ve beddua"},
        ],
        "remedy": "Zulüm helalleşmesi, zekat tamamlama."
    },
    {
        "name": "Ön Çapraz Bağ Zedelenmesi (Menisküs, Diz Bağ Sorunları)",
        "category": "Ortopedik",
        "symptoms": [
            "Ön çapraz bağ zedelenmesi", "Menisküs yırtığı", "Diz bağı sorunu",
            "Diz ağrısı", "Diz kapağı sorunları", "ÖÇB", "ACL", "diz tutulması"
        ],
        "causes": [
            {"category": "savastan_kacma", "weight": 10, "detail": "Savaştan kaçma, vatan hainliği, insanların yerinden yurdundan olmasına sebep olma"},
            {"category": "zulum_anne_baba", "weight": 9, "detail": "Yaşlı anne-babanın dizine/ayağına vurmak, bakıma muhtaç iken terk edip yol gözletmek"},
            {"category": "adak_hayvan", "weight": 9, "detail": "Deve adağı: kişinin veya atalarının deve adayıp yerine getirmemesi ya da zengin olduğu halde adak etinden yemesi"},
            {"category": "soz_tutmama", "weight": 9, "detail": "Allah yolunda 'yürüyeceğim' deyip yürümeme; türbe ziyareti, umre/hac adağını tutmama"},
            {"category": "beddua", "weight": 9, "detail": "'Dizlerin sızlasın / tutmaz olsun / bükülmesin' gibi edilen veya alınan beddualar; dizle vurarak / bacak kırarak alınan ah"},
            {"category": "kiz_kacirma", "weight": 8, "detail": "Soyda veya kişinin kendinde kız kaçırma eylemi"},
            {"category": "adak_eylem", "weight": 7, "detail": "Yerine getirilmeyen yürüyüş ve ziyaret adakları"},
        ],
        "remedy": "Savaştan kaçma/hainlik, anne-babaya diz-ayak zulmü ve terk etme, ödenmemiş deve adağı, yürüyüş–türbe–umre sözleri, kız kaçırma ve dize edilen/alınan beddualar tek tek tespit edilip tövbe, helalleşme ve adak iadesi yapılır."
    },
    {
        "name": "Kulak Duymaması (İşitme Kaybı, Sağırlık)",
        "category": "Kulak",
        "symptoms": [
            "Kulak duymaması", "İşitme kaybı", "Sağırlık", "Duymama",
            "Kulak zarı patlaması", "İşitme güçlüğü", "Kulak iltihabı"
        ],
        "causes": [
            {"category": "zulum_anne_baba", "weight": 10, "detail": "Anne-babanın yaşlılıktan duymamasına/yüksek sesle konuşmasına kızıp azarlamak veya beddua etmek; kulaklarına vurmak"},
            {"category": "yetim_hakki", "weight": 9, "detail": "Yetim çocukların kulaklarına vurmak / koparmak / işkence etmek"},
            {"category": "zulum_hayvan", "weight": 8, "detail": "Hayvanların kulaklarına şiş/mil/bıçak sokma, kulaklarını çekip koparma"},
            {"category": "zulum_insan", "weight": 9, "detail": "Kulağa vurma; mum tıkama; asit/kurşun/kaynar su dökme; yüksek sesle bağırarak/gürültüyle taciz"},
            {"category": "iftira", "weight": 8, "detail": "Gıybet, iftira, kınama yapılırken sessiz kalıp dinleme (kulak misafirliği); dine-kitaba sövüldüğünde sessiz kalma"},
            {"category": "kinama", "weight": 8, "detail": "Sağır veya işitme güçlüğü çekenlerle alay etmek, onları kınamak"},
            {"category": "beddua", "weight": 9, "detail": "'Kulakların çınlasın / duymaz olsun / zarı patlasın / tıkansın' gibi beddualar"},
        ],
        "remedy": "Kulak zulümleri (anne-baba, yetim, hayvan), gıybet/iftira/küfre sessiz kalma, kulağa edilen-alınan beddualar ve sağır/işitme güçlüğü çekenlerle alay etme tespit edilip helalleşme ve tövbe yapılır."
    },
    {
        "name": "Safra Kesesi (Taş, İltihap)",
        "category": "Sindirim",
        "symptoms": [
            "Safra kesesi", "Safra taşı", "Kolesistit", "Safra iltihabı",
            "Safra yolu sorunu", "Safra ağrısı"
        ],
        "causes": [
            {"category": "zekat", "weight": 10, "detail": "Tarla zekâtı: kişinin veya atasının tarla zekâtını vermemesi → organlarda taş/toprak birikmesi (safra kesesi dahil)"},
            {"category": "beddua", "weight": 9, "detail": "'Midene/böbreğine taş otursun', 'Yediğin taş olsun' gibi beddualar"},
            {"category": "miras_laneti", "weight": 9, "detail": "Miras malları üzerindeki hak haramlıkları, miras üzerine kavga ve lânet"},
            {"category": "haram_kazanc", "weight": 8, "detail": "Haksız kazanç → karaciğer ve sindirim sistemi rahatsızlıkları"},
            {"category": "hak_haram", "weight": 8, "detail": "Haram lokma; hak haramlığı"},
            {"category": "adak_eti", "weight": 8, "detail": "Adak hayvanının ciğerini yeme; yenmiş adak eti"},
            {"category": "adak_hayvan", "weight": 7, "detail": "Yerine getirilmeyen (özellikle büyükbaş) hayvan adağı"},
        ],
        "remedy": "Tarla zekâtı borçları araştırılır; soydan gelen miras ve mal bedduaları için tövbe edilir; varsa adak borçları (özellikle büyükbaş veya yenmiş adaklar) tespit edilip yerine getirilir; 'taş olsun' tipi beddualar ve yenmiş adak eti için helalleşme yapılır."
    },
    {
        "name": "Tansiyon (Hipertansiyon)",
        "category": "Kardiyovasküler",
        "symptoms": [
            "Tansiyon", "Yüksek tansiyon", "Hipertansiyon", "Kan basıncı yüksekliği"
        ],
        "causes": [
            {"category": "isyan", "weight": 10, "detail": "Kadere/imtihanlara isyan: 'bıktım, dayanamıyorum, neden hep ben?'; sabah namazı kaçırıp kendine aşırı kızma"},
            {"category": "zulum_anne_baba", "weight": 9, "detail": "Anne-babaya isyankâr davranma, karşı gelme"},
            {"category": "zekat", "weight": 9, "detail": "Verilmeyen veya eksik zekât borçları"},
            {"category": "adak_eylem", "weight": 9, "detail": "Allah'a verilip yerine getirilmeyen adak sözleri"},
            {"category": "sirk", "weight": 8, "detail": "Allah'ın sıfatlarını / kudretini başkalarına veya maddelere yükleme"},
            {"category": "beddua", "weight": 8, "detail": "Kendi vücuduna, aklına, beynine veya çevresindekilere edilen beddua, küfür ve lanet"},
        ],
        "remedy": "İsyandan (kadere, imtihanlara, anne-babaya) tövbe edilir; zekât ve adak borçları tespit edilerek ödenir; şirk niteliğindeki bağlılıklar terk edilir; kendine ve çevreye edilen beddualardan helalleşme/tövbe ile arınılır."
    },
]
