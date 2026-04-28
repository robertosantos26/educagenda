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
  classes?: {
    name: string;
  }[] | null;
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (error || !profile?.school_id) return null;

    return profile.school_id;
  }

  async function loadClasses() {
    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      return;
    }

    setClasses(data || []);
  }

  async function loadStudents() {
    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("id, name, birth_date, class_id, classes(name)")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar crianças: " + error.message);
      return;
    }

    setStudents((data || []) as Student[]);
  }

  async function createStudent() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome da criança.");
      return;
    }

    if (!classId) {
      setMessage("Selecione uma turma já cadastrada.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

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
          style={{
            padding: 12,
            width: "100%",
            maxWidth: 400,
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 12,
          }}
        />

        <br />

        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          style={{
            padding: 12,
            width: "100%",
            maxWidth: 400,
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 12,
          }}
        />

        <br />

        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          required
          style={{
            padding: 12,
            width: "100%",
            maxWidth: 400,
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <option value="">Selecione uma turma cadastrada</option>

          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {classes.length === 0 && (
          <p style={{ color: "#b45309", marginTop: 4 }}>
            Nenhuma turma cadastrada. Cadastre uma turma antes de adicionar crianças.
          </p>
        )}

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
            {students.map((student) => (
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
                <span>Turma: {student.classes?.[0]?.name || "Sem turma"}</span>
                <br />
                <span>Nascimento: {student.birth_date || "Não informado"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
