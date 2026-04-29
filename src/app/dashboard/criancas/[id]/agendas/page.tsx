"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  class_id: string | null;
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
  created_at: string;
};

export default function AgendasCriancaPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");

  async function loadStudent() {
    if (!studentId) return;

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id")
      .eq("id", studentId)
      .single();

    if (error) {
      setMessage("Erro ao carregar criança: " + error.message);
      return;
    }

    setStudent(data);
  }

  async function loadReports() {
    if (!studentId) return;

    const { data, error } = await supabase
      .from("daily_reports")
      .select(
        "id, report_date, food, sleep, bathroom, mood, activities, observations, message_to_parents, created_at"
      )
      .eq("student_id", studentId)
      .order("report_date", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar agendas: " + error.message);
      return;
    }

    setReports(data || []);
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
    loadStudent();
    loadReports();
  }, []);

  return (
    <div>
      <div style={headerCardStyle}>
        <Link href="/dashboard/criancas" style={backLinkStyle}>
          ← Voltar para crianças
        </Link>

        <div style={headerContentStyle}>
          <div style={avatarStyle}>
            {student?.name?.charAt(0).toUpperCase() || "C"}
          </div>

          <div>
            <h1 style={pageTitle}>
              Histórico de {student?.name || "criança"}
            </h1>
            <p style={subtitle}>
              Acompanhe todas as agendas registradas em formato de linha do tempo.
            </p>
          </div>
        </div>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      <div style={timelineWrapperStyle}>
        {reports.length === 0 ? (
          <div style={emptyCardStyle}>
            <h2>📭 Nenhuma agenda registrada ainda</h2>
            <p style={{ color: "#6b7280" }}>
              Quando uma agenda for preenchida, ela aparecerá aqui.
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
                    <h2 style={reportTitleStyle}>Agenda do dia</h2>
                  </div>

                  <span style={moodBadgeStyle}>
                    {moodEmoji(report.mood)} {report.mood || "Humor não informado"}
                  </span>
                </div>

                <div style={infoGridStyle}>
                  <InfoBlock
                    icon="🍽️"
                    label="Alimentação"
                    value={report.food}
                  />

                  <InfoBlock
                    icon="😴"
                    label="Sono"
                    value={report.sleep}
                  />

                  <InfoBlock
                    icon="🚽"
                    label="Banheiro / fralda"
                    value={report.bathroom}
                  />

                  <InfoBlock
                    icon="🎨"
                    label="Atividades"
                    value={report.activities}
                  />
                </div>

                <div style={sectionBoxStyle}>
                  <strong>📝 Observações internas</strong>
                  <p>{report.observations || "Sem observações registradas."}</p>
                </div>

                <div style={parentMessageBoxStyle}>
                  <strong>💬 Recado para os pais</strong>
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

const headerCardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  marginBottom: 28,
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: 22,
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 700,
};

const headerContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap" as const,
};

const avatarStyle = {
  width: 58,
  height: 58,
  borderRadius: 18,
  background: "#dbeafe",
  color: "#1d4ed8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 24,
};

const pageTitle = {
  fontSize: 28,
  margin: "0 0 6px",
};

const subtitle = {
  color: "#6b7280",
  margin: 0,
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
  background: "#eff6ff",
  border: "2px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  zIndex: 2,
};

const timelineLineStyle = {
  width: 2,
  flex: 1,
  background: "#dbeafe",
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
  color: "#2563eb",
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
  background: "#eff6ff",
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

const sectionBoxStyle = {
  padding: 14,
  borderRadius: 14,
  background: "#fffbeb",
  border: "1px solid #fde68a",
  color: "#92400e",
  marginBottom: 12,
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

const messageStyle = {
  marginTop: 14,
  color: "#374151",
};
