// Form (analiz) API'si
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type FormSubmission = {
  id: string;
  ad_soyad: string;
  yas?: string;
  tlf?: string;
  medeni_durum?: string;
  cocuk_sayisi?: string;
  memleket?: string;
  dogum_tarihi?: string;
  cinsiyet?: string;
  anne_durum?: string;
  baba_durum?: string;
  anneanne_durum?: string;
  anne_babasi_durum?: string;
  babaanne_durum?: string;
  baba_babasi_durum?: string;
  zekat_veriyor?: string;
  faizli_kredi?: string;
  anne_hastalik?: string;
  baba_hastalik?: string;
  cocuk_hastalik?: string;
  rahatsizliklar?: string;
  adak_yemin?: string;
  muska_okunmus_su?: string;
  miras_sorunu?: string;
  beddua_hak_haram?: string;
  intihar?: string;
  anne_baba_ofke?: string;
  es_soguklugu?: string;
  sehvet?: string;
  duygusallik?: string;
  kin?: string;
  kusme_alinganlik?: string;
  ofke?: string;
  nefret?: string;
  supheci?: string;
  uyku_sorunu?: string;
  aniden_parlama?: string;
  alaycilik?: string;
  ai_analysis?: string | null;
  created_at?: string;
};

export const formApi = {
  create: (data: Partial<FormSubmission>) =>
    call<FormSubmission>('/form-submissions', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => call<FormSubmission>(`/form-submissions/${id}`),
  list: () => call<FormSubmission[]>('/form-submissions'),
  remove: (id: string) => call<{ ok: boolean }>(`/form-submissions/${id}`, { method: 'DELETE' }),
  analyze: (
    id: string,
    opts: { force?: boolean; signal?: AbortSignal } = {},
  ) =>
    call<{ ai_analysis: string; signals: Record<string, string[]>; cached?: boolean }>(
      `/form-submissions/${id}/analyze${opts.force ? '?force=true' : ''}`,
      { method: 'POST', signal: opts.signal },
    ),
};
