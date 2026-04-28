import { create } from "zustand";
import type {LearningPlan} from "../types/skill";

interface SkillState {
  // Что пользователь ввёл
  skillName: string;
  setSkillName: (name: string) => void;

  // Уровень после опросника
  level: string;
  setLevel: (level: string) => void;

  // Сгенерированный учебный план
  plan: LearningPlan | null;
  setPlan: (plan: LearningPlan | null) => void;

  // Текущий урок
  currentLesson: number;
  setCurrentLesson: (index: number) => void;

  // Загрузка (пока AI генерирует)
  generating: boolean;
  setGenerating: (generating: boolean) => void;

  // Сброс всего (начать заново)
  reset: () => void;
}

export const useSkillStore = create<SkillState>((set) => ({
  skillName: "",
  setSkillName: (name) => set({ skillName: name }),

  level: "",
  setLevel: (level) => set({ level }),

  plan: null,
  setPlan: (plan) => set({ plan }),

  currentLesson: 0,
  setCurrentLesson: (index) => set({ currentLesson: index }),

  generating: false,
  setGenerating: (generating) => set({ generating }),

  reset: () =>
    set({
      skillName: "",
      level: "",
      plan: null,
      currentLesson: 0,
      generating: false,
    }),
}));
