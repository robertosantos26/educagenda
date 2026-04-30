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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const [teacherChildrenCount, setTeacherChildrenCount] = useState(0);
  const [teacherReportsTodayCount, setTeacherReportsTodayCount] = useState(0);
  const [teacherPendingTodayCount, setTeacherPendingTodayCount] = useState(0);

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("id, name, role, school_id")
      .eq("id", user.id)
      .single();

    return data || null;
  }

  async function loadAdminDashboard(profile: any) {
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

    const { count: unreadMessages } = await supabase
      .from("parent_messages")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id)
      .eq("read_by_admin", false)
      .eq("read_by_teacher", false);

    setChildrenCount(children || 0);
    setTeachersCount(teachers || 0);
    setClassesCount(classes || 0);
    setReportsTodayCount(reportsToday || 0);
    setUnreadMessagesCount(unreadMessages || 0);
  }

  async function loadTeacherDashboard(profile: any) {
    const today = new Date().toISOString().split("T")[0];

    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("auth_user_id", profile.id)
      .single();

    if (!teacher?.id) return;

    const { data: links } = await supabase
      .from("teacher_class_links")
      .select("class_id")
      .eq("teacher_id", teacher.id);

    const classIds = links?.map((item) => item.class_id) || [];

    if (classIds.length === 0) {
      setTeacherChildrenCount(0);
      setTeacherReportsTodayCount(0);
      setTeacherPendingTodayCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    const { data: students } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", profile.school_id)
      .eq("active", true)
      .in("class_id", classIds);

    const studentIds = students?.map((student) => student.id) || [];
    const totalChildren = studentIds.length;

    if (studentIds.length === 0) {
      setTeacherChildrenCount(0);
      setTeacherReportsTodayCount(0);
      setTeacherPendingTodayCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    const { count: reportsToday } = await supabase
      .from("daily_reports")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id)
      .eq("report_date", today)
      .in("student_id", studentIds);

    const { count: unreadMessages } = await supabase
      .from("parent_messages")
      .select("*", { count: "exact", head: true })
      .eq("school_id", profile.school_id)
      .eq("read_by_admin", false)
      .eq("read_by_teacher", false)
      .in("student_id", studentIds);

    const doneToday = reportsToday || 0;
    const pendingToday = Math.max(totalChildren - doneToday, 0);

    setTeacherChildrenCount(totalChildren);
    setTeacherReportsTodayCount(doneToday);
    setTeacherPendingTodayCount(pendingToday);
    setUnreadMessagesCount(unreadMessages || 0);
  }

  async function loadDashboard() {
    const profile = await getProfile();

    if (!profile?.school_id) return;

    setName(profile.name || "");
    setRole(profile.role || "");

    if (profile.role === "teacher") {
      await loadTeacherDashboard(profile);
      return;
    }

    await loadAdminDashboard(profile);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const isTeacher = role === "teacher";

  return (
    <div>
      <div style={heroCardStyle}>
        <div>
          <p style={eyebrowStyle}>Painel Educagenda</p>
          <h1 style={titleStyle}>Olá, {name || "usuário"} 👋</h1>
          <p style={subtitleStyle}>
            {isTeacher
              ? "Acompanhe suas crianças, agendas e mensagens dos responsáveis."
              : "Acompanhe os principais números da escola e acesse rapidamente as áreas do sistema."}
          </p>
        </div>

        <div style={profileBadgeStyle}>
          Perfil: <strong>{role || "carregando..."}</strong>
        </div>
      </div>

      {isTeacher ? (
        <>
          <div style={gridStyle}>
            <DashboardCard
              emoji="👶"
              title="Minhas crianças"
              value={teacherChildrenCount}
              description="Crianças das suas turmas"
              href="/dashboard/minhas-turmas"
              color="#2563eb"
              background="#eff6ff"
            />

            <DashboardCard
              emoji="✅"
              title="Agendas feitas hoje"
              value={teacherReportsTodayCount}
              description="Agendas já registradas"
              href="/dashboard/agenda"
              color="#16a34a"
              background="#f0fdf4"
            />

            <DashboardCard
              emoji="⏳"
              title="Faltam hoje"
              value={teacherPendingTodayCount}
              description="Crianças ainda sem agenda"
              href="/dashboard/agenda"
              color="#ea580c"
              background="#fff7ed"
            />

            <DashboardCard
              emoji="💬"
              title="Mensagens não lidas"
              value={unreadMessagesCount}
              description="Recados dos pais ainda pendentes"
              href="/dashboard/mensagens"
              color="#dc2626"
              background="#fef2f2"
            />
          </div>

          <div style={quickActionsCardStyle}>
            <h2 style={sectionTitleStyle}>Atalhos rápidos</h2>

            <div style={quickActionsGridStyle}>
              <QuickAction href="/dashboard/agenda" label="Preencher agenda" />
              <QuickAction href="/dashboard/minhas-turmas" label="Ver minhas turmas" />
              <QuickAction href="/dashboard/mensagens" label="Ver mensagens dos pais" />
            </div>
          </div>
        </>
      ) : (
        <>
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
              href="/dashboard/agenda"
              color="#ea580c"
              background="#fff7ed"
            />

            <DashboardCard
              emoji="💬"
              title="Mensagens não lidas"
              value={unreadMessagesCount}
              description="Recados dos pais ainda pendentes"
              href="/dashboard/mensagens"
              color="#dc2626"
              background="#fef2f2"
            />
          </div>

          <div style={quickActionsCardStyle}>
            <h2 style={sectionTitleStyle}>Atalhos rápidos</h2>

            <div style={quickActionsGridStyle}>
              <QuickAction href="/dashboard/agenda" label="Preencher agenda" />
              <QuickAction href="/dashboard/criancas" label="Cadastrar criança" />
              <QuickAction href="/dashboard/professores" label="Cadastrar professor" />
              <QuickAction href="/dashboard/turmas" label="Cadastrar turma" />
              <QuickAction href="/dashboard/mensagens" label="Ver mensagens dos pais" />
            </div>
          </div>
        </>
      )}
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
        <div style={{ ...emojiBoxStyle, background, color }}>{emoji}</div>

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
