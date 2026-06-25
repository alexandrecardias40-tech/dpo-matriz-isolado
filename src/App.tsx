import { useState, useMemo } from "react";
import { useData } from "./DataProvider";
import DashboardLayout from "./components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { Checkbox } from "./components/ui/checkbox";
import { X, ChevronDown, Calendar, FileText, User, HelpCircle, ArrowRightLeft, Percent, Layers, ShieldCheck, HelpCircle as HelpIcon, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { FonteBadge } from "./components/ui/FonteBadge";

const fmt = (v: number) => isNaN(v) ? "R$ 0" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtK = (v: number) => !v || isNaN(v) ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v);
const pct = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) + "%" : "0%";

const STATUS_MAP: Record<string, { bg: string; border: string; color: string; label: string; icon: string }> = {
  verde: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46", label: "Empenhos Batem", icon: "●" },
  amarelo: { bg: "#fffbeb", border: "#fde68a", color: "#92400e", label: "Empenhos Divergem", icon: "▲" },
  vermelho: { bg: "#fef2f2", border: "#fecaca", color: "#991b1b", label: "Diferença Alta", icon: "■" },
  matriz_only: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af", label: "Apenas Matriz", icon: "○" },
  tg_only: { bg: "#faf5ff", border: "#e9d5ff", color: "#6b21a8", label: "Apenas Tesouro", icon: "✧" },
};

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

function MultiSel({ label, opts, sel, set, formatVal }: { label: string; opts: string[]; sel: string[]; set: (v: string[]) => void; formatVal?: (v: string) => string }) {
  const renderLabel = (val: string) => formatVal ? formatVal(val) : val;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", fontSize: 11, cursor: "pointer", width: 170, gap: 6, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {sel.length > 0 ? sel.map(renderLabel).join(", ") : "Todos"}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
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

function TaxaExecFilter({ sel, set }: { sel: string[]; set: (v: string[]) => void }) {
  const options = [
    { value: "baixo", label: "Baixo", color: "#ef4444" },
    { value: "medio", label: "Média", color: "#eab308" },
    { value: "alto", label: "Alta", color: "#22c55e" }
  ];

  const renderLabel = (val: string) => {
    const found = options.find(o => o.value === val);
    return found ? found.label : val;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Taxa de Execução</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", fontSize: 11, cursor: "pointer", width: 170, gap: 6, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {sel.length > 0 ? sel.map(renderLabel).join(", ") : "Todos"}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 180, padding: 0 }}>
          <Command>
            <CommandList>
              <CommandGroup>
                {options.map(o => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={() => set(sel.includes(o.value) ? sel.filter(x => x !== o.value) : [...sel, o.value])}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 12px" }}
                  >
                    <Checkbox checked={sel.includes(o.value)} style={{ pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: o.color }} />
                      <span style={{ fontWeight: 600, color: "#334155" }}>{o.label}</span>
                    </div>
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

function KpiCard({ title, value, sub, color, icon, tooltip }: { title: React.ReactNode; value: string; sub?: string; color: string; icon: string; tooltip?: string }) {
  return (
    <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", borderLeft: `4px solid ${color}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", padding: "8px 12px", position: "relative" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase" }} title={tooltip}>
        <span style={{ fontSize: 13 }}>{icon}</span> {title}
        {tooltip && <HelpIcon size={11} style={{ color: "#94a3b8", cursor: "help", marginLeft: "auto" }} />}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4, lineHeight: 1.1, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const { records, adiantamentos, loading } = useData();

  // Estados dos filtros
  const [selUnidade, setSelUnidade] = useState<string[]>([]);
  const [selPI, setSelPI] = useState<string[]>([]);
  const [selOrigem, setSelOrigem] = useState<string>("all");
  const [selTaxaExec, setSelTaxaExec] = useState<string[]>([]);
  const selStatus = "all";

  // Estado do registro selecionado para o modal de naturezas
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Massa de dados única para os filtros (Filtros Cascata / Dependentes)
  const unidades = useMemo(() => {
    const filteredForUnidades = selPI.length > 0
      ? records.filter((d: any) => selPI.includes((d.plano_interno || "").trim()))
      : records;
    const raw = Array.from(new Set(filteredForUnidades.map((d: any) => (d.unidade || "").trim()).filter(Boolean))) as string[];
    return raw.sort((a, b) => getUnitAbbreviation(a).localeCompare(getUnitAbbreviation(b)));
  }, [records, selPI]);

  const planosInternos = useMemo(() => {
    const filteredForPIs = selUnidade.length > 0
      ? records.filter((d: any) => selUnidade.includes((d.unidade || "").trim()))
      : records;
    return Array.from(new Set(filteredForPIs.map((d: any) => (d.plano_interno || "").trim()).filter(Boolean))).sort() as string[];
  }, [records, selUnidade]);

  // Filtros aplicados sobre a tabela principal
  const filteredRecords = useMemo(() => {
    return records.filter((d: any) => {
      const u = (d.unidade || "").trim();
      const pi = (d.plano_interno || "").trim();
      
      if (selUnidade.length > 0 && !selUnidade.includes(u)) return false;
      if (selPI.length > 0 && !selPI.includes(pi)) return false;
      
      // Filtro de origem
      if (selOrigem === "matriz" && !d.in_matrix) return false;
      if (selOrigem === "tg" && d.in_matrix) return false;

      // Filtro de status
      if (selStatus !== "all" && d.semaforo !== selStatus) return false;

      // Filtro de taxa de execução
      if (selTaxaExec.length > 0) {
        if (!d.in_matrix) return false;
        const aprovado = Number(d.valor_aprovado) || 0;
        const executado = Number(d.total_executado_matriz) || 0;
        const taxa = aprovado > 0 ? (executado / aprovado) * 100 : 0;
        
        let cat = "baixo";
        if (taxa >= 35 && taxa <= 75) cat = "medio";
        else if (taxa > 75) cat = "alto";
        
        if (!selTaxaExec.includes(cat)) return false;
      }

      return true;
    });
  }, [records, selUnidade, selPI, selOrigem, selStatus, selTaxaExec]);

  // Filtros aplicados sobre a tabela de adiantamentos
  const filteredAdiantamentos = useMemo(() => {
    return adiantamentos.filter((d: any) => {
      const u = (d.unidade || "").trim();
      if (selUnidade.length > 0) {
        // Verifica se a sigla da unidade de adiantamento está contida no nome completo selecionado
        const matchesAny = selUnidade.some(su => su.toUpperCase().includes(u.toUpperCase()) || u.toUpperCase().includes(su.toUpperCase()));
        if (!matchesAny) return false;
      }
      return true;
    });
  }, [adiantamentos, selUnidade]);

  // Totais agregados dos registros filtrados (Matriz x Tesouro)
  const T = useMemo(() => {
    let valor_aprovado = 0;
    let despesas_empenhadas_matriz = 0;
    let credito_disponivel_matriz = 0;
    let despesas_debitadas_matriz = 0;
    let total_executado_matriz = 0;

    let credito_disponivel_tg = 0;
    let despesas_empenhadas_tg = 0;
    let despesas_empenhadas_a_liquidar_tg = 0;
    let despesas_liquidadas_tg = 0;
    let total_tg = 0;

    let count_ambos = 0;
    let count_matriz = 0;
    let count_tg = 0;

    filteredRecords.forEach((d: any) => {
      valor_aprovado += Number(d.valor_aprovado) || 0;
      despesas_empenhadas_matriz += Number(d.despesas_empenhadas_matriz) || 0;
      credito_disponivel_matriz += Number(d.credito_disponivel_matriz) || 0;
      despesas_debitadas_matriz += Number(d.despesas_debitadas_matriz) || 0;
      total_executado_matriz += Number(d.total_executado_matriz) || 0;

      credito_disponivel_tg += Number(d.credito_disponivel_tg) || 0;
      despesas_empenhadas_tg += Number(d.despesas_empenhadas_tg) || 0;
      despesas_empenhadas_a_liquidar_tg += Number(d.despesas_empenhadas_a_liquidar_tg) || 0;
      despesas_liquidadas_tg += Number(d.despesas_liquidadas_tg) || 0;
      total_tg += Number(d.total_tg) || 0;

      if (d.in_matrix && d.in_tg) count_ambos++;
      else if (d.in_matrix) count_matriz++;
      else if (d.in_tg) count_tg++;
    });

    const pct_exec = valor_aprovado > 0 ? (total_executado_matriz / valor_aprovado) * 100 : 0;

    return {
      valor_aprovado, despesas_empenhadas_matriz, credito_disponivel_matriz, despesas_debitadas_matriz, total_executado_matriz, pct_exec,
      credito_disponivel_tg, despesas_empenhadas_tg, despesas_empenhadas_a_liquidar_tg, despesas_liquidadas_tg, total_tg,
      count_ambos, count_matriz, count_tg, total_count: filteredRecords.length
    };
  }, [filteredRecords]);

  // Totais de Adiantamentos
  const TAdiantamentos = useMemo(() => {
    const total_valor = filteredAdiantamentos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    return {
      total_valor,
      count: filteredAdiantamentos.length
    };
  }, [filteredAdiantamentos]);

  // Análise diagnóstica e estatística dinâmica da unidade para a Matriz
  const unitMatrixDiagnostic = useMemo(() => {
    if (loading || !records || records.length === 0 || selUnidade.length === 0) return null;

    // Filtra todos os registros da base que pertencem à matriz
    const allMatrixRecords = records.filter((r: any) => r.in_matrix);
    
    // Totais globais da Matriz para servir de referência comparativa
    let globalApproved = 0;
    let globalExecuted = 0;
    allMatrixRecords.forEach((r: any) => {
      globalApproved += Number(r.valor_aprovado) || 0;
      globalExecuted += Number(r.total_executado_matriz) || 0;
    });
    const globalRate = globalApproved > 0 ? (globalExecuted / globalApproved) * 100 : 0;

    // Filtra os registros da unidade que estão na matriz
    const selectedUnitRecords = allMatrixRecords.filter((r: any) => {
      const u = (r.unidade || "").trim();
      return selUnidade.includes(u);
    });

    if (selectedUnitRecords.length === 0) return null;

    let approved = 0;
    let executed = 0;
    let debited = 0;
    let empenhed = 0;
    let available = 0;

    let countLow = 0;
    let countMid = 0;
    let countHigh = 0;

    // Lista de planos internos da unidade para análise aprofundada
    const piList: any[] = [];

    selectedUnitRecords.forEach((r: any) => {
      const ap = Number(r.valor_aprovado) || 0;
      const ex = Number(r.total_executado_matriz) || 0;
      const db = Number(r.despesas_debitadas_matriz) || 0;
      const em = Number(r.despesas_empenhadas_matriz) || 0;
      const av = Number(r.credito_disponivel_matriz) || 0;

      approved += ap;
      executed += ex;
      debited += db;
      empenhed += em;
      available += av;

      const rate = ap > 0 ? (ex / ap) * 100 : 0;
      if (rate < 35) countLow++;
      else if (rate <= 75) countMid++;
      else countHigh++;

      piList.push({
        code: r.plano_interno,
        name: r.plano_interno_nome || "Sem Nome",
        approved: ap,
        executed: ex,
        rate: rate,
        available: av
      });
    });

    const executionRate = approved > 0 ? (executed / approved) * 100 : 0;
    const shareOfTotalApproved = globalApproved > 0 ? (approved / globalApproved) * 100 : 0;
    const shareOfTotalExecuted = globalExecuted > 0 ? (executed / globalExecuted) * 100 : 0;

    // Ordenação dos PIs por Orçamento para identificar concentração
    const sortedByBudget = [...piList].sort((a, b) => b.approved - a.approved);
    const topBudgets = sortedByBudget.slice(0, 3);

    // Ordenação dos PIs críticos (execução < 35% e orçamento > 0)
    const criticalPIs = piList
      .filter(p => p.approved > 0 && p.rate < 35)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);

    // Comparativos em relação ao todo
    const rateDiff = executionRate - globalRate;
    const comparisonText = rateDiff >= 0
      ? `está ${rateDiff.toFixed(1)}% ACIMA da média de execução institucional (${globalRate.toFixed(1)}%)`
      : `está ${Math.abs(rateDiff).toFixed(1)}% ABAIXO da média de execução institucional (${globalRate.toFixed(1)}%)`;

    let statusLabel = "";
    let statusColor = "";
    let statusBg = "";
    let recommendations: string[] = [];

    if (executionRate < 35) {
      statusLabel = "Risco Crítico: Baixa Execução";
      statusColor = "#ef4444";
      statusBg = "#fef2f2";
      recommendations.push(
        `Acelerar imediatamente os empenhos e liquidações dos ${countLow} Planos Internos travados.`,
        `Reavaliar e remanejar o saldo livre disponível de ${fmt(available)} para evitar devolução involuntária no encerramento fiscal.`,
        "Auditar gargalos burocráticos ou licitações desertas correspondentes à unidade."
      );
    } else if (executionRate <= 75) {
      statusLabel = "Aproveitamento Regular / Estável";
      statusColor = "#f59e0b";
      statusBg = "#fffbeb";
      recommendations.push(
        `Monitorar a liquidação física e faturamento dos ${countMid} PIs em progresso regular.`,
        `Planejar a destinação dos ${fmt(available)} restantes de saldo livre para garantir o uso planejado antes do fechamento.`
      );
    } else {
      statusLabel = "Alta Performance Administrativa";
      statusColor = "#10b981";
      statusBg = "#ecfdf5";
      recommendations.push(
        `Registrar e documentar as boas práticas desta unidade, que atinge execução de excelência (${executionRate.toFixed(1)}%).`,
        "Garantir a execução integral dos saldos mínimos remanescentes."
      );
    }

    return {
      unitsText: selUnidade.map(getUnitAbbreviation).join(", "),
      approvedText: fmt(approved),
      executedText: fmt(executed),
      debitedText: fmt(debited),
      empenhedText: fmt(empenhed),
      availableText: fmt(available),
      executionRateText: executionRate.toFixed(1) + "%",
      globalRateText: globalRate.toFixed(1) + "%",
      shareApprovedText: shareOfTotalApproved.toFixed(1) + "%",
      shareExecutedText: shareOfTotalExecuted.toFixed(1) + "%",
      comparisonText,
      countLow,
      countMid,
      countHigh,
      totalPIs: piList.length,
      topBudgets,
      criticalPIs,
      statusLabel,
      statusColor,
      statusBg,
      recommendations
    };
  }, [selUnidade, records, loading]);

  const hasFilter = selUnidade.length > 0 || selPI.length > 0 || selOrigem !== "all" || selTaxaExec.length > 0;

  const cleanFilters = () => {
    setSelUnidade([]);
    setSelPI([]);
    setSelOrigem("all");
    setSelTaxaExec([]);
  };

  const s: Record<string, React.CSSProperties> = {
    panel: { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    th: { fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "10px 12px", textAlign: "center" as const, background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontWeight: 700 },
    td: { padding: "10px 12px", fontSize: 11, borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" as const, textAlign: "center" as const, color: "#334155" },
    sectionTitle: { fontWeight: 700, fontSize: 14, color: "#1e293b", padding: "14px 18px", borderBottom: "1px solid #e2e8f0" },
    tabButton: { padding: "8px 16px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", borderRadius: 6, transition: "all 0.2s" }
  };

  return (
    <DashboardLayout>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Carregando dados estruturados da Matriz...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Cabeçalho */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                Execução Financeira da Matriz <FonteBadge fonte={selOrigem} size="lg" />
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 6, margin: "6px 0 0" }}>
                Cruzamento inteligente de controle manual (Planilha Matriz) com lançamentos do Tesouro Gerencial.
              </p>
            </div>
          </div>

          {/* Filtros Globais */}
          <div style={{ ...s.panel, padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <MultiSel label="Unidade Organizacional" opts={unidades} sel={selUnidade} set={setSelUnidade} formatVal={getUnitAbbreviation} />
            <MultiSel label="PI" opts={planosInternos} sel={selPI} set={setSelPI} />
            <TaxaExecFilter sel={selTaxaExec} set={setSelTaxaExec} />

            <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>Origem do Dado</span>
              <select value={selOrigem} onChange={e => setSelOrigem(e.target.value)}
                style={{ padding: "5px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 11, background: "white", cursor: "pointer", width: 170, textAlign: "center", textAlignLast: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <option value="all">Todos</option>
                <option value="matriz">Matriz</option>
                <option value="tg">Tesouro Gerencial</option>
              </select>
            </div>

            {hasFilter && (
              <button onClick={cleanFilters}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", fontSize: 11, cursor: "pointer", alignSelf: "center", fontWeight: 600, color: "#ef4444" }}>
                <X size={12} /> Limpar Filtros
              </button>
            )}
          </div>



          {/* Seção 1: Cruzamento Matriz x Tesouro Gerencial */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={13} /> 📂 CONTROLE DA MATRIZ DE EXECUÇÃO (PLANILHA)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <KpiCard title="Valor Aprovado Geral" value={fmt(T.valor_aprovado)} sub="Valor fixado aprovado" color="#3b82f6" icon="💰" tooltip="Valor aprovado fixado no planejamento inicial." />
              <KpiCard title="Despesas Debitadas" value={fmt(T.despesas_debitadas_matriz)} sub="Cálculo: Aprovado - Disp. - Emp." color="#f59e0b" icon="🧾" tooltip="Calculado por fórmula: VALOR APROVADO - Crédito Disponível - Despesas empenhadas" />
              <KpiCard title="Total Executado (Matriz)" value={fmt(T.total_executado_matriz)} sub="Soma: Empenhado + Debitado" color="#10b981" icon="⚡" tooltip="Calculado por fórmula: Despesas empenhadas + Despesas debitadas" />
              <KpiCard title="Percentual Executado" value={T.pct_exec.toFixed(2) + "%"} sub="Em relação ao aprovado" color="#8b5cf6" icon="📈" tooltip="Calculado por fórmula: Total Executado / VALOR APROVADO" />
            </div>
          </div>

          {/* KPIs Row 2 — Tesouro Gerencial (Dados de Sistema) */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={13} /> 🏛️ EXECUÇÃO NO TESOURO GERENCIAL (SISTEMA)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <KpiCard title="Crédito Disponível (TG)" value={fmt(T.credito_disponivel_tg)} sub="Disponível no sistema" color="#6366f1" icon="📥" />
              <KpiCard title="Despesas Empenhadas (TG)" value={fmt(T.despesas_empenhadas_tg)} sub="Reservado oficialmente" color="#0ea5e9" icon="📋" />
              <KpiCard title="Despesas Liquidadas (TG)" value={fmt(T.despesas_liquidadas_tg)} sub="Serviços atestados" color="#14b8a6" icon="💳" />
              <KpiCard title="Total Geral do Tesouro" value={fmt(T.total_tg)} sub="Movimentação total no TG" color="#64748b" icon="🏛️" />
            </div>
          </div>

          {/* Tabela Principal (Cruzamento) */}
          <div style={s.panel}>
            <div style={{ ...s.sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>Tabela de Cruzamento Matriz x Tesouro Gerencial</span>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                Exibindo <strong>{filteredRecords.length}</strong> de <strong>{records.length}</strong> chaves <code>(UGR, PI)</code>
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      { name: "UGR", width: "45px" },
                      { name: "Unidade", width: "110px" },
                      { name: "Descrição", width: "150px" },
                      { name: "Processo SEI", width: "95px" },
                      { name: "Aprovado (M)", width: "72px" },
                      { name: "Debitado (M)", width: "72px" },
                      { name: "Executado (M)", width: "85px" },
                      { name: "Empenhado (TG)", width: "80px" },
                      { name: "Disponível (TG)", width: "80px" },
                      { name: "Ações", width: "60px" }
                    ].map(h => (
                      <th key={h.name} style={{ ...s.th, padding: "6px 2px", fontSize: "9px", width: h.width, minWidth: h.width }}>{h.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((d: any, i: number) => {
                    const diff = Math.abs(d.despesas_empenhadas_matriz - d.despesas_empenhadas_tg);
                    
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", width: "45px", minWidth: "45px", fontWeight: 700 }}>{d.ugr}</td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", width: "110px", minWidth: "110px", maxWidth: "110px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2 }} title={d.unidade}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{d.unidade || "—"}</span>
                        </td>
                          <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", width: "150px", minWidth: "150px", maxWidth: "150px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2, textAlign: "center" }} title={`${d.plano_interno} - ${d.plano_interno_nome || ""}`}>
                          <span style={{ fontWeight: 600, color: "#4f46e5" }}>{d.plano_interno_nome || "—"}</span>
                          <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px", fontFamily: "monospace" }}>{d.plano_interno}</div>
                        </td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9px", width: "95px", minWidth: "95px", maxWidth: "95px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.sei}>
                          <span style={{ color: "#374151" }}>{d.sei || "—"}</span>
                        </td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", width: "72px", minWidth: "72px", fontWeight: 600, color: "#0f172a" }}>{d.in_matrix ? fmt(d.valor_aprovado) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", width: "72px", minWidth: "72px", color: "#0f172a", fontWeight: 700 }}>
                          {d.in_matrix ? fmt(d.despesas_debitadas_matriz) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", width: "85px", minWidth: "85px", fontWeight: 700, position: "relative" }}>
                          {d.in_matrix ? (() => {
                            const aprovado = Number(d.valor_aprovado) || 0;
                            const executado = Number(d.total_executado_matriz) || 0;
                            const taxa = aprovado > 0 ? (executado / aprovado) * 100 : 0;
                            
                            let dotColor = "#ef4444";
                            if (taxa >= 35 && taxa <= 75) dotColor = "#eab308";
                            else if (taxa > 75) dotColor = "#22c55e";

                            return (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                                <span style={{ color: dotColor }}>{fmt(executado)}</span>
                                <span className="instant-tooltip-container" style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)" }}>
                                  <span 
                                    style={{ 
                                      display: "inline-block", 
                                      width: 9, 
                                      height: 9, 
                                      borderRadius: "50%", 
                                      background: dotColor, 
                                      cursor: "help",
                                      flexShrink: 0
                                    }} 
                                  />
                                  <span className="tooltip-text">
                                    Taxa de Execução: {taxa.toFixed(1)}%
                                  </span>
                                </span>
                              </div>
                            );
                          })() : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", width: "80px", minWidth: "80px", color: diff > 10 ? "#b45309" : "#0f172a", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {d.in_tg ? fmt(d.despesas_empenhadas_tg) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", width: "80px", minWidth: "80px", fontWeight: 700, whiteSpace: "nowrap" }}>{d.in_tg ? fmt(d.credito_disponivel_tg) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9px", width: "60px", minWidth: "60px" }}>
                          {d.in_tg ? (
                            <button
                              onClick={() => setSelectedRecord(d)}
                              style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: 4, padding: "3px 6px", fontSize: "9px", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}
                            >
                              Ver ND
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "9px" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnóstico Situacional e Eficiência da Unidade */}
          {unitMatrixDiagnostic && (
            <div style={{ ...s.panel, padding: "20px 24px", borderLeft: `6px solid ${unitMatrixDiagnostic.statusColor}`, display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Cabeçalho do Diagnóstico */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingUp size={18} style={{ color: unitMatrixDiagnostic.statusColor }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Análise de Desempenho e Eficiência da Matriz: {unitMatrixDiagnostic.unitsText}
                    </h3>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#64748b", margin: "4px 0 0" }}>
                    Análise exclusiva baseada nos limites e execuções cadastrados na planilha física da Matriz.
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12, background: unitMatrixDiagnostic.statusBg, color: unitMatrixDiagnostic.statusColor, border: `1px solid ${unitMatrixDiagnostic.statusColor}20` }}>
                  {unitMatrixDiagnostic.statusLabel}
                </span>
              </div>

              {/* Grid 1: Indicadores e Métricas Centrais */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Orçamento Aprovado</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginTop: 4, fontFamily: "monospace" }}>{unitMatrixDiagnostic.approvedText}</div>
                  <span style={{ fontSize: 10, color: "#64748b", marginTop: 2, display: "block" }}>Representa {unitMatrixDiagnostic.shareApprovedText} do total geral</span>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Executado (Matriz)</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981", marginTop: 4, fontFamily: "monospace" }}>{unitMatrixDiagnostic.executedText}</div>
                  <span style={{ fontSize: 10, color: "#64748b", marginTop: 2, display: "block" }}>Representa {unitMatrixDiagnostic.shareExecutedText} do executado total</span>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Taxa de Execução Real</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: unitMatrixDiagnostic.statusColor, marginTop: 4, fontFamily: "monospace" }}>{unitMatrixDiagnostic.executionRateText}</div>
                  <span style={{ fontSize: 10, color: "#64748b", marginTop: 2, display: "block" }}>Média da Matriz: {unitMatrixDiagnostic.globalRateText}</span>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Saldo Livre Disponível</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", marginTop: 4, fontFamily: "monospace" }}>{unitMatrixDiagnostic.availableText}</div>
                  <span style={{ fontSize: 10, color: "#64748b", marginTop: 2, display: "block" }}>Recursos não comprometidos</span>
                </div>
              </div>

              {/* Comparação Texto */}
              <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5, background: `${unitMatrixDiagnostic.statusColor}08`, padding: "12px 16px", borderRadius: 8, borderLeft: `4px solid ${unitMatrixDiagnostic.statusColor}` }}>
                📢 <strong>Diagnóstico de Escala:</strong> A UGR selecionada ({unitMatrixDiagnostic.unitsText}) responde por <strong>{unitMatrixDiagnostic.shareApprovedText}</strong> de todo o orçamento da Matriz, mas atinge <strong>{unitMatrixDiagnostic.shareExecutedText}</strong> de participação da execução global. Seu índice interno de utilização <strong>{unitMatrixDiagnostic.comparisonText}</strong>.
              </div>



            </div>
          )}

          {/* Modal Overlay para Naturezas de Despesa */}
          {selectedRecord && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
              <div style={{ background: "white", borderRadius: 16, width: "90%", maxWidth: 850, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
                
                {/* Header do Modal */}
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Desdobramento por Natureza de Despesa (TG)
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                      UGR: <strong>{selectedRecord.ugr}</strong> · PI: <strong>{selectedRecord.plano_interno}</strong> ({selectedRecord.plano_interno_nome || "Sem Nome"})
                    </p>
                  </div>
                  <button onClick={() => setSelectedRecord(null)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 6, borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <X size={18} />
                  </button>
                </div>

                {/* Corpo do Modal */}
                <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Tabela do desmembramento */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["ND", "Descrição da Natureza de Despesa", "Disponível (TG)", "Empenhado (TG)", "A Liquidar (TG)", "Liquidado (TG)", "Total Movimentado"].map(h => (
                            <th key={h} style={{ ...s.th, padding: "8px 10px", fontSize: 9 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.tg_breakdown?.map((nd: any, idx: number) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? "white" : "#fafbfc" }}>
                            <td style={{ ...s.td, padding: "8px 10px", fontWeight: 700, color: "#4f46e5" }}>{nd.natureza_despesa}</td>
                            <td style={{ ...s.td, padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>{nd.natureza_despesa_nome}</td>
                            <td style={{ ...s.td, padding: "8px 10px" }}>{fmt(nd.credito_disponivel)}</td>
                            <td style={{ ...s.td, padding: "8px 10px", fontWeight: 700 }}>{fmt(nd.despesas_empenhadas)}</td>
                            <td style={{ ...s.td, padding: "8px 10px" }}>{fmt(nd.despesas_empenhadas_a_liquidar)}</td>
                            <td style={{ ...s.td, padding: "8px 10px", color: "#10b981", fontWeight: 600 }}>{fmt(nd.despesas_liquidadas)}</td>
                            <td style={{ ...s.td, padding: "8px 10px", fontFamily: "monospace", fontWeight: 600 }}>{fmt(nd.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer do Modal */}
                <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", background: "#f8fafc" }}>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    style={{ background: "#0f172a", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Fechar Detalhes
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
