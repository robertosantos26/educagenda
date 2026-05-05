"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

export default function MinhasTurmasPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMyClasses() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!teacher?.id) {
      setMessage("Professor não encontrado.");
      setLoading(false);
      return;
    }

    const { data: links, error } = await supabase
      .from("teacher_class_links")
      .select("class_id, classes(id, name)")
      .eq("teacher_id", teacher.id);

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      setLoading(false);
      return;
    }

    const mapped =
      links?.map((item: any) => ({
        id: item.classes.id,
        name: item.classes.name,
      })) || [];

    setClasses(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadMyClasses();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <h1 style={pageTitle}>Minhas turmas</h1>
        <p style={subtitle}>
          Acesse as turmas vinculadas ao seu perfil e veja rapidamente as crianças de cada uma.
        </p>
        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Turmas vinculadas</h2>

        {loading ? (
          <p style={emptyStyle}>Carregando turmas...</p>
        ) : classes.length === 0 ? (
          <p style={emptyStyle}>Nenhuma turma vinculada ao seu usuário.</p>
        ) : (
          <div style={classesGridStyle}>
            {classes.map((item) => (
              <article key={item.id} style={classCardStyle}>
                <div style={classTopRowStyle}>
                  <div style={emojiBoxStyle}>🏫</div>
                  <div>
                    <strong style={classNameStyle}>{item.name}</strong>
                    <p style={classSubTextStyle}>Turma vinculada ao professor</p>
                  </div>
                </div>

                <Link href={`/dashboard/turmas/${item.id}`} style={viewButtonStyle}>
                  Ver crianças da turma
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

const sectionTitle = {
  fontSize: 20,
  marginBottom: 18,
};

const classesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 14,
};

const classCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
  background: "#fafafa",
};

const classTopRowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
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

const classNameStyle = {
  display: "block",
  fontSize: 16,
  marginBottom: 4,
  color: "#111827",
};

const classSubTextStyle = {
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
