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
    <div style={card}>
  <h2 style={title}>Cadastrar criança</h2>

  <input
    type="text"
    placeholder="Nome da criança"
    value={name}
    onChange={(e) => setName(e.target.value)}
    style={input}
  />

  <input
    type="date"
    value={birthDate}
    onChange={(e) => setBirthDate(e.target.value)}
    style={input}
  />

  <select
    value={classId}
    onChange={(e) => setClassId(e.target.value)}
    style={input}
  >
    <option value="">Selecione a turma</option>
    {classes.map((item) => (
      <option key={item.id} value={item.id}>
        {item.name}
      </option>
    ))}
  </select>

  <button onClick={createStudent} style={buttonPrimary}>
    Cadastrar criança
  </button>

  {message && <p style={{ marginTop: 12 }}>{message}</p>}
</div>
  );

  const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
  marginBottom: 32,
};

const title = {
  marginBottom: 16,
  fontSize: 20,
};

const input = {
  display: "block",
  width: "100%",
  maxWidth: 400,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
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
  fontWeight: "bold",
};
}
