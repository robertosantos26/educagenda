"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

type MenuItem = {
  href: string;
  label: string;
  icon: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadRoleAndPayment() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("id", user.id)
      .single();

    const currentRole = profile?.role || "";
    setRole(currentRole);

    if (!profile?.school_id) {
      router.push("/");
      return;
    }

    const { data: school } = await supabase
      .from("schools")
      .select("status")
      .eq("id", profile.school_id)
      .single();

    if (school?.status !== "active") {
      router.push("/aguardando-pagamento");
      return;
    }

    if (currentRole === "guardian" && pathname === "/dashboard") {
      router.push("/dashboard/meu-filho");
    }
  }

  function checkMobile() {
    setIsMobile(window.innerWidth < 900);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  useEffect(() => {
    loadRoleAndPayment();
    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [pathname]);

  const menuItems = getMenuItems(role);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div style={pageStyle}>
      {isMobile && (
        <header style={mobileHeaderStyle}>
          <button onClick={() => setMenuOpen(true)} style={hamburgerButtonStyle}>
            ☰
          </button>

          <div>
            <strong style={{ display: "block", fontSize: 17 }}>Educagenda</strong>
            <span style={{ fontSize: 12, color: "#dbeafe" }}>
              Agenda escolar infantil
            </span>
          </div>

          <button onClick={handleLogout} style={mobileLogoutButtonStyle}>
            Sair
          </button>
        </header>
      )}

      {isMobile && menuOpen && (
        <div style={overlayStyle} onClick={closeMenu}>
          <aside style={mobileMenuStyle} onClick={(e) => e.stopPropagation()}>
            <div style={brandBoxStyle}>
              <div style={logoStyle}>E</div>
              <div>
                <h1 style={brandTitleStyle}>Educagenda</h1>
                <p style={brandSubtitleStyle}>Comunicação escolar simples</p>
              </div>
            </div>

            <nav style={navStyle}>
              {menuItems.map((item) => (
                <MenuLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  onClick={closeMenu}
                />
              ))}
            </nav>

            <button onClick={handleLogout} style={logoutButtonStyle}>
              Sair da conta
            </button>
          </aside>
        </div>
      )}

      {!isMobile && (
        <aside style={sidebarStyle}>
          <div style={brandBoxStyle}>
            <div style={logoStyle}>E</div>
            <div>
              <h1 style={brandTitleStyle}>Educagenda</h1>
              <p style={brandSubtitleStyle}>Agenda escolar infantil</p>
            </div>
          </div>

          <div style={roleBadgeStyle}>
            Perfil: <strong>{formatRole(role)}</strong>
          </div>

          <nav style={navStyle}>
            {menuItems.map((item) => (
              <MenuLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </nav>

          <button onClick={handleLogout} style={logoutButtonStyle}>
            Sair da conta
          </button>
        </aside>
      )}

      <main
        style={{
          ...mainStyle,
          marginLeft: isMobile ? 0 : 280,
          paddingTop: isMobile ? 92 : 28,
        }}
      >
        <div style={contentShellStyle}>{children}</div>
      </main>
    </div>
  );
}

function getMenuItems(role: string): MenuItem[] {
  if (role === "guardian") {
    return [{ href: "/dashboard/meu-filho", label: "Meu filho", icon: "👶" }];
  }

  if (role === "teacher") {
    return [
      { href: "/dashboard", label: "Início", icon: "🏠" },
      { href: "/dashboard/minhas-turmas", label: "Minhas turmas", icon: "🏫" },
      { href: "/dashboard/agenda", label: "Agenda individual", icon: "📝" },
      { href: "/dashboard/agenda-turma", label: "Agenda por turma", icon: "📅" },
      { href: "/dashboard/mensagens", label: "Mensagens", icon: "💬" },
    ];
  }

  return [
    { href: "/dashboard", label: "Início", icon: "🏠" },
    { href: "/dashboard/turmas", label: "Turmas", icon: "🏫" },
    { href: "/dashboard/professores", label: "Professores", icon: "👩‍🏫" },
    { href: "/dashboard/criancas", label: "Crianças", icon: "👶" },
    { href: "/dashboard/responsaveis", label: "Responsáveis", icon: "👨‍👩‍👧" },
    { href: "/dashboard/agenda", label: "Agenda individual", icon: "📝" },
    { href: "/dashboard/agenda-turma", label: "Agenda por turma", icon: "📅" },
    { href: "/dashboard/mensagens", label: "Mensagens", icon: "💬" },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function formatRole(role: string) {
  if (role === "admin") return "Admin";
  if (role === "teacher") return "Professor";
  if (role === "guardian") return "Responsável";
  if (role === "supervisor") return "Supervisor";
  return "Carregando...";
}

function MenuLink({
  item,
  active,
  onClick,
}: {
  item: MenuItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      style={{
        ...menuLinkStyle,
        background: active ? "#2563eb" : "rgba(255,255,255,0.07)",
        color: active ? "#ffffff" : "#e5e7eb",
        boxShadow: active ? "0 10px 20px rgba(37, 99, 235, 0.28)" : "none",
      }}
    >
      <span style={menuIconStyle}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #dbeafe 0, transparent 30%), #f4f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#111827",
};

const sidebarStyle = {
  width: 280,
  minHeight: "100vh",
  background: "linear-gradient(180deg, #111827, #1f2937)",
  color: "white",
  position: "fixed" as const,
  left: 0,
  top: 0,
  padding: 24,
  boxShadow: "8px 0 30px rgba(15, 23, 42, 0.18)",
  display: "flex",
  flexDirection: "column" as const,
};

const brandBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 24,
};

const logoStyle = {
  width: 46,
  height: 46,
  borderRadius: 16,
  background: "linear-gradient(135deg, #60a5fa, #2563eb)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  fontWeight: 900,
  color: "white",
  boxShadow: "0 10px 22px rgba(37, 99, 235, 0.35)",
};

const brandTitleStyle = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.1,
};

const brandSubtitleStyle = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#cbd5e1",
};

const roleBadgeStyle = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.08)",
  color: "#e5e7eb",
  fontSize: 13,
  marginBottom: 22,
};

const navStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
};

const menuLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "white",
  textDecoration: "none",
  padding: "12px 14px",
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 700,
};

const menuIconStyle = {
  width: 24,
  textAlign: "center" as const,
};

const logoutButtonStyle = {
  marginTop: "auto",
  width: "100%",
  padding: "12px 16px",
  border: "none",
  borderRadius: 14,
  background: "#ef4444",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 10px 20px rgba(239, 68, 68, 0.22)",
};

const mainStyle = {
  minHeight: "100vh",
  padding: 28,
};

const contentShellStyle = {
  background: "rgba(255,255,255,0.82)",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.10)",
  border: "1px solid rgba(255,255,255,0.7)",
  minHeight: "calc(100vh - 56px)",
};

const mobileHeaderStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  height: 68,
  background: "linear-gradient(135deg, #111827, #1f2937)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  zIndex: 50,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.22)",
};

const hamburgerButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: 22,
  cursor: "pointer",
};

const mobileLogoutButtonStyle = {
  border: "none",
  borderRadius: 12,
  background: "#ef4444",
  color: "white",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  zIndex: 100,
};

const mobileMenuStyle = {
  width: "82%",
  maxWidth: 320,
  height: "100%",
  background: "linear-gradient(180deg, #111827, #1f2937)",
  color: "white",
  padding: 22,
  boxShadow: "10px 0 30px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column" as const,
};
