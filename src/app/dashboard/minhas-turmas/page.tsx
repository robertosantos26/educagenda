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

  async function loadMyClasses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      return;
    }

    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!teacher?.id) {
      setMessage("Professor não encontrado.");
      return;
    }

    const { data: links, error } = await supabase
      .from("teacher_class_links")
      .select("class_id, classes(id, name)")
      .eq("teacher_id", teacher.id);

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      return;
    }

    const mapped =
      links?.map((item: any) => ({
        id: item.classes.id,
        name: item.classes.name,
      })) || [];

    setClasses(mapped);
  }

  useEffect(() => {
    loadMyClasses();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <h1 style={pageTitleStyle}>Minhas turmas</h1>
        <p style={subtitleStyle}>
          Acesse as turmas vinculadas ao seu usuário e abra rapidamente a lista de crianças.
        </p>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Turmas vinculadas</h2>

        {classes.length === 0 ? (
          <p style={emptyStyle}>Nenhuma turma vinculada ao seu usuário.</p>
        ) : (
          <div style={classesGridStyle}>
            {classes.map((item) => (
              <article key={item.id} style={classCardStyle}>
                <div style={classHeaderStyle}>
                  <div style={emojiBoxStyle}>🏫</div>
                  <div>
                    <strong style={classNameStyle}>{item.name}</strong>
                    <p style={classSubTextStyle}>Turma vinculada ao seu perfil</p>
                  </div>
                </div>

                <Link href={`/dashboard/turmas/${item.id}`} style={viewButtonStyle}>
                  Ver crianças
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

const pageTitleStyle = {
  fontSize: 28,
  margin: "0 0 6px",
};

const subtitleStyle = {
  color: "#6b7280",
  margin: 0,
};

const sectionTitleStyle = {
  fontSize: 22,
  marginTop: 0,
  marginBottom: 18,
};

const messageStyle = {
  marginTop: 16,
  color: "#374151",
};

const emptyStyle = {
  color: "#6b7280",
};

const classesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 16,
};

const classCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 14,
};

const classHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const emojiBoxStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 19,
};

const classNameStyle = {
  fontSize: 16,
};

const classSubTextStyle = {
  margin: "4px 0 0",
  color: "#6b7280",
  fontSize: 13,
};

const viewButtonStyle = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#2563eb",
  color: "white",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
};
