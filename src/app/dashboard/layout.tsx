"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Role = "admin" | "supervisor" | "teacher" | "guardian" | null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);

  async function loadRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(data?.role || null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  useEffect(() => {
    loadRole();
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <nav
        style={{
          padding: 20,
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: 20,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/dashboard">Início</Link>

          {(role === "admin" || role === "supervisor") && (
            <>
              <Link href="/dashboard/turmas">Turmas</Link>
              <Link href="/dashboard/professores">Professores</Link>
              <Link href="/dashboard/criancas">Crianças</Link>
              <Link href="/dashboard/relatorios">Relatórios</Link>
              <Link href="/dashboard/responsaveis">Responsáveis</Link>
            </>
          )}

          {role === "teacher" && (
            <>
              <Link href="/dashboard/minhas-turmas">Minhas turmas</Link>
            </>
          )}

          {(role === "admin" || role === "supervisor" || role === "teacher") && (
            <Link href="/dashboard/agenda">Agenda</Link>
          )}
          {role === "guardian" && (
  <Link href="/dashboard/meu-filho">Meu filho</Link>
)}
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            background: "#dc2626",
            color: "white",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </nav>

      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
}
