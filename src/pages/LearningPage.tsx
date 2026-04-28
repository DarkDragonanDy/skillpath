import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSkillStore } from "../store/skillStore";
import { useAuthStore } from "../store/authStore";
import { generateLearningPlan } from "../services/ai";
import { savePlan, saveProgress } from "../services/firebase";
import type { Resource } from "../types/skill";

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
    reset,
  } = useSkillStore();

  // Если нет скилла — вернуться
  useEffect(() => {
    if (!skillName) {
      navigate("/");
      return;
    }

    // Генерируем план если его ещё нет
    if (!plan && !generating) {
      setGenerating(true);
      generateLearningPlan(skillName, level).then((newPlan) => {
        setPlan(newPlan);
        setGenerating(false);
        // Сохраняем в Firestore
        if (user) {
          savePlan(user.uid, newPlan);
        }
      });
    }
  }, [skillName, plan, generating, level, navigate, setPlan, setGenerating, user]);

  const handleNextLesson = () => {
    if (plan && currentLesson < plan.lessons.length - 1) {
      const next = currentLesson + 1;
      setCurrentLesson(next);
      if (user) {
        saveProgress(user.uid, skillName, next);
      }
    }
  };

  const handlePrevLesson = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    }
  };

  const handleStartOver = () => {
    reset();
    navigate("/");
  };

  // Загрузка
  if (generating || !plan) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>
            Генерируем учебный план для «{skillName}»...
          </p>
          <p style={styles.loadingHint}>
            Уровень: {level === "beginner" ? "начинающий" : level === "intermediate" ? "средний" : "продвинутый"}
          </p>
        </div>
      </div>
    );
  }

  const lesson = plan.lessons[currentLesson];

  return (
    <div style={styles.container}>
      {/* Хедер */}
      <header style={styles.header}>
        <button onClick={handleStartOver} style={styles.backBtn}>
          ← Новый скилл
        </button>
        <span style={styles.headerTitle}>
          {skillName} — {level === "beginner" ? "начинающий" : level === "intermediate" ? "средний" : "продвинутый"}
        </span>
      </header>

      <div style={styles.layout}>
        {/* Боковая навигация по урокам */}
        <nav style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Уроки</h3>
          {plan.lessons.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setCurrentLesson(i)}
              style={{
                ...styles.lessonBtn,
                background: i === currentLesson ? "#e8f0fe" : "transparent",
                fontWeight: i === currentLesson ? 600 : 400,
              }}
            >
              {i + 1}. {l.title}
            </button>
          ))}
        </nav>

        {/* Контент урока */}
        <main style={styles.content}>
          <h1 style={styles.lessonTitle}>{lesson.title}</h1>
          <div style={styles.lessonContent}>{lesson.content}</div>

          {/* Ссылки на ресурсы */}
          {lesson.resources.length > 0 && (
            <div style={styles.resources}>
              <h3 style={styles.resourcesTitle}>📚 Полезные ресурсы</h3>
              {lesson.resources.map((r: Resource, i: number) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.resourceLink}
                >
                  <span style={styles.resourceType}>
                    {r.type === "video" ? "🎬" : r.type === "docs" ? "📖" : r.type === "tutorial" ? "💻" : "📄"}
                  </span>
                  {r.title}
                </a>
              ))}
            </div>
          )}

          {/* Навигация между уроками */}
          <div style={styles.nav}>
            <button
              onClick={handlePrevLesson}
              disabled={currentLesson === 0}
              style={{
                ...styles.navBtn,
                opacity: currentLesson === 0 ? 0.4 : 1,
              }}
            >
              ← Назад
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
                opacity: currentLesson === plan.lessons.length - 1 ? 0.4 : 1,
              }}
            >
              Далее →
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
  },
  headerTitle: {
    fontSize: 14,
    color: "#666",
  },
  layout: {
    display: "flex",
    maxWidth: 1000,
    margin: "0 auto",
    padding: 24,
    gap: 24,
  },
  sidebar: {
    width: 240,
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
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 4,
  },
  content: {
    flex: 1,
    background: "white",
    borderRadius: 16,
    padding: "36px 40px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  lessonTitle: {
    fontSize: 28,
    margin: "0 0 24px",
    fontWeight: 700,
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
