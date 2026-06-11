import { create } from 'zustand';

// Yapılandırılmış alan tipleri
export type Elder = { status: 'sag' | 'vefat' | ''; value: string };
export type YN = { status: 'evet' | 'hayir' | ''; note: string };

const emptyElder = (): Elder => ({ status: '', value: '' });
const emptyYN = (): YN => ({ status: '', note: '' });

export type FormData = {
  // Kişisel
  ad_soyad: string;
  yas: string;
  tlf: string;
  medeni_durum: string;
  cocuk_sayisi: string;
  memleket: string;
  dogum_tarihi: string; // GG.AA.YYYY format
  cinsiyet: 'erkek' | 'kadın' | '';

  // Aile büyükleri (sağ/vefat + değer)
  anne: Elder;
  baba: Elder;
  anneanne: Elder;
  anne_babasi: Elder;
  babaanne: Elder;
  baba_babasi: Elder;

  // Mali durum
  zekat: 'evet' | 'hayir' | '';
  faiz: 'evet' | 'hayir' | '';
  faiz_aciklama: string;

  // Ailedeki hastalıklar (serbest metin)
  anne_hastalik: string;
  baba_hastalik: string;
  cocuk_hastalik: string;

  // Yaşanılan ruhsal ve fiziksel rahatsızlıklar
  rahatsizliklar: string;

  // 17 soru (Evet/Hayır + opsiyonel açıklama)
  adak_yemin: YN;
  muska_okunmus_su: YN;
  miras_sorunu: YN;
  beddua_hak_haram: YN;
  intihar: YN;
  anne_baba_ofke: YN;
  es_soguklugu: YN;
  sehvet: YN;
  duygusallik: YN;
  kin: YN;
  kusme_alinganlik: YN;
  ofke: YN;
  nefret: YN;
  supheci: YN;
  uyku_sorunu: YN;
  aniden_parlama: YN;
  alaycilik: YN;
};

type State = FormData & {
  set: (partial: Partial<FormData>) => void;
  setElder: (key: ElderKey, partial: Partial<Elder>) => void;
  setYN: (key: YNKey, partial: Partial<YN>) => void;
  reset: () => void;
};

export type ElderKey = 'anne' | 'baba' | 'anneanne' | 'anne_babasi' | 'babaanne' | 'baba_babasi';
export type YNKey =
  | 'adak_yemin' | 'muska_okunmus_su' | 'miras_sorunu' | 'beddua_hak_haram'
  | 'intihar' | 'anne_baba_ofke' | 'es_soguklugu' | 'sehvet'
  | 'duygusallik' | 'kin' | 'kusme_alinganlik' | 'ofke'
  | 'nefret' | 'supheci' | 'uyku_sorunu' | 'aniden_parlama' | 'alaycilik';

const initial: FormData = {
  ad_soyad: '', yas: '', tlf: '', medeni_durum: '', cocuk_sayisi: '',
  memleket: '', dogum_tarihi: '', cinsiyet: '',

  anne: emptyElder(), baba: emptyElder(), anneanne: emptyElder(),
  anne_babasi: emptyElder(), babaanne: emptyElder(), baba_babasi: emptyElder(),

  zekat: '', faiz: '', faiz_aciklama: '',

  anne_hastalik: '', baba_hastalik: '', cocuk_hastalik: '',
  rahatsizliklar: '',

  adak_yemin: emptyYN(), muska_okunmus_su: emptyYN(), miras_sorunu: emptyYN(),
  beddua_hak_haram: emptyYN(), intihar: emptyYN(), anne_baba_ofke: emptyYN(),
  es_soguklugu: emptyYN(), sehvet: emptyYN(), duygusallik: emptyYN(),
  kin: emptyYN(), kusme_alinganlik: emptyYN(), ofke: emptyYN(),
  nefret: emptyYN(), supheci: emptyYN(), uyku_sorunu: emptyYN(),
  aniden_parlama: emptyYN(), alaycilik: emptyYN(),
};

export const useFormStore = create<State>((set, get) => ({
  ...initial,
  set: (partial) => set(partial as any),
  setElder: (key, partial) => set((state) => ({ [key]: { ...state[key], ...partial } } as any)),
  setYN: (key, partial) => set((state) => ({ [key]: { ...state[key], ...partial } } as any)),
  reset: () => set(initial as any),
}));

// Yapılandırılmış veriyi backend'in beklediği flat string yapısına çevir
export function serializeForBackend(s: FormData): Record<string, string> {
  const elderToStr = (e: Elder): string => {
    if (!e.status) return '';
    if (e.status === 'sag') return e.value.trim() ? `Sağ, ${e.value.trim()} yaşında` : 'Sağ';
    return e.value.trim() ? `Vefat, ${e.value.trim()}` : 'Vefat';
  };
  const ynToStr = (y: YN): string => {
    if (!y.status) return '';
    if (y.status === 'evet') return y.note.trim() ? `Evet — ${y.note.trim()}` : 'Evet';
    return 'Hayır';
  };

  return {
    ad_soyad: s.ad_soyad,
    yas: s.yas,
    tlf: s.tlf,
    medeni_durum: s.medeni_durum,
    cocuk_sayisi: s.cocuk_sayisi,
    memleket: s.memleket,
    dogum_tarihi: s.dogum_tarihi,
    cinsiyet: s.cinsiyet || '',
    anne_durum: elderToStr(s.anne),
    baba_durum: elderToStr(s.baba),
    anneanne_durum: elderToStr(s.anneanne),
    anne_babasi_durum: elderToStr(s.anne_babasi),
    babaanne_durum: elderToStr(s.babaanne),
    baba_babasi_durum: elderToStr(s.baba_babasi),
    zekat_veriyor: s.zekat === 'evet' ? 'Evet' : s.zekat === 'hayir' ? 'Hayır' : '',
    faizli_kredi: s.faiz === 'evet'
      ? `Evet — ${s.faiz_aciklama.trim()}`
      : s.faiz === 'hayir' ? 'Hayır' : '',
    anne_hastalik: s.anne_hastalik,
    baba_hastalik: s.baba_hastalik,
    cocuk_hastalik: s.cocuk_hastalik,
    rahatsizliklar: s.rahatsizliklar,
    adak_yemin: ynToStr(s.adak_yemin),
    muska_okunmus_su: ynToStr(s.muska_okunmus_su),
    miras_sorunu: ynToStr(s.miras_sorunu),
    beddua_hak_haram: ynToStr(s.beddua_hak_haram),
    intihar: ynToStr(s.intihar),
    anne_baba_ofke: ynToStr(s.anne_baba_ofke),
    es_soguklugu: ynToStr(s.es_soguklugu),
    sehvet: ynToStr(s.sehvet),
    duygusallik: ynToStr(s.duygusallik),
    kin: ynToStr(s.kin),
    kusme_alinganlik: ynToStr(s.kusme_alinganlik),
    ofke: ynToStr(s.ofke),
    nefret: ynToStr(s.nefret),
    supheci: ynToStr(s.supheci),
    uyku_sorunu: ynToStr(s.uyku_sorunu),
    aniden_parlama: ynToStr(s.aniden_parlama),
    alaycilik: ynToStr(s.alaycilik),
  };
}

// Doğum tarihi auto-format: kullanıcı sayı girdikçe nokta otomatik konulur
// "12" → "12", "125" → "12.5", "1205" → "12.05", "12051985" → "12.05.1985"
export function formatBirthDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}.${mm}`;
  return `${dd}.${mm}.${yyyy}`;
}

// Form tamamlanma yüzdesi hesaplama
// Soruları toplam alan sayısı üzerinden değerlendirir. Sadece doldurulanlar sayılır.
export function computeCompletion(s: FormData): { percent: number; filled: number; total: number } {
  // Personal: 8 alan (ad_soyad, yas, tlf, medeni_durum, cocuk_sayisi, memleket, dogum_tarihi, cinsiyet)
  const personalFields = [s.ad_soyad, s.yas, s.tlf, s.medeni_durum, s.cocuk_sayisi, s.memleket, s.dogum_tarihi, s.cinsiyet];
  const personalFilled = personalFields.filter((v) => (v || '').trim() !== '').length;

  // Elders: 2 elder (anne, baba)
  const elders: Elder[] = [s.anne, s.baba];
  const eldersFilled = elders.filter((e) => e.status !== '').length;

  // Mali: 2 (zekat, faiz)
  const maliFilled = (s.zekat !== '' ? 1 : 0) + (s.faiz !== '' ? 1 : 0);

  // Hastalık + rahatsızlık serbest metinleri: 4
  const healthFields = [s.anne_hastalik, s.baba_hastalik, s.cocuk_hastalik, s.rahatsizliklar];
  const healthFilled = healthFields.filter((v) => (v || '').trim() !== '').length;

  // 17 soru — sadece status (evet/hayır) seçilmiş olması yeterli
  const yns: YN[] = [
    s.adak_yemin, s.muska_okunmus_su, s.miras_sorunu, s.beddua_hak_haram,
    s.intihar, s.anne_baba_ofke, s.es_soguklugu, s.sehvet,
    s.duygusallik, s.kin, s.kusme_alinganlik, s.ofke,
    s.nefret, s.supheci, s.uyku_sorunu, s.aniden_parlama, s.alaycilik,
  ];
  const ynsFilled = yns.filter((y) => y.status !== '').length;

  const total = personalFields.length + elders.length + 2 + healthFields.length + yns.length; // 8 + 6 + 2 + 4 + 17 = 37
  const filled = personalFilled + eldersFilled + maliFilled + healthFilled + ynsFilled;
  const percent = Math.round((filled / total) * 100);
  return { percent, filled, total };
}
