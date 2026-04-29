"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MensagensPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [role, setRole] = useState("");

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();

    setRole(data?.role || "");
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("parent_messages")
      .select(`
        id,
        message,
        message_date,
        read_by_admin,
        read_by_teacher,
        students(name)
      `)
      .order("created_at", { ascending: false });

    setMessages(data || []);
  }

  async function markAsRead(id: string) {
    const field =
      role === "admin" ? "read_by_admin" : "read_by_teacher";

    await supabase
      .from("parent_messages")
      .update({ [field]: true })
      .eq("id", id);

    loadMessages();
  }

  useEffect(() => {
    loadUser();
    loadMessages();
  }, []);

  return (
    <div>
      <h1>📬 Mensagens dos responsáveis</h1>

      {messages.map((msg) => {
        const isRead =
          msg.read_by_admin || msg.read_by_teacher;

        return (
          <div
            key={msg.id}
            style={{
              padding: 16,
              marginBottom: 12,
              borderRadius: 12,
              background: isRead ? "#f3f4f6" : "#fff7ed",
            }}
          >
            <strong>👶 {msg.students?.name}</strong>

            <p>{msg.message}</p>

            {!isRead && (
              <button onClick={() => markAsRead(msg.id)}>
                Marcar como lida
              </button>
            )}

            {isRead && <span>✔ Lida</span>}
          </div>
        );
      })}
    </div>
  );
}
