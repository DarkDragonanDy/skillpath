import type { LearningPlan, AssessmentQuestion } from "../types/skill";

// Пока Cloud Functions не настроены — используем заглушки
// Потом заменим на реальные вызовы к Firebase Functions → Claude API

// Генерация вопросов для определения уровня
export async function generateAssessment(
  skillName: string
): Promise<AssessmentQuestion[]> {
  // TODO: заменить на вызов Cloud Function
  // const response = await fetch('/api/assessLevel', { ... })

  // Заглушка — 3 простых вопроса
  await fakeDelay(1000);

  return [
    {
      question: `Как бы вы оценили свой опыт в "${skillName}"?`,
      options: [
        "Никогда не пробовал",
        "Знаю основы",
        "Использую регулярно",
        "Могу обучать других",
      ],
      correctIndex: -1, // Нет правильного ответа — это опрос
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
      question: `Сколько времени в неделю вы готовы уделять?`,
      options: [
        "1-2 часа",
        "3-5 часов",
        "5-10 часов",
        "Больше 10 часов",
      ],
      correctIndex: -1,
    },
  ];
}

// Определение уровня по ответам
export function determineLevel(answers: number[]): string {
  const experienceAnswer = answers[0];
  if (experienceAnswer === 0) return "beginner";
  if (experienceAnswer === 1) return "intermediate";
  return "advanced";
}

// Генерация учебного плана
export async function generateLearningPlan(
  skillName: string,
  level: string
): Promise<LearningPlan> {
  // TODO: заменить на вызов Cloud Function
  // const response = await fetch('/api/generatePlan', {
  //   method: 'POST',
  //   body: JSON.stringify({ skillName, level })
  // })

  await fakeDelay(2000);

  // Заглушка — пример плана
  return {
    skillName,
    level,
    lessons: [
      {
        id: "1",
        title: `Введение в ${skillName}`,
        content: `Это первый урок по теме "${skillName}". Здесь будет контент, сгенерированный AI, с объяснениями и примерами. Пока это заглушка — после подключения Claude API тут появится настоящий учебный материал.`,
        resources: [
          {
            title: `${skillName} — Википедия`,
            url: `https://ru.wikipedia.org/wiki/${encodeURIComponent(skillName)}`,
            type: "article",
          },
          {
            title: `${skillName} для начинающих — YouTube`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName)}+для+начинающих`,
            type: "video",
          },
        ],
      },
      {
        id: "2",
        title: `Основные концепции ${skillName}`,
        content: `Второй урок углубляется в ключевые концепции. AI сгенерирует подробный разбор с практическими примерами.`,
        resources: [
          {
            title: `Документация по ${skillName}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(skillName)}+documentation`,
            type: "docs",
          },
        ],
      },
      {
        id: "3",
        title: `Практика: ${skillName}`,
        content: `Третий урок — практические задания. AI предложит упражнения и проверит понимание материала.`,
        resources: [
          {
            title: `Практические задания по ${skillName}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(skillName)}+practice+exercises`,
            type: "tutorial",
          },
        ],
      },
    ],
  };
}

// Утилита для имитации задержки сети
function fakeDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
