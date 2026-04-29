"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
};

export default function AgendasCriancaPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    if (!studentId) return;

    // 👶 Criança
    const { data: studentData } = await supabase
      .from("students")
      .select("id, name")
      .eq("id", studentId)
      .single();

    setStudent(studentData);

    // 📅 Agendas
    const { data: reports } = await supabase
      .from("daily_reports")
      .select(
        "id, report_date, food, sleep, bathroom, mood, activities, observations, message_to_parents"
      )
      .eq("student_id", studentId);

    // 💬 Mensagens dos pais
    const { data: messages } = await supabase
      .from("parent_messages")
      .select("id, message, message_date")
      .eq("student_id", studentId);

    // 🔗 Junta tudo
    const combined = [
      ...(reports || []).map((r: any) => ({
        type: "report",
        date: r.report_date,
        data: r,
      })),
      ...(messages || []).map((m: any) => ({
        type: "message",
        date: m.message_date,
        data: m,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    setTimeline(combined);
  }

  function formatDate(date: string) {
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  }

  function moodEmoji(mood: string | null) {
    if (!mood) return "🙂";

    const v = mood.toLowerCase();

    if (v.includes("feliz")) return "😄";
    if (v.includes("tranquilo")) return "🙂";
    if (v.includes("agitado")) return "🤸";
    if (v.includes("choroso")) return "😢";
    if (v.includes("irritado")) return "😠";

    return "🙂";
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>
        📅 Histórico de {student?.name || ""}
      </h1>

      {message && <p>{message}</p>}

      {timeline.length === 0 ? (
        <p>Nenhuma informação ainda.</p>
      ) : (
        timeline.map((item, index) => (
          <div key={index} style={cardStyle}>
            {/* 📅 DATA */}
            <p style={dateStyle}>📅 {formatDate(item.date)}</p>

            {/* 📊 AGENDA */}
            {item.type === "report" && (
              <>
                <strong style={{ fontSize: 18 }}>
                  {moodEmoji(item.data.mood)} Agenda do dia
                </strong>

                <p>🍽️ {item.data.food || "Sem info"}</p>
                <p>😴 {item.data.sleep || "Sem info"}</p>
                <p>🚽 {item.data.bathroom || "Sem info"}</p>
                <p>🎨 {item.data.activities || "Sem info"}</p>

                <div style={boxStyleYellow}>
                  <strong>📝 Observações</strong>
                  <p>{item.data.observations || "Nenhuma"}</p>
                </div>

                <div style={boxStyleGreen}>
                  <strong>💬 Recado da escola</strong>
                  <p>{item.data.message_to_parents || "Nenhum"}</p>
                </div>
              </>
            )}

            {/* 💬 MENSAGEM DOS PAIS */}
            {item.type === "message" && (
              <div style={boxStyleBlue}>
                <strong>👨‍👩‍👧 Recado dos pais</strong>
                <p>{item.data.message}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 18,
  borderRadius: 12,
  marginBottom: 16,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const dateStyle = {
  fontWeight: "bold",
  color: "#2563eb",
  marginBottom: 10,
};

const boxStyleYellow = {
  background: "#fffbeb",
  padding: 12,
  borderRadius: 10,
  marginTop: 10,
};

const boxStyleGreen = {
  background: "#f0fdf4",
  padding: 12,
  borderRadius: 10,
  marginTop: 10,
};

const boxStyleBlue = {
  background: "#eff6ff",
  padding: 14,
  borderRadius: 10,
};
