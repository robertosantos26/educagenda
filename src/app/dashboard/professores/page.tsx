"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  access_created: boolean;
  auth_user_id: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

export default function ProfessoresPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getSchoolId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    return profile?.school_id || null;
  }

  async function loadClasses() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId);

    setClasses(data || []);
  }

  async function loadTeachers() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data } = await supabase
      .from("teachers")
      .select("id, name, email, phone, access_created, auth_user_id")
      .eq("school_id", schoolId);

    setTeachers(data || []);
  }

  function toggleClass(classId: string) {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  }

  async function createTeacher() {
    setMessage("");

    if (!name || !email) {
      setMessage("Nome e email são obrigatórios.");
      return;
    }

    const schoolId = await getSchoolId();

    const { data: teacher, error } = await supabase
      .from("teachers")
      .insert({
        name,
        email,
        phone,
        school_id: schoolId,
      })
      .select()
      .single();

    if (error || !teacher) {
      setMessage("Erro ao cadastrar professor.");
      return;
    }

    if (selectedClasses.length > 0) {
      const links = selectedClasses.map((classId) => ({
        teacher_id: teacher.id,
        class_id: classId,
      }));

      await supabase.from("teacher_class_links").insert(links);
    }

    setName("");
    setEmail("");
    setPhone("");
    setSelectedClasses([]);

    setMessage("Professor cadastrado.");
    loadTeachers();
  }

  async function createAccess(teacherId: string) {
    setMessage("");

    if (!password) {
      setMessage("Informe uma senha provisória.");
      return;
    }

    const response = await fetch("/api/create-teacher-auth", {
      method: "POST",
      body: JSON.stringify({
        teacherId,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error);
      return;
    }

    setMessage("Acesso criado com sucesso.");
    setPassword("");
    loadTeachers();
  }

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Professores</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Cadastrar professor</h2>

        <input
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={input}
        />

        <div>
          <strong>Turmas</strong>
          {classes.map((c) => (
            <label key={c.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                onChange={() => toggleClass(c.id)}
                checked={selectedClasses.includes(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>

        <button onClick={createTeacher} style={button}>
          Cadastrar professor
        </button>

        {message && <p>{message}</p>}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Professores</h2>

        {teachers.map((teacher) => (
          <div key={teacher.id} style={card}>
            <strong>{teacher.name}</strong>
            <br />
            {teacher.email}
            <br />

            <p>
              Status:{" "}
              {teacher.access_created ? "Acesso criado" : "Sem acesso"}
            </p>

            {!teacher.access_created && (
              <>
                <input
                  placeholder="Senha provisória"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={input}
                />

                <button
                  onClick={() => createAccess(teacher.id)}
                  style={button}
                >
                  Criar acesso
                </button>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

const input = {
  display: "block",
  marginBottom: 10,
  padding: 10,
  width: "100%",
  maxWidth: 400,
};

const button = {
  padding: 10,
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const card = {
  border: "1px solid #ddd",
  padding: 16,
  marginBottom: 12,
  borderRadius: 8,
};
