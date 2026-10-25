"use client";

import React, { useEffect, useState, useCallback } from "react";
import AuthView, { SessionUser } from "@/components/AuthView";
import DashboardView from "@/components/DashboardView";
import { Deployment } from "@/lib/db";

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [initializing, setInitializing] = useState(true);

  const fetchDeployments = useCallback(async () => {
    try {
      const res = await fetch("/api/deployments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments || []);
      }
    } catch (e) {
      console.error("Failed to fetch deployments:", e);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [authRes, depRes] = await Promise.all([
          fetch("/api/auth", { cache: "no-store" }),
          fetch("/api/deployments", { cache: "no-store" }),
        ]);
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.user) {
            setUser(authData.user);
          }
        }
        if (depRes.ok) {
          const depData = await depRes.json();
          setDeployments(depData.deployments || []);
        }
      } finally {
        setInitializing(false);
      }
    }
    bootstrap();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-400 flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-bold animate-pulse">
            ▲
          </div>
          <span>INITIALIZING VORTEX CONTROL PLANE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthView
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          fetchDeployments();
        }}
      />
    );
  }

  return (
    <DashboardView
      user={user}
      deployments={deployments}
      onRefresh={fetchDeployments}
      onLogout={handleLogout}
    />
  );
}
