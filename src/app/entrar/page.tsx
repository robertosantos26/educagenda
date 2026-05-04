"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

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

  return (
    <div style={containerStyle}>
      <div style={backgroundStyle}></div>
      <div style={overlayStyle}></div>

      <div style={cardStyle}>
        <div style={logoStyle}>E</div>

        <h1 style={titleStyle}>Educagenda</h1>
        <p style={subtitleStyle}>Acesse sua escola</p>

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
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...mainButtonStyle,
            background: loading ? "#9ca3af" : "#2563eb",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p style={footerTextStyle}>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" style={linkStyle}>
            Criar conta da escola
          </Link>
        </p>

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

const footerTextStyle = {
  marginTop: 18,
  color: "#6b7280",
  fontSize: 14,
};

const linkStyle = {
  color: "#2563eb",
  fontWeight: 800,
  textDecoration: "none",
};

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};
