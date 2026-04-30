"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
  school_id: string;
  class_id: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

type Report = {
  id: string;
  report_date: string;
  food: string | null;
  sleep: string | null;
  bathroom: string | null;
  mood: string | null;
  activities: string | null;
  observations: string | null;
  message_to_parents: string | null;
};

export default function MeuFilhoPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [className, setClassName] = useState("");
  const [reports, setReports] = useState<Report[]>([]);

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [parentMessage, setParentMessage] = useState("");

  const [message, setMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState(false);

  async function loadChild() {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      return;
    }

    const { data: link, error } = await supabase
      .from("student_guardians")
      .select("students(id, name, school_id, class_id)")
      .eq("guardian_id", user.id)
      .single();

    if (error || !link) {
      setMessage("Nenhuma criança vinculada a este responsável.");
      return;
    }

    const child = (link as any).students as Student;

    setStudent(child);

    await loadClass(child.class_id);
    await loadReports(child.id);
  }

  async function loadClass(classId: string | null) {
    if (!classId) {
      setClassName("Sem turma");
      return;
    }

    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("id", classId)
      .single();

    const turma = data as ClassItem | null;
    setClassName(turma?.name || "Sem turma");
  }

  async function loadReports(studentId: string) {
    const { data, error } = await supabase
      .from("daily_reports")
      .select(
        "id, report_date, food, sleep, bathroom, mood, activities, observations, message_to_parents"
      )
      .eq("student_id", studentId)
      .order("report_date", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar agendas: " + error.message);
      return;
    }

    setReports(data || []);
  }

  async function sendMessageToSchool() {
    setMessage("");

    if (!student) {
      setMessage("Criança não encontrada.");
      return;
    }

    if (!parentMessage.trim()) {
      setMessage("Digite um recado antes de enviar.");
      return;
    }

    setLoadingMessage(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      setLoadingMessage(false);
      return;
    }

    const { error } = await supabase.from("parent_messages").insert({
      school_id: student.school_id,
      student_id: student.id,
      guardian_id: user.id,
      message: parentMessage.trim(),
    });

    if (error) {
      setMessage("Erro ao enviar recado: " + error.message);
      setLoadingMessage(false);
      return;
    }

    setParentMessage("");
    setShowMessageForm(false);
    setMessage("Recado enviado para a escola.");
    setLoadingMessage(false);
  }

  function formatDate(date: string) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function moodEmoji(mood: string | null) {
    if (!mood) return "🙂";

    const value = mood.toLowerCase();

    if (value.includes("feliz")) return "😄";
    if (value.includes("tranquilo")) return "🙂";
    if (value.includes("agitado")) return "🤸";
    if (value.includes("choroso")) return "😢";
    if (value.includes("irritado")) return "😠";

    return "🙂";
  }

  useEffect(() => {
    loadChild();
  }, []);

  return (
    <div>
      <div style={heroCardStyle}>
        <div style={heroContentStyle}>
          <div style={avatarStyle}>
            {student?.name?.charAt(0).toUpperCase() || "F"}
          </div>

          <div>
            <p style={eyebrowStyle}>Área do responsável</p>
            <h1 style={pageTitle}>
              {student ? `Agenda de ${student.name}` : "Meu filho"}
            </h1>
            <p style={subtitle}>
              🏫 Turma: <strong>{className || "Carregando..."}</strong>
            </p>
          </div>
        </div>
      </div>

      <div style={messageCardStyle}>
        <div style={messageHeaderStyle}>
          <div>
            <h2 style={sectionTitle}>💬 Recados para a escola</h2>
            <p style={sectionSubtitle}>
              Envie uma informação rápida para a equipe da escola quando precisar.
            </p>
          </div>

          <button
            onClick={() => {
              setShowMessageForm(!showMessageForm);
              setMessage("");
            }}
            style={addButtonStyle}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Novo recado
          </button>
        </div>

        {showMessageForm && (
          <div style={formBoxStyle}>
            <textarea
              placeholder="Ex: Hoje ele acordou um pouco indisposto. Qualquer coisa, podem me avisar."
              value={parentMessage}
              onChange={(e) => setParentMessage(e.target.value)}
              style={textareaStyle}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={sendMessageToSchool}
                disabled={loadingMessage}
                style={{
                  ...buttonPrimary,
                  background: loadingMessage ? "#9ca3af" : "#2563eb",
                  cursor: loadingMessage ? "not-allowed" : "pointer",
                }}
              >
                {loadingMessage ? "Enviando..." : "Enviar recado"}
              </button>

              <button
                onClick={() => {
                  setParentMessage("");
                  setShowMessageForm(false);
                }}
                style={buttonSecondary}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={timelineWrapperStyle}>
        <h2 style={sectionTitle}>📅 Histórico da agenda</h2>

        {reports.length === 0 ? (
          <div style={emptyCardStyle}>
            <h3>📭 Nenhuma agenda registrada ainda</h3>
            <p style={{ color: "#6b7280" }}>
              Quando a escola preencher a agenda, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          reports.map((report, index) => (
            <div key={report.id} style={timelineItemStyle}>
              <div style={timelineMarkerColumnStyle}>
                <div style={timelineDotStyle}>{moodEmoji(report.mood)}</div>

                {index !== reports.length - 1 && (
                  <div style={timelineLineStyle}></div>
                )}
              </div>

              <div style={reportCardStyle}>
                <div style={reportHeaderStyle}>
                  <div>
                    <p style={dateLabelStyle}>📅 {formatDate(report.report_date)}</p>
                    <h3 style={reportTitleStyle}>Agenda do dia</h3>
                  </div>

                  <span style={moodBadgeStyle}>
                    {moodEmoji(report.mood)} {report.mood || "Humor não informado"}
                  </span>
                </div>

                <div style={infoGridStyle}>
                  <InfoBlock icon="🍽️" label="Alimentação" value={report.food} />
                  <InfoBlock icon="😴" label="Sono" value={report.sleep} />
                  <InfoBlock icon="🚽" label="Banheiro / fralda" value={report.bathroom} />
                  <InfoBlock icon="🎨" label="Atividades" value={report.activities} />
                </div>

                <div style={parentMessageBoxStyle}>
                  <strong>💬 Recado da escola</strong>
                  <p>{report.message_to_parents || "Nenhum recado enviado."}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null;
}) {
  return (
    <div style={infoBlockStyle}>
      <div style={infoIconStyle}>{icon}</div>
      <div>
        <p style={infoLabelStyle}>{label}</p>
        <p style={infoValueStyle}>{value || "Não informado"}</p>
      </div>
    </div>
  );
}

const heroCardStyle = {
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  borderRadius: 22,
  padding: 32,
  color: "white",
  marginBottom: 28,
  boxShadow: "0 12px 30px rgba(34, 197, 94, 0.22)",
};

const heroContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap" as const,
};

const avatarStyle = {
  width: 64,
  height: 64,
  borderRadius: 20,
  background: "rgba(255,255,255,0.22)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 26,
};

const eyebrowStyle = {
  margin: 0,
  fontSize: 13,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  opacity: 0.9,
  fontWeight: 700,
};

const pageTitle = {
  fontSize: 32,
  margin: "8px 0 6px",
};

const subtitle = {
  margin: 0,
  opacity: 0.95,
};

const messageCardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  marginBottom: 28,
};

const messageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap" as const,
};

const sectionTitle = {
  fontSize: 20,
  marginBottom: 8,
};

const sectionSubtitle = {
  margin: 0,
  color: "#6b7280",
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

const formBoxStyle = {
  marginTop: 22,
  padding: 18,
  borderRadius: 16,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const textareaStyle = {
  display: "block",
  width: "100%",
  minHeight: 110,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginBottom: 14,
  fontSize: 14,
  boxSizing: "border-box" as const,
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

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};

const timelineWrapperStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

const timelineItemStyle = {
  display: "grid",
  gridTemplateColumns: "54px 1fr",
  gap: 18,
};

const timelineMarkerColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
};

const timelineDotStyle = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: "#f0fdf4",
  border: "2px solid #bbf7d0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  zIndex: 2,
};

const timelineLineStyle = {
  width: 2,
  flex: 1,
  background: "#dcfce7",
  marginTop: 8,
  marginBottom: 8,
};

const reportCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
  marginBottom: 22,
  background: "#ffffff",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
};

const reportHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap" as const,
  marginBottom: 18,
};

const dateLabelStyle = {
  margin: 0,
  color: "#16a34a",
  fontWeight: 800,
};

const reportTitleStyle = {
  margin: "6px 0 0",
  fontSize: 22,
};

const moodBadgeStyle = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 700,
  fontSize: 14,
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const infoBlockStyle = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: 14,
  borderRadius: 14,
  background: "#f9fafb",
  border: "1px solid #f3f4f6",
};

const infoIconStyle = {
  width: 32,
  height: 32,
  borderRadius: 10,
  background: "#f0fdf4",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const infoLabelStyle = {
  margin: 0,
  color: "#6b7280",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

const infoValueStyle = {
  margin: "4px 0 0",
  color: "#111827",
};

const parentMessageBoxStyle = {
  padding: 14,
  borderRadius: 14,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#166534",
};

const emptyCardStyle = {
  padding: 24,
  borderRadius: 16,
  background: "#f9fafb",
  border: "1px dashed #d1d5db",
};
