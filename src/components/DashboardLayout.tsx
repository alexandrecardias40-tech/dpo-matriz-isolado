import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import metaData from "../metadata.json";
import {
  Settings, Menu, X, Home, Activity,
  GitCompare, ChevronDown, Download,
} from "lucide-react";

interface MenuItem {
  href: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  external?: boolean;
}

interface MenuSectionConfig {
  key: string;
  title: string;
  items: MenuItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuConfig?: MenuSectionConfig[];
  hideUpdateBadge?: boolean;
}

export default function DashboardLayout({ children, menuConfig, hideUpdateBadge }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  const indicatorItems: MenuItem[] = [
    { href: "/dashboard", label: "Dashboard Principal", icon: <Home size={16} /> },
  ];

  const sections: MenuSectionConfig[] = useMemo(
    () =>
      menuConfig && menuConfig.length > 0
        ? menuConfig
        : [
            { key: "indicators", title: "📊 Indicadores", items: indicatorItems },
            {
              key: "charts",
              title: "📈 Gráficos",
              items: [{ href: "/graficos", label: "Fluxo de Crédito Matriz", icon: <Activity size={16} /> }],
            },
            {
              key: "comparatives",
              title: "🔄 Comparativos",
              items: [
                { href: "/comparisons", label: "Comparativo de Saldos", icon: <GitCompare size={16} /> },
              ],
            },
          ],
    [menuConfig]
  );

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.key, s.key === "indicators"]))
  );

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      sections.forEach((s) => { if (!(s.key in next)) next[s.key] = false; });
      return next;
    });
  }, [sections]);

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (href: string) => location === href;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>
      {/* ===== SIDEBAR ===== */}
      <aside
        style={{
          width: sidebarOpen ? "18rem" : "5rem",
          minWidth: sidebarOpen ? "18rem" : "5rem",
          flexShrink: 0,
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #334155",
          boxShadow: "4px 0 16px rgba(0,0,0,0.25)",
          transition: "width 0.3s ease, min-width 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "white", letterSpacing: "-0.025em" }}>
                Execução Matriz
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Dashboard UnB</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: "0.375rem",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              marginLeft: "auto",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {sections.map((section) => (
            <div key={section.key} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleSection(section.key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 1rem",
                  color: "#cbd5e1",
                  background: "transparent",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {sidebarOpen && <span>{section.title}</span>}
                {sidebarOpen && (
                  <ChevronDown
                    size={16}
                    style={{ transform: expandedSections[section.key] ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}
                  />
                )}
              </button>

              {sidebarOpen && expandedSections[section.key] && (
                <div style={{ marginLeft: 8, display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const style: React.CSSProperties = {
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      textDecoration: "none",
                      fontSize: 13,
                      color: active ? "white" : "#94a3b8",
                      background: active ? "#2563eb" : "transparent",
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                    };

                    if (item.external) {
                      return (
                        <a key={item.href} href={item.href} style={style}>
                          {item.icon}
                          <span>{item.label}</span>
                        </a>
                      );
                    }
                    return (
                      <Link key={item.href} href={item.href} style={style}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "1rem", borderTop: "1px solid #334155" }}>

          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0.5rem 1rem",
              color: "#94a3b8",
              textDecoration: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Home size={16} />
            {sidebarOpen && <span>Sair</span>}
          </a>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, overflowY: "auto", background: "#f8fafc", position: "relative" }}>
        {/* Update badge */}
        {!hideUpdateBadge && (
          <div style={{ position: "absolute", top: 16, right: 32, zIndex: 10 }}>
            <div
              title={`Atualizado a partir do arquivo: ${metaData.filename}`}
              style={{
                fontSize: 11,
                color: "#64748b",
                background: "rgba(255,255,255,0.95)",
                padding: "6px 14px",
                borderRadius: 9999,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "help"
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontWeight: 600 }}>Atualizado:</span>
              {metaData.lastUpdated}
            </div>
          </div>
        )}

        <div style={{ padding: "2rem" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
