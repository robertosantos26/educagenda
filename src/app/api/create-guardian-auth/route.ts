import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { guardianId, email, password } = body;

    if (!guardianId || !email || !password) {
      return Response.json(
        { error: "Dados incompletos." },
        { status: 400 }
      );
    }

    // Cliente com service_role (permite criar usuário no auth)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Criar usuário no Auth
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !userData?.user) {
      return Response.json(
        { error: authError?.message || "Erro ao criar usuário." },
        { status: 500 }
      );
    }

    const userId = userData.user.id;

    // 2. Atualizar profile como responsável
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "guardian",
        auth_user_id: userId,
      })
      .eq("id", guardianId);

    if (profileError) {
      return Response.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Erro interno." },
      { status: 500 }
    );
  }
}
