import { useEffect, useMemo, useState } from "react";
import { useData } from "./DataProvider";
import { PI_GROUPS, PI_GROUP_NAMES, PI_ALLOWED } from "./App";
import DashboardLayout from "./components/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from "recharts";
import { TrendingUp, DollarSign, AlertTriangle, Target, Wallet, ArrowUpRight, Percent, BarChart3, ChevronDown, X, LineChart } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "./components/ui/command";
import { Checkbox } from "./components/ui/checkbox";

const fmt  = (v: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2}).format(v||0);
const fmtK = (v: number) => `R$ ${((v||0)/1e6).toFixed(2)}M`;
const pct  = (a:number,b:number) => b>0?((a/b)*100).toFixed(1)+"%":"0%";

/* ── palette ── */
const C = { blue:"#3b82f6", green:"#10b981", red:"#ef4444", amber:"#f59e0b", purple:"#8b5cf6", teal:"#14b8a6", slate:"#64748b" };
const COLORS = ['#2f6bff','#13c7d6','#ff6b00','#f9d600','#2ed11e','#ff2d95','#7a4dff','#ff9f1c','#00d3a7','#d163ff','#4cc9f0','#f72585','#06d6a0','#ffd166','#e63946','#52b788'];

function getUnitAbbreviation(name: string): string {
  if (!name) return "";
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim();
  }
  const partsSlash = name.split("/");
  if (partsSlash.length > 1) {
    const lastPart = partsSlash[partsSlash.length - 1].trim();
    if (lastPart.length <= 8) {
      return lastPart;
    }
  }
  const parts = name.split(" - ");
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.length <= 10) {
      return lastPart;
    }
  }
  if (name.length <= 12) {
    return name;
  }
  const words = name.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 2);
  if (words.length > 1) {
    const initials = words.map(w => w[0]).join("").toUpperCase();
    if (initials.length >= 2 && initials.length <= 5) return initials;
  }
  return name.slice(0, 12) + "...";
}

/* ── MultiSel Filter Helper ── */
function MultiSel({ label, opts, sel, set, formatVal }: { label: string; opts: string[]; sel: string[]; set: (v: string[]) => void; formatVal?: (v: string) => string }) {
  const renderLabel = (val: string) => formatVal ? formatVal(val) : val;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569" }}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, background: "white", fontSize: 9.5, cursor: "pointer", width: 140, gap: 4, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {sel.length > 0 ? sel.map(renderLabel).join(", ") : "Todos"}
            </span>
            <ChevronDown size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 240, padding: 0 }}>
          <Command>
            <CommandInput placeholder="Buscar…" />
            {opts.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", cursor: "pointer" }}
                onClick={() => set(sel.length === opts.length ? [] : [...opts])}>
                <Checkbox checked={sel.length === opts.length && opts.length > 0} style={{ pointerEvents: "none" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Selecionar Todos</span>
              </div>
            )}
            <CommandList style={{ maxHeight: 220, overflowY: "auto" }}>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {opts.map(o => (
                  <CommandItem key={o} value={o} onSelect={() => set(sel.includes(o) ? sel.filter(x => x !== o) : [...sel, o])} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px" }}>
                    <Checkbox checked={sel.includes(o)} style={{ pointerEvents: "none" }} />
                    <span style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o}>
                      {formatVal ? `${formatVal(o)} - ${o}` : o}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ── custom tooltips ── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#0f172a", color:"#f1f5f9", borderRadius:10, padding:"10px 14px", fontSize:11, boxShadow:"0 8px 24px rgba(0,0,0,0.3)", minWidth:180 }}>
      <div style={{ fontWeight:700, marginBottom:6, borderBottom:"1px solid #1e293b", paddingBottom:4 }}>{payload[0]?.payload?.fullName||label}</div>
      {payload.map((p:any)=>(
        <div key={p.name} style={{ display:"flex", justifyContent:"space-between", gap:16, marginTop:3 }}>
          <span style={{ color:"#94a3b8" }}>{p.name}</span>
          <span style={{ fontWeight:700, color:p.color||"#f1f5f9" }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:"#0f172a", color:"#f1f5f9", borderRadius:10, padding:"10px 14px", fontSize:11, boxShadow:"0 8px 24px rgba(0,0,0,0.3)", minWidth:200 }}>
      <div style={{ fontWeight:700, marginBottom:6, borderBottom:"1px solid #1e293b", paddingBottom:4 }}>{d.fullName} ({d.name})</div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ color:"#94a3b8" }}>Aprovado:</span>
        <span style={{ fontWeight:700 }}>{fmt(d.aprovado)}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ color:"#94a3b8" }}>Executado:</span>
        <span style={{ fontWeight:700, color:"#10b981" }}>{fmt(d.executado)}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ color:"#94a3b8" }}>Disponível:</span>
        <span style={{ fontWeight:700, color:"#f59e0b" }}>{fmt(d.disponivel)}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ color:"#94a3b8" }}>Taxa de Execução:</span>
        <span style={{ fontWeight:700, color:"#8b5cf6" }}>{(d.originalY !== undefined ? d.originalY : d.y).toFixed(1)}%</span>
      </div>
    </div>
  );
};

/* ── aggregation ── */
function buildData(records: any[], labelMatriz: string = "Matriz Total") {
  // Códigos de Custos Indiretos — excluídos do Debitado e Executado
  const CI_CODES = new Set(PI_GROUPS["Custos Indiretos"] || []);

  const byCC: Record<string,any> = {};
  records.forEach(d => {
    const cc = (d.unidade||"Outras Unidades").trim();
    if (!byCC[cc]) byCC[cc] = { cc, valor_aprovado:0, emp_tg:0, disp_tg:0, n:0 };

    const pi = (d.plano_interno || "").trim();
    byCC[cc].valor_aprovado += Number(d.valor_aprovado)||0;
    byCC[cc].n++;

    // Emp e Disp TG apenas para Matriz (exclui CI)
    if (!CI_CODES.has(pi)) {
      byCC[cc].emp_tg  += Number(d.despesas_empenhadas_tg)||0;
      byCC[cc].disp_tg += Number(d.credito_disponivel_tg)||0;
    }
  });

  // Derive deb and exec from TG formula (CI já excluído)
  Object.values(byCC).forEach((r: any) => {
    r.deb_tg  = r.valor_aprovado - r.disp_tg - r.emp_tg;
    r.exec_tg = r.valor_aprovado - r.disp_tg;
  });

  const ccArr = Object.values(byCC).sort((a:any,b:any)=>b.valor_aprovado-a.valor_aprovado);

  const totAprovado  = ccArr.reduce((s:number,r:any)=>s+r.valor_aprovado,0);
  const totEmpMatriz = ccArr.reduce((s:number,r:any)=>s+r.emp_tg,0);
  const totDebMatriz = ccArr.reduce((s:number,r:any)=>s+r.deb_tg,0);
  const totDispMatriz= ccArr.reduce((s:number,r:any)=>s+r.disp_tg,0);
  const totExecMatriz= ccArr.reduce((s:number,r:any)=>s+r.exec_tg,0);

  // Top 15 para gráficos e tabelas com siglas
  const top15 = ccArr.slice(0,15).map((r:any)=>({
    name: getUnitAbbreviation(r.cc),
    fullName: r.cc,
    [`Aprovado (${labelMatriz})`]: r.valor_aprovado,
    [`Executado (${labelMatriz})`]: r.exec_tg,
    [`Empenhado (${labelMatriz})`]: r.emp_tg,
    [`Debitado (${labelMatriz})`]: r.deb_tg,
    [`Disponível (${labelMatriz})`]: r.disp_tg,
    registros: r.n,
  }));

  // Scatter/Bubble Data
  const scatterData = ccArr.map((r:any)=>({
    x: r.valor_aprovado,
    y: r.valor_aprovado > 0 ? (r.exec_tg / r.valor_aprovado) * 100 : 0,
    z: r.disp_tg,
    name: getUnitAbbreviation(r.cc),
    fullName: r.cc,
    aprovado: r.valor_aprovado,
    executado: r.exec_tg,
    disponivel: r.disp_tg,
  }));

  // Insights
  const ccExec = [...ccArr].sort((a:any, b:any) => b.exec_tg - a.exec_tg);
  const liderExec = ccExec[0];

  const ccDisp = [...ccArr].sort((a:any, b:any) => b.disp_tg - a.disp_tg);
  const maiorSaldoLivre = ccDisp[0];

  return {
    top15,
    scatterData,
    totAprovado,
    totEmpMatriz,
    totDebMatriz,
    totDispMatriz,
    totExecMatriz,
    liderExec,
    maiorSaldoLivre,
    nCC: ccArr.length
  };
}



export default function ComparativosPage() {
  const { records, loading } = useData();
  const [activeTab, setActiveTab] = useState<"ranking" | "eficiencia">("ranking");
  const [barView, setBarView] = useState<"execucao" | "desmembramento">("execucao");
  
  // Estado de Filtro de Unidade e PI
  const [selUnidade, setSelUnidade] = useState<string[]>([]);
  const [selPI, setSelPI] = useState<string[]>([]);
  const [animationTick, setAnimationTick] = useState(0);

  useEffect(() => {
    if (activeTab !== "eficiencia") return;
    let active = true;
    const tick = () => {
      if (!active) return;
      setAnimationTick(t => t + 0.045); // Gentle slow floating
      requestAnimationFrame(tick);
    };
    const frameId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [activeTab]);

  // Filtro cascata: PIs permitidos presentes na Matriz
  const baseMatrixRecords = useMemo(() => {
    return records.filter((d: any) => d.in_matrix && PI_ALLOWED.includes((d.plano_interno || "").trim()));
  }, [records]);

  const unidades = useMemo(() => {
    const codesFromNames = selPI.length > 0
      ? selPI.flatMap(name => PI_GROUPS[name] ?? [])
      : [];
    const filteredForUnidades = codesFromNames.length > 0
      ? baseMatrixRecords.filter((d: any) => codesFromNames.includes((d.plano_interno || "").trim()))
      : baseMatrixRecords;
    const raw = Array.from(new Set(filteredForUnidades.map((d: any) => (d.unidade || "").trim()).filter(Boolean))) as string[];
    return raw.sort((a, b) => getUnitAbbreviation(a).localeCompare(getUnitAbbreviation(b)));
  }, [baseMatrixRecords, selPI]);

  const planosInternos = useMemo(() => {
    const filteredForPIs = selUnidade.length > 0
      ? baseMatrixRecords.filter((d: any) => selUnidade.includes((d.unidade || "").trim()))
      : baseMatrixRecords;
    const codesPresent = new Set(filteredForPIs.map((d: any) => (d.plano_interno || "").trim()));
    return PI_GROUP_NAMES.filter(name =>
      (PI_GROUPS[name] ?? []).some(code => codesPresent.has(code))
    );
  }, [baseMatrixRecords, selUnidade]);

  // Limpa seleções inválidas quando as opções do filtro cascata mudam
  useEffect(() => {
    if (selUnidade.length > 0) {
      const valid = selUnidade.filter(u => unidades.includes(u));
      if (valid.length !== selUnidade.length) setSelUnidade(valid);
    }
  }, [unidades, selUnidade]);

  useEffect(() => {
    if (selPI.length > 0) {
      const valid = selPI.filter(pi => planosInternos.includes(pi));
      if (valid.length !== selPI.length) setSelPI(valid);
    }
  }, [planosInternos, selPI]);

  const filteredRecords = useMemo(() => {
    return baseMatrixRecords.filter((d: any) => {
      const u = (d.unidade || "").trim();
      const pi = (d.plano_interno || "").trim();
      if (selUnidade.length > 0 && !selUnidade.includes(u)) return false;
      
      if (selPI.length > 0) {
        const codesFromNames = selPI.flatMap(name => PI_GROUPS[name] ?? []);
        if (!codesFromNames.includes(pi)) return false;
      }
      return true;
    });
  }, [baseMatrixRecords, selUnidade, selPI]);

  const labelMatriz = selPI.length > 0 ? selPI.join(" + ") : "Matriz Total";
  const D = useMemo(() => buildData(filteredRecords, labelMatriz), [filteredRecords, labelMatriz]);

  // Análise conceitual gerada dinamicamente baseada nos filtros
  const dynamicAnalysis = useMemo(() => {
    if (selUnidade.length === 0) {
      return {
        title: "Análise Consolidada da Matriz",
        text: `Atualmente, o painel exibe a visão global com todas as ${D.nCC} unidades organizacionais da Matriz. O orçamento total aprovado totaliza ${fmt(D.totAprovado)}, com uma execução acumulada de ${fmt(D.totExecMatriz)} (${pct(D.totExecMatriz, D.totAprovado)}). A unidade ${D.liderExec ? getUnitAbbreviation(D.liderExec.cc) : "N/A"} apresenta o maior volume de execução real (${fmt(D.liderExec?.exec_matriz)}), enquanto a unidade ${D.maiorSaldoLivre ? getUnitAbbreviation(D.maiorSaldoLivre.cc) : "N/A"} retém o maior saldo livre restante (${fmt(D.maiorSaldoLivre?.disp_matriz)}). O saldo livre total disponível em toda a Matriz é de ${fmt(D.totDispMatriz)}.`
      };
    } else if (selUnidade.length === 1) {
      const uName = selUnidade[0];
      const abbrev = getUnitAbbreviation(uName);
      const uData = D.top15[0] || { "Aprovado (Matriz)": 0, "Executado (Matriz)": 0, "Disponível (Matriz)": 0, "Empenhado (Matriz)": 0, "Debitado (Matriz)": 0 };
      const aprovado = Number(uData["Aprovado (Matriz)"]) || 0;
      const executado = Number(uData["Executado (Matriz)"]) || 0;
      const eRate = aprovado > 0 ? (executado / aprovado) * 100 : 0;
      
      let performanceSub = "";
      if (aprovado > 500000 && eRate < 35) {
        performanceSub = "A unidade possui um volume expressivo de orçamento aprovado, mas apresenta uma taxa de execução crítica (abaixo de 35%). Isso sinaliza um potencial represamento de recursos que poderiam ser remanejados ou otimizados para outros setores.";
      } else if (eRate < 35) {
        performanceSub = "A taxa de execução atual é considerada baixa (abaixo de 35%). Indica que as atividades planejadas estão em ritmo lento ou aguardando liberação de processos administrativos.";
      } else if (eRate >= 35 && eRate <= 75) {
        performanceSub = "A unidade apresenta um ritmo de execução moderado e equilibrado em relação ao orçamento alocado, compatível com o cronograma regular do período.";
      } else {
        performanceSub = "A unidade demonstra excelente desempenho de execução, utilizando a maior parte do seu orçamento aprovado. Demonstra alta capacidade de entrega e maturidade no planejamento físico-financeiro.";
      }

      return {
        title: `Análise Individual — ${abbrev}`,
        text: `A unidade ${uName} (${abbrev}) possui um orçamento aprovado de ${fmt(aprovado)} na Matriz. Desse montante, executou ${fmt(executado)}, atingindo uma taxa de execução de ${eRate.toFixed(1)}%. Resta um saldo livre de ${fmt(uData["Disponível (Matriz)"])} disponível para novas programações. ${performanceSub}`
      };
    } else {
      const globalData = buildData(records.filter((d: any) => d.in_matrix));
      const groupShare = pct(D.totAprovado, globalData.totAprovado);
      const avgRate = D.totAprovado > 0 ? (D.totExecMatriz / D.totAprovado) * 100 : 0;
      
      let performanceSub = "";
      if (avgRate < 35) {
        performanceSub = "O grupo selecionado apresenta uma média de execução consolidada baixa (abaixo de 35%). Recomenda-se revisar os cronogramas de compras ou liberar saldos para outras áreas da Matriz.";
      } else if (avgRate >= 35 && avgRate <= 75) {
        performanceSub = "O grupo apresenta desempenho de execução intermediário e estável, alinhado às médias gerais da Matriz.";
      } else {
        performanceSub = "O grupo se destaca por uma taxa de execução consolidada alta, evidenciando ótima eficiência operacional nas unidades selecionadas.";
      }

      return {
        title: `Análise Comparativa do Grupo (${selUnidade.length} Unidades)`,
        text: `As ${selUnidade.length} unidades selecionadas representam ${groupShare} do orçamento total aprovado da Matriz. Juntas, somam ${fmt(D.totAprovado)} em recursos aprovados e registram uma execução conjunta de ${fmt(D.totExecMatriz)} (${pct(D.totExecMatriz, D.totAprovado)}). Dentre as selecionadas, ${D.liderExec ? getUnitAbbreviation(D.liderExec.cc) : "N/A"} lidera a execução com ${fmt(D.liderExec?.exec_matriz)} executados, e ${D.maiorSaldoLivre ? getUnitAbbreviation(D.maiorSaldoLivre.cc) : "N/A"} possui o maior saldo disponível individual (${fmt(D.maiorSaldoLivre?.disp_matriz)}). O saldo acumulado disponível para o grupo é de ${fmt(D.totDispMatriz)}. ${performanceSub}`
      };
    }
  }, [selUnidade, D, records]);

  // Filtro de matriz para análise de eficiência
  const matrixFilteredRecords = useMemo(() => {
    return baseMatrixRecords.filter((d: any) => {
      const pi = (d.plano_interno || "").trim();
      if (selPI.length > 0) {
        const codesFromNames = selPI.flatMap(name => PI_GROUPS[name] ?? []);
        if (!codesFromNames.includes(pi)) return false;
      }
      return true;
    });
  }, [baseMatrixRecords, selPI]);

  // Análise específica de eficiência para a segunda aba
  const efficiencyAnalysis = useMemo(() => {
    const ccData = buildData(matrixFilteredRecords, labelMatriz);
    const totalUnits = ccData.scatterData.length;
    
    // Concentração do Orçamento (Pareto)
    const sortedByBudget = [...ccData.scatterData].sort((a, b) => b.aprovado - a.aprovado);
    const top3BudgetSum = sortedByBudget.slice(0, 3).reduce((sum, item) => sum + item.aprovado, 0);
    const paretoPct = ccData.totAprovado > 0 ? (top3BudgetSum / ccData.totAprovado) * 100 : 0;

    // Distribuição de eficiência
    const lowExec = ccData.scatterData.filter(d => d.y < 35).length;
    const midExec = ccData.scatterData.filter(d => d.y >= 35 && d.y <= 75).length;
    const highExec = ccData.scatterData.filter(d => d.y > 75).length;
    
    const pctLow = totalUnits > 0 ? (lowExec / totalUnits) * 100 : 0;
    const pctHigh = totalUnits > 0 ? (highExec / totalUnits) * 100 : 0;

    let dispersionDesc = "";
    if (pctLow > 45) {
      dispersionDesc = "Assimetria Elevada (Baixo Desempenho Generalizado): Quase metade ou mais das unidades apresenta taxa de execução crítica (< 35%), sinalizando que a maioria das unidades aloca recursos mas tem dificuldade para empenhar.";
    } else if (pctHigh > 45) {
      dispersionDesc = "Alta Eficiência Geral: A maior parte das unidades executa acima de 75%, mostrando excelente fluxo de utilização dos recursos alocados.";
    } else {
      dispersionDesc = "Distribuição Equilibrada: As unidades estão dispersas de forma equilibrada, com a maior parte apresentando execução intermediária.";
    }

    if (selUnidade.length === 0) {
      return {
        title: `Diagnóstico de Eficiência — ${labelMatriz} (Geral)`,
        text: `O gráfico de dispersão exibe a eficiência de alocação das ${totalUnits} unidades. Observa-se que as 3 maiores unidades concentram ${paretoPct.toFixed(1)}% de todo o orçamento aprovado da ${labelMatriz}, indicando alta concentração orçamentária. Com relação ao aproveitamento: ${lowExec} unidades (${pctLow.toFixed(1)}%) estão com desempenho baixo (vermelho), ${midExec} intermediário (amarelo) e ${highExec} (${pctHigh.toFixed(1)}%) alto (verde). Este cenário indica uma ${dispersionDesc}`,
        recommendations: [
          `Promover remanejamentos preventivos de saldos ociosos (unidades com baixa taxa) para aquelas com alta taxa de execução dentro da ${labelMatriz}.`,
          "Padronizar os fluxos de contratação e capacitar gestores das unidades com execução crítica.",
          "Realizar monitoramento quinzenal com as 3 maiores unidades detentoras de recursos para garantir a execução das grandes metas."
        ]
      };
    } else if (selUnidade.length === 1) {
      const uName = selUnidade[0];
      const abbrev = getUnitAbbreviation(uName);
      const uData = D.scatterData[0] || { aprovado: 0, executado: 0, disponivel: 0, y: 0 };
      const budgetShare = ccData.totAprovado > 0 ? (uData.aprovado / ccData.totAprovado) * 100 : 0;
      const rate = uData.y;

      let diagText = "";
      let recs: string[] = [];

      if (rate < 35) {
        diagText = `A unidade ${abbrev} apresenta eficiência crítica com apenas ${rate.toFixed(1)}% de execução do seu orçamento de ${fmt(uData.aprovado)} (que representa ${budgetShare.toFixed(1)}% de toda a ${labelMatriz}). O saldo disponível restante é significativo (${fmt(uData.disponivel)}), indicando recursos parados.`;
        recs = [
          "Identificar imediatamente gargalos licitatórios ou contratuais específicos desta unidade.",
          "Verificar a viabilidade de liberação de saldos não utilizados para remanejamento antes do fechamento das janelas orçamentárias.",
          "Estabelecer um cronograma emergencial de empenho."
        ];
      } else if (rate >= 35 && rate <= 75) {
        diagText = `A unidade ${abbrev} apresenta eficiência moderada de ${rate.toFixed(1)}% na execução de seu orçamento de ${fmt(uData.aprovado)}. Seu saldo disponível de ${fmt(uData.disponivel)} indica que o cronograma está em andamento normal, mas há espaço para otimização.`;
        recs = [
          "Acelerar a liquidação de serviços atestados para liberar espaço financeiro.",
          "Revisar processos pendentes na UGR correspondente para evitar acúmulos no final do exercício."
        ];
      } else {
        diagText = `A unidade ${abbrev} apresenta excelente eficiência com ${rate.toFixed(1)}% de execução do seu orçamento de ${fmt(uData.aprovado)}. O saldo livre restante é de apenas ${fmt(uData.disponivel)}, demonstrando excelente aproveitamento.`;
        recs = [
          `Utilizar os processos de gestão desta unidade como referência (benchmark) para as demais da ${labelMatriz}.`,
          "Priorizar esta unidade para novos aportes financeiros se houver recursos remanescentes de outras áreas."
        ];
      }

      return {
        title: `Diagnóstico de Eficiência — ${abbrev}`,
        text: diagText,
        recommendations: recs
      };
    } else {
      const avgRate = D.totAprovado > 0 ? (D.totExecMatriz / D.totAprovado) * 100 : 0;
      const budgetShare = ccData.totAprovado > 0 ? (D.totAprovado / ccData.totAprovado) * 100 : 0;

      let diagText = `O grupo selecionado (${selUnidade.length} unidades) responde por ${budgetShare.toFixed(1)}% do orçamento total da ${labelMatriz}. A taxa de execução média consolidada do grupo é de ${avgRate.toFixed(1)}%, com saldo livre acumulado de ${fmt(D.totDispMatriz)}.`;
      let recs: string[] = [];

      if (avgRate < 35) {
        diagText += " O grupo encontra-se em zona de execução lenta com recursos subutilizados.";
        recs = [
          "Criar uma força-tarefa integrada entre os gestores das unidades selecionadas para destravar processos comuns.",
          "Remanejar saldos internos para as unidades do grupo que demonstrarem maior agilidade administrativa."
        ];
      } else if (avgRate >= 35 && avgRate <= 75) {
        diagText += " O desempenho do grupo é regular e atende aos parâmetros médios esperados.";
        recs = [
          "Monitorar individualmente as unidades do grupo que estão abaixo de 35% de execução.",
          "Manter a regularidade dos empenhos programados."
        ];
      } else {
        diagText += " O grupo demonstra alto nível de maturidade e eficiência na execução dos recursos alocados.";
        recs = [
          "Utilizar este grupo como modelo interno de boa gestão de suprimentos e planejamento.",
          "Favorecer o grupo em futures distribuições orçamentárias devido à alta velocidade de resposta."
        ];
      }

      return {
        title: `Diagnóstico do Grupo Selecionado (${selUnidade.length} Unidades)`,
        text: diagText,
        recommendations: recs
      };
    }
  }, [selUnidade, D, matrixFilteredRecords, labelMatriz]);

  const animatedScatterData = useMemo(() => {
    return D.scatterData.map((d: any, idx: number) => {
      // Gentle floating:
      // We vary x by up to 1.2% of its value (or a small fixed fraction)
      // We vary y by up to 1.2 percentage points
      const offsetFactorX = Math.sin(animationTick + idx * 1.7) * 0.012;
      const offsetFactorY = Math.cos(animationTick + idx * 2.3) * 1.2;
      return {
        ...d,
        x: d.x * (1 + offsetFactorX),
        y: Math.max(0, Math.min(100, d.y + offsetFactorY)),
        originalY: d.y
      };
    });
  }, [D.scatterData, animationTick]);

  const s = {
    card: { background:"white", borderRadius:12, border:"1px solid #e2e8f0", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" } as React.CSSProperties,
    section: { fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:4 } as React.CSSProperties,
    tabBtn: (active: boolean) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "6px 14px",
      fontSize: 11.5,
      fontWeight: 800,
      border: active ? "1px solid transparent" : "1px solid #cbd5e1",
      cursor: "pointer",
      borderRadius: 8,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: active ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" : "white",
      color: active ? "white" : "#475569",
      boxShadow: active ? "0 6px 16px -4px rgba(15,23,42,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }) as React.CSSProperties
  };

  return (
    <DashboardLayout>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Carregando dados comparativos...</div>
      ) : (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Cabeçalho */}
        <div style={{ borderBottom:"1px solid #e2e8f0", paddingBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0, letterSpacing:"-0.5px" }}>
              Painel de Comparativos — Gestão: {labelMatriz}
            </h1>
            <p style={{ fontSize:11.5, color:"#64748b", marginTop:3 }}>
              Análise comparativa de alocação, despesas provisionadas, saldo disponível e taxas de execução entre as unidades.
            </p>
          </div>

          {/* Abas Principais (Navegação Dinâmica) */}
          <div style={{ display:"flex", background:"#f8fafc", padding:4, borderRadius:10, gap:6, border: "1px solid #e2e8f0", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
            <button 
              onClick={() => setActiveTab("ranking")} 
              style={{ ...s.tabBtn(activeTab === "ranking"), minWidth: 190 }}
              onMouseEnter={(e) => { if (activeTab !== "ranking") e.currentTarget.style.background = "#f1f5f9" }}
              onMouseLeave={(e) => { if (activeTab !== "ranking") e.currentTarget.style.background = "white" }}
            >
              <BarChart3 size={14}/> Desempenho & Participação
            </button>
            <button 
              onClick={() => setActiveTab("eficiencia")} 
              style={{ ...s.tabBtn(activeTab === "eficiencia"), minWidth: 190 }}
              onMouseEnter={(e) => { if (activeTab !== "eficiencia") e.currentTarget.style.background = "#f1f5f9" }}
              onMouseLeave={(e) => { if (activeTab !== "eficiencia") e.currentTarget.style.background = "white" }}
            >
              <LineChart size={14}/> Matriz de Eficiência
            </button>
          </div>
        </div>

        {/* Painel de Filtros */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <MultiSel label="Plano Interno" opts={planosInternos} sel={selPI} set={setSelPI} />
          <MultiSel label="Unidade Organizacional" opts={unidades} sel={selUnidade} set={setSelUnidade} formatVal={getUnitAbbreviation} />

          {(selUnidade.length > 0 || selPI.length > 0) && (
            <button onClick={() => { setSelUnidade([]); setSelPI([]); }}
              style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", border: "1px solid #cbd5e1", borderRadius: 5, background: "white", fontSize: 9.5, cursor: "pointer", alignSelf: "center", fontWeight: 600, color: "#ef4444", marginTop: 11 }}>
              <X size={10} /> Limpar
            </button>
          )}
        </div>

        {/* KPIs de Cruzamento na mesma sequência do gráfico */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
          {[
            { label:"Dotação", value:fmt(D.totAprovado), color:C.blue, icon:<DollarSign size={14}/>, sub:"Total aprovado" },
            { label:"Empenhado", value:fmt(D.totEmpMatriz), color:C.amber, icon:<TrendingUp size={14}/>, sub:"Provisionado em sistema" },
            { label:"Debitado", value:fmt(D.totDebMatriz), color:C.teal, icon:<Target size={14}/>, sub:"Provisionado em planilha" },
            { label:"Disponível", value:fmt(D.totDispMatriz), color:C.slate, icon:<Wallet size={14}/>, sub:"Saldo livre restante" },
            { label:"Execução Média", value:pct(D.totExecMatriz, D.totAprovado), color:C.purple, icon:<Percent size={14}/>, sub:"Aproveitamento total" },
            { label:"Unidades Mapeadas", value:`${D.nCC} unidades`, color:C.slate, icon:<ArrowUpRight size={14}/>, sub:"Mapeadas na planilha" },
          ].map(k=>(
            <div key={k.label} style={{ ...s.card, borderLeft:`3px solid ${k.color}`, padding:"8px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, gap: 4 }}>
                <div style={{ fontSize:8.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em", flex:1, overflow:"hidden" }} title={k.label}>{k.label}</div>
                <span style={{ color:k.color, opacity:0.7, flexShrink:0 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize:13.5, fontWeight:800, color:"#0f172a", lineHeight:1.1, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={k.value}>{k.value}</div>
              <div style={{ fontSize:8.5, color:"#94a3b8", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={k.sub}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Renderização condicional de abas com animação fluida */}
        {activeTab === "ranking" ? (
          <div style={{ width: "100%" }}>
            
            {/* Gráfico de Barras Principal */}
            <div style={{ ...s.card, padding:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #e2e8f0" }}>
                <div style={s.section}>Top 15 Unidades — Cenário Comparativo ({labelMatriz})</div>
                <div style={{ fontSize:11, color:"#64748b" }}>Ordenado por volume total aprovado · Exibido por Sigla de Unidade</div>
              </div>
              
              <div style={{ padding:"18px 20px 10px", flex:1 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={D.top15} layout="vertical" margin={{ left:5, right:20, top:0, bottom:0 }} barCategoryGap={6} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={v=>fmtK(v)} tick={{ fontSize:10, fill:"#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={60} tick={{ fontSize:10, fill:"#374151", fontWeight:800 }} tickLine={false} axisLine={false} interval={0} />
                    <Tooltip content={<DarkTooltip/>} cursor={{ fill:"#f8fafc" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize:11, paddingTop:10 }} />
                    <Bar dataKey={`Aprovado (${labelMatriz})`} fill={C.blue} radius={[0,4,4,0]} barSize={11} isAnimationActive={true} animationDuration={800} />
                    <Bar dataKey={`Executado (${labelMatriz})`} fill={C.green} radius={[0,4,4,0]} barSize={11} isAnimationActive={true} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bloco de Análise Dinâmica para Desempenho */}
            <div style={{ ...s.card, padding: "16px 18px", background: "#f8fafc", borderLeft: "4px solid #3b82f6", marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Target size={14} style={{ color: "#3b82f6" }} /> {dynamicAnalysis.title}
              </div>
              <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, margin: 0 }}>
                {dynamicAnalysis.text}
              </p>
            </div>

          </div>
        ) : (
          /* Aba Eficiência - Scatter/Bubble Chart */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #e2e8f0" }}>
                <div style={s.section}>Matriz de Eficiência Orçamentária ({labelMatriz})</div>
                <div style={{ fontSize:11, color:"#64748b" }}>
                  Relação entre <strong>Orçamento Aprovado (X)</strong> e <strong>Taxa de Execução (Y)</strong> · O tamanho da bola representa o <strong>Saldo Disponível</strong>
                </div>
              </div>
              <div style={{ padding:"24px 20px 10px" }}>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top:20, right:30, bottom:20, left:20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Aprovado" tickFormatter={v=>fmtK(v)} tick={{ fontSize:10 }} tickLine={false} axisLine={false}>
                      <label value="Orçamento Aprovado" offset={-10} position="insideBottom" style={{ fontSize:10, fill:"#94a3b8", fontWeight:700 }} />
                    </XAxis>
                    <YAxis type="number" dataKey="y" name="Taxa de Execução" tickFormatter={v=>`${v}%`} tick={{ fontSize:10 }} domain={[0, 105]} tickLine={false} axisLine={false}>
                      <label value="Taxa de Execução" angle={-90} position="insideLeft" style={{ fontSize:10, fill:"#94a3b8", fontWeight:700 }} />
                    </YAxis>
                    <ZAxis type="number" dataKey="z" range={[60, 1000]} name="Saldo Disponível" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
                    <Scatter name="Unidades" data={animatedScatterData} fill="#8b5cf6" isAnimationActive={false}>
                      {animatedScatterData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bloco de Análise Dinâmica para Eficiência */}
            <div style={{ ...s.card, padding: "16px 18px", background: "#f8fafc", borderLeft: "4px solid #8b5cf6" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={14} style={{ color: "#8b5cf6" }} /> {efficiencyAnalysis.title}
              </div>
              <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, margin: 0 }}>
                {efficiencyAnalysis.text}
              </p>
            </div>
          </div>
        )}



      </div>
      )}
    </DashboardLayout>
  );
}
