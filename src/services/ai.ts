/**
 * SkillPath — AI Service
 *
 * Frontend interface to the multi-agent Cloud Functions backend.
 * Written collaboratively: API integration by Claude, product flow by Andrej
 */
import type { LearningPlan, AssessmentQuestion, QuizQuestion } from "../types/skill";

export interface StudentProfile {
    level: "beginner" | "intermediate" | "advanced";
    goals: string;
    knowledgeGaps: string[];
    strengths: string[];
}

const ASSESS_LEVEL_URL = "https://assesslevel-m4gebfvvnq-uc.a.run.app";
const ANALYZE_ASSESSMENT_URL = "https://us-central1-skill-path-0001.cloudfunctions.net/analyzeAssessment";
const GENERATE_PLAN_AGENTIC_URL = "https://us-central1-skill-path-0001.cloudfunctions.net/generatePlanAgentic";
const GENERATE_QUIZ_URL = "https://generatequiz-m4gebfvvnq-uc.a.run.app";
const PING_URL = "https://us-central1-skill-path-0001.cloudfunctions.net/ping";
// ============================================
// Generate assessment questions (Assessor agent step 1)
// ============================================
export async function generateAssessment(
    skillName: string
): Promise<AssessmentQuestion[]> {
    try {
        const response = await fetch(ASSESS_LEVEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillName }),
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        return data.questions;
    } catch (error) {
        console.error("Error generating assessment:", error);
        return getFallbackQuestions(skillName);
    }
}

// ============================================
// Analyze assessment answers → student profile (Assessor agent step 2)
// ============================================
export async function analyzeAssessmentAnswers(
    skillName: string,
    questions: AssessmentQuestion[],
    answers: number[]
): Promise<StudentProfile> {
    try {
        const response = await fetch(ANALYZE_ASSESSMENT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillName, questions, answers }),
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error("Error analyzing assessment:", error);
        return {
            level: determineLevel(answers, questions) as StudentProfile["level"],
            goals: "Learn the fundamentals",
            knowledgeGaps: [],
            strengths: [],
        };
    }
}

// ============================================
// Rule-based level fallback (used when API is unavailable)
// ============================================
export function determineLevel(
    answers: number[],
    questions: AssessmentQuestion[]
): string {
    const experienceAnswer = answers[0];
    let correctCount = 0;
    let knowledgeQuestions = 0;

    questions.forEach((q, i) => {
        if (q.correctIndex >= 0 && i < answers.length) {
            knowledgeQuestions++;
            if (answers[i] === q.correctIndex) correctCount++;
        }
    });

    const knowledgeRatio = knowledgeQuestions > 0 ? correctCount / knowledgeQuestions : 0;

    if (experienceAnswer <= 1 && knowledgeRatio < 0.4) return "beginner";
    if (experienceAnswer <= 2 && knowledgeRatio < 0.7) return "intermediate";
    return "advanced";
}

// ============================================
// Generate learning plan via multi-agent orchestrator
// ============================================
export async function generateLearningPlan(
    skillName: string,
    level: string,
    studentProfile?: StudentProfile
): Promise<LearningPlan> {
    try {
        const response = await fetch(GENERATE_PLAN_AGENTIC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillName, level, studentProfile }),
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error("Error generating plan:", error);
        return getFallbackPlan(skillName, level);
    }
}

// ============================================
// Generate quiz for a lesson
// ============================================
export async function generateQuiz(
    skillName: string,
    lessonTitle: string,
    lessonContent: string
): Promise<QuizQuestion[]> {
    try {
        const response = await fetch(GENERATE_QUIZ_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillName, lessonTitle, lessonContent }),
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        return data.questions;
    } catch (error) {
        console.error("Error generating quiz:", error);
        return getFallbackQuiz();
    }
}

// ============================================
// Demo plan — hardcoded, zero tokens, for UI testing
// Written by Claude
// ============================================
export function getDemoPlan(): LearningPlan {
    return {
        skillName: "JavaScript",
        level: "beginner",
        lessons: [
            {
                id: "1",
                title: "Variables & Data Types",
                content: "JavaScript is a dynamically typed language, meaning variables can hold any type of value. You declare variables using let, const, or var. let and const are block-scoped and preferred in modern JS — use const when the value won't be reassigned, let otherwise.\n\nThe basic data types are: string ('hello'), number (42, 3.14), boolean (true/false), null, undefined, and object. Arrays and functions are also objects. You can check a type with the typeof operator: typeof 'hello' returns 'string'.\n\nUnderstanding the difference between null and undefined is important. undefined means a variable was declared but not assigned; null is an intentional empty value you set yourself.\n\nTemplate literals (backticks) let you embed expressions: `Hello, ${name}!`. They're far cleaner than string concatenation and support multi-line strings.",
                resources: [
                    { title: "MDN: JavaScript data types", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures", type: "docs" },
                    { title: "JavaScript Variables – freeCodeCamp", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", type: "tutorial" },
                    { title: "JavaScript Variables (YouTube)", url: "https://www.youtube.com/results?search_query=javascript+variables+beginners", type: "video" },
                ],
            },
            {
                id: "2",
                title: "Functions & Scope",
                content: "Functions are reusable blocks of code. You can define them with the function keyword or as arrow functions: const greet = (name) => `Hello, ${name}!`. Arrow functions are shorter and don't bind their own this.\n\nScope determines where a variable is accessible. Variables declared inside a function are local to it. Variables declared outside are in the global scope. Block scope (let/const) means a variable only exists within the {} where it was defined.\n\nClosures are a powerful concept: a function 'remembers' the variables from the scope where it was created, even after that scope has closed. This is used heavily in callbacks and event handlers.\n\nDefault parameters let you set fallback values: function greet(name = 'World') {}. This avoids having to check for undefined inside the function.",
                resources: [
                    { title: "MDN: Functions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions", type: "docs" },
                    { title: "JavaScript Scope – W3Schools", url: "https://www.w3schools.com/js/js_scope.asp", type: "article" },
                    { title: "JavaScript Functions Tutorial (YouTube)", url: "https://www.youtube.com/results?search_query=javascript+functions+scope", type: "video" },
                ],
            },
            {
                id: "3",
                title: "Arrays & Objects",
                content: "Arrays store ordered lists of values: const fruits = ['apple', 'banana', 'cherry']. Access items by index (fruits[0]). Key methods: push/pop (end), shift/unshift (start), map, filter, reduce for transformations.\n\nObjects store key-value pairs: const user = { name: 'Alex', age: 25 }. Access values with dot notation (user.name) or bracket notation (user['name']). You can nest objects and arrays inside each other.\n\nDestructuring lets you extract values cleanly: const { name, age } = user. Spread syntax (...) copies or merges: const newUser = { ...user, role: 'admin' }.\n\nArray methods like map() and filter() return new arrays without mutating the original — this immutable style is preferred in modern JavaScript and frameworks like React.",
                resources: [
                    { title: "MDN: Array methods", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array", type: "docs" },
                    { title: "JavaScript Arrays – freeCodeCamp", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/#basic-data-structures", type: "tutorial" },
                    { title: "Arrays & Objects (YouTube)", url: "https://www.youtube.com/results?search_query=javascript+arrays+objects+tutorial", type: "video" },
                ],
            },
        ],
    };
}

// ============================================
// Ping — check backend availability (no Claude call)
// Written by Claude
// ============================================
export async function pingBackend(): Promise<boolean> {
    try {
        const res = await fetch(PING_URL, { method: "GET" });
        return res.ok;
    } catch {
        return false;
    }
}

// ============================================
// Fallbacks
// ============================================
function getFallbackQuestions(skillName: string): AssessmentQuestion[] {
    return [
        {
            question: `How would you rate your experience with "${skillName}"?`,
            options: ["Never tried it", "Know the basics", "Use it regularly", "Can teach others"],
            correctIndex: -1,
        },
        {
            question: `What do you want to achieve by learning "${skillName}"?`,
            options: ["Understand the basics", "Build a project", "Career change", "Deepen knowledge"],
            correctIndex: -1,
        },
        {
            question: "How much time per week can you dedicate?",
            options: ["1-2 hours", "3-5 hours", "5-10 hours", "More than 10 hours"],
            correctIndex: -1,
        },
    ];
}

function getFallbackPlan(skillName: string, level: string): LearningPlan {
    return {
        skillName,
        level,
        lessons: [{
            id: "1",
            title: `Introduction to ${skillName}`,
            content: "AI generation temporarily unavailable. Please refresh the page.",
            resources: [{
                title: `Search materials on ${skillName}`,
                url: `https://www.google.com/search?q=${encodeURIComponent(skillName)}+tutorial`,
                type: "article",
            }],
        }],
    };
}

function getFallbackQuiz(): QuizQuestion[] {
    return [{
        question: "Quiz generation is temporarily unavailable. Please try again later.",
        options: ["OK", "Retry", "Skip", "Continue"],
        correctIndex: 0,
        explanation: "The AI service is currently unavailable.",
    }];
}
