"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  access_created: boolean;
};

type ClassItem = {
  id: string;
  name: string;
};

export default function ProfessoresPage() {
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [passwords, setPasswords] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getSchoolId() {
    const { data: { user } } = await supabase.auth.getUser();
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
      .select("id, name, email, phone, access_created")
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
    setShowForm(false);

    setMessage("Professor cadastrado.");
    loadTeachers();
  }

  async function createAccess(teacherId: string) {
    const password = passwords[teacherId];

    if (!password) {
      setMessage("Digite uma senha provisória.");
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
    setPasswords((prev) => ({ ...prev, [teacherId]: "" }));
    loadTeachers();
  }

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  return (
    <div>
      <div style={card}>
        <div style={header}>
          <div>
            <h1>Professores</h1>
            <p style={{ color: "#666" }}>
              Gerencie os professores da escola
            </p>
          </div>

          <button onClick={() => setShowForm(!showForm)} style={addButton}>
            + Novo professor
          </button>
        </div>

        {message && <p>{message}</p>}
      </div>

      {showForm && (
        <div style={card}>
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
        </div>
      )}

      <div style={card}>
        <h2>Professores cadastrados</h2>

        {teachers.map((teacher) => (
          <div key={teacher.id} style={item}>
            <div>
              <strong>{teacher.name}</strong>
              <br />
              {teacher.email}
            </div>

            {!teacher.access_created && (
              <div style={{ marginTop: 10 }}>
                <input
                  type="password"
                  placeholder="Senha provisória"
                  value={passwords[teacher.id] || ""}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      [teacher.id]: e.target.value,
                    })
                  }
                  style={input}
                />

                <button
                  onClick={() => createAccess(teacher.id)}
                  style={button}
                >
                  Criar acesso
                </button>
              </div>
            )}

            {teacher.access_created && (
              <p style={{ color: "green" }}>Acesso criado</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20,
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const addButton = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  cursor: "pointer",
};

const input = {
  display: "block",
  marginBottom: 10,
  padding: 10,
  width: "100%",
};

const button = {
  padding: 10,
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};

const item = {
  padding: 10,
  borderBottom: "1px solid #ddd",
};
