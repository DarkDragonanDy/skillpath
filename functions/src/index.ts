import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import Anthropic from "@anthropic-ai/sdk";

setGlobalOptions({maxInstances: 10});

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

// CORS заголовки — разрешаем запросы с любого домена
function setCors(res: any) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================
// Генерация учебного плана
// ============================================
export const generatePlan = onRequest(
    {secrets: [anthropicKey]},
    async (req, res) => {
        setCors(res);

        // Preflight запрос — браузер сначала спрашивает разрешение
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        try {
            if (req.method !== "POST") {
                res.status(405).json({error: "Method not allowed"});
                return;
            }

            const {skillName, level} = req.body;

            if (!skillName) {
                res.status(400).json({error: "skillName is required"});
                return;
            }

            logger.info("Generating plan", {skillName, level});

            const client = new Anthropic({apiKey: anthropicKey.value()});

            const message = await client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                messages: [
                    {
                        role: "user",
                        content: `Ты — опытный преподаватель. Создай учебный план для изучения навыка "${skillName}".
Уровень ученика: ${level || "beginner"}.
 
Требования:
1. Создай 5-7 уроков, от простого к сложному
2. Каждый урок должен содержать:
   - Понятное объяснение темы с примерами
   - 2-3 ссылки на реальные бесплатные ресурсы (документация, YouTube, статьи, туториалы)
3. Используй только реальные, проверенные ссылки на известные ресурсы (MDN, Wikipedia, YouTube, официальная документация, freeCodeCamp, Khan Academy и т.д.)
4. Если не уверен в конкретной ссылке — дай ссылку на поиск по теме
 
Ответь СТРОГО в JSON формате без markdown, без backticks:
{
  "skillName": "${skillName}",
  "level": "${level || "beginner"}",
  "lessons": [
    {
      "id": "1",
      "title": "Название урока",
      "content": "Подробное объяснение темы (3-5 абзацев, с примерами)",
      "resources": [
        {
          "title": "Название ресурса",
          "url": "https://...",
          "type": "article | video | docs | tutorial"
        }
      ]
    }
  ]
}`,
                    },
                ],
            });

            const textBlock = message.content.find((block) => block.type === "text");
            if (!textBlock || textBlock.type !== "text") {
                throw new Error("No text in response");
            }

            const plan = JSON.parse(textBlock.text);

            logger.info("Plan generated", {lessons: plan.lessons?.length});
            res.status(200).json(plan);
        } catch (error) {
            logger.error("Error generating plan", error);
            res.status(500).json({error: "Failed to generate plan"});
        }
    }
);

// ============================================
// Генерация вопросов для оценки уровня
// ============================================
export const assessLevel = onRequest(
    {secrets: [anthropicKey]},
    async (req, res) => {
        setCors(res);

        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        try {
            if (req.method !== "POST") {
                res.status(405).json({error: "Method not allowed"});
                return;
            }

            const {skillName} = req.body;

            if (!skillName) {
                res.status(400).json({error: "skillName is required"});
                return;
            }

            logger.info("Generating assessment", {skillName});

            const client = new Anthropic({apiKey: anthropicKey.value()});

            const message = await client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: `Создай умный опросник из 4-5 вопросов для определения уровня знаний человека в навыке "${skillName}".
 
Требования:
1. Первый вопрос — общий об опыте
2. Второй — о целях изучения
3. Остальные — конкретные вопросы по теме, чтобы точнее определить уровень
4. Вопросы должны быть понятны и новичку
5. Варианты ответов от простого к сложному
 
Ответь СТРОГО в JSON формате без markdown, без backticks:
{
  "questions": [
    {
      "question": "Текст вопроса",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
      "correctIndex": -1
    }
  ]
}
 
Для вопросов об опыте и целях ставь correctIndex: -1 (нет правильного ответа).
Для вопросов на знание — ставь индекс правильного ответа (0-3).`,
                    },
                ],
            });

            const textBlock = message.content.find((block) => block.type === "text");
            if (!textBlock || textBlock.type !== "text") {
                throw new Error("No text in response");
            }

            const result = JSON.parse(textBlock.text);

            logger.info("Assessment generated", {
                questions: result.questions?.length,
            });
            res.status(200).json(result);
        } catch (error) {
            logger.error("Error generating assessment", error);
            res.status(500).json({error: "Failed to generate assessment"});
        }
    }
);