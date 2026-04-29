"use client";

import { useEffect, useState } from "react";
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
};

export default function CriancasPage() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [classId, setClassId] = useState("");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

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
      .select("id, name, birth_date, class_id")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    setStudents(data || []);
  }

  async function createStudent() {
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

    const { error } = await supabase.from("students").insert({
      school_id: schoolId,
      class_id: classId,
      name: name.trim(),
      birth_date: birthDate || null,
      active: true,
    });

    if (error) {
      setMessage("Erro ao cadastrar criança: " + error.message);
      setLoading(false);
      return;
    }

    setName("");
    setBirthDate("");
    setClassId("");
    setMessage("Criança cadastrada com sucesso.");

    await loadStudents();
    setLoading(false);
  }

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <h1 style={pageTitle}>Crianças</h1>
        <p style={subtitle}>Cadastre as crianças e vincule cada uma a uma turma.</p>

        <h2 style={sectionTitle}>Cadastrar criança</h2>

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

        <button
          onClick={createStudent}
          disabled={loading}
          style={buttonPrimary}
        >
          {loading ? "Salvando..." : "Cadastrar criança"}
        </button>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Crianças cadastradas</h2>

        {students.length === 0 ? (
          <p style={emptyStyle}>Nenhuma criança cadastrada ainda.</p>
        ) : (
          <div style={listStyle}>
            {students.map((student) => {
              const turma = classes.find((c) => c.id === student.class_id);

              return (
                <div key={student.id} style={studentCardStyle}>
                  <strong>{student.name}</strong>
                  <span>Turma: {turma?.name || "Sem turma"}</span>
                  <span>
                    Nascimento: {student.birth_date || "Não informado"}
                  </span>
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

const pageTitle = {
  fontSize: 28,
  marginBottom: 6,
};

const subtitle = {
  color: "#6b7280",
  marginBottom: 28,
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

const buttonPrimary = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
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

const listStyle = {
  display: "grid",
  gap: 12,
};

const studentCardStyle = {
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
};
