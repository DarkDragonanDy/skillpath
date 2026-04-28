// Скилл который пользователь хочет изучить
export interface Skill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: Date;
  userId: string;
}

// Прогресс пользователя по скиллу
export interface UserProgress {
  skillId: string;
  completedLessons: string[];
  currentLesson: number;
  quizScores: number[];
}

// Учебный план сгенерированный AI
export interface LearningPlan {
  skillName: string;
  level: string;
  lessons: Lesson[];
}

// Один урок в плане
export interface Lesson {
  id: string;
  title: string;
  content: string;
  resources: Resource[];
}

// Внешний ресурс (ссылка на источник)
export interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "docs" | "tutorial";
}

// Вопрос опросника для определения уровня
export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}
