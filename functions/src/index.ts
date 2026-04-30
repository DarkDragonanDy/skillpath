import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import Anthropic from "@anthropic-ai/sdk";
import type {Response} from "express";

setGlobalOptions({maxInstances: 10});

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

const HAIKU = "claude-haiku-4-5-20251001";

// ============================================
// Internal agent types
// ============================================
interface StudentProfile {
    level: "beginner" | "intermediate" | "advanced";
    goals: string;
    knowledgeGaps: string[];
    strengths: string[];
}

interface LessonOutline {
    id: string;
    title: string;
    keyConcepts: string[];
    objectives: string;
}

interface LessonContent {
    id: string;
    title: string;
    content: string;
}

interface LessonResources {
    id: string;
    resources: Array<{title: string; url: string; type: string}>;
}

interface ReviewResult {
    approved: boolean;
    lessonIdsToRetry: string[];
}

// ============================================
// Utilities
// ============================================
function setCors(res: Response) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
}

function parseAIResponse(text: string): unknown {
    const clean = text
        .replace(/```json\s?/g, "")
        .replace(/```\s?/g, "")
        .trim();
    return JSON.parse(clean);
}

async function callAgent(
    client: Anthropic,
    maxTokens: number,
    prompt: string
): Promise<unknown> {
    const message = await client.messages.create({
        model: HAIKU,
        max_tokens: maxTokens,
        messages: [{role: "user", content: prompt}],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text in agent response");
    return parseAIResponse(textBlock.text);
}

// ============================================
// Agent: Curriculum Planner
// Creates lesson outlines — no content, just structure
// ============================================
async function curriculumPlannerAgent(
    client: Anthropic,
    skillName: string,
    level: string,
    profile: StudentProfile | null
): Promise<LessonOutline[]> {
    const profileContext = profile
        ? `Student goals: ${profile.goals}. Knowledge gaps: ${profile.knowledgeGaps.join(", ")}.`
        : "";

    const result = await callAgent(client, 1200, `You are a curriculum design expert.
Create a structured course outline for "${skillName}" at ${level} level.
${profileContext}

Create exactly 6 lessons, progressing from foundational to advanced.
DO NOT write lesson content — only titles, key concepts, and learning objective.

Respond ONLY in valid JSON, no markdown:
{
  "lessons": [
    {
      "id": "1",
      "title": "Lesson title",
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "objectives": "One sentence: what the student will be able to do after this lesson"
    }
  ]
}`) as {lessons: LessonOutline[]};

    return result.lessons;
}

// ============================================
// Agent: Content Generator (per lesson, runs in parallel)
// ============================================
async function contentGeneratorAgent(
    client: Anthropic,
    skillName: string,
    level: string,
    outline: LessonOutline
): Promise<LessonContent> {
    const result = await callAgent(client, 2000, `You are an expert teacher writing educational content.

Skill: "${skillName}" | Level: ${level}
Lesson: "${outline.title}"
Key concepts to cover: ${outline.keyConcepts.join(", ")}
Learning objective: ${outline.objectives}

Write 3-4 clear, practical paragraphs with concrete examples. Pitch the difficulty at ${level} level.

Respond ONLY in valid JSON, no markdown:
{
  "id": "${outline.id}",
  "title": "${outline.title}",
  "content": "Full lesson content here..."
}`) as LessonContent;

    return result;
}

// ============================================
// Agent: Resource Finder (per lesson, runs in parallel)
// ============================================
async function resourceFinderAgent(
    client: Anthropic,
    skillName: string,
    outline: LessonOutline
): Promise<LessonResources> {
    const result = await callAgent(client, 900, `You are an educational resource curator.

Skill: "${skillName}"
Lesson: "${outline.title}"
Key concepts: ${outline.keyConcepts.join(", ")}

Find exactly 2-3 free, high-quality resources. Use ONLY well-known sources you are certain exist:
MDN Web Docs, YouTube, official documentation, freeCodeCamp, Khan Academy, W3Schools, Wikipedia.
If unsure about a specific URL, use a google search link: https://www.google.com/search?q=...

Respond ONLY in valid JSON, no markdown:
{
  "id": "${outline.id}",
  "resources": [
    {
      "title": "Resource name",
      "url": "https://...",
      "type": "article | video | docs | tutorial"
    }
  ]
}`) as LessonResources;

    return result;
}

// ============================================
// Agent: Quality Reviewer
// Validates the assembled plan, flags weak lessons for retry
// ============================================
async function qualityReviewerAgent(
    client: Anthropic,
    skillName: string,
    level: string,
    lessons: Array<LessonContent & {resources: LessonResources["resources"]}>
): Promise<ReviewResult> {
    const summary = lessons.map((l) => ({
        id: l.id,
        title: l.title,
        contentLength: l.content.length,
        resourceCount: l.resources.length,
    }));

    const result = await callAgent(client, 600, `You are a curriculum quality reviewer.

Skill: "${skillName}" | Level: ${level}
Lessons summary: ${JSON.stringify(summary)}

Check each lesson for:
1. Content is substantial (contentLength >= 400 characters)
2. Has at least 2 resources
3. Title matches the skill and level

Mark lessons that fail as needing retry. Approve if all lessons pass.

Respond ONLY in valid JSON, no markdown:
{
  "approved": true,
  "lessonIdsToRetry": []
}`) as ReviewResult;

    return result;
}

// ============================================
// HTTP: assessLevel — Assessment question generator (unchanged)
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
                model: HAIKU,
                max_tokens: 2000,
                messages: [{
                    role: "user",
                    content: `Create a smart questionnaire of 4-5 questions to determine a person's knowledge level in the skill "${skillName}".

Requirements:
1. First question — general experience level
2. Second — learning goals
3. The rest — specific topic questions to better determine level
4. Questions should be understandable even for beginners
5. Answer options from simple to complex

Respond STRICTLY in JSON format without markdown:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": -1
    }
  ]
}

For experience and goal questions set correctIndex: -1. For knowledge questions set the correct answer index (0-3).`,
                }],
            });

            const textBlock = message.content.find((b) => b.type === "text");
            if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");

            res.status(200).json(parseAIResponse(textBlock.text));
        } catch (error) {
            logger.error("Error generating assessment", error);
            res.status(500).json({error: "Failed to generate assessment"});
        }
    }
);

// ============================================
// HTTP: analyzeAssessment — Assessor agent
// Analyzes quiz answers → structured student profile
// ============================================
export const analyzeAssessment = onRequest(
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
            const {skillName, questions, answers} = req.body;
            if (!skillName || !questions || !answers) {
                res.status(400).json({error: "skillName, questions and answers are required"});
                return;
            }
            logger.info("Analyzing assessment", {skillName});
            const client = new Anthropic({apiKey: anthropicKey.value()});

            const qa = questions.map((q: {question: string; options: string[]}, i: number) => ({
                question: q.question,
                answer: q.options[answers[i]] ?? "no answer",
            }));

            const profile = await callAgent(client, 800, `You are an expert educational assessor.

Skill being learned: "${skillName}"
Student's answers:
${qa.map((item: {question: string; answer: string}, i: number) => `${i + 1}. Q: ${item.question}\n   A: ${item.answer}`).join("\n")}

Analyze the answers and determine the student's profile.

Respond ONLY in valid JSON, no markdown:
{
  "level": "beginner | intermediate | advanced",
  "goals": "One sentence summarizing what the student wants to achieve",
  "knowledgeGaps": ["gap1", "gap2"],
  "strengths": ["strength1"]
}`) as StudentProfile;

            logger.info("Assessment analyzed", {level: profile.level});
            res.status(200).json(profile);
        } catch (error) {
            logger.error("Error analyzing assessment", error);
            res.status(500).json({error: "Failed to analyze assessment"});
        }
    }
);

// ============================================
// HTTP: generatePlanAgentic — Multi-agent orchestrator
// Planner → (ContentGenerator ‖ ResourceFinder) → Reviewer → Plan
// ============================================
export const generatePlanAgentic = onRequest(
    {secrets: [anthropicKey], timeoutSeconds: 120},
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
            const {skillName, level, studentProfile} = req.body;
            if (!skillName) {
                res.status(400).json({error: "skillName is required"});
                return;
            }
            const resolvedLevel = level || studentProfile?.level || "beginner";
            logger.info("Starting agentic plan generation", {skillName, level: resolvedLevel});

            const client = new Anthropic({apiKey: anthropicKey.value()});

            // Agent 1: Curriculum Planner → lesson outlines
            logger.info("Agent 1: Curriculum Planner running");
            const outlines = await curriculumPlannerAgent(client, skillName, resolvedLevel, studentProfile ?? null);

            // Agent 2+3: Content Generator and Resource Finder in parallel per lesson
            logger.info("Agents 2+3: Content and Resource agents running in parallel", {lessons: outlines.length});
            const [contentResults, resourceResults] = await Promise.all([
                Promise.all(outlines.map((o) => contentGeneratorAgent(client, skillName, resolvedLevel, o))),
                Promise.all(outlines.map((o) => resourceFinderAgent(client, skillName, o))),
            ]);

            // Assemble lessons
            const resourceMap = new Map(resourceResults.map((r) => [r.id, r.resources]));
            let lessons = contentResults.map((c) => ({
                ...c,
                resources: resourceMap.get(c.id) ?? [],
            }));

            // Agent 5: Quality Reviewer
            logger.info("Agent 5: Quality Reviewer running");
            const review = await qualityReviewerAgent(client, skillName, resolvedLevel, lessons);

            // Retry weak lessons once
            if (!review.approved && review.lessonIdsToRetry.length > 0) {
                logger.info("Reviewer requested retry", {lessonIds: review.lessonIdsToRetry});
                const retryOutlines = outlines.filter((o) => review.lessonIdsToRetry.includes(o.id));
                const retried = await Promise.all(
                    retryOutlines.map((o) => contentGeneratorAgent(client, skillName, resolvedLevel, o))
                );
                const retriedMap = new Map(retried.map((r) => [r.id, r]));
                lessons = lessons.map((l) => {
                    const updated = retriedMap.get(l.id);
                    return updated ? {...updated, resources: l.resources} : l;
                });
            }

            const plan = {skillName, level: resolvedLevel, lessons};
            logger.info("Agentic plan generated", {lessonCount: lessons.length});
            res.status(200).json(plan);
        } catch (error) {
            logger.error("Error in agentic plan generation", error);
            res.status(500).json({error: "Failed to generate plan"});
        }
    }
);

// ============================================
// HTTP: generateQuiz — Quiz generator for a lesson (unchanged)
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
                model: HAIKU,
                max_tokens: 2000,
                messages: [{
                    role: "user",
                    content: `Create a quiz of 3-4 questions to test understanding of the lesson "${lessonTitle}" in the skill "${skillName}".

Lesson content for context:
${lessonContent?.substring(0, 1000) || "No content provided"}

Requirements:
1. Questions should test understanding, not memorization
2. Each question has 4 options with exactly one correct answer
3. Include a brief explanation for the correct answer

Respond STRICTLY in JSON format without markdown:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation"
    }
  ]
}`,
                }],
            });

            const textBlock = message.content.find((b) => b.type === "text");
            if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");

            res.status(200).json(parseAIResponse(textBlock.text));
        } catch (error) {
            logger.error("Error generating quiz", error);
            res.status(500).json({error: "Failed to generate quiz"});
        }
    }
);
