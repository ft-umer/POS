"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
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
  login: (username: string, password: string, pin: string) => boolean;
  logout: () => void;
  users: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // ✅ Load or initialize users once
  useEffect(() => {
    const storedUsers = localStorage.getItem("pos_users");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const demoUsers: User[] = [
        { username: "superadmin", role: "superadmin" },
        { username: "admin1", role: "admin", site: "Site1", pin: "1111" },
        { username: "admin2", role: "admin", site: "Site2", pin: "2222" },
        { username: "admin3", role: "admin", site: "Site3", pin: "3333" },
      ];
      localStorage.setItem("pos_users", JSON.stringify(demoUsers));
      setUsers(demoUsers);
    }

    const currentUser = localStorage.getItem("pos_user");
    const authFlag = localStorage.getItem("pos_auth") === "true";

    if (authFlag && currentUser) {
      setUser(JSON.parse(currentUser));
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  // ✅ Login
  const login = (username: string, password: string, pin: string) => {
    const now = new Date().toISOString();
    const foundUser = users.find((u) => u.username === username);

    if (!foundUser) {
      console.warn(`❌ Login failed: User "${username}" not found`);
      return false;
    }

    if (foundUser.role === "superadmin" && password === "123456") {
      const updatedSuperadmin = { ...foundUser, lastLogin: now, lastLogout: "" };
      updateUsers(username, updatedSuperadmin);
      setUser(updatedSuperadmin);
      setIsAuthenticated(true);
      console.log(`🟢 SUPERADMIN "${username}" logged in at ${now}`);
      return true;
    }

    if (foundUser.role === "admin" && password === "123456" && pin === foundUser.pin) {
      const updatedAdmin = { ...foundUser, lastLogin: now, lastLogout: "" };
      updateUsers(username, updatedAdmin);
      setUser(updatedAdmin);
      setIsAuthenticated(true);
      console.log(`🟢 ADMIN "${username}" logged in at ${now}`);
      return true;
    }

    console.warn(`❌ Login failed for "${username}"`);
    return false;
  };

  // ✅ Logout
  const logout = () => {
    if (!user) return;
    const now = new Date().toISOString();

    const updatedUser = { ...user, lastLogout: now };
    updateUsers(user.username, updatedUser);

    console.log(`🔴 ${user.role.toUpperCase()} "${user.username}" logged out at ${now}`);

    setUser(null);
    setIsAuthenticated(false);
    localStorage.setItem("pos_auth", "false");
    localStorage.removeItem("pos_user");

    // 🔄 trigger update for AdminList
    window.dispatchEvent(new Event("storage"));
  };

  // ✅ Helper: Update users array + storage in one place
  const updateUsers = (username: string, updatedUser: User) => {
    const updatedList = users.map((u) => (u.username === username ? updatedUser : u));
    setUsers(updatedList);
    localStorage.setItem("pos_users", JSON.stringify(updatedList));
    localStorage.setItem("pos_user", JSON.stringify(updatedUser));
    localStorage.setItem("pos_auth", "true");

    // 🔄 notify listeners (AdminList)
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, users, loading }}
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
