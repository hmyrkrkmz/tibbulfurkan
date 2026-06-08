import { create } from 'zustand';
import type { Ancestor, AnimalVow, ActionVow, Allergy, ProfileCreate } from './api';
import type { FormSubmission } from './formApi';

type OnboardingState = {
  // Aşama 1
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'erkek' | 'kadın' | '';
  // Aşama 2
  current_diseases: string[];
  symptoms: string[];
  life_events: string[];
  allergies: Allergy[];
  // Aşama 3
  ancestors: Ancestor[];
  // Aşama 4
  has_animals: boolean;
  animals_kept: string[];
  animal_vows: AnimalVow[];
  action_vows: ActionVow[];

  // Hangi form/analize bağlı olarak prefill edildiyse onun id'si
  source_form_id?: string;

  set: (partial: Partial<OnboardingState>) => void;
  reset: () => void;
  prefillFromForm: (form: FormSubmission) => void;
  toCreatePayload: () => ProfileCreate;
};

const initial = {
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: '' as const,
  current_diseases: [],
  symptoms: [],
  life_events: [],
  allergies: [],
  ancestors: [],
  has_animals: false,
  animals_kept: [],
  animal_vows: [],
  action_vows: [],
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  ...initial,
  set: (partial) => set(partial),
  reset: () => set(initial),
  prefillFromForm: (form: FormSubmission) => {
    // ad_soyad → first_name + last_name
    const fullName = (form.ad_soyad || '').trim();
    const parts = fullName.split(/\s+/);
    const first_name = parts.shift() || '';
    const last_name = parts.join(' ');

    // cinsiyet (formdaki "erkek"/"kadın" stringi)
    const c = (form.cinsiyet || '').toLowerCase().trim();
    const gender: 'erkek' | 'kadın' | '' =
      c.startsWith('e') ? 'erkek' : (c.startsWith('k') ? 'kadın' : '');

    // Form'daki büyüklerden atalar oluştur (anne, baba, anneanne, anne_babasi, babaanne, baba_babasi)
    type ElderEntry = {
      key: keyof FormSubmission;
      relation: string;
      relation_key: string;
      side: 'maternal' | 'paternal';
      diseases?: string[];
    };
    const annePart = (form.anne_hastalik || '').trim();
    const babaPart = (form.baba_hastalik || '').trim();

    const elders: ElderEntry[] = [
      { key: 'anne_durum',          relation: 'Anne',           relation_key: 'anne',          side: 'maternal', diseases: annePart && annePart.toLowerCase() !== 'yok' ? [annePart] : [] },
      { key: 'anneanne_durum',      relation: 'Anneanne',       relation_key: 'anneanne',      side: 'maternal' },
      { key: 'anne_babasi_durum',   relation: 'Annenin Babası', relation_key: 'anne_babasi',   side: 'maternal' },
      { key: 'baba_durum',          relation: 'Baba',           relation_key: 'baba',          side: 'paternal', diseases: babaPart && babaPart.toLowerCase() !== 'yok' ? [babaPart] : [] },
      { key: 'babaanne_durum',      relation: 'Babaanne',       relation_key: 'babaanne',      side: 'paternal' },
      { key: 'baba_babasi_durum',   relation: 'Babanın Babası', relation_key: 'baba_babasi',   side: 'paternal' },
    ];

    const ancestors: Ancestor[] = [];
    for (const e of elders) {
      const raw = String(form[e.key] || '').trim();
      if (!raw) continue;
      const isAlive = /sağ|sag/i.test(raw);
      const events: string[] = [];
      // "Vefat, 2010" gibi içeriklerden yıl bilgisini olay olarak ekle
      const vefatMatch = raw.match(/vefat[,\s]*(.*)/i);
      if (vefatMatch && vefatMatch[1]?.trim()) {
        events.push(`Vefat: ${vefatMatch[1].trim()}`);
      }
      ancestors.push({
        relation: e.relation,
        relation_key: e.relation_key,
        side: e.side,
        name: '',
        diseases: e.diseases || [],
        events,
        unfulfilled_vows: [],
        sins_admitted: [],
        is_alive: isAlive,
      });
    }

    // Kişinin kendi rahatsızlıklarını semptomlara ekle
    const rahat = (form.rahatsizliklar || '').trim();
    const symptoms = rahat ? rahat.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean) : [];

    // Hayat olayları: faiz, miras, intihar gibi formdan gelen "Evet — ..." cevaplarından üret
    const life_events: string[] = [];
    const evetReason = (val?: string, label?: string): string | null => {
      const v = (val || '').trim();
      if (!v || !/^evet/i.test(v)) return null;
      const detail = v.replace(/^evet\s*[—-]*\s*/i, '').trim();
      return detail ? `${label}: ${detail}` : (label || null);
    };
    const ev1 = evetReason(form.faizli_kredi, 'Faizli kredi');
    if (ev1) life_events.push(ev1);
    const ev2 = evetReason(form.miras_sorunu, 'Miras sorunu');
    if (ev2) life_events.push(ev2);
    const ev3 = evetReason(form.intihar, 'İntihar girişimi');
    if (ev3) life_events.push(ev3);
    const ev4 = evetReason(form.beddua_hak_haram, 'Beddua / hak haram');
    if (ev4) life_events.push(ev4);
    const ev5 = evetReason(form.adak_yemin, 'Yarım kalmış adak / yemin');
    if (ev5) life_events.push(ev5);

    set({
      ...initial,
      first_name,
      last_name,
      birth_date: form.dogum_tarihi || '',
      gender,
      symptoms,
      life_events,
      ancestors,
      source_form_id: form.id,
    });
  },
  toCreatePayload: () => {
    const s = get();
    return {
      first_name: s.first_name,
      last_name: s.last_name,
      birth_date: s.birth_date,
      gender: (s.gender || 'erkek') as 'erkek' | 'kadın',
      current_diseases: s.current_diseases,
      symptoms: s.symptoms,
      life_events: s.life_events,
      allergies: s.allergies,
      ancestors: s.ancestors,
      has_animals: s.has_animals,
      animals_kept: s.animals_kept,
      animal_vows: s.animal_vows,
      action_vows: s.action_vows,
    };
  },
}));
