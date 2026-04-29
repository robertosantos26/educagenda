"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
  school_id: string;
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
  const [reports, setReports] = useState<Report[]>([]);
  const [parentMessage, setParentMessage] = useState("");
  const [message, setMessage] = useState("");

  async function loadChild() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
      return;
    }

    const { data: link, error } = await supabase
      .from("student_guardians")
      .select("students(id, name, school_id)")
      .eq("guardian_id", user.id)
      .single();

    if (error || !link) {
      setMessage("Nenhuma criança vinculada a este responsável.");
      return;
    }

    const child = (link as any).students;

    setStudent(child);
    await loadReports(child.id);
  }

  async function loadReports(studentId: string) {
    const { data } = await supabase
      .from("daily_reports")
      .select("id, report_date, food, sleep, bathroom, mood, activities, observations, message_to_parents")
      .eq("student_id", studentId)
      .order("report_date", { ascending: false });

    setReports(data || []);
  }

  async function sendMessageToSchool() {
    setMessage("");

    if (!student) {
      setMessage("Criança não encontrada.");
      return;
    }

    if (!parentMessage.trim()) {
      setMessage("Digite um recado.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Usuário não autenticado.");
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
      return;
    }

    setParentMessage("");
    setMessage("Recado enviado para a escola.");
  }

  useEffect(() => {
    loadChild();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Agenda do meu filho</h1>

      {message && <p>{message}</p>}

      {student && (
        <>
          <h2>{student.name}</h2>

          <section style={{ marginTop: 24 }}>
            <h3>Enviar recado para a escola</h3>

            <textarea
              placeholder="Escreva um recado para a escola/professora"
              value={parentMessage}
              onChange={(e) => setParentMessage(e.target.value)}
              style={{
                padding: 12,
                width: "100%",
                maxWidth: 500,
                minHeight: 80,
                border: "1px solid #ccc",
                borderRadius: 8,
                marginBottom: 12,
              }}
            />

            <br />

            <button onClick={sendMessageToSchool} style={button}>
              Enviar recado
            </button>
          </section>

          <section style={{ marginTop: 40 }}>
            <h3>Agendas registradas</h3>

            {reports.length === 0 ? (
              <p>Nenhuma agenda registrada ainda.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} style={card}>
                  <h3>Agenda de {report.report_date}</h3>

                  <p><strong>Alimentação:</strong> {report.food || "Não informado"}</p>
                  <p><strong>Sono:</strong> {report.sleep || "Não informado"}</p>
                  <p><strong>Banheiro:</strong> {report.bathroom || "Não informado"}</p>
                  <p><strong>Humor:</strong> {report.mood || "Não informado"}</p>
                  <p><strong>Atividades:</strong> {report.activities || "Não informado"}</p>
                  <p><strong>Observações:</strong> {report.observations || "Não informado"}</p>
                  <p><strong>Recado da escola:</strong> {report.message_to_parents || "Não informado"}</p>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

const button = {
  padding: 10,
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const card = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 8,
  marginBottom: 12,
};
