"use client";

import { useEffect, useState } from "react";
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

export default function AgendasCriancaPage({
  params,
}: {
  params: { id: string };
}) {
  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");

  async function loadStudent() {
    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id")
      .eq("id", params.id)
      .single();

    if (error) {
      setMessage("Erro ao carregar criança: " + error.message);
      return;
    }

    setStudent(data);
  }

  async function loadReports() {
    const { data, error } = await supabase
      .from("daily_reports")
      .select(
        "id, report_date, food, sleep, bathroom, mood, activities, observations, message_to_parents, created_at"
      )
      .eq("student_id", params.id)
      .order("report_date", { ascending: false });

    if (error) {
      setMessage("Erro ao carregar agendas: " + error.message);
      return;
    }

    setReports(data || []);
  }

  useEffect(() => {
    loadStudent();
    loadReports();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/dashboard/turmas">← Voltar para turmas</Link>

      <h1 style={{ marginTop: 24 }}>
        Agendas de {student?.name || "criança"}
      </h1>

      {message && <p>{message}</p>}

      {reports.length === 0 ? (
        <p>Nenhuma agenda registrada para esta criança ainda.</p>
      ) : (
        <div style={{ marginTop: 32 }}>
          {reports.map((report) => (
            <section
              key={report.id}
              style={{
                padding: 20,
                border: "1px solid #ddd",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <h2>Agenda de {report.report_date}</h2>

              <p>
                <strong>Alimentação:</strong> {report.food || "Não informado"}
              </p>

              <p>
                <strong>Sono:</strong> {report.sleep || "Não informado"}
              </p>

              <p>
                <strong>Banheiro / fralda:</strong>{" "}
                {report.bathroom || "Não informado"}
              </p>

              <p>
                <strong>Humor:</strong> {report.mood || "Não informado"}
              </p>

              <p>
                <strong>Atividades:</strong>{" "}
                {report.activities || "Não informado"}
              </p>

              <p>
                <strong>Observações:</strong>{" "}
                {report.observations || "Não informado"}
              </p>

              <p>
                <strong>Recado aos pais:</strong>{" "}
                {report.message_to_parents || "Não informado"}
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
