"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type ClassItem = {
  id: string;
  name: string;
};

type TeacherClassLink = {
  teacher_id: string;
  class_id: string;
};

export default function ProfessoresPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [links, setLinks] = useState<TeacherClassLink[]>([]);

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

    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar turmas: " + error.message);
      return;
    }

    setClasses(data || []);
  }

  async function loadTeachers() {
    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      return;
    }

    const { data, error } = await supabase
      .from("teachers")
      .select("id, name, email, phone, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar professores: " + error.message);
      return;
    }

    setTeachers(data || []);
  }

  async function loadLinks() {
    const { data, error } = await supabase
      .from("teacher_class_links")
      .select("teacher_id, class_id");

    if (error) {
      setMessage("Erro ao carregar vínculos: " + error.message);
      return;
    }

    setLinks(data || []);
  }

  function toggleClass(classId: string) {
    setSelectedClasses((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId]
    );
  }

  async function createTeacher() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome do professor.");
      return;
    }

    if (selectedClasses.length === 0) {
      setMessage("Selecione pelo menos uma turma para o professor.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    const { data: teacher, error } = await supabase
      .from("teachers")
      .insert({
        school_id: schoolId,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      })
      .select("id")
      .single();

    if (error || !teacher) {
      setMessage("Erro ao cadastrar professor: " + (error?.message || ""));
      setLoading(false);
      return;
    }

    const teacherLinks = selectedClasses.map((classId) => ({
      teacher_id: teacher.id,
      class_id: classId,
    }));

    const { error: linkError } = await supabase
      .from("teacher_class_links")
      .insert(teacherLinks);

    if (linkError) {
      setMessage("Professor criado, mas houve erro ao vincular turmas: " + linkError.message);
      setLoading(false);
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setSelectedClasses([]);
    setMessage("Professor cadastrado com sucesso.");

    await loadTeachers();
    await loadLinks();

    setLoading(false);
  }

  function getTeacherClasses(teacherId: string) {
    const teacherLinks = links.filter((link) => link.teacher_id === teacherId);

    const names = teacherLinks
      .map((link) => classes.find((item) => item.id === link.class_id)?.name)
      .filter(Boolean);

    return names.length > 0 ? names.join(", ") : "Nenhuma turma vinculada";
  }

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadLinks();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Professores</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Cadastrar professor</h2>

        <input
          type="text"
          placeholder="Nome do professor"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <br />

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <br />

        <input
          type="text"
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <strong>Turmas do professor</strong>

          {classes.length === 0 ? (
            <p>Nenhuma turma cadastrada ainda.</p>
          ) : (
            <div style={{ marginTop: 10 }}>
              {classes.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(item.id)}
                    onChange={() => toggleClass(item.id)}
                    style={{ marginRight: 8 }}
                  />
                  {item.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={createTeacher}
          disabled={loading || classes.length === 0}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            cursor: loading || classes.length === 0 ? "not-allowed" : "pointer",
            background: loading || classes.length === 0 ? "#9ca3af" : "#111827",
            color: "white",
            marginTop: 12,
          }}
        >
          {loading ? "Salvando..." : "Cadastrar"}
        </button>

        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Professores cadastrados</h2>

        {teachers.length === 0 ? (
          <p>Nenhum professor cadastrado ainda.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <strong>{teacher.name}</strong>
                <br />
                <span>{teacher.email || "Sem e-mail"}</span>
                <br />
                <span>{teacher.phone || "Sem telefone"}</span>
                <br />
                <span>
                  <strong>Turmas:</strong> {getTeacherClasses(teacher.id)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  width: "100%",
  maxWidth: 400,
  border: "1px solid #ccc",
  borderRadius: 8,
  marginBottom: 12,
};
