"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [schoolName, setSchoolName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("E-mail ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
  }

  async function handleSignup() {
    setMessage("");

    if (!schoolName || !cnpj || !adminName || !email || !password) {
      setMessage("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setMessage("Erro ao criar usuário.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({
        name: schoolName,
        cnpj: cnpj,
      })
      .select("id")
      .single();

    if (schoolError || !school) {
      setMessage("Erro ao criar escola.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      auth_user_id: userId,
      school_id: school.id,
      name: adminName,
      email,
      role: "admin",
      active: true,
    });

    if (profileError) {
      setMessage("Erro ao criar perfil.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundStyle}></div>
      <div style={overlayStyle}></div>

      <div style={cardStyle}>
        <h1>Educagenda</h1>

        <div style={tabsStyle}>
          <button onClick={() => setMode("login")}>Entrar</button>
          <button onClick={() => setMode("signup")}>Criar conta</button>
        </div>

        {mode === "signup" && (
          <>
            <input
              placeholder="Nome da escola"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="CNPJ"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Seu nome"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button onClick={mode === "login" ? handleLogin : handleSignup}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

const containerStyle = {
  position: "relative" as const,
  height: "100vh",
};

const backgroundStyle = {
  position: "absolute" as const,
  inset: 0,
  backgroundImage: "url('/bg.jpg')",
  backgroundSize: "cover",
  filter: "blur(10px)",
};

const overlayStyle = {
  position: "absolute" as const,
  inset: 0,
  background: "rgba(0,0,0,0.5)",
};

const cardStyle = {
  position: "relative" as const,
  zIndex: 2,
  maxWidth: 400,
  margin: "auto",
  top: "50%",
  transform: "translateY(-50%)",
  background: "white",
  padding: 20,
  borderRadius: 12,
};

const inputStyle = {
  width: "100%",
  marginBottom: 10,
  padding: 10,
};

const tabsStyle = {
  display: "flex",
  gap: 10,
  marginBottom: 10,
};
