import { create } from "zustand";
import type { LearningPlan, SavedCourse } from "../types/skill";

interface SkillState {
  // What the user typed
  skillName: string;
  setSkillName: (name: string) => void;

  // Level after assessment
  level: string;
  setLevel: (level: string) => void;

  // Generated learning plan
  plan: LearningPlan | null;
  setPlan: (plan: LearningPlan | null) => void;

  // Current lesson index
  currentLesson: number;
  setCurrentLesson: (index: number) => void;

  // Loading state while AI generates
  generating: boolean;
  setGenerating: (generating: boolean) => void;

  // Active course ID in Firestore
  courseId: string | null;
  setCourseId: (id: string | null) => void;

  // Completed lessons for current course
  completedLessons: number[];
  setCompletedLessons: (lessons: number[]) => void;

  // Quiz scores for current course
  quizScores: Record<string, number>;
  setQuizScores: (scores: Record<string, number>) => void;

  // Load a saved course into the store
  loadCourse: (course: SavedCourse) => void;

  // Reset everything (start over)
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

  courseId: null,
  setCourseId: (id) => set({ courseId: id }),

  completedLessons: [],
  setCompletedLessons: (lessons) => set({ completedLessons: lessons }),

  quizScores: {},
  setQuizScores: (scores) => set({ quizScores: scores }),

  // Restore a saved course into the store
  loadCourse: (course) =>
      set({
        skillName: course.plan.skillName,
        level: course.plan.level,
        plan: course.plan,
        currentLesson: course.currentLesson,
        courseId: course.id,
        completedLessons: course.completedLessons || [],
        quizScores: course.quizScores || {},
        generating: false,
      }),

  reset: () =>
      set({
        skillName: "",
        level: "",
        plan: null,
        currentLesson: 0,
        generating: false,
        courseId: null,
        completedLessons: [],
        quizScores: {},
      }),
}));
