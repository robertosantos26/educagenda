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

export default function AgendaPage() {
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
      .eq("school_id", schoolId)
      .order("name", { ascending: true });

    setClasses(data || []);
  }

  async function loadStudents() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data } = await supabase
      .from("students")
      .select("id, name, class_id")
      .eq("school_id", schoolId)
      .eq("active", true)
      .order("name", { ascending: true });

    setStudents(data || []);
  }

  async function saveAgenda() {
    setMessage("");

    if (!selectedStudentId) {
      setMessage("Selecione uma criança.");
      return;
    }

    setLoading(true);

    const schoolId = await getSchoolId();

    if (!schoolId) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("daily_reports").upsert(
      {
        school_id: schoolId,
        student_id: selectedStudentId,
        teacher_id: user?.id || null,
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
    loadClasses();
    loadStudents();
  }, []);

  function getClassName(classId: string | null) {
    if (!classId) return "Sem turma";
    return classes.find((item) => item.id === classId)?.name || "Sem turma";
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Agenda diária</h1>
      <p>Selecione a criança e registre as informações do dia.</p>

      <section style={{ marginTop: 24 }}>
        <h2>Selecionar criança</h2>

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          style={{
            padding: 12,
            width: "100%",
            maxWidth: 500,
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <option value="">Selecione uma criança</option>

          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} — {getClassName(student.class_id)}
            </option>
          ))}
        </select>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Informações do dia</h2>

        <textarea
          placeholder="Alimentação"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          style={textareaStyle}
        />

        <textarea
          placeholder="Sono"
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          style={textareaStyle}
        />

        <textarea
          placeholder="Banheiro / fralda"
          value={bathroom}
          onChange={(e) => setBathroom(e.target.value)}
          style={textareaStyle}
        />

        <input
          type="text"
          placeholder="Humor. Ex: tranquilo, choroso, animado..."
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Atividades realizadas"
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          style={textareaStyle}
        />

        <textarea
          placeholder="Observações internas"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          style={textareaStyle}
        />

        <textarea
          placeholder="Recado para os pais"
          value={messageToParents}
          onChange={(e) => setMessageToParents(e.target.value)}
          style={textareaStyle}
        />

        <button
          onClick={saveAgenda}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#9ca3af" : "#111827",
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
