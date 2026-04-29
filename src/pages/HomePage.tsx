import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSkillStore } from "../store/skillStore";
import { useAuthStore } from "../store/authStore";
import { getUserCourses, deleteCourse } from "../services/firebase";
import type { SavedCourse } from "../types/skill";

export default function HomePage() {
  const { user, logout } = useAuth();
  const { setSkillName, loadCourse, reset } = useSkillStore();
  const { user: authUser } = useAuthStore();
  const [input, setInput] = useState("");
  const [courses, setCourses] = useState<SavedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const navigate = useNavigate();

  // Load saved courses on mount
  useEffect(() => {
    if (authUser) {
      setLoadingCourses(true);
      getUserCourses(authUser.uid).then((data) => {
        setCourses(data);
        setLoadingCourses(false);
      });
    }
  }, [authUser]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    reset();
    setSkillName(input.trim());
    navigate("/assess");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  // Resume a saved course
  const handleResume = (course: SavedCourse) => {
    loadCourse(course);
    navigate("/learn");
  };

  // Delete a course
  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    await deleteCourse(courseId);
    setCourses(courses.filter((c) => c.id !== courseId));
  };

  // Calculate progress percentage
  const getProgress = (course: SavedCourse): number => {
    const total = course.plan.lessons.length;
    if (total === 0) return 0;
    const completed = course.completedLessons?.length || 0;
    return Math.round((completed / total) * 100);
  };

  return (
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <span style={styles.logo}>🎯 SkillLearn</span>
          <div style={styles.userBlock}>
            <span style={styles.userName}>{user?.displayName}</span>
            <button onClick={logout} style={styles.logoutBtn}>
              Log out
            </button>
          </div>
        </header>

        {/* Main content */}
        <main style={styles.main}>
          <h1 style={styles.title}>What do you want to learn?</h1>
          <p style={styles.subtitle}>
            Enter a skill name — AI will create a personalized learning plan
          </p>

          <div style={styles.inputRow}>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Python, design, cooking..."
                style={styles.input}
                autoFocus
            />
            <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                style={{
                  ...styles.submitBtn,
                  opacity: input.trim() ? 1 : 0.5,
                }}
            >
              Start →
            </button>
          </div>

          {/* Saved courses section */}
          {!loadingCourses && courses.length > 0 && (
              <div style={styles.coursesSection}>
                <h2 style={styles.coursesTitle}>My Courses</h2>
                <div style={styles.coursesList}>
                  {courses.map((course) => {
                    const progress = getProgress(course);
                    return (
                        <div key={course.id} style={styles.courseCard}>
                          <div style={styles.courseInfo}>
                            <h3 style={styles.courseName}>
                              {course.plan.skillName}
                            </h3>
                            <span style={styles.courseLevel}>
                        {course.plan.level === "beginner"
                            ? "Beginner"
                            : course.plan.level === "intermediate"
                                ? "Intermediate"
                                : "Advanced"}
                      </span>
                            <span style={styles.courseLessons}>
                        {course.plan.lessons.length} lessons
                      </span>
                          </div>

                          {/* Progress bar */}
                          <div style={styles.progressContainer}>
                            <div style={styles.progressBar}>
                              <div
                                  style={{
                                    ...styles.progressFill,
                                    width: `${progress}%`,
                                  }}
                              />
                            </div>
                            <span style={styles.progressText}>{progress}%</span>
                          </div>

                          {/* Actions */}
                          <div style={styles.courseActions}>
                            <button
                                onClick={() => handleResume(course)}
                                style={styles.resumeBtn}
                            >
                              {progress === 0 ? "Start" : "Continue"}
                            </button>
                            <button
                                onClick={() => handleDelete(course.id)}
                                style={styles.deleteBtn}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
          )}

          {loadingCourses && (
              <p style={styles.loadingText}>Loading your courses...</p>
          )}
        </main>
      </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "white",
    borderBottom: "1px solid #eee",
  },
  logo: {
    fontSize: 20,
    fontWeight: 600,
  },
  userBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: "#666",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
    color: "#666",
  },
  main: {
    maxWidth: 600,
    margin: "80px auto 0",
    textAlign: "center",
    padding: "0 24px 48px",
  },
  title: {
    fontSize: 36,
    margin: "0 0 12px",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    margin: "0 0 40px",
  },
  inputRow: {
    display: "flex",
    gap: 12,
  },
  input: {
    flex: 1,
    padding: "14px 20px",
    fontSize: 16,
    border: "2px solid #e0e0e0",
    borderRadius: 12,
    outline: "none",
  },
  submitBtn: {
    background: "#4285f4",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontSize: 16,
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  coursesSection: {
    marginTop: 56,
    textAlign: "left",
  },
  coursesTitle: {
    fontSize: 22,
    fontWeight: 600,
    margin: "0 0 20px",
  },
  coursesList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  courseCard: {
    background: "white",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  courseInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  courseLevel: {
    fontSize: 12,
    color: "#4285f4",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  courseLessons: {
    fontSize: 13,
    color: "#999",
  },
  progressContainer: {
    width: 140,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    background: "#e8e8e8",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#34a853",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#666",
    minWidth: 36,
  },
  courseActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  resumeBtn: {
    background: "#4285f4",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 500,
  },
  deleteBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    cursor: "pointer",
    color: "#999",
  },
  loadingText: {
    color: "#999",
    marginTop: 40,
  },
};