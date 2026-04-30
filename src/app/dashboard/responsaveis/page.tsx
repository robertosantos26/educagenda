"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
};

type GuardianLink = {
  student_id: string;
  guardian_id: string;
  relationship: string | null;
  students: {
    name: string;
  } | null;
  profiles: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export default function ResponsaveisPage() {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<GuardianLink[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [relationship, setRelationship] = useState("Mãe");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getSchoolId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    return data?.school_id || null;
  }

  async function loadStudents() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data } = await supabase
      .from("students")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("active", true)
      .order("name", { ascending: true });

    setStudents(data || []);
  }

  async function loadGuardians() {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    const { data, error } = await supabase
      .from("student_guardians")
      .select(`
        student_id,
        guardian_id,
        relationship,
        students!student_guardians_student_id_fkey(name),
        profiles!student_guardians_guardian_id_fkey(name, email, phone)
      `)
      .eq("profiles.school_id", schoolId);

    if (error) {
      setMessage("Erro ao carregar responsáveis: " + error.message);
      return;
    }

    setGuardianLinks((data || []) as unknown as GuardianLink[]);
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setStudentId("");
    setRelationship("Mãe");
  }

  async function createGuardian() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome do responsável.");
      return;
    }

    if (!email.trim()) {
      setMessage("Digite o e-mail do responsável.");
      return;
    }

    if (!password.trim()) {
      setMessage("Digite uma senha provisória.");
      return;
    }

    if (!studentId) {
      setMessage("Selecione a criança vinculada.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/create-guardian-auth", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        studentId,
        relationship,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Erro ao criar responsável.");
      setLoading(false);
      return;
    }

    resetForm();
    setShowForm(false);
    setMessage("Responsável criado com sucesso.");

    await loadGuardians();

    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
    loadGuardians();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={pageTitle}>Responsáveis</h1>
            <p style={subtitle}>
              Crie acesso para pais e responsáveis acompanharem a agenda da criança.
            </p>
          </div>

          <button onClick={() => setShowForm(true)} style={addButtonStyle}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Novo responsável
          </button>
        </div>

        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Cadastrar responsável</h2>

          <input type="text" placeholder="Nome do responsável" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="E-mail de acesso" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Senha provisória" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <select value={relationship} onChange={(e) => setRelationship(e.target.value)} style={inputStyle}>
            <option value="Mãe">Mãe</option>
            <option value="Pai">Pai</option>
            <option value="Avó">Avó</option>
            <option value="Avô">Avô</option>
            <option value="Responsável">Responsável</option>
            <option value="Outro">Outro</option>
          </select>

          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle}>
            <option value="">Selecione a criança</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={createGuardian}
              disabled={loading}
              style={{
                ...buttonPrimary,
                background: loading ? "#9ca3af" : "#2563eb",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Criando..." : "Criar responsável"}
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
        <h2 style={sectionTitle}>Responsáveis cadastrados</h2>

        {guardianLinks.length === 0 ? (
          <p style={emptyStyle}>Nenhum responsável cadastrado ainda.</p>
        ) : (
          <div style={gridStyle}>
            {guardianLinks.map((item) => {
              const guardian = item.profiles;
              const child = item.students;

              return (
                <div key={`${item.guardian_id}-${item.student_id}`} style={guardianCardStyle}>
                  <div style={topRowStyle}>
                    <div style={avatarStyle}>
                      {guardian?.name?.charAt(0).toUpperCase() || "R"}
                    </div>

                    <div>
                      <strong style={nameStyle}>
                        👨‍👩‍👧 {guardian?.name || "Responsável"}
                      </strong>
                      <p style={infoTextStyle}>{guardian?.email || "Sem e-mail"}</p>
                    </div>
                  </div>

                  <InfoLine icon="📞" label="Telefone" value={guardian?.phone || "Não informado"} />
                  <InfoLine icon="👶" label="Criança vinculada" value={child?.name || "Não informada"} />
                  <InfoLine icon="🔗" label="Parentesco" value={item.relationship || "Responsável"} />

                  <span style={statusBadgeStyle}>✅ Acesso criado</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={infoLineStyle}>
      <span style={iconStyle}>{icon}</span>
      <div>
        <p style={infoLabelStyle}>{label}</p>
        <p style={infoValueStyle}>{value}</p>
      </div>
    </div>
  );
}

const cardStyle = { background: "#ffffff", borderRadius: 18, padding: 28, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)", marginBottom: 28 };
const headerRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" as const };
const pageTitle = { fontSize: 28, marginBottom: 6 };
const subtitle = { color: "#6b7280", marginBottom: 0 };
const sectionTitle = { fontSize: 20, marginBottom: 18 };
const inputStyle = { display: "block", width: "100%", maxWidth: 520, padding: 12, borderRadius: 10, border: "1px solid #d1d5db", marginBottom: 12, fontSize: 14 };
const addButtonStyle = { display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12, border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: 700 };
const buttonPrimary = { padding: "12px 18px", borderRadius: 10, border: "none", color: "white", fontWeight: 700 };
const buttonSecondary = { padding: "12px 18px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontWeight: 700 };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 };
const guardianCardStyle = { padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)" };
const topRowStyle = { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 };
const avatarStyle = { width: 48, height: 48, borderRadius: 16, background: "#fef3c7", color: "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 };
const nameStyle = { fontSize: 18, display: "block" };
const infoTextStyle = { margin: "6px 0 0", color: "#6b7280" };
const infoLineStyle = { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 };
const iconStyle = { width: 24 };
const infoLabelStyle = { margin: 0, color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const };
const infoValueStyle = { margin: "3px 0 0", color: "#111827", fontSize: 14 };
const statusBadgeStyle = { display: "inline-block", padding: "7px 10px", borderRadius: 999, fontWeight: 700, fontSize: 13, background: "#dcfce7", color: "#166534" };
const messageStyle = { marginTop: 14, color: "#374151" };
const emptyStyle = { color: "#6b7280" };
