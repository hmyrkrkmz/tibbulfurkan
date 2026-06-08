import Constants from 'expo-constants';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type Allergy = { allergen: string; since?: string };

export type Ancestor = {
  id?: string;
  name?: string;
  relation: string;
  relation_key?: string;  // Önceden tanımlı ilişki anahtarı (anne, baba, teyze vb.)
  side: 'maternal' | 'paternal';
  diseases?: string[];
  events?: string[];
  unfulfilled_vows?: string[];
  sins_admitted?: string[];
  is_alive?: boolean;
  notes?: string;
};

export type AnimalVow = {
  animal: string;
  quantity?: number;
  fulfilled: boolean;
  issue?: string;
};

export type ActionVow = {
  action_type: string;
  description?: string;
  fulfilled: boolean;
};

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'erkek' | 'kadın';
  current_diseases: string[];
  symptoms: string[];
  life_events: string[];
  allergies: Allergy[];
  ancestors: Ancestor[];
  has_animals: boolean;
  animals_kept: string[];
  animal_vows: AnimalVow[];
  action_vows: ActionVow[];
  created_at: string;
};

export type ProfileCreate = Omit<Profile, 'id' | 'created_at'>;

export type CauseMatch = {
  category: string;
  category_label: string;
  weight: number;
  detail: string;
  source_side?: 'self' | 'maternal' | 'paternal' | null;
  source_relation?: string | null;
};

export type DiseaseMatch = {
  disease: string;
  category: string;
  matched_causes: CauseMatch[];
  total_score: number;
  remedy: string;
};

export type MindMapNode = {
  id: string;
  label: string;
  type: 'self' | 'ancestor';
  side: 'self' | 'maternal' | 'paternal';
  relation?: string;
  relation_key?: string;
  diseases?: string[];
  events?: string[];
  unfulfilled_vows?: string[];
  sins_admitted?: string[];
  allergies?: string[];
  vows?: string[];
};

export type MindMapEdge = { from: string; to: string; side: string };

export type AnalysisResult = {
  id: string;
  profile_id: string;
  matches: DiseaseMatch[];
  maternal_burden_score: number;
  paternal_burden_score: number;
  self_burden_score: number;
  dominant_categories: { category: string; label: string; score: number }[];
  llm_analysis?: string | null;
  mind_map?: { nodes: MindMapNode[]; edges: MindMapEdge[] };
  created_at: string;
};

export const api = {
  createProfile: (data: ProfileCreate) =>
    request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (id: string) => request<Profile>(`/profiles/${id}`),
  listProfiles: () => request<Profile[]>('/profiles'),
  deleteProfile: (id: string) => request<{ ok: boolean }>(`/profiles/${id}`, { method: 'DELETE' }),
  getAnalysis: (id: string) => request<AnalysisResult>(`/profiles/${id}/analysis`),
  reanalyze: (id: string) =>
    request<AnalysisResult>(`/profiles/${id}/analyze`, { method: 'POST' }),
  llmAnalysis: (id: string) =>
    request<{ llm_analysis: string; analysis_id: string }>(`/profiles/${id}/llm-analysis`, {
      method: 'POST',
    }),
  listDiseases: () => request<any[]>('/diseases'),
  listCauseCategories: () => request<Record<string, string>>('/cause-categories'),
};
