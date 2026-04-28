"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string;
  created_at: string;
};

export default function TurmasPage() {
  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      return;
    }

    setClasses(data || []);
  }

  async function createClass() {
    setMessage("");

    if (!className.trim()) {
      setMessage("Digite o nome da turma.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (!profile?.school_id) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("classes").insert({
      name: className.trim(),
      school_id: profile.school_id,
    });

    if (error) {
      setMessage("Erro ao cadastrar turma: " + error.message);
      setLoading(false);
      return;
    }

    setClassName("");
    setMessage("Turma cadastrada com sucesso.");
    await loadClasses();
    setLoading(false);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Turmas</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Cadastrar turma</h2>

        <input
          type="text"
          placeholder="Ex: Maternal 1, Jardim A..."
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          style={{
            padding: 12,
            width: "100%",
            maxWidth: 400,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        />

        <br />

        <button
          onClick={createClass}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "#111827",
            color: "white",
            marginTop: 12,
          }}
        >
          {loading ? "Salvando..." : "Cadastrar"}
        </button>

        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Turmas cadastradas</h2>

        {classes.length === 0 ? (
          <p>Nenhuma turma cadastrada ainda.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {classes.map((item) => (
              <li
  key={item.id}
  style={{
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
    marginBottom: 12,
  }}
>
  <strong>{item.name}</strong>
  <br />
  <a href={`/dashboard/turmas/${item.id}`} style={{ color: "#2563eb" }}>
    Ver crianças da turma
  </a>
</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
