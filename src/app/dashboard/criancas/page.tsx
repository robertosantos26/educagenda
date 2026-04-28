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
    const { data: { user } } = await supabase.auth.getUser();
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
    <div style={{ maxWidth: 900 }}>
      <h1>Crianças</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Cadastrar criança</h2>

        <input
          type="text"
          placeholder="Nome da criança"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 12, width: "100%", maxWidth: 400, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}
        />

        <br />

        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          style={{ padding: 12, width: "100%", maxWidth: 400, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}
        />

        <br />

        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          style={{ padding: 12, width: "100%", maxWidth: 400, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}
        >
          <option value="">Selecione uma turma cadastrada</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <br />

        <button
          onClick={createStudent}
          disabled={loading || classes.length === 0}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            cursor: loading || classes.length === 0 ? "not-allowed" : "pointer",
            background: loading || classes.length === 0 ? "#9ca3af" : "#111827",
            color: "white",
            marginTop: 12,
          }}
        >
          {loading ? "Salvando..." : "Cadastrar"}
        </button>

        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Crianças cadastradas</h2>

        {students.length === 0 ? (
          <p>Nenhuma criança cadastrada ainda.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {students.map((student) => {
              const turma = classes.find((c) => c.id === student.class_id);

              return (
                <li
                  key={student.id}
                  style={{
                    padding: 16,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <strong>{student.name}</strong>
                  <br />
                  <span>Turma: {turma?.name || "Sem turma"}</span>
                  <br />
                  <span>Nascimento: {student.birth_date || "Não informado"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
