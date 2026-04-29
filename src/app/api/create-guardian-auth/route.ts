import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, studentId, relationship } =
      await request.json();

    if (!name || !email || !password || !studentId) {
      return NextResponse.json(
        { error: "Nome, e-mail, senha e criança são obrigatórios." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: student, error: studentError } = await adminSupabase
      .from("students")
      .select("id, school_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Criança não encontrada." },
        { status: 404 }
      );
    }

    const { data: authUser, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: "guardian",
        },
      });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message || "Erro ao criar usuário." },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    const { error: profileError } = await adminSupabase.from("profiles").insert({
      id: userId,
      auth_user_id: userId,
      school_id: student.school_id,
      name,
      email,
      phone: phone || null,
      role: "guardian",
      active: true,
    });

    if (profileError) {
      return NextResponse.json(
        { error: "Usuário criado, mas erro ao criar perfil: " + profileError.message },
        { status: 400 }
      );
    }

    const { error: linkError } = await adminSupabase
      .from("student_guardians")
      .insert({
        student_id: studentId,
        guardian_id: userId,
        relationship: relationship || "Responsável",
      });

    if (linkError) {
      return NextResponse.json(
        { error: "Perfil criado, mas erro ao vincular criança: " + linkError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Acesso do responsável criado com sucesso.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao criar acesso do responsável." },
      { status: 500 }
    );
  }
}
