// Skill the user wants to learn
export interface Skill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: Date;
  userId: string;
}

// User progress for a skill
export interface UserProgress {
  skillId: string;
  completedLessons: string[];
  currentLesson: number;
  quizScores: number[];
}

// AI-generated learning plan
export interface LearningPlan {
  skillName: string;
  level: string;
  lessons: Lesson[];
}

// Single lesson in a plan
export interface Lesson {
  id: string;
  title: string;
  content: string;
  resources: Resource[];
}

// External resource (link to source)
export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "docs" | "tutorial";
}

// Assessment question for level detection
export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// Quiz question for a lesson
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Saved course in Firestore
export interface SavedCourse {
  id: string;
  userId: string;
  plan: LearningPlan;
  currentLesson: number;
  completedLessons: number[];
  quizScores: Record<string, number>; // lessonId -> score (0-100)
  createdAt: unknown;
  updatedAt: unknown;
}
