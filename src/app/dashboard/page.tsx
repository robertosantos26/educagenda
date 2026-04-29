"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const [childrenCount, setChildrenCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  const [reportsTodayCount, setReportsTodayCount] = useState(0);

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("name, role, school_id")
      .eq("id", user.id)
      .single();

    return data || null;
  }

  async function loadDashboard() {
    const profile = await getProfile();

    if (!profile?.school_id) return;

    setName(profile.name || "");
    setRole(profile.role || "");

    const today = new Date().toISOString().split("T")[0];

    const { count: children } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id);

    const { count: teachers } = await supabase
      .from("teachers")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id);

    const { count: classes } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id);

    const { count: reportsToday } = await supabase
      .from("daily_reports")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id)
      .eq("report_date", today);

    setChildrenCount(children || 0);
    setTeachersCount(teachers || 0);
    setClassesCount(classes || 0);
    setReportsTodayCount(reportsToday || 0);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      <div style={heroCardStyle}>
        <div>
          <p style={eyebrowStyle}>Painel Educagenda</p>
          <h1 style={titleStyle}>
            Olá, {name || "usuário"} 👋
          </h1>
          <p style={subtitleStyle}>
            Acompanhe os principais números da escola e acesse rapidamente as áreas do sistema.
          </p>
        </div>

        <div style={profileBadgeStyle}>
          Perfil: <strong>{role || "carregando..."}</strong>
        </div>
      </div>

      <div style={gridStyle}>
        <DashboardCard
          emoji="👶"
          title="Crianças"
          value={childrenCount}
          description="Alunos cadastrados na escola"
          href="/dashboard/criancas"
          color="#2563eb"
          background="#eff6ff"
        />

        <DashboardCard
          emoji="👩‍🏫"
          title="Professores"
          value={teachersCount}
          description="Professores cadastrados"
          href="/dashboard/professores"
          color="#16a34a"
          background="#f0fdf4"
        />

        <DashboardCard
          emoji="🏫"
          title="Turmas"
          value={classesCount}
          description="Turmas cadastradas"
          href="/dashboard/turmas"
          color="#9333ea"
          background="#faf5ff"
        />

        <DashboardCard
          emoji="📅"
          title="Agendas hoje"
          value={reportsTodayCount}
          description="Agendas registradas hoje"
          href="/dashboard/agenda-turma"
          color="#ea580c"
          background="#fff7ed"
        />
      </div>

      <div style={quickActionsCardStyle}>
        <h2 style={sectionTitleStyle}>Atalhos rápidos</h2>

        <div style={quickActionsGridStyle}>
          <QuickAction href="/dashboard/agenda-turma" label="Preencher agenda por turma" />
          <QuickAction href="/dashboard/criancas" label="Cadastrar criança" />
          <QuickAction href="/dashboard/professores" label="Cadastrar professor" />
          <QuickAction href="/dashboard/turmas" label="Cadastrar turma" />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  emoji,
  title,
  value,
  description,
  href,
  color,
  background,
}: {
  emoji: string;
  title: string;
  value: number;
  description: string;
  href: string;
  color: string;
  background: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={dashboardCardStyle}>
        <div
          style={{
            ...emojiBoxStyle,
            background,
            color,
          }}
        >
          {emoji}
        </div>

        <p style={cardTitleStyle}>{title}</p>

        <h2 style={{ ...cardValueStyle, color }}>{value}</h2>

        <p style={cardDescriptionStyle}>{description}</p>
      </div>
    </Link>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={quickActionStyle}>
      {label}
    </Link>
  );
}

const heroCardStyle = {
  background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
  borderRadius: 22,
  padding: 32,
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  marginBottom: 28,
  boxShadow: "0 12px 30px rgba(37, 99, 235, 0.25)",
};

const eyebrowStyle = {
  margin: 0,
  fontSize: 13,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  opacity: 0.85,
  fontWeight: 700,
};

const titleStyle = {
  fontSize: 32,
  margin: "10px 0 8px",
};

const subtitleStyle = {
  maxWidth: 620,
  margin: 0,
  opacity: 0.92,
  lineHeight: 1.5,
};

const profileBadgeStyle = {
  background: "rgba(255,255,255,0.16)",
  padding: "10px 14px",
  borderRadius: 999,
  fontSize: 14,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 18,
  marginBottom: 28,
};

const dashboardCardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  minHeight: 190,
  transition: "0.2s",
};

const emojiBoxStyle = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 26,
  marginBottom: 18,
};

const cardTitleStyle = {
  margin: 0,
  color: "#6b7280",
  fontWeight: 700,
};

const cardValueStyle = {
  fontSize: 38,
  margin: "8px 0",
};

const cardDescriptionStyle = {
  margin: 0,
  color: "#6b7280",
  fontSize: 14,
};

const quickActionsCardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

const sectionTitleStyle = {
  fontSize: 20,
  marginBottom: 18,
};

const quickActionsGridStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12,
};

const quickActionStyle = {
  padding: "12px 16px",
  borderRadius: 12,
  background: "#f3f4f6",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 700,
};
