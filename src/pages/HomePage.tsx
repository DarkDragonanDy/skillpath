/**
 * SkillPath — Home Page
 * Written collaboratively by Andrej and Claude
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSkillStore } from "../store/skillStore";
import { useAuthStore } from "../store/authStore";
import { getUserCourses, deleteCourse } from "../services/firebase";
import { getDemoPlan } from "../services/ai";
import type { SavedCourse } from "../types/skill";

export default function HomePage() {
  const { user, logout } = useAuth();
  const { setSkillName, loadCourse, reset } = useSkillStore();
  const { user: authUser } = useAuthStore();
  const [input, setInput] = useState("");
  const [courses, setCourses] = useState<SavedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const navigate = useNavigate();

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

  const handleDemo = () => {
    reset();
    const plan = getDemoPlan();
    setSkillName(plan.skillName);
    useSkillStore.getState().setLevel(plan.level);
    useSkillStore.getState().setPlan(plan);
    navigate("/learn");
  };

  const handleResume = (course: SavedCourse) => {
    loadCourse(course);
    navigate("/learn");
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Delete this course?")) return;
    await deleteCourse(courseId);
    setCourses(courses.filter((c) => c.id !== courseId));
  };

  const getProgress = (course: SavedCourse): number => {
    const total = course.plan.lessons.length;
    if (total === 0) return 0;
    const completed = course.completedLessons?.length || 0;
    return Math.round((completed / total) * 100);
  };

  const levelLabel = (level: string) =>
    level === "beginner" ? "Beginner" : level === "intermediate" ? "Intermediate" : "Advanced";

  return (
    <div className="home-page">
      {/* Header */}
      <header className="app-header">
        <span className="app-logo">
          <Brain size={22} />
          SkillPath
        </span>
        <div className="app-header-right">
          <span className="app-user-name">{user?.displayName}</span>
          <button onClick={logout} className="app-logout-btn">
            Log out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="home-main">
        <h1 className="home-title">What do you want to learn?</h1>
        <p className="home-subtitle">
          Enter a skill name — AI will create a personalized learning plan
        </p>

        <div className="home-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Python, design, cooking..."
            className="home-input"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="home-submit-btn"
          >
            Start →
          </button>
        </div>

        <button onClick={handleDemo} className="home-demo-btn">
          Try Demo (no AI)
        </button>

        {/* Saved courses */}
        {!loadingCourses && courses.length > 0 && (
          <div className="courses-section">
            <h2 className="courses-title">My Courses</h2>
            <div className="courses-list">
              {courses.map((course) => {
                const progress = getProgress(course);
                return (
                  <div key={course.id} className="course-card">
                    <div className="course-info">
                      <h3 className="course-name">{course.plan.skillName}</h3>
                      <span className="course-level">{levelLabel(course.plan.level)}</span>
                      <span className="course-lessons-count">
                        {course.plan.lessons.length} lessons
                      </span>
                    </div>

                    <div className="course-progress">
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-pct">{progress}%</span>
                    </div>

                    <div className="course-actions">
                      <button
                        onClick={() => handleResume(course)}
                        className="course-resume-btn"
                      >
                        {progress === 0 ? "Start" : "Continue"}
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="course-delete-btn"
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
          <p className="loading-text">Loading your courses...</p>
        )}
      </main>
    </div>
  );
}
