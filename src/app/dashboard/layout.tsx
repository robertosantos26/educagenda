import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <nav
        style={{
          padding: 20,
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: 20,
        }}
      >
        <Link href="/dashboard">Início</Link>
        <Link href="/dashboard/turmas">Turmas</Link>
        <Link href="/dashboard/criancas">Crianças</Link>
      </nav>

      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
}
