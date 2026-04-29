"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
};

type Draft = {
  food: string;
  sleep: string;
  bathroom: string;
  mood: string;
  activities: string;
  observations: string;
  message_to_parents: string;
};

export default function AgendaTurmaPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

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

  async function loadClasses() {
    const profile = await getProfile();

    if (!profile?.school_id) {
      setMessage("Usuário sem escola vinculada.");
      return;
    }

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
        setMessage("Nenhuma turma vinculada ao professor.");
        return;
      }

      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", classIds)
        .order("name", { ascending: true });

      setClasses(data || []);
      return;
    }

    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true });

    setClasses(data || []);
  }

  async function loadStudentsByClass(classId: string) {
    setMessage("");
    setSelectedClassId(classId);
    setStudents([]);
    setDrafts({});

    if (!classId) return;

    const { data, error } = await supabase
      .from("students")
      .select("id, name")
      .eq("class_id", classId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setMessage("Erro ao carregar crianças: " + error.message);
      return;
    }

    setStudents(data || []);

    const initialDrafts: Record<string, Draft> = {};

    (data || []).forEach((student) => {
      initialDrafts[student.id] = {
        food: "",
        sleep: "",
        bathroom: "",
        mood: "",
        activities: "",
        observations: "",
        message_to_parents: "",
      };
    });

    setDrafts(initialDrafts);
  }

  function updateDraft(studentId: string, field: keyof Draft, value: string) {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [field]: value,
      },
    }));
  }

  async function saveAll() {
    setMessage("");

    if (!selectedClassId) {
      setMessage("Selecione uma turma.");
      return;
    }

    if (students.length === 0) {
      setMessage("Não há crianças nesta turma.");
      return;
    }

    setLoading(true);

    const profile = await getProfile();

    if (!profile?.school_id) {
      setMessage("Usuário sem escola vinculada.");
      setLoading(false);
      return;
    }

    const rows = students.map((student) => ({
      school_id: profile.school_id,
      student_id: student.id,
      teacher_id: profile.id,
      report_date: today,
      food: drafts[student.id]?.food || "",
      sleep: drafts[student.id]?.sleep || "",
      bathroom: drafts[student.id]?.bathroom || "",
      mood: drafts[student.id]?.mood || "",
      activities: drafts[student.id]?.activities || "",
      observations: drafts[student.id]?.observations || "",
      message_to_parents: drafts[student.id]?.message_to_parents || "",
    }));

    const { error } = await supabase.from("daily_reports").upsert(rows, {
      onConflict: "student_id,report_date",
    });

    if (error) {
      setMessage("Erro ao salvar agendas: " + error.message);
      setLoading(false);
      return;
    }

    setMessage("Agendas da turma salvas com sucesso.");
    setLoading(false);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <h1 style={pageTitle}>Agenda por turma</h1>
        <p style={subtitle}>
          Selecione a turma e preencha a agenda das crianças em sequência.
        </p>

        <p style={dateStyle}>Agenda de hoje: {today}</p>

        <label style={labelStyle}>Turma</label>

        <select
          value={selectedClassId}
          onChange={(e) => loadStudentsByClass(e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecione uma turma</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {students.length > 0 && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Crianças da turma</h2>

          <div style={studentListStyle}>
            {students.map((student) => (
              <div key={student.id} style={studentCardStyle}>
                <h3 style={{ marginBottom: 16 }}>{student.name}</h3>

                <OptionGroup
                  title="Alimentação"
                  value={drafts[student.id]?.food || ""}
                  onChange={(value) => updateDraft(student.id, "food", value)}
                  options={["Comeu tudo", "Comeu bem", "Comeu pouco", "Não comeu"]}
                />

                <OptionGroup
                  title="Sono"
                  value={drafts[student.id]?.sleep || ""}
                  onChange={(value) => updateDraft(student.id, "sleep", value)}
                  options={["Dormiu bem", "Dormiu pouco", "Não dormiu", "Sono tranquilo"]}
                />

                <OptionGroup
                  title="Banheiro / fralda"
                  value={drafts[student.id]?.bathroom || ""}
                  onChange={(value) => updateDraft(student.id, "bathroom", value)}
                  options={["Normal", "Trocou fralda", "Usou banheiro", "Sem evacuação"]}
                />

                <OptionGroup
                  title="Humor"
                  value={drafts[student.id]?.mood || ""}
                  onChange={(value) => updateDraft(student.id, "mood", value)}
                  options={["Feliz", "Tranquilo", "Agitado", "Choroso", "Irritado"]}
                />

                <OptionGroup
                  title="Atividades"
                  value={drafts[student.id]?.activities || ""}
                  onChange={(value) =>
                    updateDraft(student.id, "activities", value)
                  }
                  options={[
                    "Participou bem",
                    "Brincou com colegas",
                    "Fez atividade pedagógica",
                    "Teve dificuldade na atividade",
                  ]}
                />

                <OptionGroup
                  title="Observações internas"
                  value={drafts[student.id]?.observations || ""}
                  onChange={(value) =>
                    updateDraft(student.id, "observations", value)
                  }
                  options={[
                    "Sem observações",
                    "Precisou de atenção extra",
                    "Teve boa participação",
                    "Demonstrou cansaço",
                  ]}
                />

                <label style={labelStyle}>Recado para os pais</label>

                <textarea
                  placeholder="Escreva um recado para os pais..."
                  value={drafts[student.id]?.message_to_parents || ""}
                  onChange={(e) =>
                    updateDraft(
                      student.id,
                      "message_to_parents",
                      e.target.value
                    )
                  }
                  style={textareaStyle}
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveAll}
            disabled={loading}
            style={{
              ...buttonPrimary,
              background: loading ? "#9ca3af" : "#2563eb",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Salvando..." : "Salvar agendas da turma"}
          </button>
        </div>
      )}
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
    <div style={{ marginBottom: 18 }}>
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
  marginBottom: 20,
};

const dateStyle = {
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "10px 14px",
  borderRadius: 10,
  display: "inline-block",
  marginBottom: 20,
  fontWeight: 700,
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
  minHeight: 90,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 18,
  fontSize: 14,
};

const studentListStyle = {
  display: "grid",
  gap: 20,
};

const studentCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 22,
  background: "#f9fafb",
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
  padding: "14px 22px",
  borderRadius: 10,
  border: "none",
  color: "white",
  fontWeight: 700,
  marginTop: 24,
};

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};
