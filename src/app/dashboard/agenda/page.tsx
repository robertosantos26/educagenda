"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "supervisor" | "teacher" | "guardian" | "";

type ClassItem = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  class_id: string | null;
};

type Report = {
  id: string;
  student_id: string;
  report_date: string;
  food: string | null;
  sleep: string | null;
  bathroom: string | null;
  mood: string | null;
  activities: string | null;
  observations: string | null;
  message_to_parents: string | null;
};

export default function AgendaPage() {
  const today = new Date().toISOString().split("T")[0];

  const [role, setRole] = useState<Role>("");
  const [schoolId, setSchoolId] = useState("");
  const [profileId, setProfileId] = useState("");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [showForm, setShowForm] = useState(false);

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

  async function loadInitialData() {
    setMessage("");

    const profile = await getProfile();

    if (!profile?.school_id) {
      setMessage("Usuário sem escola vinculada.");
      return;
    }

    setRole(profile.role || "");
    setSchoolId(profile.school_id);
    setProfileId(profile.id);

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

      const { data: teacherClasses } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", classIds)
        .order("name", { ascending: true });

      setClasses(teacherClasses || []);

      if (teacherClasses && teacherClasses.length > 0) {
        setSelectedClassId(teacherClasses[0].id);
        await loadStudentsAndReports(teacherClasses[0].id, selectedDate);
      }

      return;
    }

    const { data: allClasses } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true });

    setClasses(allClasses || []);

    if (allClasses && allClasses.length > 0) {
      setSelectedClassId(allClasses[0].id);
      await loadStudentsAndReports(allClasses[0].id, selectedDate);
    }
  }

  async function loadStudentsAndReports(classId: string, date: string) {
    if (!classId) return;

    setMessage("");
    setStudents([]);
    setReports([]);

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, name, class_id")
      .eq("class_id", classId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (studentError) {
      setMessage("Erro ao carregar crianças: " + studentError.message);
      return;
    }

    const loadedStudents = studentData || [];
    setStudents(loadedStudents);

    const studentIds = loadedStudents.map((student) => student.id);

    if (studentIds.length === 0) {
      setReports([]);
      return;
    }

    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .select(
        "id, student_id, report_date, food, sleep, bathroom, mood, activities, observations, message_to_parents"
      )
      .eq("report_date", date)
      .in("student_id", studentIds);

    if (reportError) {
      setMessage("Erro ao carregar agendas: " + reportError.message);
      return;
    }

    setReports(reportData || []);
  }

  function getReportByStudent(studentId: string) {
    return reports.find((report) => report.student_id === studentId) || null;
  }

  function resetForm() {
    setSelectedStudentId("");
    setFood("");
    setSleep("");
    setBathroom("");
    setMood("");
    setActivities("");
    setObservations("");
    setMessageToParents("");
  }

  function openNewAgenda() {
    resetForm();
    setShowForm(true);
    setMessage("");
  }

  function openStudentAgenda(student: Student) {
    setSelectedStudentId(student.id);
    setShowForm(true);
    setMessage("");

    const existingReport = getReportByStudent(student.id);

    if (existingReport) {
      setFood(existingReport.food || "");
      setSleep(existingReport.sleep || "");
      setBathroom(existingReport.bathroom || "");
      setMood(existingReport.mood || "");
      setActivities(existingReport.activities || "");
      setObservations(existingReport.observations || "");
      setMessageToParents(existingReport.message_to_parents || "");
    } else {
      setFood("");
      setSleep("");
      setBathroom("");
      setMood("");
      setActivities("");
      setObservations("");
      setMessageToParents("");
    }
  }

  async function handleClassChange(classId: string) {
    setSelectedClassId(classId);
    resetForm();
    setShowForm(false);
    await loadStudentsAndReports(classId, selectedDate);
  }

  async function handleDateChange(date: string) {
    setSelectedDate(date);
    resetForm();
    setShowForm(false);

    if (selectedClassId) {
      await loadStudentsAndReports(selectedClassId, date);
    }
  }

  async function saveAgenda() {
    setMessage("");

    if (!selectedClassId) {
      setMessage("Selecione uma turma.");
      return;
    }

    if (!selectedStudentId) {
      setMessage("Selecione uma criança.");
      return;
    }

    if (!schoolId || !profileId) {
      setMessage("Usuário sem escola vinculada.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("daily_reports").upsert(
      {
        school_id: schoolId,
        student_id: selectedStudentId,
        teacher_id: profileId,
        report_date: selectedDate,
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

    setMessage("Agenda salva com sucesso.");
    setShowForm(false);
    resetForm();

    await loadStudentsAndReports(selectedClassId, selectedDate);

    setLoading(false);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  const doneCount = reports.length;
  const pendingCount = Math.max(students.length - doneCount, 0);

  return (
    <div>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={pageTitle}>Agenda</h1>
            <p style={subtitle}>
              Selecione a turma, acompanhe quem já recebeu agenda e preencha em poucos cliques.
            </p>
          </div>

          <button onClick={openNewAgenda} style={addButtonStyle}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Nova agenda
          </button>
        </div>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={cardStyle}>
        <div style={filtersGridStyle}>
          <div>
            <label style={labelStyle}>Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Turma</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione uma turma</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={summaryGridStyle}>
          <SummaryCard emoji="👶" title="Crianças" value={students.length} color="#2563eb" bg="#eff6ff" />
          <SummaryCard emoji="✅" title="Feitas" value={doneCount} color="#16a34a" bg="#f0fdf4" />
          <SummaryCard emoji="⏳" title="Pendentes" value={pendingCount} color="#dc2626" bg="#fef2f2" />
        </div>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            {selectedStudentId && getReportByStudent(selectedStudentId)
              ? "Editar agenda"
              : "Preencher nova agenda"}
          </h2>

          <label style={labelStyle}>Criança</label>
          <select
            value={selectedStudentId}
            onChange={(e) => {
              const student = students.find((s) => s.id === e.target.value);
              if (student) openStudentAgenda(student);
              else setSelectedStudentId("");
            }}
            style={inputStyle}
          >
            <option value="">Selecione uma criança</option>
            {students.map((student) => {
              const hasReport = Boolean(getReportByStudent(student.id));

              return (
                <option key={student.id} value={student.id}>
                  {hasReport ? "✅" : "🔴"} {student.name}
                </option>
              );
            })}
          </select>

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

          <label style={labelStyle}>Recado para os pais</label>
          <textarea
            placeholder="Escreva um recado livre para os pais..."
            value={messageToParents}
            onChange={(e) => setMessageToParents(e.target.value)}
            style={textareaStyle}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={saveAgenda}
              disabled={loading}
              style={{
                ...buttonPrimary,
                background: loading ? "#9ca3af" : "#2563eb",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Salvando..." : "Salvar agenda"}
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              style={buttonSecondary}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Crianças da turma</h2>

        {students.length === 0 ? (
          <p style={emptyStyle}>Nenhuma criança encontrada nesta turma.</p>
        ) : (
          <div style={studentsGridStyle}>
            {students.map((student) => {
              const hasReport = Boolean(getReportByStudent(student.id));

              return (
                <button
                  key={student.id}
                  onClick={() => openStudentAgenda(student)}
                  style={{
                    ...studentButtonStyle,
                    borderColor: hasReport ? "#bbf7d0" : "#fecaca",
                    background: hasReport ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div style={studentAvatarStyle}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ textAlign: "left" as const }}>
                    <strong>{student.name}</strong>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: hasReport ? "#166534" : "#991b1b",
                        fontWeight: 700,
                      }}
                    >
                      {hasReport ? "✅ Agenda feita" : "🔴 Pendente hoje"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  emoji,
  title,
  value,
  color,
  bg,
}: {
  emoji: string;
  title: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ ...summaryIconStyle, background: bg, color }}>{emoji}</div>
      <div>
        <p style={summaryTitleStyle}>{title}</p>
        <strong style={{ ...summaryValueStyle, color }}>{value}</strong>
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

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap" as const,
};

const pageTitle = { fontSize: 28, marginBottom: 6 };

const subtitle = { color: "#6b7280", marginBottom: 0 };

const sectionTitle = { fontSize: 20, marginBottom: 18 };

const labelStyle = {
  display: "block",
  fontWeight: 800,
  marginBottom: 10,
  color: "#111827",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginBottom: 22,
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 14,
  fontSize: 14,
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  display: "block",
  width: "100%",
  maxWidth: 720,
  minHeight: 110,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 16,
  fontSize: 14,
};

const addButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#16a34a",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const buttonPrimary = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  color: "white",
  fontWeight: 800,
};

const buttonSecondary = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#374151",
  cursor: "pointer",
  fontWeight: 800,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const summaryCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
};

const summaryIconStyle = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
};

const summaryTitleStyle = {
  margin: 0,
  color: "#6b7280",
  fontWeight: 700,
  fontSize: 13,
};

const summaryValueStyle = {
  fontSize: 26,
};

const studentsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const studentButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 16,
  borderRadius: 16,
  border: "1px solid",
  cursor: "pointer",
  width: "100%",
};

const studentAvatarStyle = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  color: "#2563eb",
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
  fontWeight: 700,
};

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};

const emptyStyle = {
  color: "#6b7280",
};
