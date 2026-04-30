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

    if (!email || !password) {
      setMessage("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("E-mail ou senha inválidos.");
      setLoading(false);
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
      setMessage("Erro ao criar usuário: " + (authError?.message || ""));
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
      setMessage("Erro ao criar escola: " + (schoolError?.message || ""));
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
      setMessage("Erro ao criar perfil: " + profileError.message);
      setLoading(false);
      return;
    }

    setMessage("Conta criada com sucesso.");
    router.push("/dashboard");
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundStyle}></div>
      <div style={overlayStyle}></div>

      <div style={cardStyle}>
        <div style={logoStyle}>E</div>

        <h1 style={titleStyle}>Educagenda</h1>
        <p style={subtitleStyle}>
          Agenda digital para escolas infantis, professores e responsáveis.
        </p>

        <div style={tabsStyle}>
          <button
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            style={{
              ...tabButtonStyle,
              background: mode === "login" ? "#2563eb" : "transparent",
              color: mode === "login" ? "white" : "#374151",
            }}
          >
            Entrar
          </button>

          <button
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            style={{
              ...tabButtonStyle,
              background: mode === "signup" ? "#2563eb" : "transparent",
              color: mode === "signup" ? "white" : "#374151",
            }}
          >
            Criar conta
          </button>
        </div>

        {mode === "signup" && (
          <>
            <input
              type="text"
              placeholder="Nome da escola"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="CNPJ da escola"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Seu nome"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={mode === "login" ? handleLogin : handleSignup}
          disabled={loading}
          style={{
            ...mainButtonStyle,
            background: loading ? "#9ca3af" : "#2563eb",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Aguarde..."
            : mode === "login"
            ? "Entrar"
            : "Criar conta da escola"}
        </button>

        {message && <p style={messageStyle}>{message}</p>}
      </div>
    </div>
  );
}

const containerStyle = {
  position: "relative" as const,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  fontFamily: "Arial, sans-serif",
  padding: 20,
};

const backgroundStyle = {
  position: "absolute" as const,
  inset: 0,
  backgroundImage: "url('/bg.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "blur(10px)",
  transform: "scale(1.08)",
};

const overlayStyle = {
  position: "absolute" as const,
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.72), rgba(37,99,235,0.45))",
};

const cardStyle = {
  position: "relative" as const,
  zIndex: 2,
  width: "100%",
  maxWidth: 420,
  background: "rgba(255,255,255,0.92)",
  borderRadius: 24,
  padding: 34,
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  textAlign: "center" as const,
};

const logoStyle = {
  width: 58,
  height: 58,
  margin: "0 auto 16px",
  borderRadius: 18,
  background: "linear-gradient(135deg, #60a5fa, #2563eb)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 900,
};

const titleStyle = {
  fontSize: 32,
  margin: "0 0 8px",
};

const subtitleStyle = {
  color: "#6b7280",
  marginBottom: 24,
  lineHeight: 1.4,
};

const tabsStyle = {
  display: "flex",
  background: "#f3f4f6",
  borderRadius: 14,
  padding: 4,
  marginBottom: 20,
};

const tabButtonStyle = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: 13,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginBottom: 12,
  fontSize: 14,
  boxSizing: "border-box" as const,
};

const mainButtonStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "none",
  color: "white",
  fontWeight: 800,
  fontSize: 15,
};

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};
