import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AssessPage from "./pages/AssessPage";
import LearningPage from "./pages/LearningPage";

function App() {
  const { user, loading } = useAuth();

  // Пока проверяем авторизацию — показываем загрузку
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Загрузка...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Если не залогинен — показываем LoginPage */}
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/assess" element={<AssessPage />} />
            <Route path="/learn" element={<LearningPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
