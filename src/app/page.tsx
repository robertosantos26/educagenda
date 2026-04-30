"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Email ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={container}>
      {/* 🔵 BACKGROUND COM BLUR */}
      <div style={background}></div>

      {/* 🔷 CARD LOGIN */}
      <div style={card}>
        <h1 style={title}>Educagenda</h1>
        <p style={subtitle}>Acesso ao sistema</p>

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button onClick={handleLogin} style={button}>
          Entrar
        </button>

        {message && <p style={error}>{message}</p>}
      </div>
    </div>
  );
}

const container = {
  position: "relative" as const,
  width: "100%",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const background = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundImage: "url('/bg.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "blur(8px)",
  transform: "scale(1.1)",
};

const card = {
  position: "relative" as const,
  zIndex: 2,
  background: "rgba(255,255,255,0.9)",
  padding: 30,
  borderRadius: 16,
  width: 320,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  textAlign: "center" as const,
};

const title = {
  marginBottom: 10,
};

const subtitle = {
  marginBottom: 20,
  color: "#555",
};

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const button = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const error = {
  marginTop: 10,
  color: "red",
};
