"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
  class_id: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

type Role = "admin" | "supervisor" | "teacher" | "guardian" | null;

export default function AgendaPage() {
  const [role, setRole] = useState<Role>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [food, setFood] = useState("");
  const [sleep, setSleep] = useState("");
  const [bathroom, setBathroom] = useState("");
  const [mood, setMood] = useState("");
  const [activities, setActivities] = useState("");
  const [observations, setObservations] = useState("");
  const [messageToParents, setMessageToParents] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("id, school_id, role")
      .eq("id", user.id)
      .single();

    return data || null;
  }

  async function loadClasses(profile: any) {
    if (!profile?.school_id) return;

    if (profile.role === "teacher") {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("auth_user_id", profile.id)
        .single();

      if (!teacher?.id) return;

      const { data: links } = await supabase
        .from("teacher_class_links")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", teacher.id);

      const mapped =
        links?.map((item: any) => ({
          id: item.classes.id,
          name: item.classes.name,
        })) || [];

      setClasses(mapped);
      return;
    }

    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true });

    setClasses(data || []);
  }

  async function loadStudents(profile: any) {
    if (!profile?.school_id) return;

    if (profile.role === "teacher") {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("auth_user_id", profile.id)
        .single();

      if (!teacher?.id) {
        setMessage("Professor não encontrado.");
        return;
      }

      const { data: links } = await supabase
        .from("teacher_class_links")
        .select("class_id")
        .eq("teacher_id", teacher.id);

      const classIds = links?.map((item) => item.class_id) || [];

      if (classIds.length === 0) {
        setStudents([]);
        setMessage("Nenhuma turma vinculada ao seu usuário.");
        return;
      }

      const { data, error } = await supabase
        .from("students")
        .select("id, name, class_id")
        .eq("school_id", profile.school_id)
        .eq("active", true)
        .in("class_id", classIds)
        .order("name", { ascending: true });

      if (error) {
        setMessage("Erro ao carregar crianças: " + error.message);
        return;
      }

      setStudents(data || []);
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id")
      .eq("school_id", profile.school_id)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar crianças: " + error.message);
      return;
    }

    setStudents(data || []);
  }

  async function saveAgenda() {
    setMessage("");

    if (!selectedStudentId) {
      setMessage("Selecione uma criança.");
      return;
    }

    setLoading(true);

    const profile = await getProfile();

    if (!profile?.school_id) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("daily_reports").upsert(
      {
        school_id: profile.school_id,
        student_id: selectedStudentId,
        teacher_id: profile.id,
        report_date: today,
        food,
        sleep,
        bathroom,
        mood,
        activities,
        observations,
        message_to_parents: messageToParents,
      },
      {
        onConflict: "student_id,report_date",
      }
    );

    if (error) {
      setMessage("Erro ao salvar agenda: " + error.message);
      setLoading(false);
      return;
    }

    setFood("");
    setSleep("");
    setBathroom("");
    setMood("");
    setActivities("");
    setObservations("");
    setMessageToParents("");

    setMessage("Agenda salva com sucesso.");
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const profile = await getProfile();

      if (!profile) {
        setMessage("Usuário não autenticado.");
        return;
      }

      setRole(profile.role);
      await loadClasses(profile);
      await loadStudents(profile);
    }

    init();
  }, []);

  function getClassName(classId: string | null) {
    if (!classId) return "Sem turma";
    return classes.find((item) => item.id === classId)?.name || "Sem turma";
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Agenda diária</h1>

      <p>
        Perfil atual: <strong>{role || "carregando..."}</strong>
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Selecionar criança</h2>

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecione uma criança</option>

          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} — {getClassName(student.class_id)}
            </option>
          ))}
        </select>

        {students.length === 0 && (
          <p>Nenhuma criança disponível para este usuário.</p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Informações do dia</h2>

        <textarea placeholder="Alimentação" value={food} onChange={(e) => setFood(e.target.value)} style={textareaStyle} />
        <textarea placeholder="Sono" value={sleep} onChange={(e) => setSleep(e.target.value)} style={textareaStyle} />
        <textarea placeholder="Banheiro / fralda" value={bathroom} onChange={(e) => setBathroom(e.target.value)} style={textareaStyle} />

        <input
          type="text"
          placeholder="Humor. Ex: tranquilo, choroso, animado..."
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          style={inputStyle}
        />

        <textarea placeholder="Atividades realizadas" value={activities} onChange={(e) => setActivities(e.target.value)} style={textareaStyle} />
        <textarea placeholder="Observações internas" value={observations} onChange={(e) => setObservations(e.target.value)} style={textareaStyle} />
        <textarea placeholder="Recado para os pais" value={messageToParents} onChange={(e) => setMessageToParents(e.target.value)} style={textareaStyle} />

        <button
          onClick={saveAgenda}
          disabled={loading || students.length === 0}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            cursor: loading || students.length === 0 ? "not-allowed" : "pointer",
            background: loading || students.length === 0 ? "#9ca3af" : "#111827",
            color: "white",
            marginTop: 12,
          }}
        >
          {loading ? "Salvando..." : "Salvar agenda"}
        </button>

        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </section>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  width: "100%",
  maxWidth: 500,
  border: "1px solid #ccc",
  borderRadius: 8,
  marginBottom: 12,
};

const textareaStyle = {
  padding: 12,
  width: "100%",
  maxWidth: 500,
  minHeight: 80,
  border: "1px solid #ccc",
  borderRadius: 8,
  marginBottom: 12,
};
