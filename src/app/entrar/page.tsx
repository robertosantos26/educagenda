"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SavedAccess = {
  email: string;
  password: string;
};

const SAVED_ACCESS_KEY = "educagenda_saved_access";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberAccess, setRememberAccess] = useState(false);
  const [savedAccesses, setSavedAccesses] = useState<SavedAccess[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rawAccesses = localStorage.getItem(SAVED_ACCESS_KEY);

    if (!rawAccesses) return;

    try {
      const parsedAccesses = JSON.parse(rawAccesses) as SavedAccess[];

      if (!Array.isArray(parsedAccesses)) return;

      const validAccesses = parsedAccesses.filter(
        (item) => item?.email && item?.password,
      );

      setSavedAccesses(validAccesses);
    } catch {
      localStorage.removeItem(SAVED_ACCESS_KEY);
    }
  }, []);

  function saveAccess(currentEmail: string, currentPassword: string) {
    const nextAccesses = [
      { email: currentEmail, password: currentPassword },
      ...savedAccesses.filter((item) => item.email !== currentEmail),
    ].slice(0, 5);

    setSavedAccesses(nextAccesses);
    localStorage.setItem(SAVED_ACCESS_KEY, JSON.stringify(nextAccesses));
  }

  function handleUseSavedAccess(access: SavedAccess) {
    setEmail(access.email);
    setPassword(access.password);
    setRememberAccess(true);
    setMessage("");
  }

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

    if (rememberAccess) {
      saveAccess(email, password);
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

        {savedAccesses.length > 0 && (
          <div style={savedAccessContainerStyle}>
            <p style={savedAccessTitleStyle}>Acessos salvos neste dispositivo</p>
            <div style={savedAccessListStyle}>
              {savedAccesses.map((access) => (
                <button
                  key={access.email}
                  type="button"
                  onClick={() => handleUseSavedAccess(access)}
                  style={savedAccessButtonStyle}
                >
                  {access.email}
                </button>
              ))}
            </div>
          </div>
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

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={rememberAccess}
            onChange={(e) => setRememberAccess(e.target.checked)}
          />
          Gravar acesso neste dispositivo
        </label>

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

const savedAccessContainerStyle = {
  marginBottom: 12,
  textAlign: "left" as const,
};

const savedAccessTitleStyle = {
  fontSize: 13,
  color: "#4b5563",
  margin: "0 0 8px",
};

const savedAccessListStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
};

const savedAccessButtonStyle = {
  border: "1px solid #cbd5e1",
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
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

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#4b5563",
  marginBottom: 14,
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
