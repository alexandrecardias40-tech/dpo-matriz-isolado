import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";

export default function LandingPage() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log(container);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)", color: "white", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", boxSizing: "border-box" }}>
      
      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 120,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push",
              },
              onHover: {
                enable: true,
                mode: "grab",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              grab: {
                distance: 180,
                links: {
                  opacity: 0.8,
                  color: "#38bdf8"
                }
              },
            },
          },
          particles: {
            color: {
              value: "#38bdf8",
            },
            links: {
              color: "#38bdf8",
              distance: 150,
              enable: true,
              opacity: 0.35,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 1.5,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 120,
            },
            opacity: {
              value: 0.7,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 4 },
            },
          },
          detectRetina: true,
        }}
      />

      {/* Header Banner */}
      <div style={{ position: "absolute", top: "15px", left: "15px", right: "15px", padding: "6px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", zIndex: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: "#000000", fontWeight: 700, letterSpacing: "0.3px", wordWrap: "break-word" }}>
            Decanato de Planejamento, Orçamento e Avaliação Institucional - DPO
          </span>
          <span style={{ fontSize: 12, color: "#000000", fontWeight: 600, letterSpacing: "0.2px", wordWrap: "break-word" }}>
            Diretoria de Orçamento - DOR
          </span>
        </div>
        <div style={{ flexShrink: 0, marginLeft: "10px" }}>
          <img 
            src="/inova_gestao.png" 
            alt="Inova Gestão" 
            style={{ height: 80, objectFit: "contain" }} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "0px", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
        
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: "0 0 20px 0", textShadow: "0 0 40px rgba(56, 189, 248, 0.4)", letterSpacing: "-0.5px", maxWidth: "100%", wordWrap: "break-word" }}>
          Painel de Custos Indiretos
        </h1>

        {/* Glass Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 20,
          padding: "30px 40px",
          width: "100%",
          maxWidth: 320,
          boxSizing: "border-box",
          boxShadow: "0 30px 60px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "white", fontWeight: 700, letterSpacing: "-0.5px" }}>Dashboard</h2>
          <h2 style={{ margin: "4px 0 0 0", fontSize: 20, color: "white", fontWeight: 700, letterSpacing: "-0.5px" }}>Custos Indiretos</h2>
          <p style={{ marginTop: 10, marginBottom: 24, color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>Análise de Custos Indiretos</p>
          
          <a href="#/dashboard" style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(to right, #059669, #10b981)",
            color: "white",
            textDecoration: "none",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.5px",
            boxShadow: "0 8px 20px -6px rgba(16, 185, 129, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
            transition: "all 0.3s ease",
            textTransform: "uppercase"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 15px 25px -8px rgba(16, 185, 129, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(16, 185, 129, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)";
          }}
          >
            Acessar Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, width: "100%", textAlign: "center", color: "#64748b", fontSize: 13, zIndex: 10 }}>
        created by dor@unb.br
      </div>
    </div>
  );
}
