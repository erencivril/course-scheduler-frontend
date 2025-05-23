import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { GlobalStyle } from "./theme/global";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import { useAuth } from "./components/AuthContext";
import { colors } from "./theme/colors";
import CoursesPage from "./pages/CoursesPage";

const Header: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        background: colors.white,
        borderBottom: `2px solid ${colors.orange}`,
        padding: "0 32px",
        height: "80px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        maxWidth: "1200px", 
        width: "100%", 
        margin: "0 auto",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="Izmir University of Economics Logo"
            style={{ height: "56px", marginRight: "24px" }}
          />
          <h1 style={{ 
            color: colors.orange, 
            fontSize: "28px", 
            margin: 0, 
            fontWeight: 700,
            textShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}>
            IEU Course Scheduler
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center" }}>
          <nav style={{ 
            display: "flex", 
            alignItems: "center"
          }}>
            <Link 
              to="/dashboard" 
              style={{ 
                margin: "0 16px", 
                color: colors.darkGray,
                fontWeight: 600,
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = colors.lightGray;
                e.currentTarget.style.color = colors.orange;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.darkGray;
              }}
            >
              Dashboard
            </Link>
            <Link 
              to="/courses" 
              style={{ 
                margin: "0 16px", 
                color: colors.darkGray,
                fontWeight: 600,
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = colors.lightGray;
                e.currentTarget.style.color = colors.orange;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.darkGray;
              }}
            >
              Courses
            </Link>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "16px",
                background: "transparent",
                color: colors.orange,
                border: `2px solid ${colors.orange}`,
                borderRadius: "6px",
                padding: "10px 24px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "none",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = colors.orange;
                e.currentTarget.style.color = colors.white;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.orange;
              }}
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <GlobalStyle />
      {isAuthenticated && <Header />}
      <div style={{
        minHeight: isAuthenticated ? "calc(100vh - 80px)" : "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isAuthenticated ? "flex-start" : "center",
        background: colors.lightGray,
      }}>
        <main style={{
          width: "100%",
          maxWidth: "1400px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <PrivateRoute>
                  <CoursesPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
      {isAuthenticated && (
        <footer style={{
          textAlign: "center",
          padding: "24px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.white,
          color: colors.darkGray,
          fontSize: "14px"
        }}>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} Izmir University of Economics - Course Scheduler
          </p>
        </footer>
      )}
    </BrowserRouter>
  );
}

export default App;
