"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single();

    setName(data?.name || "");
    setRole(data?.role || "");
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div>
      <h1>Educagenda</h1>

      <p>
        Olá, <strong>{name || "usuário"}</strong>.
      </p>

      <p>
        Perfil: <strong>{role || "carregando..."}</strong>
      </p>

      {role === "admin" && (
        <p>Você tem acesso completo ao sistema da escola.</p>
      )}

      {role === "teacher" && (
        <p>Você pode acessar suas turmas e preencher agendas das crianças vinculadas.</p>
      )}
    </div>
  );
}
