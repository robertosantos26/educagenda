"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

export default function MinhasTurmasPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [message, setMessage] = useState("");

  async function loadMyClasses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      return;
    }

    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!teacher?.id) {
      setMessage("Professor não encontrado.");
      return;
    }

    const { data: links, error } = await supabase
      .from("teacher_class_links")
      .select("class_id, classes(id, name)")
      .eq("teacher_id", teacher.id);

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      return;
    }

    const mapped =
      links?.map((item: any) => ({
        id: item.classes.id,
        name: item.classes.name,
      })) || [];

    setClasses(mapped);
  }

  useEffect(() => {
    loadMyClasses();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Minhas turmas</h1>

      {message && <p>{message}</p>}

      {classes.length === 0 ? (
        <p>Nenhuma turma vinculada ao seu usuário.</p>
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
              <Link href={`/dashboard/turmas/${item.id}`} style={{ color: "#2563eb" }}>
                Ver crianças da turma
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
