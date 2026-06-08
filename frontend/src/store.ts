import { create } from 'zustand';
import type { Ancestor, AnimalVow, ActionVow, Allergy, ProfileCreate } from './api';

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

  set: (partial: Partial<OnboardingState>) => void;
  reset: () => void;
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
