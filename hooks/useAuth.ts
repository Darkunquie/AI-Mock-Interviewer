"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/client/api";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signIn = async (email: string, password: string) => {
    const res = await apiFetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
    }
    return data;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const res = await apiFetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
    }
    return data;
  };

  const signOut = async () => {
    try {
      await apiFetch("/api/auth/signout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return {
    user,
    isLoading,
    isSignedIn: !!user,
    isAdmin: user?.role === "admin",
    signIn,
    signUp,
    signOut,
    refreshUser: fetchUser,
  };
}
