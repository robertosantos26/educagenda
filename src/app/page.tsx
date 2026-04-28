"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login(formData: FormData) {
    setLoading(true);
    setMessage("");
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return setMessage(error.message);
    window.location.href = "/dashboard";
  }

  async function registerSchool(formData: FormData) {
    setLoading(true);
    setMessage("");

    const schoolName = String(formData.get("schoolName"));
    const cnpj = String(formData.get("cnpj"));
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const phone = String(formData.get("phone"));

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      setLoading(false);
      return setMessage(authError?.message || "Não foi possível criar o usuário.");
    }

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({ name: schoolName, cnpj, email, phone })
      .select()
      .single();

    if (schoolError || !school) {
      setLoading(false);
      return setMessage(schoolError?.message || "Não foi possível criar a escola.");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      school_id: school.id,
      name,
      email,
      phone,
      role: "admin",
    });

    setLoading(false);

    if (profileError) return setMessage(profileError.message);

    setMessage("Escola criada. Agora faça login.");
    setMode("login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl font-bold">Educagenda</h1>
        <p className="text-gray-600 mt-2">Agenda escolar infantil digital.</p>

        <div className="flex gap-2 mt-6">
          <button onClick={() => setMode("login")} className={`flex-1 rounded-xl p-3 ${mode === "login" ? "bg-gray-900 text-white" : "bg-gray-100"}`}>Login</button>
          <button onClick={() => setMode("register")} className={`flex-1 rounded-xl p-3 ${mode === "register" ? "bg-gray-900 text-white" : "bg-gray-100"}`}>Cadastrar escola</button>
        </div>

        {mode === "login" ? (
          <form action={login} className="mt-6 space-y-3">
            <input name="email" type="email" placeholder="E-mail" required className="w-full border rounded-xl p-3" />
            <input name="password" type="password" placeholder="Senha" required className="w-full border rounded-xl p-3" />
            <button disabled={loading} className="w-full bg-blue-600 text-white rounded-xl p-3">{loading ? "Entrando..." : "Entrar"}</button>
          </form>
        ) : (
          <form action={registerSchool} className="mt-6 space-y-3">
            <input name="schoolName" placeholder="Nome da escola" required className="w-full border rounded-xl p-3" />
            <input name="cnpj" placeholder="CNPJ" className="w-full border rounded-xl p-3" />
            <input name="name" placeholder="Seu nome" required className="w-full border rounded-xl p-3" />
            <input name="phone" placeholder="Telefone" className="w-full border rounded-xl p-3" />
            <input name="email" type="email" placeholder="E-mail" required className="w-full border rounded-xl p-3" />
            <input name="password" type="password" placeholder="Senha" required minLength={6} className="w-full border rounded-xl p-3" />
            <button disabled={loading} className="w-full bg-blue-600 text-white rounded-xl p-3">{loading ? "Criando..." : "Criar escola"}</button>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </section>
    </main>
  );
}
