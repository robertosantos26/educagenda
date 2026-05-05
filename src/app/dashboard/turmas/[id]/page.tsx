"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(true);

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
    async function loadData() {
      if (!turmaId) return;

      setLoading(true);
      setMessage("");

      await Promise.all([loadTurma(), loadStudents()]);

      setLoading(false);
    }

    loadData();
  }, [turmaId]);

  return (
    <div>
      <div style={cardStyle}>
        <Link href="/dashboard/turmas" style={backLinkStyle}>
          ← Voltar para turmas
        </Link>

        <h1 style={pageTitle}>Turma: {turma?.name || "Carregando..."}</h1>
        <p style={subtitle}>
          Acompanhe todas as crianças vinculadas e acesse as agendas com um clique.
        </p>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitle}>Crianças da turma</h2>
          {!loading && students.length > 0 && (
            <span style={badgeStyle}>{students.length} cadastrada(s)</span>
          )}
        </div>

        {loading ? (
          <p style={emptyStyle}>Carregando crianças...</p>
        ) : students.length === 0 ? (
          <p style={emptyStyle}>Nenhuma criança cadastrada nesta turma.</p>
        ) : (
          <div style={studentsGridStyle}>
            {students.map((student) => (
              <article key={student.id} style={studentCardStyle}>
                <div style={studentTopStyle}>
                  <div style={emojiBoxStyle}>🧒</div>
                  <div>
                    <strong style={studentNameStyle}>{student.name}</strong>
                    <p style={studentMetaStyle}>
                      Nascimento: {student.birth_date || "Não informado"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/criancas/${student.id}/agendas`}
                  style={viewButtonStyle}
                >
                  Ver agendas registradas
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  marginBottom: 28,
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: 18,
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 600,
};

const pageTitle = {
  fontSize: 28,
  marginBottom: 6,
};

const subtitle = {
  color: "#6b7280",
  marginBottom: 0,
};

const messageStyle = {
  marginTop: 14,
  color: "#b91c1c",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
  flexWrap: "wrap" as const,
};

const sectionTitle = {
  fontSize: 20,
  marginBottom: 0,
};

const badgeStyle = {
  background: "#eef2ff",
  color: "#3730a3",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
};

const studentsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 14,
};

const studentCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
  background: "#fafafa",
};

const studentTopStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const emojiBoxStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: "#dbeafe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
};

const studentNameStyle = {
  display: "block",
  fontSize: 16,
  marginBottom: 4,
  color: "#111827",
};

const studentMetaStyle = {
  margin: 0,
  fontSize: 14,
  color: "#6b7280",
};

const viewButtonStyle = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  border: "1px solid #2563eb",
  color: "#2563eb",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 600,
};

const emptyStyle = {
  color: "#6b7280",
  marginBottom: 0,
};
