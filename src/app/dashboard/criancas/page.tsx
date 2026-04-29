"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  birth_date: string | null;
  class_id: string | null;
  address: string | null;
  notes: string | null;
};

type GuardianLink = {
  student_id: string;
  profiles?: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export default function CriancasPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [classId, setClassId] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<GuardianLink[]>([]);

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

  async function loadStudents() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data } = await supabase
      .from("students")
      .select("id, name, birth_date, class_id, address, notes")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    setStudents(data || []);
  }

  async function loadGuardians() {
    const { data } = await supabase
      .from("student_guardians")
      .select("student_id, profiles(name, email, phone)");

    setGuardianLinks((data || []) as GuardianLink[]);
  }

  function resetForm() {
    setName("");
    setBirthDate("");
    setClassId("");
    setAddress("");
    setNotes("");
    setEditingStudentId(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
    setMessage("");
  }

  function openEditForm(student: Student) {
    setEditingStudentId(student.id);
    setName(student.name || "");
    setBirthDate(student.birth_date || "");
    setClassId(student.class_id || "");
    setAddress(student.address || "");
    setNotes(student.notes || "");
    setShowForm(true);
    setMessage("");
  }

  async function saveStudent() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome da criança.");
      return;
    }

    if (!classId) {
      setMessage("Selecione uma turma.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    if (editingStudentId) {
      const { error } = await supabase
        .from("students")
        .update({
          name: name.trim(),
          birth_date: birthDate || null,
          class_id: classId,
          address: address.trim() || null,
          notes: notes.trim() || null,
        })
        .eq("id", editingStudentId);

      if (error) {
        setMessage("Erro ao atualizar criança: " + error.message);
        setLoading(false);
        return;
      }

      setMessage("Dados da criança atualizados com sucesso.");
    } else {
      const { error } = await supabase.from("students").insert({
        school_id: schoolId,
        class_id: classId,
        name: name.trim(),
        birth_date: birthDate || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        active: true,
      });

      if (error) {
        setMessage("Erro ao cadastrar criança: " + error.message);
        setLoading(false);
        return;
      }

      setMessage("Criança cadastrada com sucesso.");
    }

    resetForm();
    setShowForm(false);
    await loadStudents();
    setLoading(false);
  }

  function getClassName(classIdValue: string | null) {
    if (!classIdValue) return "Sem turma";
    return classes.find((c) => c.id === classIdValue)?.name || "Sem turma";
  }

  function getGuardian(studentId: string) {
    const link = guardianLinks.find((item) => item.student_id === studentId);
    return link?.profiles || null;
  }

  useEffect(() => {
    loadClasses();
    loadStudents();
    loadGuardians();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={pageTitle}>Crianças</h1>
            <p style={subtitle}>
              Cadastre, consulte e edite os dados das crianças.
            </p>
          </div>

          <button onClick={openCreateForm} style={addButtonStyle}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Nova criança
          </button>
        </div>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            {editingStudentId ? "Editar criança" : "Cadastrar criança"}
          </h2>

          <input
            type="text"
            placeholder="Nome da criança"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={inputStyle}
          />

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Selecione a turma</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Endereço"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={inputStyle}
          />

          <textarea
            placeholder="Observações. Ex: alergias, restrições alimentares, cuidados especiais..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={textareaStyle}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveStudent} disabled={loading} style={buttonPrimary}>
              {loading
                ? "Salvando..."
                : editingStudentId
                ? "Salvar alterações"
                : "Cadastrar criança"}
            </button>

            <button
              onClick={() => {
                resetForm();
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
        <h2 style={sectionTitle}>Crianças cadastradas</h2>

        {students.length === 0 ? (
          <p style={emptyStyle}>Nenhuma criança cadastrada ainda.</p>
        ) : (
          <div style={listStyle}>
            {students.map((student) => {
              const guardian = getGuardian(student.id);

              return (
                <div key={student.id} style={studentCardStyle}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 18 }}>{student.name}</strong>

                    <p style={infoTextStyle}>
                      <strong>Turma:</strong> {getClassName(student.class_id)}
                    </p>

                    <p style={infoTextStyle}>
                      <strong>Nascimento:</strong>{" "}
                      {student.birth_date || "Não informado"}
                    </p>

                    <p style={infoTextStyle}>
                      <strong>Responsável:</strong>{" "}
                      {guardian
                        ? `${guardian.name}${guardian.phone ? ` • ${guardian.phone}` : ""}`
                        : "Nenhum responsável vinculado"}
                    </p>

                    <p style={infoTextStyle}>
                      <strong>Endereço:</strong>{" "}
                      {student.address || "Não informado"}
                    </p>

                    <p style={infoTextStyle}>
                      <strong>Observações:</strong>{" "}
                      {student.notes || "Sem observações"}
                    </p>
                  </div>

                  <div style={actionsStyle}>
                    <Link
                      href={`/dashboard/criancas/${student.id}/agendas`}
                      style={historyButtonStyle}
                    >
                      Ver histórico
                    </Link>

                    <button
                      onClick={() => openEditForm(student)}
                      style={editButtonStyle}
                    >
                      Ver / editar dados
                    </button>
                  </div>
                </div>
              );
            })}
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
  marginBottom: 12,
  fontSize: 14,
};

const textareaStyle = {
  display: "block",
  width: "100%",
  maxWidth: 620,
  minHeight: 100,
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

const listStyle = {
  display: "grid",
  gap: 14,
};

const studentCardStyle = {
  padding: 18,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  flexWrap: "wrap" as const,
};

const infoTextStyle = {
  margin: "7px 0",
  color: "#4b5563",
};

const actionsStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
  minWidth: 160,
};

const historyButtonStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  background: "#eff6ff",
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 700,
  textAlign: "center" as const,
};

const editButtonStyle = {
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
