"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  admission_date: string | null;
  access_created: boolean;
};

type ClassItem = {
  id: string;
  name: string;
};

type TeacherClassLink = {
  teacher_id: string;
  class_id: string;
};

export default function ProfessoresPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [links, setLinks] = useState<TeacherClassLink[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  // ✅ FIX: schoolId guardado em estado — getSchoolId() chamado uma única vez
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ FIX: Uma única chamada ao Supabase para pegar school_id
  async function fetchSchoolId(): Promise<string | null> {
    if (schoolId) return schoolId; // já carregado, reutiliza

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    const id = profile?.school_id || null;
    setSchoolId(id);
    return id;
  }

  async function loadClasses(sid: string) {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", sid)
      .order("name", { ascending: true });

    setClasses(data || []);
  }

  async function loadTeachers(sid: string) {
    const { data } = await supabase
      .from("teachers")
      .select("id, name, email, phone, address, admission_date, access_created")
      .eq("school_id", sid)
      .order("name", { ascending: true });

    setTeachers(data || []);
  }

  // ✅ FIX PRINCIPAL: filtra vínculos apenas das turmas da escola atual
  // Antes: buscava TODOS os teacher_class_links do banco (sem filtro)
  // Agora: faz JOIN com classes filtrando por school_id
  async function loadLinks(sid: string) {
    const { data, error } = await supabase
      .from("teacher_class_links")
      .select("teacher_id, class_id, classes!inner(school_id)")
      .eq("classes.school_id", sid);

    if (error) {
      console.error("Erro ao carregar vínculos:", error.message);
      return;
    }

    // Remove o campo extra do JOIN antes de salvar no estado
    const cleaned: TeacherClassLink[] = (data || []).map((item) => ({
      teacher_id: item.teacher_id,
      class_id: item.class_id,
    }));

    setLinks(cleaned);
  }

  // ✅ FIX: carrega tudo de uma vez com o mesmo school_id
  async function loadAll() {
    const sid = await fetchSchoolId();
    if (!sid) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      return;
    }

    await Promise.all([
      loadClasses(sid),
      loadTeachers(sid),
      loadLinks(sid),
    ]);
  }

  function resetForm() {
    setEditingTeacherId(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setAdmissionDate("");
    setSelectedClasses([]);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
    setMessage("");
  }

  function openEditForm(teacher: Teacher) {
    setEditingTeacherId(teacher.id);
    setName(teacher.name || "");
    setEmail(teacher.email || "");
    setPhone(teacher.phone || "");
    setAddress(teacher.address || "");
    setAdmissionDate(teacher.admission_date || "");

    const teacherLinks = links
      .filter((link) => link.teacher_id === teacher.id)
      .map((link) => link.class_id);

    setSelectedClasses(teacherLinks);
    setShowForm(true);
    setMessage("");
  }

  function toggleClass(classId: string) {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  }

  function getTeacherClasses(teacherId: string) {
    const teacherLinks = links.filter((link) => link.teacher_id === teacherId);

    const names = teacherLinks
      .map((link) => classes.find((item) => item.id === link.class_id)?.name)
      .filter(Boolean);

    return names.length > 0 ? names.join(", ") : "Nenhuma turma vinculada";
  }

  async function saveTeacher() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Digite o nome do professor.");
      return;
    }

    if (!editingTeacherId && !email.trim()) {
      setMessage("Digite o e-mail do professor.");
      return;
    }

    if (selectedClasses.length === 0) {
      setMessage("Selecione pelo menos uma turma.");
      return;
    }

    setLoading(true);

    const sid = await fetchSchoolId();

    if (!sid) {
      setMessage("Não encontrei a escola vinculada ao usuário.");
      setLoading(false);
      return;
    }

    let teacherId = editingTeacherId;

    if (editingTeacherId) {
      const { error } = await supabase
        .from("teachers")
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          admission_date: admissionDate || null,
        })
        .eq("id", editingTeacherId);

      if (error) {
        setMessage("Erro ao atualizar professor: " + error.message);
        setLoading(false);
        return;
      }

      await supabase
        .from("teacher_class_links")
        .delete()
        .eq("teacher_id", editingTeacherId);
    } else {
      const { data: teacher, error } = await supabase
        .from("teachers")
        .insert({
          school_id: sid,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          admission_date: admissionDate || null,
        })
        .select("id")
        .single();

      if (error || !teacher) {
        setMessage("Erro ao cadastrar professor: " + (error?.message || ""));
        setLoading(false);
        return;
      }

      teacherId = teacher.id;
    }

    const teacherLinks = selectedClasses.map((classId) => ({
      teacher_id: teacherId,
      class_id: classId,
    }));

    const { error: linkError } = await supabase
      .from("teacher_class_links")
      .insert(teacherLinks);

    if (linkError) {
      setMessage(
        "Professor salvo, mas houve erro ao vincular turmas: " +
          linkError.message
      );
      setLoading(false);
      return;
    }

    resetForm();
    setShowForm(false);
    setMessage(
      editingTeacherId
        ? "Professor atualizado com sucesso."
        : "Professor cadastrado com sucesso."
    );

    await loadTeachers(sid);
    await loadLinks(sid);

    setLoading(false);
  }

  async function createAccess(teacherId: string) {
    setMessage("");

    const password = passwords[teacherId];

    if (!password) {
      setMessage("Digite uma senha provisória.");
      return;
    }

    const response = await fetch("/api/create-teacher-auth", {
      method: "POST",
      body: JSON.stringify({ teacherId, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Erro ao criar acesso.");
      return;
    }

    setMessage("Acesso criado com sucesso.");
    setPasswords((prev) => ({ ...prev, [teacherId]: "" }));

    const sid = await fetchSchoolId();
    if (sid) await loadTeachers(sid);
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={pageTitle}>Professores</h1>
            <p style={subtitle}>
              Cadastre, edite e gerencie o acesso dos professores.
            </p>
          </div>

          <button onClick={openCreateForm} style={addButtonStyle}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            Novo professor
          </button>
        </div>

        {message && (
          <p
            style={{
              ...messageStyle,
              color: message.toLowerCase().includes("erro") ? "#dc2626" : "#15803d",
              background: message.toLowerCase().includes("erro") ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${message.toLowerCase().includes("erro") ? "#fecaca" : "#bbf7d0"}`,
              borderRadius: 10,
              padding: "10px 14px",
              marginTop: 14,
            }}
          >
            {message}
          </p>
        )}
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            {editingTeacherId ? "Editar professor" : "Cadastrar professor"}
          </h2>

          <input
            type="text"
            placeholder="Nome do professor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="E-mail do professor"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!editingTeacherId}
            style={{
              ...inputStyle,
              background: editingTeacherId ? "#f3f4f6" : "white",
              cursor: editingTeacherId ? "not-allowed" : "text",
            }}
          />

          {editingTeacherId && (
            <p style={helpTextStyle}>
              O e-mail não pode ser alterado porque está vinculado ao acesso do professor.
            </p>
          )}

          <input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Endereço"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Data de admissão</label>
          <input
            type="date"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
            style={inputStyle}
          />

          <div style={{ marginTop: 18 }}>
            <p style={labelStyle}>Turmas do professor</p>

            {classes.length === 0 ? (
              <p style={emptyStyle}>
                Nenhuma turma cadastrada ainda. Cadastre uma turma primeiro.
              </p>
            ) : (
              <div style={classGridStyle}>
                {classes.map((item) => {
                  const selected = selectedClasses.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleClass(item.id)}
                      style={{
                        ...classButtonStyle,
                        background: selected ? "#2563eb" : "#f9fafb",
                        color: selected ? "white" : "#111827",
                        borderColor: selected ? "#2563eb" : "#e5e7eb",
                      }}
                    >
                      🏫 {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={saveTeacher}
              disabled={loading || classes.length === 0}
              style={{
                ...buttonPrimary,
                background:
                  loading || classes.length === 0 ? "#9ca3af" : "#2563eb",
                cursor:
                  loading || classes.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Salvando..."
                : editingTeacherId
                ? "Salvar alterações"
                : "Cadastrar professor"}
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
        <h2 style={sectionTitle}>Professores cadastrados</h2>

        {teachers.length === 0 ? (
          <p style={emptyStyle}>Nenhum professor cadastrado ainda.</p>
        ) : (
          <div style={teachersGridStyle}>
            {teachers.map((teacher) => (
              <div key={teacher.id} style={teacherCardStyle}>
                <div style={teacherHeaderStyle}>
                  <div style={avatarStyle}>
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={teacherNameStyle}>👩‍🏫 {teacher.name}</strong>
                    <p style={infoTextStyle}>{teacher.email || "Sem e-mail"}</p>
                  </div>
                </div>

                <div style={infoBlockStyle}>
                  <InfoLine icon="📞" label="Telefone" value={teacher.phone || "Não informado"} />
                  <InfoLine icon="📍" label="Endereço" value={teacher.address || "Não informado"} />
                  <InfoLine icon="📅" label="Admissão" value={teacher.admission_date || "Não informado"} />
                  <InfoLine icon="🏫" label="Turmas" value={getTeacherClasses(teacher.id)} />
                </div>

                <span
                  style={{
                    ...statusBadgeStyle,
                    background: teacher.access_created ? "#dcfce7" : "#fef3c7",
                    color: teacher.access_created ? "#166534" : "#92400e",
                  }}
                >
                  {teacher.access_created ? "✅ Acesso criado" : "🔐 Sem acesso"}
                </span>

                {!teacher.access_created && (
                  <div style={accessBoxStyle}>
                    <input
                      type="password"
                      placeholder="Senha provisória"
                      value={passwords[teacher.id] || ""}
                      onChange={(e) =>
                        setPasswords({ ...passwords, [teacher.id]: e.target.value })
                      }
                      style={smallInputStyle}
                    />
                    <button
                      onClick={() => createAccess(teacher.id)}
                      style={accessButtonStyle}
                    >
                      Criar acesso
                    </button>
                  </div>
                )}

                <button onClick={() => openEditForm(teacher)} style={editButtonStyle}>
                  Ver / editar dados
                </button>
              </div>
            ))}
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
const smallInputStyle = { padding: 10, borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, width: "100%" };
const labelStyle = { fontWeight: 700, marginBottom: 10 };
const helpTextStyle = { marginTop: -4, marginBottom: 12, color: "#6b7280", fontSize: 13 };
const classGridStyle = { display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 18 };
const classButtonStyle = { padding: "10px 14px", borderRadius: 999, border: "1px solid #e5e7eb", cursor: "pointer", fontWeight: 600 };
const addButtonStyle = { display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12, border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: 700 };
const buttonPrimary = { padding: "12px 18px", borderRadius: 10, border: "none", color: "white", fontWeight: 700 };
const buttonSecondary = { padding: "12px 18px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontWeight: 700 };
const teachersGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 };
const teacherCardStyle = { padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)" };
const teacherHeaderStyle = { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 };
const avatarStyle = { width: 48, height: 48, borderRadius: 16, background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 };
const teacherNameStyle = { fontSize: 18, display: "block" };
const infoTextStyle = { margin: "6px 0 0", color: "#6b7280" };
const infoBlockStyle = { display: "grid", gap: 12, marginBottom: 16 };
const infoLineStyle = { display: "flex", gap: 10, alignItems: "flex-start" };
const iconStyle = { width: 24 };
const infoLabelStyle = { margin: 0, color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const };
const infoValueStyle = { margin: "3px 0 0", color: "#111827", fontSize: 14 };
const statusBadgeStyle = { display: "inline-block", padding: "7px 10px", borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 14 };
const accessBoxStyle = { display: "grid", gap: 10, marginBottom: 12 };
const accessButtonStyle = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#111827", color: "white", cursor: "pointer", fontWeight: 700 };
const editButtonStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", background: "#eff6ff", color: "#2563eb", cursor: "pointer", fontWeight: 700 };
const messageStyle = { marginTop: 14, color: "#374151" };
const emptyStyle = { color: "#6b7280" };
