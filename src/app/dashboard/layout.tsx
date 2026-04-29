"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState("");

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

    setRole(data?.role || "");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  useEffect(() => {
    loadRole();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      <aside
        style={{
          width: 260,
          minHeight: "100vh",
          background: "#1f2937",
          color: "white",
          position: "fixed",
          left: 0,
          top: 0,
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Educagenda</h1>
        <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 32 }}>
          Agenda escolar infantil
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <MenuLink href="/dashboard">Início</MenuLink>

          {(role === "admin" || role === "supervisor") && (
            <>
              <MenuLink href="/dashboard/turmas">Turmas</MenuLink>
              <MenuLink href="/dashboard/professores">Professores</MenuLink>
              <MenuLink href="/dashboard/criancas">Crianças</MenuLink>
              <MenuLink href="/dashboard/agenda">Agenda</MenuLink>
              <MenuLink href="/dashboard/relatorios">Relatórios</MenuLink>
            </>
          )}

          {role === "teacher" && (
            <>
              <MenuLink href="/dashboard/minhas-turmas">Minhas turmas</MenuLink>
              <MenuLink href="/dashboard/agenda">Agenda</MenuLink>
            </>
          )}

          {role === "guardian" && (
            <MenuLink href="/dashboard/meu-filho">Meu filho</MenuLink>
          )}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 40,
            width: "100%",
            padding: "12px 16px",
            border: "none",
            borderRadius: 10,
            background: "#ef4444",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Sair
        </button>
      </aside>

      <main
        style={{
          marginLeft: 260,
          padding: 32,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 32,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function MenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: "white",
        textDecoration: "none",
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.08)",
        fontSize: 15,
      }}
    >
      {children}
    </Link>
  );
}
