"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

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
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/dashboard">Início</Link>
          <Link href="/dashboard/turmas">Turmas</Link>
          <Link href="/dashboard/professores">Professores</Link>
          <Link href="/dashboard/criancas">Crianças</Link>
          <Link href="/dashboard/agenda">Agenda</Link>
          <Link href="/dashboard/relatorios">Relatórios</Link>
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
