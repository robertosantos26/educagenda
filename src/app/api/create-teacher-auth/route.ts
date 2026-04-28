import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { teacherId, password } = await request.json();

    if (!teacherId || !password) {
      return NextResponse.json(
        { error: "teacherId e password são obrigatórios." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: teacher, error: teacherError } = await adminSupabase
      .from("teachers")
      .select("id, school_id, name, email, phone, auth_user_id")
      .eq("id", teacherId)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: "Professor não encontrado." },
        { status: 404 }
      );
    }

    if (!teacher.email) {
      return NextResponse.json(
        { error: "Professor precisa ter e-mail para criar acesso." },
        { status: 400 }
      );
    }

    if (teacher.auth_user_id) {
      return NextResponse.json(
        { error: "Esse professor já possui acesso criado." },
        { status: 400 }
      );
    }

    const { data: authUser, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email: teacher.email,
        password,
        email_confirm: true,
        user_metadata: {
          name: teacher.name,
          role: "teacher",
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
      school_id: teacher.school_id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      role: "teacher",
      active: true,
    });

    if (profileError) {
      return NextResponse.json(
        { error: "Usuário criado, mas erro ao criar profile: " + profileError.message },
        { status: 400 }
      );
    }

    const { error: updateError } = await adminSupabase
      .from("teachers")
      .update({
        auth_user_id: userId,
        access_created: true,
      })
      .eq("id", teacher.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Acesso criado, mas erro ao atualizar professor." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Acesso do professor criado com sucesso.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao criar acesso." },
      { status: 500 }
    );
  }
}
