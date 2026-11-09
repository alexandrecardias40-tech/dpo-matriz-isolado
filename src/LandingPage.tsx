import { useEffect, useRef } from "react";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(120, Math.floor((width * height) / 9000));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1.5,
      });
    }

    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: Math.random() * 2 + 1.5,
        });
      }
      if (particles.length > 200) {
        particles.splice(0, particles.length - 200);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const dx = p1.x - mouse.x;
          const dy = p1.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.65;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)", color: "white", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box" }}>
      
      {/* Background Particles Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {/* Header Banner */}
      <div style={{ position: "absolute", top: "15px", left: "15px", right: "15px", padding: "12px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", zIndex: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: "#000000", fontWeight: 700, letterSpacing: "0.3px", wordWrap: "break-word" }}>
            Decanato de Planejamento, Orçamento e Avaliação Institucional - DPO
          </span>
          <span style={{ fontSize: 12, color: "#000000", fontWeight: 600, letterSpacing: "0.2px", wordWrap: "break-word" }}>
            Diretoria de Orçamento - DOR
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "0px", width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
        
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: "0 0 20px 0", textShadow: "0 0 40px rgba(56, 189, 248, 0.4)", letterSpacing: "-0.5px", maxWidth: "100%", wordWrap: "break-word" }}>
          Painel de Execução da Matriz
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
          <h2 style={{ margin: "4px 0 0 0", fontSize: 20, color: "white", fontWeight: 700, letterSpacing: "-0.5px" }}>Matriz Orçamentária</h2>
          <p style={{ marginTop: 10, marginBottom: 24, color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>Análise e Cruzamento de Dados</p>
          
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

      {/* Botão Canto Direito: Painel de Gestão UnB (Power BI) */}
      <a
        href="https://app.powerbi.com/view?r=eyJrIjoiZWNjNzkzZWQtNTJkMi00YmZhLThkOTgtNzgzNmE2MWMzZjdmIiwidCI6ImVjMzU5YmExLTYzMGItNGQyYi1iODMzLWM4ZTZkNDhmODA1OSJ9"
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir Painel de Gestão UnB no Microsoft Power BI"
        style={{
          position: "absolute",
          bottom: "16px",
          right: "20px",
          zIndex: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "7px 14px 7px 9px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.8) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          textDecoration: "none",
          color: "white",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.8)";
          e.currentTarget.style.boxShadow = "0 12px 28px -4px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(30, 41, 59, 0.95) 100%)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.35)";
          e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.8) 100%)";
        }}
      >
        {/* Ícone Power BI */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.35)",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="13" width="3.5" height="7" rx="0.75" fill="#FFFFFF" fillOpacity="0.85" />
            <rect x="10.25" y="8" width="3.5" height="12" rx="0.75" fill="#FFFFFF" fillOpacity="0.95" />
            <rect x="16.5" y="4" width="3.5" height="16" rx="0.75" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Textos */}
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.15 }}>
          <span style={{ fontSize: 8.5, color: "#fbbf24", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Power BI
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.2px" }}>
            Painel de Gestão UnB
          </span>
        </div>

        {/* Seta externa ↗ */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: 3,
            color: "#fbbf24",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>
      </a>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, width: "100%", textAlign: "center", color: "#64748b", fontSize: 13, zIndex: 10 }}>
        created by dor@unb.br
      </div>
    </div>
  );
}
