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
    <div>
      <div style={cardStyle}>
        <h1 style={pageTitle}>Agenda diária</h1>
        <p style={subtitle}>
          Preencha rapidamente a rotina da criança usando opções prontas.
        </p>

        <label style={labelStyle}>Criança</label>
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
          <p style={warningStyle}>Nenhuma criança disponível para este usuário.</p>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Informações do dia</h2>

        <OptionGroup
          title="Alimentação"
          value={food}
          onChange={setFood}
          options={["Comeu tudo", "Comeu bem", "Comeu pouco", "Não comeu"]}
        />

        <OptionGroup
          title="Sono"
          value={sleep}
          onChange={setSleep}
          options={["Dormiu bem", "Dormiu pouco", "Não dormiu", "Sono tranquilo"]}
        />

        <OptionGroup
          title="Banheiro / fralda"
          value={bathroom}
          onChange={setBathroom}
          options={["Normal", "Trocou fralda", "Usou banheiro", "Sem evacuação"]}
        />

        <OptionGroup
          title="Humor"
          value={mood}
          onChange={setMood}
          options={["Feliz", "Tranquilo", "Agitado", "Choroso", "Irritado"]}
        />

        <OptionGroup
          title="Atividades"
          value={activities}
          onChange={setActivities}
          options={[
            "Participou bem",
            "Brincou com colegas",
            "Fez atividade pedagógica",
            "Teve dificuldade na atividade",
          ]}
        />

        <OptionGroup
          title="Observações internas"
          value={observations}
          onChange={setObservations}
          options={[
            "Sem observações",
            "Precisou de atenção extra",
            "Teve boa participação",
            "Demonstrou cansaço",
          ]}
        />

        <div style={{ marginTop: 24 }}>
          <label style={labelStyle}>Recado para os pais</label>
          <textarea
            placeholder="Escreva um recado livre para os pais..."
            value={messageToParents}
            onChange={(e) => setMessageToParents(e.target.value)}
            style={textareaStyle}
          />
        </div>

        <button
          onClick={saveAgenda}
          disabled={loading || students.length === 0}
          style={{
            ...buttonPrimary,
            background: loading || students.length === 0 ? "#9ca3af" : "#2563eb",
            cursor: loading || students.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Salvando..." : "Salvar agenda"}
        </button>

        {message && <p style={messageStyle}>{message}</p>}
      </div>
    </div>
  );
}

function OptionGroup({
  title,
  value,
  onChange,
  options,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div style={optionGroupStyle}>
      <p style={labelStyle}>{title}</p>

      <div style={optionsGridStyle}>
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              style={{
                ...optionButtonStyle,
                background: selected ? "#2563eb" : "#f9fafb",
                color: selected ? "white" : "#111827",
                borderColor: selected ? "#2563eb" : "#e5e7eb",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  marginBottom: 28,
};

const pageTitle = {
  fontSize: 28,
  marginBottom: 6,
};

const subtitle = {
  color: "#6b7280",
  marginBottom: 28,
};

const sectionTitle = {
  fontSize: 22,
  marginBottom: 22,
};

const labelStyle = {
  display: "block",
  fontWeight: 700,
  marginBottom: 10,
  color: "#111827",
};

const inputStyle = {
  display: "block",
  width: "100%",
  maxWidth: 520,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 12,
  fontSize: 14,
};

const textareaStyle = {
  display: "block",
  width: "100%",
  maxWidth: 620,
  minHeight: 110,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 18,
  fontSize: 14,
};

const optionGroupStyle = {
  marginBottom: 22,
};

const optionsGridStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 10,
};

const optionButtonStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
};

const buttonPrimary = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "none",
  color: "white",
  fontWeight: 700,
  marginTop: 16,
};

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};

const warningStyle = {
  color: "#b45309",
  marginTop: 8,
};
