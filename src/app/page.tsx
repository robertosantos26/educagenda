"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [activeTab, setActiveTab] = useState<"escola" | "professor" | "familia">("escola");
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const planos = [
    {
      nome: "Básico",
      descricao: "Para escolas pequenas que estão começando",
      preco_mensal: 97,
      preco_anual: 77,
      cor: "#1e40af",
      destaque: false,
      features: [
        "Até 80 alunos",
        "Até 5 professores",
        "Agenda diária digital",
        "Comunicados para responsáveis",
        "App para pais e professores",
        "Suporte por e-mail",
      ],
    },
    {
      nome: "Profissional",
      descricao: "O mais escolhido pelas escolas infantis",
      preco_mensal: 197,
      preco_anual: 157,
      cor: "#2563eb",
      destaque: true,
      features: [
        "Até 200 alunos",
        "Professores ilimitados",
        "Tudo do Básico",
        "Registros de atividades e refeições",
        "Portfólio digital do aluno",
        "Relatórios pedagógicos",
        "Suporte prioritário via WhatsApp",
      ],
    },
    {
      nome: "Escola+",
      descricao: "Para redes com múltiplas unidades",
      preco_mensal: 397,
      preco_anual: 317,
      cor: "#1d4ed8",
      destaque: false,
      features: [
        "Alunos ilimitados",
        "Múltiplas unidades",
        "Tudo do Profissional",
        "Painel de gestão centralizado",
        "Relatórios consolidados",
        "Onboarding dedicado",
        "Gerente de conta exclusivo",
      ],
    },
  ];

  const beneficiosTab = {
    escola: [
      { icone: "📋", titulo: "Agenda centralizada", desc: "Gerencie turmas, professores e eventos num único painel, sem planilhas." },
      { icone: "📊", titulo: "Relatórios pedagógicos", desc: "Acompanhe o desenvolvimento de cada aluno com registros estruturados." },
      { icone: "🔐", titulo: "Controle de acesso", desc: "Cada usuário vê apenas o que é seu. Dados protegidos e organizados." },
      { icone: "💬", titulo: "Comunicados digitais", desc: "Envie avisos, eventos e comunicados para as famílias em segundos." },
    ],
    professor: [
      { icone: "📓", titulo: "Diário digital", desc: "Registre atividades, refeições e observações de cada aluno com facilidade." },
      { icone: "👨‍👩‍👧", titulo: "Comunicação direta", desc: "Fale com os pais diretamente pelo app, sem depender de grupos de WhatsApp." },
      { icone: "📸", titulo: "Portfólio do aluno", desc: "Documente momentos e conquistas que ficam guardados para a família." },
      { icone: "📅", titulo: "Agenda da turma", desc: "Veja os eventos e comunicados da escola em tempo real, sem retrabalho." },
    ],
    familia: [
      { icone: "🔔", titulo: "Avisos em tempo real", desc: "Receba notificações instantâneas sobre eventos, comunicados e observações." },
      { icone: "📷", titulo: "Acompanhe o dia do filho", desc: "Veja registros do que seu filho comeu, brincou e aprendeu hoje." },
      { icone: "📁", titulo: "Documentos organizados", desc: "Acesse autorizações, relatórios e portfólio do seu filho com facilidade." },
      { icone: "💬", titulo: "Canal direto com o professor", desc: "Tire dúvidas e troque mensagens sem precisar ligar para a escola." },
    ],
  };


  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8faff", color: "#0f172a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(4deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.45s ease both; }

        .float-a { animation: floatA 5s ease-in-out infinite; }
        .float-b { animation: floatB 6s ease-in-out infinite; }

        .nav-link { color: #475569; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #2563eb; }

        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: inline-block;
          text-decoration: none;
        }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.3); }

        .btn-outline {
          background: white;
          color: #2563eb;
          border: 1.5px solid #bfdbfe;
          border-radius: 12px;
          padding: 13px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: inline-block;
          text-decoration: none;
        }
        .btn-outline:hover { background: #eff6ff; border-color: #93c5fd; }

        .plan-card {
          background: white;
          border-radius: 24px;
          padding: 32px 28px;
          border: 1.5px solid #e2e8f0;
          transition: all 0.3s;
          position: relative;
          flex: 1;
          min-width: 260px;
          max-width: 340px;
        }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(15,23,42,0.1); }
        .plan-card.destaque {
          border-color: #2563eb;
          box-shadow: 0 12px 40px rgba(37,99,235,0.18);
        }

        .tab-btn {
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active { background: #2563eb; color: white; }
        .tab-btn.inactive { background: transparent; color: #64748b; }
        .tab-btn.inactive:hover { background: #f1f5f9; }

        .benefit-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          transition: all 0.25s;
        }
        .benefit-card:hover { border-color: #93c5fd; box-shadow: 0 8px 24px rgba(37,99,235,0.08); transform: translateY(-2px); }

        .testimonial-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          flex: 1;
          min-width: 240px;
          max-width: 360px;
        }

        .toggle-track {
          width: 44px; height: 24px;
          background: #cbd5e1;
          border-radius: 999px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-block;
        }
        .toggle-track.on { background: #2563eb; }
        .toggle-thumb {
          width: 18px; height: 18px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px; left: 3px;
          transition: transform 0.2s;
        }
        .toggle-track.on .toggle-thumb { transform: translateX(20px); }

        .feature-check::before { content: "✓"; color: #2563eb; font-weight: 700; margin-right: 10px; }

        section { scroll-margin-top: 80px; }
      `}</style>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #e2e8f0" : "none",
        transition: "all 0.3s",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#60a5fa,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>E</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "#0f172a" }}>Educagenda</span>
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#beneficios" className="nav-link">Funcionalidades</a>
            <a href="#planos" className="nav-link">Planos</a>
            <a href="/entrar" className="btn-outline" style={{ padding: "8px 18px", fontSize: 14 }}>Entrar</a>
            <a href="/cadastro" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>Teste grátis</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #eff6ff 0%, #f8faff 50%, #f0f9ff 100%)",
        paddingTop: 100,
      }}>
        {/* Background decorations */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 500, height: 500, borderRadius: "50%", background: "rgba(37,99,235,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -60, width: 400, height: 400, borderRadius: "50%", background: "rgba(96,165,250,0.07)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px", display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}>
          {/* Left column */}
          <div style={{ flex: "1 1 480px" }}>
            <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dbeafe", color: "#1d4ed8", borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              <span>🎓</span> Agenda digital para educação infantil
            </div>

            <h1 className="fade-up-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.1, color: "#0f172a", marginBottom: 24 }}>
              A escola conectada<br />
              <span style={{ color: "#2563eb" }}>que pais e professores</span><br />
              merecem
            </h1>

            <p className="fade-up-3" style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Agenda digital, comunicados, diário de atividades e portfólio do aluno — tudo num só lugar. Para escolas infantis que querem mais organização e menos WhatsApp.
            </p>

            <div className="fade-up-4" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <a href="/cadastro" className="btn-primary" style={{ fontSize: 16, padding: "15px 32px" }}>
                Começar 30 dias grátis
              </a>
              <a href="#demo" className="btn-outline" style={{ fontSize: 15 }}>
                Ver demonstração →
              </a>
            </div>

            <p className="fade-up-4" style={{ marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
              Sem cartão de crédito · Cancele quando quiser · Suporte em português
            </p>

          </div>

          {/* Right column – floating UI mockup */}
          <div style={{ flex: "1 1 360px", display: "flex", justifyContent: "center", position: "relative", minHeight: 420 }}>
            {/* Main card */}
            <div className="float-a" style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 24px 64px rgba(15,23,42,0.14)", width: 300, position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📓</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>Diário da turma</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Maternal B · hoje</div>
                </div>
              </div>
              {[
                { nome: "Luna Ferreira", obs: "Dormiu bem, comeu toda a maçã 🍎", cor: "#fef3c7" },
                { nome: "Pedro Alves", obs: "Brincou bastante no parque 🛝", cor: "#dcfce7" },
                { nome: "Sofia Lima", obs: "Primeiro dia sem choro 🌟", cor: "#f0fdf4" },
              ].map((a) => (
                <div key={a.nome} style={{ background: a.cor, borderRadius: 12, padding: "10px 14px", marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a", marginBottom: 3 }}>{a.nome}</div>
                  <div style={{ fontSize: 12, color: "#374151" }}>{a.obs}</div>
                </div>
              ))}
              <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>3 registros enviados ✓</span>
                <span style={{ fontSize: 11, color: "#93c5fd" }}>14:32</span>
              </div>
            </div>

            {/* Floating notification card */}
            <div className="float-b" style={{ position: "absolute", top: 20, right: -20, background: "white", borderRadius: 16, padding: "12px 16px", boxShadow: "0 12px 32px rgba(15,23,42,0.12)", width: 200, zIndex: 3 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>🔔 Mensagem da professora</div>
              <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>"Hoje a Sofia disse 'obrigada' pela primeira vez! 🥰"</div>
            </div>

            {/* Stats card */}
            <div className="float-b" style={{ position: "absolute", bottom: 10, left: -10, background: "#2563eb", borderRadius: 16, padding: "14px 18px", boxShadow: "0 12px 32px rgba(37,99,235,0.3)", color: "white", zIndex: 3 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Comunicação em tempo real</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>Avisos, rotina e mensagens no mesmo app</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOCO INFORMATIVO ── */}
      <div style={{ background: "white", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
            Uma plataforma feita para facilitar a rotina entre escola, professores e famílias.
          </p>
        </div>
      </div>

      {/* ── BENEFÍCIOS ── */}
      <section id="beneficios" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ color: "#2563eb", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Funcionalidades</p>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", color: "#0f172a", marginBottom: 16 }}>
            Para cada um na escola
          </h2>
          <p style={{ color: "#64748b", fontSize: 17, maxWidth: 520, margin: "0 auto" }}>
            Cada perfil acessa exatamente o que precisa. Sem informação a mais, sem confusão.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40, background: "#f1f5f9", borderRadius: 14, padding: 6, maxWidth: 420, margin: "0 auto 40px" }}>
          {(["escola", "professor", "familia"] as const).map((t) => (
            <button key={t} className={`tab-btn ${activeTab === t ? "active" : "inactive"}`} onClick={() => setActiveTab(t)} style={{ flex: 1, textTransform: "capitalize" }}>
              {t === "escola" ? "🏫 Escola" : t === "professor" ? "👩‍🏫 Professor" : "👪 Família"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {beneficiosTab[activeTab].map((b) => (
            <div key={b.titulo} className="benefit-card">
              <div style={{ fontSize: 28, marginBottom: 14 }}>{b.icone}</div>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: "#0f172a", marginBottom: 8 }}>{b.titulo}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO SCREENSHOT MOCKUP ── */}
      <section id="demo" style={{ background: "linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 100%)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#93c5fd", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Como funciona</p>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "clamp(26px, 4vw, 38px)", color: "white", marginBottom: 16 }}>
            Simples de implantar, fácil de usar
          </h2>
          <p style={{ color: "#bfdbfe", fontSize: 16, marginBottom: 48 }}>
            Da criação da conta até os professores cadastrados em menos de 2 horas.
          </p>

          <div style={{ display: "flex", gap: 0, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { n: "1", titulo: "Crie sua conta", desc: "Cadastre a escola em minutos. Sem burocracia inicial." },
              { n: "2", titulo: "Cadastre turmas e professores", desc: "Adicione suas turmas e envie o acesso aos professores." },
              { n: "3", titulo: "Convide as famílias", desc: "Os pais recebem link por WhatsApp ou e-mail para acessar." },
              { n: "4", titulo: "Comece a usar", desc: "Agenda, comunicados e diário funcionando no mesmo dia." },
            ].map((s, i) => (
              <div key={s.n} style={{ flex: "1 1 180px", padding: "0 20px", position: "relative" }}>
                {i < 3 && <div style={{ position: "absolute", right: 0, top: 24, width: 1, height: 60, background: "rgba(255,255,255,0.15)", display: "none" }} />}
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, margin: "0 auto 16px" }}>{s.n}</div>
                <h3 style={{ color: "white", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{s.titulo}</h3>
                <p style={{ color: "#bfdbfe", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" style={{ padding: "100px 24px", background: "#f8faff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ color: "#2563eb", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Planos e preços</p>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", color: "#0f172a", marginBottom: 16 }}>
              Transparente do começo ao fim
            </h2>
            <p style={{ color: "#64748b", fontSize: 17, marginBottom: 32 }}>
              30 dias grátis em todos os planos. Sem surpresas na fatura.
            </p>

            {/* Toggle anual/mensal */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
              <span style={{ fontSize: 14, color: billingAnnual ? "#94a3b8" : "#0f172a", fontWeight: 600 }}>Mensal</span>
              <div className={`toggle-track ${billingAnnual ? "on" : ""}`} onClick={() => setBillingAnnual(!billingAnnual)}>
                <div className="toggle-thumb" />
              </div>
              <span style={{ fontSize: 14, color: billingAnnual ? "#0f172a" : "#94a3b8", fontWeight: 600 }}>
                Anual <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, padding: "2px 8px", borderRadius: 999, marginLeft: 4 }}>−20%</span>
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", alignItems: "flex-start" }}>
            {planos.map((p) => (
              <div key={p.nome} className={`plan-card ${p.destaque ? "destaque" : ""}`}>
                {p.destaque && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    Mais popular
                  </div>
                )}
                <div style={{ marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: "#0f172a" }}>{p.nome}</h3>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{p.descricao}</p>
                </div>

                <div style={{ margin: "24px 0" }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 42, color: "#0f172a" }}>
                    R${billingAnnual ? p.preco_anual : p.preco_mensal}
                  </span>
                  <span style={{ fontSize: 14, color: "#94a3b8" }}>/mês</span>
                  {billingAnnual && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      Cobrado anualmente · R${p.preco_anual * 12}/ano
                    </div>
                  )}
                </div>

                <a href="/cadastro" className={p.destaque ? "btn-primary" : "btn-outline"} style={{ display: "block", textAlign: "center", width: "100%", marginBottom: 24 }}>
                  Começar grátis por 30 dias
                </a>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
                  {p.features.map((f) => (
                    <div key={f} className="feature-check" style={{ fontSize: 14, color: "#374151", marginBottom: 10, lineHeight: 1.5 }}>{f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: 32, fontSize: 14, color: "#94a3b8" }}>
            Precisa de proposta customizada?{" "}
            <a href="https://wa.me/5554992700054" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Fale com a gente pelo WhatsApp →</a>
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(160deg, #1e3a8a 0%, #2563eb 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎓</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 44px)", color: "white", marginBottom: 16, lineHeight: 1.2 }}>
            Comece hoje.<br />30 dias grátis.
          </h2>
          <p style={{ color: "#bfdbfe", fontSize: 17, marginBottom: 36, lineHeight: 1.6 }}>
            Sem burocracia, sem cartão de crédito. Cadastre sua escola e veja o EducAgenda funcionando ainda hoje.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/cadastro" className="btn-primary" style={{ background: "white", color: "#2563eb", fontSize: 16, padding: "15px 32px" }}>
              Criar conta grátis
            </a>
            <a href="https://wa.me/5554992700054" style={{ background: "transparent", color: "white", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none", transition: "all 0.2s" }}>
              💬 Falar no WhatsApp
            </a>
          </div>
          <p style={{ color: "#93c5fd", fontSize: 13, marginTop: 20 }}>
            Implantação assistida · Suporte em português · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f172a", padding: "48px 24px 32px", color: "#94a3b8" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 16 }}>E</div>
                <span style={{ color: "white", fontWeight: 700, fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Educagenda</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 220 }}>Agenda digital para educação infantil.</p>
            </div>
            {[
              { titulo: "Produto", links: ["Funcionalidades", "Planos", "Demonstração", "Novidades"] },
              { titulo: "Empresa", links: ["Sobre nós", "Blog", "Contato"] },
              { titulo: "Suporte", links: ["Ajuda", "WhatsApp", "Política de privacidade", "Termos de uso"] },
            ].map(g => (
              <div key={g.titulo}>
                <p style={{ color: "white", fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{g.titulo}</p>
                {g.links.map(l => <div key={l} style={{ fontSize: 13, marginBottom: 8, cursor: "pointer", transition: "color 0.2s" }}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13 }}>© 2025 Educagenda. Todos os direitos reservados.</span>
            <span style={{ fontSize: 13 }}>Feito com 💙 para as escolas do Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
