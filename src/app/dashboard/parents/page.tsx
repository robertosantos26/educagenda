"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
};

export default function ResponsaveisPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function getSchoolId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    return data?.school_id || null;
  }

  async function loadStudents() {
    const schoolId = await getSchoolId();

    if (!schoolId) return;

    const { data } = await supabase
      .from("students")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("active", true)
      .order("name", { ascending: true });

    setStudents(data || []);
  }

  async function createGuardianAccess() {
    setMessage("");

    if (!name || !email || !password || !studentId) {
      setMessage("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/create-guardian-auth", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        studentId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Erro ao criar acesso.");
      setLoading(false);
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setStudentId("");

    setMessage("Acesso criado com sucesso.");
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Responsáveis</h1>

      <input
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={input}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
      />

      <input
        placeholder="Telefone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={input}
      />

      <input
        placeholder="Senha provisória"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={input}
      />

      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        style={input}
      >
        <option value="">Selecione a criança</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <button onClick={createGuardianAccess} style={button}>
        {loading ? "Criando..." : "Criar acesso"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

const input = {
  display: "block",
  marginBottom: 10,
  padding: 10,
  width: "100%",
  maxWidth: 400,
};

const button = {
  padding: 10,
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
