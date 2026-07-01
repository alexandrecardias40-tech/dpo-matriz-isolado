import React from "react";

export const PARENT_TO_CHILDREN: Record<string, string[]> = {
  "154157": ["154231", "154232"], // IE -> EST, CIC
  "154159": ["154243"], // ICH -> FIL
  "154283": ["154240", "154241"], // ICS -> SOL, DAN
  "154160": ["154246", "154247", "154248"], // IL -> LIP, TEL, LET
  "154162": ["154253"], // FT -> ENE
  "154163": ["154257"], // FS -> NUT
  "154164": ["154261", "154199"], // FACE -> ADM, CCA
  "154166": ["154306", "154307", "154308", "154309"], // IP -> PPB, PED, PCL, PST
  "154167": ["154310", "154311", "154511"], // IDA -> VIS, CEN, DIN
  "154251": ["154510"], // FAV -> HVET
  "154158": ["154237"], // IB -> FIT
  "154151": ["154186", "154187", "154265"], // DAF -> DCO, DCF, DIMEX
  "154920": ["154922"], // INFRA -> DCA
  "154191": ["154195"], // PRC -> ALM
  "154188": ["154288"], // IG -> SIS
  "152387": ["152371"], // DPO -> DOR
  "156047": ["154019"], // DPI -> CDT
};

export const CHILD_TO_PARENT: Record<string, string> = {
  "154231": "154157", "154232": "154157", // EST, CIC -> IE
  "154243": "154159", // FIL -> ICH
  "154240": "154283", "154241": "154283", // SOL, DAN -> ICS
  "154246": "154160", "154247": "154160", "154248": "154160", // LIP, TEL, LET -> IL
  "154253": "154162", // ENE -> FT
  "154257": "154163", // NUT -> FS
  "154261": "154164", "154199": "154164", // ADM, CCA -> FACE
  "154306": "154166", "154307": "154166", "154308": "154166", "154309": "154166", // PPB, PED, PCL, PST -> IP
  "154310": "154167", "154311": "154167", "154511": "154167", // VIS, CEN, DIN -> IDA
  "154510": "154251", // HVET -> FAV
  "154237": "154158", // FIT -> IB
  "154186": "154151", "154187": "154151", "154265": "154151", // DCO, DCF, DIMEX -> DAF
  "154922": "154920", // DCA -> INFRA
  "154195": "154191", // ALM -> PRC
  "154288": "154188", // SIS -> IG
  "152371": "152387", // DOR -> DPO
  "154019": "156047", // CDT -> DPI
};

export const HIERARCHY_NAMES: Record<string, string> = {
  "154157": "INSTITUTO DE CIENCIAS EXATAS (IE)",
  "154231": "DEPARTAMENTO DE ESTATISTICA (EST)",
  "154232": "DEPARTAMENTO DE CIENCIAS DA COMPUTACAO (CIC)",
  "154159": "INSTITUTO DE CIENCIAS HUMANAS (ICH)",
  "154240": "DEPARTAMENTO DE SOCIOLOGIA (SOL)",
  "154241": "DEPARTAMENTO DE ANTROPOLOGIA (DAN)",
  "154243": "DEPARTAMENTO DE FILOSOFIA (FIL)",
  "154160": "INSTITUTO DE LETRAS (IL)",
  "154246": "DEPART LINGUIS PORT E LINGUAS CLASSICAS (LIP)",
  "154247": "DEPART DE TEORIA LIT E LITERATURA (TEL)",
  "154248": "DEPART LINGUAS EESTRANGEIRAS E TRAD (LET)",
  "154162": "FACULDADE DE TECNOLOGIA (FT)",
  "154253": "DEPARTAMENTO DE ENGENHARIA ELETRICA (ENE)",
  "154163": "FACULDADE DE CIENCIAS DA SAUDE (FS)",
  "154257": "DEPARTAMENTO DE NUTRICAO-NUT",
  "154164": "FACULDADE DE ECO ADM CONT E GESTAO DE (FACE)",
  "154261": "DEPARTAMENTO DE ADMINISTRACAO (ADM)",
  "154199": "DEPART.CIENC.CONTABEIS E ATUARIAS (CCA)",
  "154166": "INSTITUTO DE PSICOLOGIA (IP)",
  "154306": "DEPTO. DE PROCESSOS PSICOLOG. BASICOS (PPB)",
  "154307": "DPTO.DE PSICOLOG.ESC.E DO DESENVOLV (PED)",
  "154308": "DEPARTAMENTO DE PSICOLOGIA CLINICA (PCL)",
  "154309": "DPTO.DE PSICOLOGIA SOCIAL E DO TRABALHO (PST)",
  "154167": "INSTITUTO DE ARTES (IDA)",
  "154310": "DEPARTAMENTO DE ARTES VISUAIS (VIS)",
  "154311": "DEPARTAMENTO DE ARTES CENICAS (CEN)",
  "154511": "DEPARTAMENTO DE DESIGN (DIN)",
  "154251": "FACULDADE DE AGRONOMIA E MED VETERINARI (FAV)",
  "154510": "HOSPITAL VETERINARIO_(HVET)",
  "154237": "DEPARTAMENTO DE FITOPATOLOGIA - FIT",
  "154151": "DECANATO DE ADMINISTRACAO (DAF)",
  "154186": "DIRETORIA DE COMPRAS (DCO)",
  "154187": "DIRETORIA DE CONTABILIDADE E FINANCAS (DCF)",
  "154265": "DIRETORIA DE IMPORTACAO E EXPORTACAO (DIMEX)",
  "154920": "SECRETARIA DE INFRAESTRUTURA (INFRA)",
  "154922": "DIRETORIA DE CONTRATOS ADMINISTRATIVOS-DCA",
  "154191": "PREFEITURA DA UNB (PRC)",
  "154195": "COORDENACAO DE ALMOXARIFADO CENTRAL - ALM",
  "154156": "GABINETE DA REITORA (GRE)",
  "154227": "VICE-REITORIA - VRT",
  "154221": "SECRETARIA DE COMUNICACAO_(SECOM)",
  "154218": "PROCURADORIA FEDERAL JUNTO A UNB - PF-UNB",
  "154222": "AUDITORIA (AUD)",
  "152383": "OUVIDORIA (OUV)",
  "154297": "SECRETARIA DE ASSUNTOS INTERNACIONAIS (INT)",
  "157250": "ASS DE ACOMP E MEDIACAO DE CONDUTA (AAMC)",
  "150241": "CTO DE POL DIR, ECO E TECNOL DAS COMUN/FUB",
  "152364": "UNB CERRADO - CER",
  "152371": "DOR/FUB - CREDITOS A DETALHAR",
  "152387": "DECANATO DE PLANEJ,ORCAM E AVAL INST - DPO",
  "154019": "CENTRO DE APOIO AO DESENVOLV. TECNOLOGICO-CDT",
  "154173": "CENT DE EST AVANC E MULTIDISCIP.-CEAM",
  "154288": "OBSERVATORIO SISMOLOGICO (SIS)",
  "154304": "CENTRO REF EM CONS NAT E REC AREAS DEG (CRAD)",
  "154368": "CENTRO DE DESENVOLVIMENTO SUSTENTAVEL (CDS)",
  "154371": "CENTRO DE EXCELENCIA EM TURISMO (CET)",
  "156850": "CENT INTERNAC DE BIOETICA E HUMANIDADE-CIBH",
  "156047": "DECANATO DE PESQUISA E INOVACAO - DPI",
  "154188": "INSTITUTO DE GEOCIENCIAS (IG)"
};

interface UnitOrganogramProps {
  selUnidade: string[];
  ugrNames: Record<string, string>;
  formatVal: (name: string) => string;
  records: any[];
  selSubUnidades: string[];
  onToggleSubUnit: (ugr: string) => void;
}

export default function UnitOrganogram({
  selUnidade,
  ugrNames,
  formatVal,
  records,
  selSubUnidades,
  onToggleSubUnit
}: UnitOrganogramProps) {
  if (selUnidade.length === 0) return null;

  // Encontra a UGR correspondente para cada unidade selecionada no filtro
  const selectedRoots = selUnidade.map(name => {
    const ugr = Object.keys(ugrNames).find(k => ugrNames[k] === name);
    return ugr || "";
  }).filter(Boolean);

  if (selectedRoots.length === 0) return null;

  const hasAnyFilter = selSubUnidades.length > 0;

  return (
    <div style={{
      background: "linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)",
      borderRadius: 12,
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 15px -2px rgba(15, 23, 42, 0.04)",
      padding: "8px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%"
    }}>
      {/* Título Centralizado */}
      <div style={{
        fontSize: 9.5,
        fontWeight: 800,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: 4,
        marginBottom: 1,
        textAlign: "center",
        width: "100%"
      }}>
        Estrutura Organizacional
      </div>

      {/* Dica de Filtro para o Usuário (Aparece apenas quando não há filtro ativo) */}
      {!hasAnyFilter && (
        <div style={{
          fontSize: "8.5px",
          color: "#6366f1",
          fontWeight: 600,
          textAlign: "center",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px"
        }}>
          <span>💡 <strong>Dica:</strong> Clique em qualquer caixa do organograma para isolar os dados daquela UGR na tabela abaixo.</span>
        </div>
      )}

      {/* Aviso de Filtro Ativo (Substitui a dica quando há seleções ativas) */}
      {hasAnyFilter && (
        <div style={{
          fontSize: "8px",
          color: "#4f46e5",
          fontWeight: 700,
          textAlign: "center",
          background: "#e0e7ff",
          padding: "2px 8px",
          borderRadius: "6px",
          alignSelf: "center",
          marginBottom: 4
        }}>
          Filtro ativo: Clique na caixa selecionada novamente para desfazer e ver todas
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", width: "100%" }}>
        {selectedRoots.map(rootUgr => {
          const childrenUgrs = PARENT_TO_CHILDREN[rootUgr] || [];
          
          // Filtra subordinadas para trazer APENAS aquelas que existem na base de dados ativa (records)
          const activeChildrenUgrs = childrenUgrs.filter(childUgr => {
            return records.some((r: any) => String(r.ugr || "").trim() === childUgr);
          });

          const parentName = ugrNames[rootUgr] || HIERARCHY_NAMES[rootUgr] || rootUgr;
          const parentAbbrev = formatVal(parentName);
          const hasChildren = activeChildrenUgrs.length > 0;

          // Estado visual de seleção do pai
          const isParentSelected = selSubUnidades.includes(rootUgr);
          const isParentFaded = hasAnyFilter && !isParentSelected;

          return (
            <div key={rootUgr} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 800 }}>
              {/* Parent Box */}
              <div 
                title={`${parentName} (Clique para filtrar na tabela)`}
                onClick={() => onToggleSubUnit(rootUgr)}
                style={{
                  background: isParentSelected
                    ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" // Electric Indigo/Blue gradient
                    : "linear-gradient(135deg, #475569 0%, #1e293b 100%)", // Medium slate/dark slate gradient
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "15px",
                  fontWeight: "700",
                  fontSize: "10px",
                  boxShadow: isParentSelected 
                    ? "0 0 10px rgba(79, 70, 229, 0.4)" 
                    : "0 2px 4px rgba(15, 23, 42, 0.1)",
                  border: isParentSelected ? "1.5px solid #818cf8" : "1px solid #334155",
                  textAlign: "center",
                  minWidth: "115px",
                  zIndex: 2,
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  opacity: isParentFaded ? 0.35 : 1,
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = isParentSelected ? "translateY(-0.5px)" : "scale(1.03) translateY(-0.5px)";
                  if (!isParentSelected) {
                    e.currentTarget.style.borderColor = "#6366f1";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1) translateY(0)";
                  if (!isParentSelected) {
                    e.currentTarget.style.borderColor = "#334155";
                  }
                }}
              >
                <span style={{ letterSpacing: "0.02em" }}>{parentAbbrev}</span>
                <div style={{
                  fontSize: "7px",
                  color: "white",
                  marginTop: "3px",
                  fontFamily: "monospace",
                  fontWeight: "600",
                  letterSpacing: "0.02em"
                }}>
                  UGR {rootUgr}
                </div>
              </div>

              {/* Connecting Lines */}
              {hasChildren && (
                <div style={{ width: "2px", height: "6px", background: "#cbd5e1" }} />
              )}

              {/* Children Row */}
              {hasChildren && (
                <div style={{ display: "flex", width: "100%", justifyContent: "center", flexWrap: "wrap", gap: "6px 0" }}>
                  {activeChildrenUgrs.map((childUgr, idx) => {
                    const childName = ugrNames[childUgr] || HIERARCHY_NAMES[childUgr] || childUgr;
                    const childAbbrev = formatVal(childName);

                    // Estado visual de seleção do filho
                    const isChildSelected = selSubUnidades.includes(childUgr);
                    const isChildFaded = hasAnyFilter && !isChildSelected;

                    return (
                      <div key={childUgr} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "100px" }}>
                        {/* Connecting Line Branches */}
                        <div style={{ display: "flex", width: "100%", height: 8, position: "relative" }}>
                          <div style={{
                            flex: 1,
                            borderRight: "2px solid #cbd5e1",
                            borderTop: idx > 0 ? "2px solid #cbd5e1" : "none"
                          }} />
                          <div style={{
                            flex: 1,
                            borderTop: idx < activeChildrenUgrs.length - 1 ? "2px solid #cbd5e1" : "none"
                          }} />
                        </div>

                        {/* Child Box */}
                        <div 
                          title={`${childName} (Clique para filtrar na tabela)`}
                          onClick={() => onToggleSubUnit(childUgr)}
                          style={{
                            background: isChildSelected
                              ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" // Electric Indigo/Blue gradient
                              : "linear-gradient(135deg, #64748b 0%, #334155 100%)", // Lighter slate-gray gradient
                            color: "white", // White text
                            padding: "3px 10px",
                            borderRadius: "12px",
                            border: isChildSelected 
                              ? "1.5px solid #818cf8" 
                              : "1px solid #475569", // Lighter slate border
                            fontWeight: "700",
                            fontSize: "9px",
                            boxShadow: isChildSelected 
                              ? "0 0 10px rgba(79, 70, 229, 0.35)" 
                              : "0 1.5px 3px rgba(15, 23, 42, 0.08)",
                            textAlign: "center",
                            width: "90%",
                            maxWidth: "115px",
                            zIndex: 2,
                            display: "inline-flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            opacity: isChildFaded ? 0.35 : 1,
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = isChildSelected ? "translateY(-0.5px)" : "translateY(-1.5px)";
                            if (!isChildSelected) {
                              e.currentTarget.style.borderColor = "#6366f1";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            if (!isChildSelected) {
                              e.currentTarget.style.borderColor = "#475569";
                            }
                          }}
                        >
                          <span style={{ letterSpacing: "0.01em" }}>{childAbbrev}</span>
                          <div style={{
                            fontSize: "6.5px",
                            color: "white", // White text
                            marginTop: "2.5px",
                            fontFamily: "monospace",
                            fontWeight: "600",
                            letterSpacing: "0.02em"
                          }}>
                            UGR {childUgr}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
