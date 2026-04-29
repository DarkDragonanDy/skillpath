import type {LearningPlan, AssessmentQuestion} from "../types/skill";

// =============================================
// НАСТРОЙКА: замени на URL твоих Cloud Functions
// после деплоя Firebase покажет URLs в терминале
// =============================================
const GENERATE_PLAN_URL = "https://generateplan-m4gebfvvnq-uc.a.run.app";
const ASSESS_LEVEL_URL = "https://assesslevel-m4gebfvvnq-uc.a.run.app";
// ============================================
// Генерация вопросов для определения уровня
// ============================================
export async function generateAssessment(
    skillName: string
): Promise<AssessmentQuestion[]> {
  try {
    const response = await fetch(ASSESS_LEVEL_URL,  {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({skillName}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error("Ошибка генерации опросника:", error);
    // Возвращаем базовые вопросы если AI недоступен
    return getFallbackQuestions(skillName);
  }
}

// ============================================
// Определение уровня по ответам
// ============================================
export function determineLevel(
    answers: number[],
    questions: AssessmentQuestion[]
): string {
  // Первый вопрос — самооценка опыта
  const experienceAnswer = answers[0];

  // Считаем правильные ответы на вопросы со знаниями
  let correctCount = 0;
  let knowledgeQuestions = 0;

  questions.forEach((q, i) => {
    if (q.correctIndex >= 0 && i < answers.length) {
      knowledgeQuestions++;
      if (answers[i] === q.correctIndex) {
        correctCount++;
      }
    }
  });

  // Комбинируем самооценку и реальные знания
  const knowledgeRatio =
      knowledgeQuestions > 0 ? correctCount / knowledgeQuestions : 0;

  if (experienceAnswer <= 1 && knowledgeRatio < 0.4) return "beginner";
  if (experienceAnswer <= 2 && knowledgeRatio < 0.7) return "intermediate";
  return "advanced";
}

// ============================================
// Генерация учебного плана
// ============================================
export async function generateLearningPlan(
    skillName: string,
    level: string
): Promise<LearningPlan> {
  try {
    const response = await fetch(GENERATE_PLAN_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({skillName, level}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const plan: LearningPlan = await response.json();
    return plan;
  } catch (error) {
    console.error("Ошибка генерации плана:", error);
    // Возвращаем заглушку если AI недоступен
    return getFallbackPlan(skillName, level);
  }
}

// ============================================
// Запасные данные если AI недоступен
// ============================================
function getFallbackQuestions(skillName: string): AssessmentQuestion[] {
  return [
    {
      question: `Как бы вы оценили свой опыт в "${skillName}"?`,
      options: [
        "Никогда не пробовал",
        "Знаю основы",
        "Использую регулярно",
        "Могу обучать других",
      ],
      correctIndex: -1,
    },
    {
      question: `Что вы хотите достичь, изучая "${skillName}"?`,
      options: [
        "Понять основы",
        "Сделать свой проект",
        "Сменить профессию",
        "Углубить знания",
      ],
      correctIndex: -1,
    },
    {
      question: "Сколько времени в неделю вы готовы уделять?",
      options: ["1-2 часа", "3-5 часов", "5-10 часов", "Больше 10 часов"],
      correctIndex: -1,
    },
  ];
}

function getFallbackPlan(skillName: string, level: string): LearningPlan {
  return {
    skillName,
    level,
    lessons: [
      {
        id: "1",
        title: `Введение в ${skillName}`,
        content:
            "AI-генерация временно недоступна. Попробуйте обновить страницу.",
        resources: [
          {
            title: `Поиск материалов по ${skillName}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(skillName)}+tutorial`,
            type: "article",
          },
        ],
      },
    ],
  };
}