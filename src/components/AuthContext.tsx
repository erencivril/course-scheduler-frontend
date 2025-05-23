import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { loginAdmin } from "../services/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("accessToken"));
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await loginAdmin(email, password);
      localStorage.setItem("accessToken", token);
      setIsAuthenticated(true);
    } catch (err: any) {
      let msg = "Login failed";
      if (err && typeof err === "object") {
        if (typeof err.message === "string") {
          if (err.message.includes("Invalid credentials")) {
            msg = "Invalid email or password.";
          } else {
            msg = err.message;
          }
        } else if (typeof err.message === "object") {
          msg = JSON.stringify(err.message);
        } else {
          msg = JSON.stringify(err);
        }
      } else if (typeof err === "string") {
        msg = err;
      }
      setError(msg);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
