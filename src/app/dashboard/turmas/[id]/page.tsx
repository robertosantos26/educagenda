"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  birth_date: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

export default function TurmaDetalhePage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [turma, setTurma] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");

  async function loadTurma() {
    if (!turmaId) return;

    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("id", turmaId)
      .single();

    if (error) {
      setMessage("Erro ao carregar turma: " + error.message);
      return;
    }

    setTurma(data);
  }

  async function loadRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(data?.role || "");
  }

  async function loadStudents() {
    if (!turmaId) return;

    const { data, error } = await supabase
      .from("students")
      .select("id, name, birth_date")
      .eq("class_id", turmaId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar crianças: " + error.message);
      return;
    }

    setStudents(data || []);
  }

  useEffect(() => {
    if (turmaId) {
      loadRole();
      loadTurma();
      loadStudents();
    }
  }, [turmaId]);

  const backHref = role === "teacher" ? "/dashboard/minhas-turmas" : "/dashboard/turmas";

  return (
    <div style={pageStyle}>
      <div style={headerCardStyle}>
        <Link href={backHref} style={backLinkStyle}>
          ← Voltar
        </Link>

        <h1 style={titleStyle}>{turma ? turma.name : "Carregando turma..."}</h1>
        <p style={subtitleStyle}>Crianças vinculadas à turma e acesso rápido às agendas.</p>
      </div>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Crianças da turma</h2>
          <span style={countBadgeStyle}>{students.length} criança(s)</span>
        </div>

        {message && <p style={messageStyle}>{message}</p>}

        {students.length === 0 ? (
          <p style={emptyStyle}>Nenhuma criança cadastrada nesta turma.</p>
        ) : (
          <div style={studentsGridStyle}>
            {students.map((student) => (
              <article key={student.id} style={studentCardStyle}>
                <div style={avatarStyle}>{student.name.charAt(0).toUpperCase()}</div>
                <strong style={studentNameStyle}>{student.name}</strong>
                <p style={studentMetaStyle}>Nascimento: {student.birth_date || "Não informado"}</p>

                <Link href={`/dashboard/criancas/${student.id}/agendas`} style={agendaLinkStyle}>
                  Ver agendas registradas
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const pageStyle = {
  display: "grid",
  gap: 20,
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

const headerCardStyle = {
  ...cardStyle,
  display: "grid",
  gap: 10,
};

const backLinkStyle = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 700,
  width: "fit-content",
};

const titleStyle = {
  fontSize: 28,
  margin: 0,
};

const subtitleStyle = {
  color: "#6b7280",
  margin: 0,
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 20,
  flexWrap: "wrap" as const,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 22,
};

const countBadgeStyle = {
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
};

const studentsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 14,
};

const studentCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 8,
};

const avatarStyle = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#dbeafe",
  color: "#1d4ed8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
};

const studentNameStyle = {
  fontSize: 16,
};

const studentMetaStyle = {
  color: "#6b7280",
  fontSize: 14,
  margin: 0,
};

const agendaLinkStyle = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
};

const messageStyle = {
  marginBottom: 12,
  color: "#374151",
};

const emptyStyle = {
  color: "#6b7280",
};
