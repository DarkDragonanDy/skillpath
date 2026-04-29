import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSkillStore } from "../store/skillStore";
import { useAuthStore } from "../store/authStore";
import { generateLearningPlan, generateQuiz } from "../services/ai";
import {
  saveCourse,
  updateCourseLesson,
  completeLesson,
  saveQuizScore,
} from "../services/firebase";
import type { Resource, QuizQuestion } from "../types/skill";
import Quiz from "../components/quiz/Quiz";

export default function LearningPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    skillName, level, plan, setPlan,
    currentLesson, setCurrentLesson,
    generating, setGenerating,
    courseId, setCourseId,
    completedLessons, setCompletedLessons,
    quizScores, setQuizScores,
    reset,
  } = useSkillStore();

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  useEffect(() => {
    if (!skillName) { navigate("/"); return; }
    if (!plan && !generating) {
      setGenerating(true);
      generateLearningPlan(skillName, level).then(async (newPlan) => {
        setPlan(newPlan);
        setGenerating(false);
        if (user && !courseId) {
          const id = await saveCourse(user.uid, newPlan);
          setCourseId(id);
        }
      });
    }
  }, [skillName, plan, generating, level, navigate, setPlan, setGenerating, user, courseId, setCourseId]);

  const goToLesson = (index: number) => {
    setCurrentLesson(index);
    setShowQuiz(false);
    if (courseId) updateCourseLesson(courseId, index);
  };

  const handleNextLesson = () => {
    if (plan && currentLesson < plan.lessons.length - 1) goToLesson(currentLesson + 1);
  };

  const handlePrevLesson = () => {
    if (currentLesson > 0) goToLesson(currentLesson - 1);
  };

  const handleStartQuiz = async () => {
    if (!plan) return;
    const lesson = plan.lessons[currentLesson];
    setLoadingQuiz(true);
    const questions = await generateQuiz(skillName, lesson.title, lesson.content);
    setQuizQuestions(questions);
    setLoadingQuiz(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = async (score: number) => {
    if (!plan || !courseId) return;
    const lesson = plan.lessons[currentLesson];
    const newScores = { ...quizScores, [lesson.id]: score };
    setQuizScores(newScores);
    await saveQuizScore(courseId, lesson.id, score, quizScores);
    if (score >= 50) {
      const newCompleted = completedLessons.includes(currentLesson)
        ? completedLessons
        : [...completedLessons, currentLesson];
      setCompletedLessons(newCompleted);
      await completeLesson(courseId, currentLesson, completedLessons);
    }
  };

  const handleStartOver = () => { reset(); navigate("/"); };

  const overallProgress = plan && plan.lessons.length > 0
    ? Math.round((completedLessons.length / plan.lessons.length) * 100)
    : 0;

  const levelLabel = level === "beginner" ? "Beginner"
    : level === "intermediate" ? "Intermediate" : "Advanced";

  const resourceIcon = (type: string) =>
    type === "video" ? "🎬" : type === "docs" ? "📖" : type === "tutorial" ? "💻" : "📄";

  if (generating || !plan) {
    return (
      <div className="learning-loading-wrap">
        <div className="learning-loading-card">
          <div className="learning-spinner" />
          <p className="learning-loading-text">
            Generating learning plan for "{skillName}"...
          </p>
          <p className="learning-loading-hint">Level: {levelLabel}</p>
        </div>
      </div>
    );
  }

  const lesson = plan.lessons[currentLesson];
  const lessonScore = quizScores[lesson.id];
  const lessonCompleted = completedLessons.includes(currentLesson);

  return (
    <div className="learning-page">
      {/* Header */}
      <header className="learning-header">
        <button onClick={handleStartOver} className="learning-back-btn">
          <ArrowLeft size={16} />
          My Courses
        </button>
        <span className="learning-header-title">{skillName}</span>
        <div className="learning-header-progress">
          <div className="learning-header-bar">
            <div
              className="learning-header-bar-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="learning-header-pct">{overallProgress}%</span>
        </div>
      </header>

      <div className="learning-layout">
        {/* Sidebar */}
        <nav className="learning-sidebar">
          <h3 className="learning-sidebar-title">Lessons</h3>
          {plan.lessons.map((l, i) => {
            const isCompleted = completedLessons.includes(i);
            const isCurrent = i === currentLesson;
            const score = quizScores[l.id];
            return (
              <button
                key={l.id}
                onClick={() => goToLesson(i)}
                className={`lesson-nav-btn ${isCurrent ? "active" : ""}`}
              >
                <span className="lesson-nav-status">
                  {isCompleted ? "✅" : `${i + 1}.`}
                </span>
                <span className="lesson-nav-text">{l.title}</span>
                {score !== undefined && (
                  <span
                    className="lesson-nav-score"
                    style={{
                      color: score >= 80 ? "#34a853" : score >= 50 ? "#f9ab00" : "#ea4335",
                    }}
                  >
                    {score}%
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Lesson content */}
        <main className="lesson-content-area">
          <div className="lesson-content-header">
            <h1 className="lesson-content-title">{lesson.title}</h1>
            {lessonCompleted && (
              <span className="lesson-completed-badge">✅ Completed</span>
            )}
          </div>

          <div className="lesson-body">{lesson.content}</div>

          {/* Resources */}
          {lesson.resources.length > 0 && (
            <div className="lesson-resources-box">
              <h3 className="lesson-resources-title">📚 Resources</h3>
              {lesson.resources.map((r: Resource, i: number) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-link-item"
                >
                  <span>{resourceIcon(r.type)}</span>
                  {r.title}
                </a>
              ))}
            </div>
          )}

          {/* Quiz */}
          <div className="quiz-prompt-wrap">
            {showQuiz ? (
              <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
            ) : lessonScore !== undefined ? (
              <div className="quiz-done-row">
                <span>
                  Previous score: <strong>{lessonScore}%</strong>
                </span>
                <button onClick={handleStartQuiz} className="quiz-retake-btn">
                  Retake Quiz
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartQuiz}
                disabled={loadingQuiz}
                className="quiz-start-btn"
              >
                {loadingQuiz ? "Generating quiz..." : "📝 Take Quiz to Complete Lesson"}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="lesson-nav-controls">
            <button
              onClick={handlePrevLesson}
              disabled={currentLesson === 0}
              className="lesson-prev-btn"
            >
              ← Previous
            </button>
            <span className="lesson-nav-counter">
              {currentLesson + 1} / {plan.lessons.length}
            </span>
            <button
              onClick={handleNextLesson}
              disabled={currentLesson === plan.lessons.length - 1}
              className="lesson-next-btn"
            >
              Next →
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
