"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string;
  created_at: string;
};

export default function TurmasPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getSchoolId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    return profile?.school_id || null;
  }

  async function loadClasses() {
    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      return;
    }

    setClasses(data || []);
  }

  function openCreateForm() {
    setEditingClassId(null);
    setClassName("");
    setShowForm(true);
    setMessage("");
  }

  function openEditForm(item: ClassItem) {
    setEditingClassId(item.id);
    setClassName(item.name);
    setShowForm(true);
    setMessage("");
  }

  async function saveClass() {
    setMessage("");

    if (!className.trim()) {
      setMessage("Digite o nome da turma.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    if (editingClassId) {
      const { error } = await supabase
        .from("classes")
        .update({
          name: className.trim(),
        })
        .eq("id", editingClassId);

      if (error) {
        setMessage("Erro ao atualizar turma: " + error.message);
        setLoading(false);
        return;
      }

      setMessage("Turma atualizada com sucesso.");
    } else {
      const { error } = await supabase.from("classes").insert({
        name: className.trim(),
        school_id: schoolId,
      });

      if (error) {
        setMessage("Erro ao cadastrar turma: " + error.message);
        setLoading(false);
        return;
      }

      setMessage("Turma cadastrada com sucesso.");
    }

    setClassName("");
    setEditingClassId(null);
    setShowForm(false);

    await loadClasses();

    setLoading(false);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={pageTitle}>Turmas</h1>
            <p style={subtitle}>
              Organize as turmas da escola e acesse rapidamente as crianças vinculadas.
            </p>
          </div>

          <button onClick={openCreateForm} style={addButtonStyle}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Nova turma
          </button>
        </div>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            {editingClassId ? "Editar turma" : "Cadastrar turma"}
          </h2>

          <input
            type="text"
            placeholder="Ex: Maternal 1, Jardim A..."
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveClass} disabled={loading} style={buttonPrimary}>
              {loading
                ? "Salvando..."
                : editingClassId
                ? "Salvar alterações"
                : "Cadastrar turma"}
            </button>

            <button
              onClick={() => {
                setClassName("");
                setEditingClassId(null);
                setShowForm(false);
              }}
              style={buttonSecondary}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Turmas cadastradas</h2>

        {classes.length === 0 ? (
          <p style={emptyStyle}>Nenhuma turma cadastrada ainda.</p>
        ) : (
          <div style={classesGridStyle}>
            {classes.map((item) => (
              <div key={item.id} style={classCardStyle}>
                <div style={classTopRowStyle}>
                  <div style={emojiBoxStyle}>🏫</div>

                  <div>
                    <strong style={classNameStyle}>{item.name}</strong>
                    <p style={classSubTextStyle}>Turma cadastrada no sistema</p>
                  </div>
                </div>

                <div style={actionsStyle}>
                  <Link
                    href={`/dashboard/turmas/${item.id}`}
                    style={viewButtonStyle}
                  >
                    Ver crianças
                  </Link>

                  <button
                    onClick={() => openEditForm(item)}
                    style={editButtonStyle}
                  >
                    Editar turma
                  </button>
                </div>
              </div>
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

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap" as const,
};

const pageTitle = {
  fontSize: 28,
  marginBottom: 6,
};

const subtitle = {
  color: "#6b7280",
  marginBottom: 0,
};

const sectionTitle = {
  fontSize: 20,
  marginBottom: 18,
};

const inputStyle = {
  display: "block",
  width: "100%",
  maxWidth: 520,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 14,
  fontSize: 14,
};

const addButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#16a34a",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const buttonPrimary = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const buttonSecondary = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#374151",
  cursor: "pointer",
  fontWeight: 700,
};

const classesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const classCardStyle = {
  padding: 18,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#ffffff",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
};

const classTopRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
};

const emojiBoxStyle = {
  width: 48,
  height: 48,
  borderRadius: 16,
  background: "#dcfce7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
};

const classNameStyle = {
  fontSize: 18,
  display: "block",
  marginBottom: 4,
};

const classSubTextStyle = {
  margin: 0,
  color: "#6b7280",
  fontSize: 14,
};

const actionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
};

const viewButtonStyle = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 10,
  background: "#eff6ff",
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 700,
  textAlign: "center" as const,
};

const editButtonStyle = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};

const emptyStyle = {
  color: "#6b7280",
};
