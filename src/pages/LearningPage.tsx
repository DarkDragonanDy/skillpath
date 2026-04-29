import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    skillName,
    level,
    plan,
    setPlan,
    currentLesson,
    setCurrentLesson,
    generating,
    setGenerating,
    courseId,
    setCourseId,
    completedLessons,
    setCompletedLessons,
    quizScores,
    setQuizScores,
    reset,
  } = useSkillStore();

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Redirect if no skill selected
  useEffect(() => {
    if (!skillName) {
      navigate("/");
      return;
    }

    // Generate plan if not loaded yet
    if (!plan && !generating) {
      setGenerating(true);
      generateLearningPlan(skillName, level).then(async (newPlan) => {
        setPlan(newPlan);
        setGenerating(false);
        // Save new course to Firestore
        if (user && !courseId) {
          const id = await saveCourse(user.uid, newPlan);
          setCourseId(id);
        }
      });
    }
  }, [skillName, plan, generating, level, navigate, setPlan, setGenerating, user, courseId, setCourseId]);

  // Navigate to a lesson
  const goToLesson = (index: number) => {
    setCurrentLesson(index);
    setShowQuiz(false);
    if (courseId) {
      updateCourseLesson(courseId, index);
    }
  };

  const handleNextLesson = () => {
    if (plan && currentLesson < plan.lessons.length - 1) {
      goToLesson(currentLesson + 1);
    }
  };

  const handlePrevLesson = () => {
    if (currentLesson > 0) {
      goToLesson(currentLesson - 1);
    }
  };

  // Start quiz for current lesson
  const handleStartQuiz = async () => {
    if (!plan) return;
    const lesson = plan.lessons[currentLesson];
    setLoadingQuiz(true);
    const questions = await generateQuiz(skillName, lesson.title, lesson.content);
    setQuizQuestions(questions);
    setLoadingQuiz(false);
    setShowQuiz(true);
  };

  // Quiz completed
  const handleQuizComplete = async (score: number) => {
    if (!plan || !courseId) return;
    const lesson = plan.lessons[currentLesson];

    // Save score
    const newScores = { ...quizScores, [lesson.id]: score };
    setQuizScores(newScores);
    await saveQuizScore(courseId, lesson.id, score, quizScores);

    // Mark lesson as completed if score >= 50%
    if (score >= 50) {
      const newCompleted = completedLessons.includes(currentLesson)
          ? completedLessons
          : [...completedLessons, currentLesson];
      setCompletedLessons(newCompleted);
      await completeLesson(courseId, currentLesson, completedLessons);
    }
  };

  const handleStartOver = () => {
    reset();
    navigate("/");
  };

  // Overall course progress
  const overallProgress =
      plan && plan.lessons.length > 0
          ? Math.round((completedLessons.length / plan.lessons.length) * 100)
          : 0;

  // Loading state
  if (generating || !plan) {
    return (
        <div style={styles.center}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>
              Generating learning plan for "{skillName}"...
            </p>
            <p style={styles.loadingHint}>
              Level:{" "}
              {level === "beginner"
                  ? "Beginner"
                  : level === "intermediate"
                      ? "Intermediate"
                      : "Advanced"}
            </p>
          </div>
        </div>
    );
  }

  const lesson = plan.lessons[currentLesson];
  const lessonScore = quizScores[lesson.id];
  const lessonCompleted = completedLessons.includes(currentLesson);

  return (
      <div style={styles.container}>
        {/* Header with progress */}
        <header style={styles.header}>
          <button onClick={handleStartOver} style={styles.backBtn}>
            ← My Courses
          </button>
          <span style={styles.headerTitle}>
          {skillName}
        </span>
          <div style={styles.headerProgress}>
            <div style={styles.headerProgressBar}>
              <div
                  style={{
                    ...styles.headerProgressFill,
                    width: `${overallProgress}%`,
                  }}
              />
            </div>
            <span style={styles.headerProgressText}>{overallProgress}%</span>
          </div>
        </header>

        <div style={styles.layout}>
          {/* Sidebar with lesson list */}
          <nav style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>Lessons</h3>
            {plan.lessons.map((l, i) => {
              const isCompleted = completedLessons.includes(i);
              const isCurrent = i === currentLesson;
              const score = quizScores[l.id];

              return (
                  <button
                      key={l.id}
                      onClick={() => goToLesson(i)}
                      style={{
                        ...styles.lessonBtn,
                        background: isCurrent ? "#e8f0fe" : "transparent",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                  >
                <span style={styles.lessonStatus}>
                  {isCompleted ? "✅" : `${i + 1}.`}
                </span>
                    <span style={styles.lessonBtnText}>{l.title}</span>
                    {score !== undefined && (
                        <span
                            style={{
                              ...styles.lessonScore,
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
          <main style={styles.content}>
            <div style={styles.lessonHeader}>
              <h1 style={styles.lessonTitle}>{lesson.title}</h1>
              {lessonCompleted && (
                  <span style={styles.completedBadge}>✅ Completed</span>
              )}
            </div>

            <div style={styles.lessonContent}>{lesson.content}</div>

            {/* Resources */}
            {lesson.resources.length > 0 && (
                <div style={styles.resources}>
                  <h3 style={styles.resourcesTitle}>📚 Resources</h3>
                  {lesson.resources.map((r: Resource, i: number) => (
                      <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.resourceLink}
                      >
                  <span style={styles.resourceType}>
                    {r.type === "video"
                        ? "🎬"
                        : r.type === "docs"
                            ? "📖"
                            : r.type === "tutorial"
                                ? "💻"
                                : "📄"}
                  </span>
                        {r.title}
                      </a>
                  ))}
                </div>
            )}

            {/* Quiz section */}
            {showQuiz ? (
                <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
            ) : (
                <div style={styles.quizPrompt}>
                  {lessonScore !== undefined ? (
                      <div style={styles.quizDone}>
                  <span>
                    Previous score: <strong>{lessonScore}%</strong>
                  </span>
                        <button onClick={handleStartQuiz} style={styles.retakeBtn}>
                          Retake Quiz
                        </button>
                      </div>
                  ) : (
                      <button
                          onClick={handleStartQuiz}
                          disabled={loadingQuiz}
                          style={styles.quizBtn}
                      >
                        {loadingQuiz ? "Generating quiz..." : "📝 Take Quiz to Complete Lesson"}
                      </button>
                  )}
                </div>
            )}

            {/* Lesson navigation */}
            <div style={styles.nav}>
              <button
                  onClick={handlePrevLesson}
                  disabled={currentLesson === 0}
                  style={{
                    ...styles.navBtn,
                    opacity: currentLesson === 0 ? 0.4 : 1,
                  }}
              >
                ← Previous
              </button>
              <span style={styles.navProgress}>
              {currentLesson + 1} / {plan.lessons.length}
            </span>
              <button
                  onClick={handleNextLesson}
                  disabled={currentLesson === plan.lessons.length - 1}
                  style={{
                    ...styles.navBtn,
                    ...styles.navBtnPrimary,
                    opacity:
                        currentLesson === plan.lessons.length - 1 ? 0.4 : 1,
                  }}
              >
                Next →
              </button>
            </div>
          </main>
        </div>
      </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    background: "white",
    borderRadius: 16,
    padding: 48,
    textAlign: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #e0e0e0",
    borderTopColor: "#4285f4",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 16px",
  },
  loadingText: {
    fontSize: 18,
    margin: "0 0 8px",
  },
  loadingHint: {
    fontSize: 14,
    color: "#999",
    margin: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 24px",
    background: "white",
    borderBottom: "1px solid #eee",
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    color: "#4285f4",
    padding: "6px 0",
    whiteSpace: "nowrap",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
    flex: 1,
  },
  headerProgress: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: 160,
  },
  headerProgressBar: {
    flex: 1,
    height: 6,
    background: "#e8e8e8",
    borderRadius: 3,
    overflow: "hidden",
  },
  headerProgressFill: {
    height: "100%",
    background: "#34a853",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  headerProgressText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#666",
    minWidth: 36,
  },
  layout: {
    display: "flex",
    maxWidth: 1000,
    margin: "0 auto",
    padding: 24,
    gap: 24,
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: 13,
    color: "#999",
    textTransform: "uppercase",
    margin: "0 0 12px",
    letterSpacing: 1,
  },
  lessonBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    textAlign: "left",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 4,
  },
  lessonStatus: {
    fontSize: 13,
    width: 24,
    flexShrink: 0,
  },
  lessonBtnText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  lessonScore: {
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    background: "white",
    borderRadius: 16,
    padding: "36px 40px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  lessonHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  lessonTitle: {
    fontSize: 28,
    margin: 0,
    fontWeight: 700,
    flex: 1,
  },
  completedBadge: {
    fontSize: 13,
    color: "#34a853",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  lessonContent: {
    fontSize: 16,
    lineHeight: 1.7,
    color: "#333",
    marginBottom: 32,
  },
  resources: {
    background: "#f8f9fa",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 32,
  },
  resourcesTitle: {
    fontSize: 16,
    margin: "0 0 12px",
  },
  resourceLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#4285f4",
    textDecoration: "none",
    fontSize: 14,
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  resourceType: {
    fontSize: 16,
  },
  quizPrompt: {
    marginBottom: 32,
  },
  quizBtn: {
    width: "100%",
    background: "#f0f4ff",
    border: "2px solid #c2d4f8",
    borderRadius: 12,
    padding: "16px 24px",
    fontSize: 16,
    cursor: "pointer",
    fontWeight: 500,
    color: "#4285f4",
    transition: "all 0.15s",
  },
  quizDone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f8f9fa",
    borderRadius: 12,
    padding: "14px 20px",
    fontSize: 15,
  },
  retakeBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "6px 16px",
    fontSize: 13,
    cursor: "pointer",
    color: "#666",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTop: "1px solid #eee",
  },
  navBtn: {
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    cursor: "pointer",
  },
  navBtnPrimary: {
    background: "#4285f4",
    color: "white",
    border: "none",
  },
  navProgress: {
    fontSize: 14,
    color: "#999",
  },
};