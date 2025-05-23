import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { colors } from "../theme/colors";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      // error is handled by context
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${colors.lightGray} 60%, ${colors.white} 100%)`,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          padding: "48px 40px 40px 40px",
          background: colors.white,
          borderRadius: "18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/logo.png"
            alt="Izmir University of Economics Logo"
            style={{ height: "90px", marginBottom: "18px" }}
          />
          <h2 style={{ color: colors.orange, textAlign: "center", fontSize: "30px", fontWeight: 700 }}>Admin Login</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                transition: "border 0.2s ease"
              }}
              disabled={loading}
            />
          </div>
          <div style={{ marginBottom: "32px" }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                transition: "border 0.2s ease"
              }}
              disabled={loading}
            />
          </div>
          {error && (
            <div style={{
              background: '#ff4d4f',
              color: 'white',
              marginBottom: '16px',
              textAlign: 'center',
              padding: '12px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(255,77,79,0.10)'
            }}>
              <span style={{ fontSize: '20px', marginRight: '6px' }}>⚠️</span>
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              background: colors.orange,
              color: colors.white,
              fontWeight: 700,
              fontSize: "18px",
              borderRadius: "6px",
              border: "none",
              padding: "14px 0",
              marginTop: "16px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s ease, transform 0.1s ease",
              boxShadow: "0 2px 8px rgba(232, 119, 34, 0.3)",
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
