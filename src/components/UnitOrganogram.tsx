import React, { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import ugrHierarchyRaw from "../ugr_hierarchy.json";

export interface UgrHierarchyItem {
  ugr: string;
  key: string;
  name_n3: string;
  nivel1: string;
  sigla_n2: string;
  name_n2: string;
  sigla_n3: string;
}

export const ugrHierarchy = ugrHierarchyRaw as Record<string, UgrHierarchyItem>;

export const NIVEL1_CATEGORIES = [
  "ASSESSORIAS E SECRETARIAS",
  "CENTROS",
  "DECANATOS",
  "REITORIA",
  "UA - FACULDADES",
  "UA - INSTITUTOS",
  "ÓRGÃOS AUXILIARES",
  "ÓRGÃOS COMPLEMENTARES"
];

interface UnitOrganogramProps {
  selNivel1: string | null;
  selNivel2: string | null;
  selNivel3: string | null;
  onSelectNivel1: (val: string | null) => void;
  onSelectNivel2: (val: string | null) => void;
  onSelectNivel3: (val: string | null) => void;
  records: any[];
}

export default function UnitOrganogram({
  selNivel1,
  selNivel2,
  selNivel3,
  onSelectNivel1,
  onSelectNivel2,
  onSelectNivel3,
  records
}: UnitOrganogramProps) {

  if (!selNivel1) return null;

  // Nível 1 ativos na base de dados
  const activeN1Categories = useMemo(() => {
    return NIVEL1_CATEGORIES.filter(cat => 
      records.some((r: any) => {
        const h = ugrHierarchy[String(r.ugr || "").trim()];
        return h && h.nivel1 === cat;
      })
    );
  }, [records]);

  // Nível 2 ativos para o Nível 1 selecionado
  const activeN2Units = useMemo(() => {
    if (!selNivel1) return [];
    const map: Record<string, { sigla_n2: string; name_n2: string; ugrs: string[] }> = {};
    Object.values(ugrHierarchy).forEach(h => {
      if (h.nivel1 === selNivel1) {
        const sig = h.sigla_n2;
        if (!map[sig]) {
          map[sig] = { sigla_n2: sig, name_n2: h.name_n2, ugrs: [] };
        }
        map[sig].ugrs.push(h.ugr);
      }
    });
    return Object.values(map)
      .filter(n2 => n2.ugrs.some(u => records.some((r: any) => String(r.ugr || "").trim() === u)))
      .sort((a, b) => a.sigla_n2.localeCompare(b.sigla_n2));
  }, [selNivel1, records]);

  // Nível 3 ativos para o Nível 2 selecionado (exclui a própria sigla pai para não duplicar caixas)
  const activeN3Units = useMemo(() => {
    if (!selNivel2) return [];
    return Object.values(ugrHierarchy)
      .filter(h => h.sigla_n2 === selNivel2 && h.sigla_n3 !== selNivel2)
      .filter(h => records.some((r: any) => String(r.ugr || "").trim() === h.ugr))
      .sort((a, b) => a.sigla_n3.localeCompare(b.sigla_n3));
  }, [selNivel2, records]);

  // Nome por extenso do Nível 2 selecionado
  const nameNivel2 = useMemo(() => {
    if (!selNivel2) return "";
    const found = Object.values(ugrHierarchy).find(h => h.sigla_n2 === selNivel2);
    return found ? found.name_n2 : selNivel2;
  }, [selNivel2]);

  // Encontra o UGR do pai principal (onde sigla_n3 === sigla_n2 ou key === sigla_n2)
  const parentUgrCode = useMemo(() => {
    if (!selNivel2) return null;
    const found = Object.values(ugrHierarchy).find(h => h.sigla_n2 === selNivel2 && h.sigla_n3 === selNivel2);
    return found ? found.ugr : null;
  }, [selNivel2]);

  // Tip dinâmico para orientar o usuário
  const tipText = useMemo(() => {
    const bulb = (
      <Lightbulb 
        size={13.5} 
        className="pulsing-bulb" 
        style={{ 
          color: "#d97706", 
          fill: "#fbbf24", 
          marginRight: "5px", 
          display: "inline-block", 
          verticalAlign: "middle",
          marginTop: "-2px"
        }} 
      />
    );

    if (!selNivel1) {
      return (
        <>
          {bulb} Selecione uma Área nas caixas abaixo para iniciar a navegação na estrutura.
        </>
      );
    }
    if (!selNivel2) {
      const name = selNivel1.toUpperCase();
      let prep = "de";
      if (name.includes("REITORIA")) prep = "da";
      else if (name.includes("FACULDADES")) prep = "das";
      else if (name.includes("INSTITUTOS") || name.includes("DECANATOS") || name.includes("ORGAOS") || name.includes("CENTROS")) prep = "dos";

      return (
        <>
          {bulb} Clique em qualquer Unidade {prep} ({selNivel1}) para detalhar suas subordinadas.
        </>
      );
    }
    if (!selNivel3) {
      return (
        <>
          {bulb} Clique em qualquer caixa (unidade principal ou subordinadas) para isolar seus dados no painel.
        </>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {bulb} Filtro ativo: Exibindo apenas a subordinada selecionada. Clique nela novamente para voltar.
      </span>
    );
  }, [selNivel1, selNivel2, selNivel3]);

  return (
    <div style={{
      background: "linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)",
      borderRadius: 12,
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 15px -2px rgba(15, 23, 42, 0.04)",
      padding: "10px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%"
    }}>
      <style>{`
        @keyframes smooth-pulse {
          0%, 100% { 
            opacity: 0.65; 
            transform: scale(0.95); 
            filter: drop-shadow(0 0 1px rgba(245, 158, 11, 0.2));
          }
          50% { 
            opacity: 1; 
            transform: scale(1.18); 
            filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.9));
          }
        }
        .pulsing-bulb {
          display: inline-block;
          animation: smooth-pulse 2.2s infinite ease-in-out;
        }
      `}</style>
      {/* Cabeçalho centralizado */}
      <div style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: 4,
        textAlign: "center",
        width: "100%"
      }}>
        Organograma
      </div>

      {/* Dica de clique para o usuário */}
      <div style={{
        fontSize: "8.5px",
        color: selNivel3 ? "#4f46e5" : "#6366f1",
        fontWeight: selNivel3 ? 700 : 600,
        textAlign: "center",
        marginBottom: 6,
        background: selNivel3 ? "#e0e7ff" : "transparent",
        padding: selNivel3 ? "2px 8px" : "0",
        borderRadius: selNivel3 ? "6px" : "0",
        alignSelf: "center",
        transition: "all 0.2s"
      }}>
        {tipText}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", width: "100%" }}>
        
        {/* VIEW 2: Área Selecionada (Nível 1), Sem Unidade Detalhada (Nível 2) */}
        {selNivel1 && !selNivel2 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            
            {/* Parent Box: Nome da Área */}
            <div style={{
              background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
              color: "white",
              padding: "5px 14px",
              borderRadius: "15px",
              fontWeight: "800",
              fontSize: "10px",
              textAlign: "center",
              border: "1px solid #1e293b",
              minWidth: "140px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
            }}>
              {selNivel1}
            </div>

            <div style={{ width: "3.5px", height: "12px", background: "#94a3b8", position: "relative", marginBottom: "-8px", zIndex: 10 }} />

            {/* Container horizontal com scroll se transbordar para manter a árvore */}
            <div className="custom-scrollbar" style={{ width: "100%", overflowX: "auto", padding: "0 0 10px 0" }}>
              <div style={{ display: "inline-flex", minWidth: "100%", justifyContent: "center" }}>
                {activeN2Units.map((n2, idx) => (
                  <div
                    key={n2.sigla_n2}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "70px",
                      flexShrink: 0
                    }}
                  >
                    {/* Conector superior cruzando com os outros */}
                    <div style={{ display: "flex", width: "100%", height: 12 }}>
                      <div style={{
                        flex: 1,
                        borderRight: "1.75px solid #94a3b8",
                        borderTop: idx > 0 ? "3.5px solid #94a3b8" : "none"
                      }} />
                      <div style={{
                        flex: 1,
                        borderLeft: "1.75px solid #94a3b8",
                        borderTop: idx < activeN2Units.length - 1 ? "3.5px solid #94a3b8" : "none"
                      }} />
                    </div>

                    {/* Card da unidade */}
                    <div
                      onClick={() => onSelectNivel2(n2.sigla_n2)}
                      style={{
                        background: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
                        color: "white",
                        padding: "5px 4px",
                        borderRadius: "9px",
                        border: "1px solid #334155",
                        textAlign: "center",
                        cursor: "pointer",
                        width: "60px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "30px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1.5px) scale(1.02)";
                        e.currentTarget.style.borderColor = "#6366f1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.borderColor = "#334155";
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: "9px" }}>{n2.sigla_n2}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Unidade Selecionada (Nível 2) - Mostra subordinadas do Nível 3 */}
        {selNivel1 && selNivel2 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            
            {/* Botão de Voltar para a Área superior */}
            <button
              onClick={() => onSelectNivel2(null)}
              style={{
                background: "white",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: "8.5px",
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
                marginBottom: 8,
                transition: "all 0.2s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              ⬅ Voltar para {selNivel1}
            </button>

             {/* Parent Box: Unidade Nível 2 clicada (Selecionável como principal) */}
            <div
              onClick={() => {
                if (parentUgrCode) {
                  onSelectNivel3(selNivel3 === parentUgrCode ? null : parentUgrCode);
                }
              }}
              title={parentUgrCode ? `Clique para isolar apenas a unidade principal ${selNivel2} (UGR ${parentUgrCode})` : "Unidade Principal"}
              style={{
                background: (parentUgrCode && selNivel3 === parentUgrCode)
                  ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)"
                  : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "white",
                padding: "6px 16px",
                borderRadius: "15px",
                border: (parentUgrCode && selNivel3 === parentUgrCode) ? "1.5px solid #818cf8" : "1px solid #020617",
                textAlign: "center",
                cursor: parentUgrCode ? "pointer" : "default",
                minWidth: "140px",
                boxShadow: (parentUgrCode && selNivel3 === parentUgrCode)
                  ? "0 0 10px rgba(79, 70, 229, 0.4)"
                  : "0 2px 5px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: (parentUgrCode && selNivel3 !== null && selNivel3 !== parentUgrCode) ? 0.35 : 1,
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseEnter={(e) => {
                if (parentUgrCode) e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                if (parentUgrCode) e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "10.5px" }}>{selNivel2}</span>
              <span style={{ fontSize: "7px", opacity: 0.9, marginTop: "2px" }}>{nameNivel2}</span>
              {parentUgrCode && (
                <span style={{ fontSize: "6.2px", color: "white", marginTop: "2.5px", fontFamily: "monospace", fontWeight: 600 }}>
                  UGR {parentUgrCode} {(parentUgrCode && selNivel3 === parentUgrCode) && "★"}
                </span>
              )}
            </div>

            {/* Conectores e subordinadas se existirem */}
            {activeN3Units.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                {/* Linha vertical central unificadora */}
                <div style={{ width: "3.5px", height: "14px", background: "#94a3b8", position: "relative", marginBottom: "-8px", zIndex: 10 }} />

                <div className="custom-scrollbar" style={{ width: "100%", overflowX: "auto", padding: "0 0 10px 0" }}>
                  <div style={{ display: "inline-flex", minWidth: "100%", justifyContent: "center" }}>
                    {activeN3Units.map((n3, idx) => {
                      const isSelected = selNivel3 === n3.ugr;
                      const hasSelection = selNivel3 !== null;
                      const isFaded = hasSelection && !isSelected;

                      return (
                        <div
                          key={n3.ugr}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "170px",
                            flexShrink: 0
                          }}
                        >
                          {/* Conector superior cruzando com os outros */}
                          <div style={{ display: "flex", width: "100%", height: 12 }}>
                            <div style={{
                              flex: 1,
                              borderRight: "1.75px solid #94a3b8",
                              borderTop: idx > 0 ? "3.5px solid #94a3b8" : "none"
                            }} />
                            <div style={{
                              flex: 1,
                              borderLeft: "1.75px solid #94a3b8",
                              borderTop: idx < activeN3Units.length - 1 ? "3.5px solid #94a3b8" : "none"
                            }} />
                          </div>

                          {/* Caixa da subordinada (Nível 3) */}
                          <div
                            title={`${n3.name_n3} (Clique para isolar)`}
                            onClick={() => onSelectNivel3(isSelected ? null : n3.ugr)}
                            style={{
                              background: isSelected
                                ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)"
                                : "linear-gradient(135deg, #64748b 0%, #334155 100%)",
                              color: "white",
                              padding: "6px 10px",
                              borderRadius: "12px",
                              border: isSelected ? "1.5px solid #818cf8" : "1px solid #475569",
                              textAlign: "center",
                              width: "150px",
                              cursor: "pointer",
                              zIndex: 2,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: "48px",
                              opacity: isFaded ? 0.35 : 1,
                              boxShadow: isSelected
                                ? "0 0 8px rgba(79, 70, 229, 0.4)"
                                : "0 1.5px 3px rgba(0,0,0,0.08)",
                              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = isSelected ? "translateY(-0.5px)" : "translateY(-1.5px)";
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#6366f1";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#475569";
                              }
                            }}
                          >
                            <span style={{ fontWeight: 800, fontSize: "10px" }}>{n3.sigla_n3}</span>
                            <span style={{ fontSize: "7.5px", opacity: 0.9, marginTop: "2px", lineHeight: 1.15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {n3.name_n3}
                            </span>
                            <span style={{ fontSize: "6.5px", color: "white", marginTop: "2.5px", fontFamily: "monospace", fontWeight: 600 }}>
                              UGR {n3.ugr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "8.5px", color: "#64748b", fontStyle: "italic", marginTop: 10 }}>
                Esta unidade não possui divisões subordinadas no orçamento atual.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
