"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  access_created: boolean;
  auth_user_id: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

type TeacherClassLink = {
  teacher_id: string;
  class_id: string;
};

export default function ProfessoresPage() {
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [links, setLinks] = useState<TeacherClassLink[]>([]);

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
    if (!schoolId) return;

    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    setClasses(data || []);
  }

  async function loadTeachers() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data } = await supabase
      .from("teachers")
      .select("id, name, email, phone, access_created, auth_user_id")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    setTeachers(data || []);
  }

  async function loadLinks() {
    const { data } = await supabase
      .from("teacher_class_links")
      .select("teacher_id, class_id");

    setLinks(data || []);
  }

  function toggleClass(classId: string) {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  }

  function getTeacherClasses(teacherId: string) {
    const teacherLinks = links.filter((link) => link.teacher_id === teacherId);

    const names = teacherLinks
      .map((link) => classes.find((item) => item.id === link.class_id)?.name)
      .filter(Boolean);

    return names.length > 0 ? names.join(", ") : "Nenhuma turma vinculada";
  }

  async function createTeacher() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome do professor.");
      return;
    }

    if (!email.trim()) {
      setMessage("Digite o e-mail do professor.");
      return;
    }

    if (selectedClasses.length === 0) {
      setMessage("Selecione pelo menos uma turma.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    const { data: teacher, error } = await supabase
      .from("teachers")
      .insert({
        school_id: schoolId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      })
      .select("id")
      .single();

    if (error || !teacher) {
      setMessage("Erro ao cadastrar professor: " + (error?.message || ""));
      setLoading(false);
      return;
    }

    const teacherLinks = selectedClasses.map((classId) => ({
      teacher_id: teacher.id,
      class_id: classId,
    }));

    const { error: linkError } = await supabase
      .from("teacher_class_links")
      .insert(teacherLinks);

    if (linkError) {
      setMessage(
        "Professor criado, mas houve erro ao vincular turmas: " +
          linkError.message
      );
      setLoading(false);
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setSelectedClasses([]);
    setShowForm(false);
    setMessage("Professor cadastrado com sucesso.");

    await loadTeachers();
    await loadLinks();

    setLoading(false);
  }

  async function createAccess(teacherId: string) {
    setMessage("");

    if (!password.trim()) {
      setMessage("Informe uma senha provisória.");
      return;
    }

    const response = await fetch("/api/create-teacher-auth", {
      method: "POST",
      body: JSON.stringify({
        teacherId,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Erro ao criar acesso.");
      return;
    }

    setMessage("Acesso criado com sucesso.");
    setPassword("");
    await loadTeachers();
  }

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadLinks();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={pageTitle}>Professores</h1>
            <p style={subtitle}>
              Cadastre professores, vincule turmas e crie acesso ao sistema.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={addButtonStyle}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            {showForm ? "Fechar cadastro" : "Novo professor"}
          </button>
        </div>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Cadastrar professor</h2>

          <input
            type="text"
            placeholder="Nome do professor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="E-mail do professor"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />

          <div style={{ marginTop: 18 }}>
            <p style={labelStyle}>Turmas do professor</p>

            {classes.length === 0 ? (
              <p style={emptyStyle}>
                Nenhuma turma cadastrada ainda. Cadastre uma turma primeiro.
              </p>
            ) : (
              <div style={classGridStyle}>
                {classes.map((item) => {
                  const selected = selectedClasses.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleClass(item.id)}
                      style={{
                        ...classButtonStyle,
                        background: selected ? "#2563eb" : "#f9fafb",
                        color: selected ? "white" : "#111827",
                        borderColor: selected ? "#2563eb" : "#e5e7eb",
                      }}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={createTeacher}
            disabled={loading || classes.length === 0}
            style={{
              ...buttonPrimary,
              background:
                loading || classes.length === 0 ? "#9ca3af" : "#2563eb",
              cursor:
                loading || classes.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Salvando..." : "Cadastrar professor"}
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Professores cadastrados</h2>

        {teachers.length === 0 ? (
          <p style={emptyStyle}>Nenhum professor cadastrado ainda.</p>
        ) : (
          <div style={listStyle}>
            {teachers.map((teacher) => (
              <div key={teacher.id} style={teacherCardStyle}>
                <div>
                  <strong style={{ fontSize: 17 }}>{teacher.name}</strong>

                  <p style={infoTextStyle}>
                    {teacher.email || "Sem e-mail"}{" "}
                    {teacher.phone ? `• ${teacher.phone}` : ""}
                  </p>

                  <p style={infoTextStyle}>
                    <strong>Turmas:</strong> {getTeacherClasses(teacher.id)}
                  </p>

                  <span
                    style={{
                      ...statusBadgeStyle,
                      background: teacher.access_created
                        ? "#dcfce7"
                        : "#fef3c7",
                      color: teacher.access_created ? "#166534" : "#92400e",
                    }}
                  >
                    {teacher.access_created ? "Acesso criado" : "Sem acesso"}
                  </span>
                </div>

                {!teacher.access_created && (
                  <div style={accessBoxStyle}>
                    <input
                      type="password"
                      placeholder="Senha provisória"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={smallInputStyle}
                    />

                    <button
                      onClick={() => createAccess(teacher.id)}
                      style={accessButtonStyle}
                    >
                      Criar acesso
                    </button>
                  </div>
                )}
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
  maxWidth: 420,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 12,
  fontSize: 14,
};

const smallInputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const labelStyle = {
  fontWeight: 700,
  marginBottom: 10,
};

const classGridStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 10,
  marginBottom: 18,
};

const classButtonStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
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
  color: "white",
  fontWeight: 700,
  marginTop: 8,
};

const listStyle = {
  display: "grid",
  gap: 14,
};

const teacherCardStyle = {
  padding: 18,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap" as const,
};

const infoTextStyle = {
  margin: "6px 0",
  color: "#6b7280",
};

const statusBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13,
};

const accessBoxStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const accessButtonStyle = {
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
