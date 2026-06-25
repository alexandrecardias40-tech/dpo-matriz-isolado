import { useMemo, useState, useEffect } from "react";
import { useData } from "./DataProvider";
import DashboardLayout from "./components/DashboardLayout";
import CINetworkChart from "./components/CINetworkChart";
import { ArrowLeft, TrendingUp, AlertTriangle } from "lucide-react";

const fmt  = (v: number) => isNaN(v)||!v ? "R$ 0,00" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
const fmtK = (v: number) => {
  if (isNaN(v) || !v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};
const pct  = (a:number,b:number) => b>0 ? ((a/b)*100).toFixed(1)+"%" : "0%";

// Agrega dados por Unidade para o Grafo
function buildByUnidade(records: any[]) {
  const m: Record<string,any> = {};
  records.forEach((d:any) => {
    const cc = (d.unidade||"Outras Unidades").trim();
    if (!m[cc]) m[cc] = {
      centro_custo: cc,
      empenhado: 0, 
      total_pago_tg: 0, 
      ressarcido: 0,
      a_ressarcir: 0, 
      total_ci: 0, 
      qtd_nes: 0,
      semaforo_verde: 0, 
      semaforo_amarelo: 0, 
      semaforo_vermelho: 0, 
      registros: []
    };
    m[cc].empenhado     += Number(d.despesas_empenhadas_tg)    || 0;
    m[cc].total_pago_tg += Number(d.despesas_liquidadas_tg)    || 0;
    m[cc].ressarcido    += Number(d.total_executado_matriz)    || 0;
    m[cc].a_ressarcir   += Number(d.credito_disponivel_matriz) || 0;
    m[cc].total_ci      += Number(d.valor_aprovado)            || 0;
    m[cc].qtd_nes       += 1;
    
    if (d.semaforo==='verde')    m[cc].semaforo_verde   += 1;
    if (d.semaforo==='amarelo')  m[cc].semaforo_amarelo += 1;
    if (d.semaforo==='vermelho') m[cc].semaforo_vermelho+= 1;
    m[cc].registros.push(d);
  });
  return Object.values(m).sort((a:any,b:any)=>b.empenhado-a.empenhado);
}

function DetailPanel({ cc, onBack, records }: { cc: any; onBack: ()=>void; records: any[] }) {
  const [selPI, setSelPI] = useState("all");

  const s = {
    card: { background:"white", borderRadius:12, border:"1px solid #e2e8f0", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", padding:"14px 16px" } as React.CSSProperties,
    th:   { fontSize:10, color:"#475569", textTransform:"uppercase" as const, letterSpacing:"0.06em", padding:"9px 10px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", fontWeight:700, textAlign:"center" as const },
    td:   { padding:"9px 10px", fontSize:11, borderBottom:"1px solid #f1f5f9", verticalAlign:"middle" as const, textAlign:"center" as const, color: "#334155" },
  };

  const planosInternos = useMemo(() => {
    return Array.from(new Set(cc.registros.map((r: any) => r.plano_interno).filter(Boolean))) as string[];
  }, [cc.registros]);

  const filteredRegistros = useMemo(() => {
    return cc.registros.filter((r: any) => {
      if (selPI !== "all" && r.plano_interno !== selPI) return false;
      return true;
    });
  }, [cc.registros, selPI]);

  const stats = useMemo(() => {
    let valor_aprovado = 0;
    let total_executado_matriz = 0;
    let despesas_empenhadas_matriz = 0;
    let despesas_debitadas_matriz = 0;
    let credito_disponivel_matriz = 0;
    
    let despesas_empenhadas_tg = 0;
    let despesas_liquidadas_tg = 0;
    
    let count_verde = 0;
    let count_amarelo = 0;
    let count_vermelho = 0;

    filteredRegistros.forEach((r: any) => {
      valor_aprovado += Number(r.valor_aprovado) || 0;
      total_executado_matriz += Number(r.total_executado_matriz) || 0;
      despesas_empenhadas_matriz += Number(r.despesas_empenhadas_matriz) || 0;
      despesas_debitadas_matriz += Number(r.despesas_debitadas_matriz) || 0;
      credito_disponivel_matriz += Number(r.credito_disponivel_matriz) || 0;

      despesas_empenhadas_tg += Number(r.despesas_empenhadas_tg) || 0;
      despesas_liquidadas_tg += Number(r.despesas_liquidadas_tg) || 0;

      if (r.semaforo === 'verde') count_verde += 1;
      if (r.semaforo === 'amarelo') count_amarelo += 1;
      if (r.semaforo === 'vermelho') count_vermelho += 1;
    });

    return {
      valor_aprovado, total_executado_matriz, despesas_empenhadas_matriz, despesas_debitadas_matriz, credito_disponivel_matriz,
      despesas_empenhadas_tg, despesas_liquidadas_tg,
      count_verde, count_amarelo, count_vermelho, total: filteredRegistros.length
    };
  }, [filteredRegistros]);

  const diagnostic = useMemo(() => {
    if (!records || records.length === 0) return null;
    
    // Global stats
    const matrixRecs = records.filter((r: any) => r.in_matrix);
    let globalApproved = 0;
    let globalExecuted = 0;
    matrixRecs.forEach((r: any) => {
      globalApproved += Number(r.valor_aprovado) || 0;
      globalExecuted += Number(r.total_executado_matriz) || 0;
    });
    const globalRate = globalApproved > 0 ? (globalExecuted / globalApproved) * 100 : 0;
    
    // Unit stats
    const aprovado = stats.valor_aprovado;
    const executado = stats.total_executado_matriz;
    const rate = aprovado > 0 ? (executado / aprovado) * 100 : 0;
    const disponivel = stats.credito_disponivel_matriz;
    const empenhado = stats.despesas_empenhadas_matriz;
    const debitado = stats.despesas_debitadas_matriz;
    
    // Compare rate with global
    const diff = rate - globalRate;
    const compareText = diff >= 0
      ? `está ${diff.toFixed(1)} pontos percentuais ACIMA da média geral da Matriz (${globalRate.toFixed(1)}%)`
      : `está ${Math.abs(diff).toFixed(1)} pontos percentuais ABAIXO da média geral da Matriz (${globalRate.toFixed(1)}%)`;

    let status = "";
    let color = "";
    let concerns: string[] = [];
    let positivePoints: string[] = [];

    if (rate < 35) {
      status = "Execução Crítica / Retenção Orçamentária";
      color = "#ef4444"; // red
      
      concerns.push(
        "Ritmo de empenho excessivamente lento: risco iminente de perda de limite orçamentário no encerramento da janela fiscal.",
        `Elevado saldo ocioso: a unidade retém ${fmt(disponivel)} livre, o que representa recursos travados que poderiam beneficiar outras unidades com maior demanda.`,
        "Pendências operacionais: possível entrave burocrático na formalização de contratos ou processos licitatórios na UGR correspondente."
      );
      positivePoints.push(
        "Margem orçamentária intacta para eventuais contratações urgentes de final de ano."
      );
    } else if (rate >= 35 && rate <= 75) {
      status = "Desempenho Regular / Em Progresso";
      color = "#f59e0b"; // amber
      
      concerns.push(
        "Acompanhamento de prazos: embora a execução esteja estável, é necessário monitorar contratos de maior relevância para evitar gargalos na reta final do exercício.",
        `Saldo em trânsito: há ${fmt(disponivel)} ainda disponível que necessita de programação nos próximos meses.`
      );
      positivePoints.push(
        "Ritmo operacional alinhado às projeções institucionais de médio prazo.",
        `Equilíbrio entre recursos aprovados (${fmt(aprovado)}) e execução real (${fmt(executado)}).`
      );
    } else {
      status = "Alta Eficiência / Otimização de Limites";
      color = "#10b981"; // green
      
      concerns.push(
        `Esgotamento de limite: com apenas ${fmt(disponivel)} restante, a unidade pode precisar de aportes ou remanejamentos de crédito adicionais para suportar despesas residuais imprevistas.`,
        "Garantia de liquidação: certificar-se de que os empenhos realizados sejam devidamente atestados e liquidados."
      );
      positivePoints.push(
        "Excelente performance administrativa: uso racional e tempestivo de todo o orçamento alocado.",
        `Demonstração de alta maturidade de planejamento físico-financeiro (taxa de execução de ${rate.toFixed(1)}%).`
      );
    }

    return {
      status,
      color,
      compareText,
      concerns,
      positivePoints,
      rateText: rate.toFixed(1),
      aprovadoText: fmt(aprovado),
      executadoText: fmt(executado),
      disponivelText: fmt(disponivel),
      empenhadoText: fmt(empenhado),
      debitadoText: fmt(debitado)
    };
  }, [cc, stats, records]);

  const Bar = ({ value, max, color }: { value:number; max:number; color:string }) => (
    <div style={{ height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden", marginTop:4 }}>
      <div style={{ height:"100%", width:`${max>0?(value/max)*100:0}%`, background:color, borderRadius:3, transition:"width 0.6s ease" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, padding:"0 2px" }}>
      
      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={onBack}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:"1px solid #e2e8f0", borderRadius:8, background:"white", fontSize:12, cursor:"pointer", fontWeight:600, color:"#374151", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <ArrowLeft size={14}/> Voltar ao Grafo
          </button>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>{cc.centro_custo}</h2>
            <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>{stats.total} registros · Detalhamento por Unidade</p>
          </div>
        </div>
      </div>

      {/* KPIs Principais da Unidade na mesma sequência do gráfico */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
        <div style={{ ...s.card, borderLeft:"4px solid #3b82f6", padding:"12px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>💰 Orçamento Aprovado</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginTop:4, fontFamily:"monospace" }}>{fmt(stats.valor_aprovado)}</div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>Planejado na Matriz</div>
        </div>
        <div style={{ ...s.card, borderLeft:"4px solid #f59e0b", padding:"12px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>📈 Empenhado (Matriz)</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginTop:4, fontFamily:"monospace" }}>{fmt(stats.despesas_empenhadas_matriz)}</div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>Lançamentos empenhados</div>
        </div>
        <div style={{ ...s.card, borderLeft:"4px solid #14b8a6", padding:"12px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>🎯 Debitado (Matriz)</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginTop:4, fontFamily:"monospace" }}>{fmt(stats.despesas_debitadas_matriz)}</div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>Provisionado na planilha</div>
        </div>
        <div style={{ ...s.card, borderLeft:"4px solid #64748b", padding:"12px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>💵 Disponível (Matriz)</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginTop:4, fontFamily:"monospace" }}>{fmt(stats.credito_disponivel_matriz)}</div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>Saldo livre restante</div>
        </div>
        <div style={{ ...s.card, borderLeft: "4px solid #8b5cf6", padding:"12px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>⚡ Taxa de Execução</div>
          <div style={{ fontSize:18, fontWeight:800, color: "#8b5cf6", marginTop:4, fontFamily:"monospace" }}>
            {pct(stats.total_executado_matriz, stats.valor_aprovado)}
          </div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>Percentual de utilização</div>
        </div>
      </div>

      {/* Bloco de Análise Dinâmica e Diagnóstico da Unidade */}
      {diagnostic && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {/* Diagnóstico Geral */}
          <div style={{ ...s.card, padding: "16px 18px", borderLeft: `4px solid ${diagnostic.color}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={15} style={{ color: diagnostic.color }} /> Diagnóstico Situacional
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 12, background: `${diagnostic.color}15`, color: diagnostic.color, border: `1px solid ${diagnostic.color}30` }}>
                  {diagnostic.status}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, margin: 0 }}>
                A unidade <strong>{cc.centro_custo}</strong> possui um orçamento total aprovado de <strong>{diagnostic.aprovadoText}</strong> e executou <strong>{diagnostic.executadoText}</strong> até o momento.
              </p>
              <div style={{ marginTop: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11, color: "#334155" }}>
                📊 A taxa de execução real de <strong>{diagnostic.rateText}%</strong> {diagnostic.compareText}.
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 10.5, color: "#64748b", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span>Empenhado: <strong style={{ color: "#475569" }}>{diagnostic.empenhadoText}</strong></span>
              <span>Debitado: <strong style={{ color: "#475569" }}>{diagnostic.debitadoText}</strong></span>
              <span>Disponível: <strong style={{ color: "#ef4444" }}>{diagnostic.disponivelText}</strong></span>
            </div>
          </div>
        </div>
      )}


      {/* Tabela de registros */}
      <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", fontWeight:700, fontSize:13, color:"#0f172a", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <span>Registros da Planilha Matriz</span>
            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:400 }}>{stats.total} planos internos</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"flex-start" }}>
              <span style={{ fontSize:10, fontWeight:700, color: "#475569" }}>Plano Interno</span>
              <select value={selPI} onChange={e=>setSelPI(e.target.value)}
                style={{ padding:"4px 8px", border:"1px solid #d1d5db", borderRadius:6, fontSize:11, background:"white", cursor:"pointer", minWidth:120 }}>
                <option value="all">Todos</option>
                {planosInternos.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ overflowX:"auto", maxHeight:320, overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, tableLayout:"fixed" }}>
            <thead style={{ position:"sticky", top:0, zIndex:1 }}>
              <tr>
                {[
                  { name: "Descrição", width: "160px" },
                  { name: "Processo SEI", width: "120px" },
                  { name: "Aprovado (Matriz)", width: "85px" },
                  { name: "Empenhado (Matriz)", width: "85px" },
                  { name: "Debitado (Matriz)", width: "85px" },
                  { name: "Disponível (Matriz)", width: "85px" },
                  { name: "Taxa de Execução", width: "100px" }
                ].map(h=>(
                  <th key={h.name} style={{ ...s.th, width: h.width, minWidth: h.width }}>{h.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRegistros.map((d:any, i:number) => {
                return (
                  <tr key={i} style={{ background:i%2===0?"white":"#fafbfc" }}>
                    <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: "#4f46e5", width: "160px", minWidth: "160px", maxWidth: "160px", whiteSpace: "normal", wordBreak: "break-word" }} title={`${d.plano_interno} - ${d.plano_interno_nome || ""}`}>
                      <span>{d.plano_interno_nome || "—"}</span>
                      <div style={{ fontSize: 8.5, color: "#64748b", fontWeight: 400, marginTop: 2, fontFamily: "monospace" }}>{d.plano_interno}</div>
                    </td>
                    <td style={{ ...s.td, fontSize: "9px", whiteSpace: "nowrap", width: "120px", minWidth: "120px" }}><span style={{ color:"#374151" }}>{d.sei||"—"}</span></td>
                    <td style={{ ...s.td, fontWeight:600, width: "85px" }}>{fmtK(d.valor_aprovado)}</td>
                    <td style={{ ...s.td, width: "85px" }}>{fmtK(d.despesas_empenhadas_matriz)}</td>
                    <td style={{ ...s.td, width: "85px" }}>{fmtK(d.despesas_debitadas_matriz)}</td>
                    <td style={{ ...s.td, color:"#f59e0b", fontWeight:700, width: "85px" }}>{fmtK(d.credito_disponivel_matriz)}</td>
                    <td style={{ ...s.td, width: "100px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color: "#8b5cf6" }}>{pct(d.total_executado_matriz, d.valor_aprovado)}</span>
                      </div>
                      <Bar value={Number(d.total_executado_matriz) || 0} max={Number(d.valor_aprovado) || 0} color="#8b5cf6" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function GraficosPage() {
  const { records, loading } = useData();
  const [selected, setSelected] = useState<any>(null);

  const byCC = useMemo(() => buildByUnidade(records.filter((r: any) => r.in_matrix && r.in_tg)), [records]);

  const handleNodeClick = (nodeData: any) => {
    if (!nodeData) return;
    const cc = byCC.find((c:any) => c.centro_custo === nodeData.centro_custo);
    if (cc) setSelected(cc);
  };

  const chartHeight = typeof window !== "undefined" ? window.innerHeight - 72 : 600;

  return (
    <DashboardLayout hideUpdateBadge={!selected}>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Carregando dados estruturados do grafo...</div>
      ) : selected ? (
        <DetailPanel cc={selected} onBack={() => setSelected(null)} records={records} />
      ) : (
        <div style={{ margin:"-24px -24px 0", position:"relative" }}>
          <div style={{ position:"absolute", top:16, left:20, zIndex:10, pointerEvents:"none" }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:"rgba(255,255,255,0.9)", margin:0, textShadow:"0 2px 8px rgba(0,0,0,0.6)" }}>
              Mapa do Fluxo de Créditos da Matriz
            </h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", margin:"2px 0 0" }}>
              {byCC.length} unidades organizacionais · {records.length} registros de cruzamento · Clique em um nó para detalhar
            </p>
          </div>
          <CINetworkChart data={byCC} height={chartHeight} onNodeClick={handleNodeClick} />
        </div>
      )}
    </DashboardLayout>
  );
}
