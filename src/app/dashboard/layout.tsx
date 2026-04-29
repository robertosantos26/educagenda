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

  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function loadRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Erro ao buscar perfil:", error.message);
      setRole("");
    } else {
      setRole(data?.role || "");
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  useEffect(() => {
    loadRole();
  }, []);

  if (loading) {
    return <div style={{ padding: 32 }}>Carregando...</div>;
  }

  const isAdmin = role === "admin" || role === "supervisor";
  const isTeacher = role === "teacher";
  const isGuardian = role === "guardian";

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <nav
        style={{
          padding: 20,
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/dashboard">Início</Link>

          {isAdmin && (
            <>
              <Link href="/dashboard/responsaveis">Responsáveis</Link>
              <Link href="/dashboard/turmas">Turmas</Link>
              <Link href="/dashboard/professores">Professores</Link>
              <Link href="/dashboard/criancas">Crianças</Link>
              <Link href="/dashboard/responsaveis">Responsáveis</Link>
              <Link href="/dashboard/relatorios">Relatórios</Link>
              <Link href="/dashboard/agenda">Agenda</Link>
            </>
          )}

          {isTeacher && (
            <>
              <Link href="/dashboard/minhas-turmas">Minhas turmas</Link>
              <Link href="/dashboard/agenda">Agenda</Link>
            </>
          )}

          {isGuardian && (
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

      <div style={{ padding: "8px 20px", background: "#f3f4f6" }}>
        Perfil carregado: <strong>{role || "nenhum"}</strong>
      </div>

      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
}
