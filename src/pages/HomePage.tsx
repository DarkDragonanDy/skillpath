import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSkillStore } from "../store/skillStore";

export default function HomePage() {
  const { user, logout } = useAuth();
  const { setSkillName } = useSkillStore();
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!input.trim()) return;
    setSkillName(input.trim());
    navigate("/assess");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={styles.container}>
      {/* Хедер с юзером */}
      <header style={styles.header}>
        <span style={styles.logo}>🎯 SkillLearn</span>
        <div style={styles.userBlock}>
          <span style={styles.userName}>{user?.displayName}</span>
          <button onClick={logout} style={styles.logoutBtn}>
            Выйти
          </button>
        </div>
      </header>

      {/* Основной контент */}
      <main style={styles.main}>
        <h1 style={styles.title}>Чему хотите научиться?</h1>
        <p style={styles.subtitle}>
          Напишите название навыка — AI создаст персональный план обучения
        </p>

        <div style={styles.inputRow}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: Python, дизайн, кулинария..."
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
            Начать →
          </button>
        </div>
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
    margin: "120px auto 0",
    textAlign: "center",
    padding: "0 24px",
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
};
