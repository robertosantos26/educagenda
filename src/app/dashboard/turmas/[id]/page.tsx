"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  birth_date: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

export default function TurmaDetalhePage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [turma, setTurma] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("");

  async function loadTurma() {
    if (!turmaId) return;

    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("id", turmaId)
      .single();

    if (error) {
      setMessage("Erro ao carregar turma: " + error.message);
      return;
    }

    setTurma(data);
  }

  async function loadStudents() {
    if (!turmaId) return;

    const { data, error } = await supabase
      .from("students")
      .select("id, name, birth_date")
      .eq("class_id", turmaId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar crianças: " + error.message);
      return;
    }

    setStudents(data || []);
  }

  useEffect(() => {
    if (turmaId) {
      loadTurma();
      loadStudents();
    }
  }, [turmaId]);

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/dashboard/turmas">← Voltar para turmas</Link>

      <h1 style={{ marginTop: 24 }}>
        Turma: {turma?.name || "Carregando..."}
      </h1>

      <section style={{ marginTop: 32 }}>
        <h2>Crianças da turma</h2>

        {message && <p>{message}</p>}

        {students.length === 0 ? (
          <p>Nenhuma criança cadastrada nesta turma.</p>
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
                <span>
                  Nascimento: {student.birth_date || "Não informado"}
                </span>
                <br />
                <Link
                  href={`/dashboard/criancas/${student.id}/agendas`}
                  style={{ color: "#2563eb" }}
                >
                  Ver agendas registradas
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
