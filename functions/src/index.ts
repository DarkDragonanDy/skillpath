import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import Anthropic from "@anthropic-ai/sdk";
import type {Response} from "express";

setGlobalOptions({maxInstances: 10});

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

// CORS headers
function setCors(res: Response) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
}

// Clean markdown wrappers from AI response before JSON parsing
function parseAIResponse(text: string): unknown {
    const clean = text
        .replace(/```json\s?/g, "")
        .replace(/```\s?/g, "")
        .trim();
    return JSON.parse(clean);
}

// ============================================
// Generate learning plan
// ============================================
export const generatePlan = onRequest(
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

            const {skillName, level} = req.body;
            if (!skillName) {
                res.status(400).json({error: "skillName is required"});
                return;
            }

            logger.info("Generating plan", {skillName, level});
            const client = new Anthropic({apiKey: anthropicKey.value()});

            const message = await client.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 16000,
                messages: [
                    {
                        role: "user",
                        content: `You are an experienced teacher. Create a learning plan for the skill "${skillName}".
Student level: ${level || "beginner"}.

Requirements:
1. Create 5-7 lessons, from simple to complex
2. Each lesson must contain:
   - Clear explanation of the topic with examples (3-5 paragraphs)
   - 2-3 links to real free resources (documentation, YouTube, articles, tutorials)
3. Use only real, verified links to well-known resources (MDN, Wikipedia, YouTube, official docs, freeCodeCamp, Khan Academy, etc.)
4. If unsure about a specific link — provide a search link for the topic

Respond STRICTLY in JSON format without markdown, without backticks, without any wrapping:
{
  "skillName": "${skillName}",
  "level": "${level || "beginner"}",
  "lessons": [
    {
      "id": "1",
      "title": "Lesson title",
      "content": "Detailed topic explanation (3-5 paragraphs with examples)",
      "resources": [
        {
          "title": "Resource name",
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

            const plan = parseAIResponse(textBlock.text);
            logger.info("Plan generated");
            res.status(200).json(plan);
        } catch (error) {
            logger.error("Error generating plan", error);
            res.status(500).json({error: "Failed to generate plan"});
        }
    }
);

// ============================================
// Generate assessment questions
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
                model: "claude-haiku-4-5-20251001",
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: `Create a smart questionnaire of 4-5 questions to determine a person's knowledge level in the skill "${skillName}".

Requirements:
1. First question — general experience level
2. Second — learning goals
3. The rest — specific topic questions to better determine level
4. Questions should be understandable even for beginners
5. Answer options from simple to complex

Respond STRICTLY in JSON format without markdown, without backticks, without any wrapping:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": -1
    }
  ]
}

For experience and goal questions set correctIndex: -1 (no correct answer).
For knowledge questions — set the correct answer index (0-3).`,
                    },
                ],
            });

            const textBlock = message.content.find((block) => block.type === "text");
            if (!textBlock || textBlock.type !== "text") {
                throw new Error("No text in response");
            }

            const result = parseAIResponse(textBlock.text);
            logger.info("Assessment generated");
            res.status(200).json(result);
        } catch (error) {
            logger.error("Error generating assessment", error);
            res.status(500).json({error: "Failed to generate assessment"});
        }
    }
);

// ============================================
// Generate quiz for a lesson
// ============================================
export const generateQuiz = onRequest(
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

            const {skillName, lessonTitle, lessonContent} = req.body;
            if (!skillName || !lessonTitle) {
                res.status(400).json({error: "skillName and lessonTitle required"});
                return;
            }

            logger.info("Generating quiz", {skillName, lessonTitle});
            const client = new Anthropic({apiKey: anthropicKey.value()});

            const message = await client.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: `Create a quiz of 3-4 questions to test understanding of the lesson "${lessonTitle}" in the skill "${skillName}".

Lesson content for context:
${lessonContent?.substring(0, 1000) || "No content provided"}

Requirements:
1. Questions should test understanding, not memorization
2. Each question has 4 options with exactly one correct answer
3. Include a brief explanation for the correct answer
4. Questions should range from basic to slightly challenging

Respond STRICTLY in JSON format without markdown, without backticks, without any wrapping:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
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

            const result = parseAIResponse(textBlock.text);
            logger.info("Quiz generated");
            res.status(200).json(result);
        } catch (error) {
            logger.error("Error generating quiz", error);
            res.status(500).json({error: "Failed to generate quiz"});
        }
    }
);