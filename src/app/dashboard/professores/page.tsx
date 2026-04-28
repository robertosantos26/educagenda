"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export default function ProfessoresPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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

  async function loadTeachers() {
    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      return;
    }

    const { data, error } = await supabase
      .from("teachers")
      .select("id, name, email, phone, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar professores: " + error.message);
      return;
    }

    setTeachers(data || []);
  }

  async function createTeacher() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome do professor.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("teachers").insert({
      school_id: schoolId,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
    });

    if (error) {
      setMessage("Erro ao cadastrar professor: " + error.message);
      setLoading(false);
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setMessage("Professor cadastrado com sucesso.");
    await loadTeachers();
    setLoading(false);
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Professores</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Cadastrar professor</h2>

        <input
          type="text"
          placeholder="Nome do professor"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 12, width: "100%", maxWidth: 400, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}
        />

        <br />

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, width: "100%", maxWidth: 400, border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }}
        />

        <br />

        <input
          type="text"
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: 12, width: "100%", maxWidth: 400, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <br />

        <button
          onClick={createTeacher}
          disabled={loading}
          style={{ padding: "12px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "#111827", color: "white", marginTop: 12 }}
        >
          {loading ? "Salvando..." : "Cadastrar"}
        </button>

        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Professores cadastrados</h2>

        {teachers.length === 0 ? (
          <p>Nenhum professor cadastrado ainda.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {teachers.map((teacher) => (
              <li key={teacher.id} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, marginBottom: 12 }}>
                <strong>{teacher.name}</strong>
                <br />
                <span>{teacher.email || "Sem e-mail"}</span>
                <br />
                <span>{teacher.phone || "Sem telefone"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
