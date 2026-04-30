import type { LearningPlan, AssessmentQuestion, QuizQuestion } from "../types/skill";

export interface StudentProfile {
    level: "beginner" | "intermediate" | "advanced";
    goals: string;
    knowledgeGaps: string[];
    strengths: string[];
}

const BASE = "https://{FUNCTION_NAME}-m4gebfvvnq-uc.a.run.app";
const fn = (name: string) => BASE.replace("{FUNCTION_NAME}", name);

const ASSESS_LEVEL_URL = fn("assesslevel");
const ANALYZE_ASSESSMENT_URL = fn("analyzeassessment");
const GENERATE_PLAN_AGENTIC_URL = fn("generateplanagentic");
const GENERATE_QUIZ_URL = fn("generatequiz");

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
