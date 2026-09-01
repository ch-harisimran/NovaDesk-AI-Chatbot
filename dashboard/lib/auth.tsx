"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "./api";
import type { AdminUser } from "./types";

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "novadesk_admin_token";
const ADMIN_KEY = "novadesk_admin_info";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ADMIN_KEY);
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (raw && token) setAdmin(JSON.parse(raw));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<{ token: string; admin: AdminUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    window.localStorage.setItem(TOKEN_KEY, res.token);
    window.localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin));
    setAdmin(res.admin);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_KEY);
    setAdmin(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
