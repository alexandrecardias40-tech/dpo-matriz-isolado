import { Link } from "wouter";

export default function LandingPage() {
  return (
    <>
      <style>{`
        .landing-container {
            font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            background: radial-gradient(circle at top, rgba(37, 99, 235, 0.25), transparent 55%),
                radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.2), transparent 60%), #0f172a;
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
        }

        .landing-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: 48px 20px 72px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .hero {
            text-align: center;
            margin-bottom: 40px;
        }

        .hero-title {
            font-size: clamp(2.25rem, 4vw, 3rem);
            font-weight: 700;
            margin: 0 0 12px;
        }

        .hero-subtitle {
            font-size: 1rem;
            opacity: 0.8;
            margin: 0;
        }

        .landing-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            max-width: 380px;
            margin: 0 auto;
            width: 100%;
        }

        .landing-card {
            border-radius: 24px;
            padding: 28px;
            text-decoration: none;
            color: inherit;
            background: rgba(15, 23, 42, 0.65);
            border: 1px solid rgba(148, 163, 184, 0.25);
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
            transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
        }

        .landing-card:hover {
            transform: translateY(-6px);
            border-color: rgba(248, 250, 252, 0.6);
            background: rgba(15, 23, 42, 0.85);
        }

        .card-badge {
            font-size: 0.85rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            font-weight: 600;
            opacity: 0.85;
        }

        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
        }

        .card-description {
            font-size: 1rem;
            line-height: 1.5;
            margin: 0;
            opacity: 0.85;
        }

        @media (max-width: 768px) {
            .landing-wrapper { padding: 40px 20px 60px; }
            .hero-title { font-size: 2rem; margin-bottom: 16px; }
            .hero-subtitle { font-size: 0.95rem; margin-bottom: 12px; }
            .landing-card { padding: 32px 24px; border-radius: 20px; }
            .card-badge { font-size: 0.9rem; margin-bottom: 4px; }
            .card-title { font-size: 1.4rem; line-height: 1.3; margin: 8px 0; }
            .card-description { font-size: 1rem; line-height: 1.6; }
        }

        @media (max-width: 640px) {
            .landing-wrapper { padding: 32px 16px 48px; }
            .hero-title { font-size: 1.75rem; }
            .landing-card { padding: 28px 20px; }
            .card-title { font-size: 1.3rem; }
        }
      `}</style>
      <div className="landing-container">
        <main className="landing-wrapper">
            <header className="hero">
                <p className="hero-subtitle">Universidade de Brasília · Diretoria de Orçamento</p>
                <h1 className="hero-title">Portal unificado de dashboards</h1>
                <p className="hero-subtitle">Escolha o painel que deseja consultar</p>
            </header>
            <section className="landing-grid">
                <Link href="/dashboard" className="landing-card">
                    <span className="card-badge" style={{ color: "#38bdf8" }}>DOR</span>
                    <h2 className="card-title">Dashboard Custos Indiretos</h2>
                    <p className="card-description">Análise de Custos Indiretos</p>
                </Link>
            </section>
            <p style={{ marginTop: "auto", paddingTop: 32, textAlign: "center", fontSize: "0.85rem", color: "rgba(248, 250, 252, 0.85)", letterSpacing: "0.08em" }}>
                created by dor@unb.br
            </p>
        </main>
      </div>
    </>
  );
}
