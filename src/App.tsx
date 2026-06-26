import { useState, useMemo, useEffect } from "react";
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

// ── PIs permitidos e seus nomes amigáveis ────────────────────────────────
export const PI_ALLOWED = ["VGY01N0103N", "VGY01N0107N", "VGY01N0101N", "MGY01N0104N", "VGY01N0105N"];
export const PI_NAMES: Record<string, string> = {
  VGY01N0103N: "Custos Indiretos",
  VGY01N0107N: "Custos Indiretos",
  VGY01N0101N: "Custos Indiretos",
  MGY01N0104N: "Matriz Acadêmica",
  VGY01N0105N: "Matriz Administrativa",
};
// Agrupamento inverso: nome → lista de códigos
export const PI_GROUPS: Record<string, string[]> = {
  "Custos Indiretos":     ["VGY01N0103N", "VGY01N0107N", "VGY01N0101N"],
  "Matriz Acadêmica":    ["MGY01N0104N"],
  "Matriz Administrativa": ["VGY01N0105N"],
};
export const PI_GROUP_NAMES = Object.keys(PI_GROUPS);

const piLabel = (code: string) => PI_NAMES[code?.trim()] ?? code;

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
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: "#475569" }}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, background: "white", fontSize: 9, cursor: "pointer", width: 130, gap: 4, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {sel.length > 0 ? sel.map(renderLabel).join(", ") : "Todos"}
            </span>
            <ChevronDown size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 210, padding: 0 }}>
          <Command>
            <CommandInput placeholder="Buscar…" />
            {opts.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", cursor: "pointer" }}
                onClick={() => set(sel.length === opts.length ? [] : [...opts])}>
                <Checkbox checked={sel.length === opts.length && opts.length > 0} style={{ pointerEvents: "none" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>Selecionar Todos</span>
              </div>
            )}
            <CommandList style={{ maxHeight: 200, overflowY: "auto" }}>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {opts.map(o => (
                  <CommandItem key={o} value={o} onSelect={() => set(sel.includes(o) ? sel.filter(x => x !== o) : [...sel, o])} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 10px" }}>
                    <Checkbox checked={sel.includes(o)} style={{ pointerEvents: "none" }} />
                    <span style={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o}>
                      {formatVal ? formatVal(o) : o}
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

function TaxaExecFilter({ sel, set, disponiveis }: { sel: string[]; set: (v: string[]) => void; disponiveis: string[] }) {
  const options = [
    { value: "baixo", label: "Baixo", color: "#ef4444" },
    { value: "medio", label: "Média", color: "#eab308" },
    { value: "alto",  label: "Alta",  color: "#22c55e" }
  ];
  const activeOptions = options.filter(o => disponiveis.includes(o.value));
  const renderLabel = (val: string) => options.find(o => o.value === val)?.label ?? val;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: "#475569" }}>Taxa de Execução</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, background: "white", fontSize: 9, cursor: "pointer", width: 130, gap: 4, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {sel.length > 0 ? sel.map(renderLabel).join(", ") : "Todos"}
            </span>
            <ChevronDown size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 160, padding: 0 }}>
          <Command>
            <CommandList>
              <CommandGroup>
                {activeOptions.map(o => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={() => set(sel.includes(o.value) ? sel.filter(x => x !== o.value) : [...sel, o.value])}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px" }}
                  >
                    <Checkbox checked={sel.includes(o.value)} style={{ pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: o.color }} />
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
    <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", borderLeft: `3px solid ${color}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", padding: "6px 8px", position: "relative", minWidth: 0 }}>
      <div style={{ fontSize: 8.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 3, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={tooltip ?? String(title)}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        {tooltip && <HelpIcon size={9} style={{ color: "#94a3b8", cursor: "help", marginLeft: "auto", flexShrink: 0 }} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2, lineHeight: 1.1, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      {sub && <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 2, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const { records: rawRecords, adiantamentos, loading } = useData();
  // Filtra apenas os PIs permitidos
  const records = useMemo(
    () => rawRecords.filter((d: any) => PI_ALLOWED.includes((d.plano_interno || "").trim())),
    [rawRecords]
  );

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
    let filtered = records;
    
    // Apply PI filter
    if (selPI.length > 0) {
      const codesFromNames = selPI.flatMap(name => PI_GROUPS[name] ?? []);
      filtered = filtered.filter((d: any) => codesFromNames.includes((d.plano_interno || "").trim()));
    }
    
    // Apply Taxa de Execução filter
    if (selTaxaExec.length > 0) {
      filtered = filtered.filter((d: any) => {
        if (!d.in_matrix) return false;
        const aprovado = Number(d.valor_aprovado) || 0;
        const executado = Number(d.total_executado_matriz) || 0;
        const taxa = aprovado > 0 ? (executado / aprovado) * 100 : 0;
        
        let cat = "baixo";
        if (taxa >= 35 && taxa <= 75) cat = "medio";
        else if (taxa > 75) cat = "alto";
        
        return selTaxaExec.includes(cat);
      });
    }

    const raw = Array.from(new Set(filtered.map((d: any) => (d.unidade || "").trim()).filter(Boolean))) as string[];
    return raw.sort((a, b) => getUnitAbbreviation(a).localeCompare(getUnitAbbreviation(b)));
  }, [records, selPI, selTaxaExec]);

  const planosInternos = useMemo(() => {
    let filtered = records;
    
    // Apply Unidade filter
    if (selUnidade.length > 0) {
      filtered = filtered.filter((d: any) => selUnidade.includes((d.unidade || "").trim()));
    }
    
    // Apply Taxa de Execução filter
    if (selTaxaExec.length > 0) {
      filtered = filtered.filter((d: any) => {
        if (!d.in_matrix) return false;
        const aprovado = Number(d.valor_aprovado) || 0;
        const executado = Number(d.total_executado_matriz) || 0;
        const taxa = aprovado > 0 ? (executado / aprovado) * 100 : 0;
        
        let cat = "baixo";
        if (taxa >= 35 && taxa <= 75) cat = "medio";
        else if (taxa > 75) cat = "alto";
        
        return selTaxaExec.includes(cat);
      });
    }

    const codesPresent = new Set(filtered.map((d: any) => (d.plano_interno || "").trim()));
    return PI_GROUP_NAMES.filter(name =>
      (PI_GROUPS[name] ?? []).some(code => codesPresent.has(code))
    );
  }, [records, selUnidade, selTaxaExec]);

  const taxasDeExecucaoDisponiveis = useMemo(() => {
    let filtered = records;
    
    // Apply Unidade filter
    if (selUnidade.length > 0) {
      filtered = filtered.filter((d: any) => selUnidade.includes((d.unidade || "").trim()));
    }
    
    // Apply PI filter
    if (selPI.length > 0) {
      const codesFromNames = selPI.flatMap(name => PI_GROUPS[name] ?? []);
      filtered = filtered.filter((d: any) => codesFromNames.includes((d.plano_interno || "").trim()));
    }
    
    const cats = new Set<string>();
    filtered.forEach((d: any) => {
      if (!d.in_matrix) return;
      const aprovado = Number(d.valor_aprovado) || 0;
      const executado = Number(d.total_executado_matriz) || 0;
      const taxa = aprovado > 0 ? (executado / aprovado) * 100 : 0;
      
      let cat = "baixo";
      if (taxa >= 35 && taxa <= 75) cat = "medio";
      else if (taxa > 75) cat = "alto";
      
      cats.add(cat);
    });
    
    return Array.from(cats);
  }, [records, selUnidade, selPI]);

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

  useEffect(() => {
    if (selTaxaExec.length > 0) {
      const valid = selTaxaExec.filter(t => taxasDeExecucaoDisponiveis.includes(t));
      if (valid.length !== selTaxaExec.length) setSelTaxaExec(valid);
    }
  }, [taxasDeExecucaoDisponiveis, selTaxaExec]);

  // Filtros aplicados sobre a tabela principal
  const filteredRecords = useMemo(() => {
    return records.filter((d: any) => {
      const u = (d.unidade || "").trim();
      const pi = (d.plano_interno || "").trim();
      
      if (selUnidade.length > 0 && !selUnidade.includes(u)) return false;
      // Filtro de PI: expande nomes selecionados para os códigos correspondentes
      if (selPI.length > 0) {
        const codesFromNames = selPI.flatMap(name => PI_GROUPS[name] ?? []);
        if (!codesFromNames.includes(pi)) return false;
      }
      
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

    const executado_tg = valor_aprovado - credito_disponivel_tg;
    const pct_exec = valor_aprovado > 0 ? (executado_tg / valor_aprovado) * 100 : 0;

    return {
      valor_aprovado, despesas_empenhadas_matriz, credito_disponivel_matriz, despesas_debitadas_matriz, total_executado_matriz, pct_exec,
      credito_disponivel_tg, despesas_empenhadas_tg, despesas_empenhadas_a_liquidar_tg, despesas_liquidadas_tg, total_tg,
      executado_tg,
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
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 12, lineHeight: 1 }}>
                <span style={{ display: "inline-flex", alignItems: "center", letterSpacing: "-0.03em", background: "linear-gradient(90deg, #0f172a 0%, #4338ca 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "#0f172a" }}>
                  Execução Orçamentária
                </span>
                <FonteBadge fonte={selOrigem} size="lg" />
              </h1>
            </div>
          </div>

          {/* Filtros Globais */}
          <div style={{ ...s.panel, padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <MultiSel label="Unidade Organizacional" opts={unidades} sel={selUnidade} set={setSelUnidade} formatVal={getUnitAbbreviation} />
            <MultiSel label="PI" opts={planosInternos} sel={selPI} set={setSelPI} />
            <TaxaExecFilter sel={selTaxaExec} set={setSelTaxaExec} disponiveis={taxasDeExecucaoDisponiveis} />




            {hasFilter && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: "transparent" }}>·</span>
                <button onClick={cleanFilters}
                  style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", border: "1px solid #fecaca", borderRadius: 5, background: "white", fontSize: 9, cursor: "pointer", fontWeight: 600, color: "#ef4444", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <X size={10} /> Limpar Filtros
                </button>
              </div>
            )}
          </div>



          {/* KPIs — linha única */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(() => {
              const parts = [];
              if (selUnidade.length > 0) parts.push(selUnidade.join(", "));
              if (selPI.length > 0) parts.push(selPI.join(", "));
              const label = parts.length > 0 ? parts.join(" | ") : "Matriz + Custos Indiretos";
              return (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1e293b", background: "#f1f5f9", padding: "4px 12px", borderRadius: 12, border: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <Layers size={12} style={{ color: "#64748b" }} />
                    {label}
                  </span>
                </div>
              );
            })()}
            {(() => {
              const isOnlyCustosIndiretos = selPI.length === 1 && selPI[0] === "Custos Indiretos";
              
              if (isOnlyCustosIndiretos) {
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 450, margin: "0 auto", width: "100%" }}>
                    <KpiCard title="Disponível"    value={fmt(T.credito_disponivel_tg)}   sub="Crédito disponível (TG)"    color="#6366f1" icon="📥" tooltip="Crédito disponível no Tesouro Gerencial." />
                    <KpiCard title="Empenhado"     value={fmt(T.despesas_empenhadas_tg)}  sub="Reservado oficialmente"     color="#0ea5e9" icon="📋" tooltip="Despesas empenhadas no Tesouro Gerencial." />
                  </div>
                );
              }

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  <KpiCard title="Dotação"       value={fmt(T.valor_aprovado)}          sub="Valor fixado aprovado"       color="#3b82f6" icon="💰" tooltip="Valor aprovado fixado no planejamento inicial." />
                  <KpiCard title="Disponível"    value={fmt(T.credito_disponivel_tg)}   sub="Crédito disponível (TG)"    color="#6366f1" icon="📥" tooltip="Crédito disponível no Tesouro Gerencial." />
                  <KpiCard title="Empenhado"     value={fmt(T.despesas_empenhadas_tg)}  sub="Reservado oficialmente"     color="#0ea5e9" icon="📋" tooltip="Despesas empenhadas no Tesouro Gerencial." />
                  <KpiCard title="Debitado"      value={fmt(T.valor_aprovado - T.credito_disponivel_tg - T.despesas_empenhadas_tg)} sub="Dotação - Disp. TG - Emp. TG" color="#f59e0b" icon="🧾" tooltip="Calculado por fórmula: Dotação (Valor Aprovado) − Crédito Disponível TG − Empenhado TG." />
                  <KpiCard title="Executado"     value={fmt(T.executado_tg)}            sub="Dotação − Disponível TG"    color="#10b981" icon="⚡" tooltip="Calculado por fórmula: Valor Aprovado − Crédito Disponível TG." />
                  <KpiCard title="% Executado"   value={T.pct_exec.toFixed(2) + "%"}    sub="Em relação à dotação"       color="#8b5cf6" icon="📈" tooltip="Calculado por fórmula: Executado TG / Valor Aprovado." />
                </div>
              );
            })()}
          </div>


          {/* Tabela Principal (Cruzamento) */}
          <div style={s.panel}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <FileText size={15} style={{ color: "#6366f1" }} /> Detalhamento de Execução Orçamentária
              </span>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                Exibindo <strong style={{ color: "#0f172a" }}>{filteredRecords.length}</strong> de <strong style={{ color: "#0f172a" }}>{records.length}</strong> chaves <code>(UGR, PI)</code>
              </span>
            </div>
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, tableLayout: "fixed", wordBreak: "break-word" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      { name: "UGR", width: "6%" },
                      { name: "UNIDADE", width: "16%" },
                      { name: "DESCRIÇÃO", width: "24%" },
                      { name: "DOTAÇÃO", width: "11%" },
                      { name: "DISPONÍVEL", width: "11%" },
                      { name: "DEBITADO", width: "11%" },
                      { name: "EXECUTADO", width: "12%" },
                      { name: "AÇÕES", width: "9%" }
                    ].map(h => (
                      <th key={h.name} style={{ ...s.th, padding: "6px 2px", fontSize: "9px", width: h.width }}>{h.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredRecords].sort((a: any, b: any) => String(a.ugr ?? "").localeCompare(String(b.ugr ?? ""), "pt-BR", { numeric: true })).map((d: any, i: number) => {
                    const diff = Math.abs(d.despesas_empenhadas_matriz - d.despesas_empenhadas_tg);
                    
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", fontWeight: 700 }}>{d.ugr}</td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2 }} title={d.unidade}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{d.unidade || "—"}</span>
                        </td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2, textAlign: "center" }} title={`${d.plano_interno} - ${piLabel(d.plano_interno)}`}>
                          <span style={{ fontWeight: 600, color: "#4f46e5" }}>{piLabel(d.plano_interno)}</span>
                          <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px", fontFamily: "monospace" }}>{d.plano_interno}</div>
                        </td>

                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 600, color: "#0f172a" }}>{d.in_matrix ? fmt(d.valor_aprovado) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 700 }}>{d.in_tg ? fmt(d.credito_disponivel_tg) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", color: "#0f172a", fontWeight: 700 }}>
                          {(d.in_matrix || d.in_tg) ? fmt((Number(d.valor_aprovado)||0) - (Number(d.credito_disponivel_tg)||0) - (Number(d.despesas_empenhadas_tg)||0)) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 700, position: "relative" }}>
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
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9px" }}>
                          {d.in_tg ? (
                            <button
                              onClick={() => setSelectedRecord(d)}
                              style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: 4, padding: "3px 5px", fontSize: "8.5px", fontWeight: 700, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}
                            >
                              Nat. Desp.
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
