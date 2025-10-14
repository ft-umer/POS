"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface User {
  _id?: string;
  username: string;
  role: "superadmin" | "admin";
  site?: string;
  pin?: string;
  lastLogin?: string;
  lastLogout?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, password: string, pin?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  users: User[];
  fetchUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "https://pos-backend-kappa.vercel.app"; // backend URL

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // ✅ On mount, restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // ✅ Login
  const login = async (username: string, password: string, pin?: string) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password, pin });
      setUser(res.data.user);
      setToken(res.data.token);
      setIsAuthenticated(true);

      // Save session
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      return true;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  // ✅ Logout
  const logout = async () => {
    if (!token) return;
    try {
      await axios.post(`${API_BASE}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn("Logout error", err);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // ✅ Fetch all users (superadmin only)
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users failed", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, login, logout, loading, users, fetchUsers }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
