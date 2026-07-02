import { useState, useMemo, useEffect } from "react";
import { useData } from "./DataProvider";
import DashboardLayout from "./components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { Checkbox } from "./components/ui/checkbox";
import { X, ChevronDown, Calendar, FileText, User, HelpCircle, ArrowRightLeft, Percent, Layers, ShieldCheck, HelpCircle as HelpIcon, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { FonteBadge } from "./components/ui/FonteBadge";
import UnitOrganogram, { ugrHierarchy, NIVEL1_CATEGORIES } from "./components/UnitOrganogram";

const fmt = (v: number) => isNaN(v) ? "R$ 0" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtK = (v: number) => !v || isNaN(v) ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v);
const pct = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) + "%" : "0%";

export const OGP_CODES = [
  "OGP01O1904N", "OGP01O19A1N", "OGP01O19A8N", "OGP01O19B1N", "OGP01O19B2N",
  "OGP01O19B5N", "OGP01O19B7N", "OGP01O19B8N", "OGP01O19B9N", "OGP01O19C1N",
  "OGP01O19C2N", "OGP01O19C4N", "OGP01O19C5N", "OGP01O19C7N", "OGP01O19C8N",
  "OGP01O19D1N", "OGP01O19D8N", "OGP01O19D9N", "OGP01O19E2N", "OGP01O19E4N",
  "OGP01O19E5N", "OGP01O19E6N", "OGP01O19E7N", "OGP01O19E8N", "OGP01O19F2N",
  "OGP01O19F4N", "OGP01O19G1N", "OGP01O19G2N", "OGP01O19G3N", "OGP01O19H4N",
  "OGP01O19H5N", "OGP01O19H9N", "OGP01O19I6N", "OGP01O19K6N", "OGP01O19K9N",
  "OGP01T19B6N", "OGP01T19J9N", "OGP01T19K2N", "OGP01T19K8N"
];

// ── PIs permitidos e seus nomes amigáveis ────────────────────────────────
export const PI_ALLOWED = [
  "VGY01N0103N", "VGY01N0107N", "VGY01N0101N", 
  "MGY01N0104N", "VGY01N0105N",
  ...OGP_CODES
];

export const PI_NAMES: Record<string, string> = {
  VGY01N0103N: "Custos Indiretos",
  VGY01N0107N: "Custos Indiretos",
  VGY01N0101N: "Custos Indiretos",
  MGY01N0104N: "Matriz Acadêmica",
  VGY01N0105N: "Matriz Administrativa",
  ...OGP_CODES.reduce((acc, code) => ({ ...acc, [code]: "Arrecadação" }), {})
};

// Agrupamento inverso: nome → lista de códigos
export const PI_GROUPS: Record<string, string[]> = {
  "Custos Indiretos":     ["VGY01N0103N", "VGY01N0107N", "VGY01N0101N"],
  "Matriz Acadêmica":    ["MGY01N0104N"],
  "Matriz Administrativa": ["VGY01N0105N"],
  "Arrecadação":          OGP_CODES
};

export const PI_GROUP_NAMES = ["Arrecadação", "Custos Indiretos", "Matriz Acadêmica", "Matriz Administrativa"];

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
  const nameStr = String(name).trim();

  // Custom translation
  if (nameStr.toUpperCase().includes("CTO DE POL DIR")) return "CCOM";
  if (nameStr.toUpperCase().includes("CUSTOS INDIRETOS")) return "CI";

  // Se contiver parênteses, a sigla normalmente está dentro deles
  const parenMatch = nameStr.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim();
  }

  // Ignora sufixo "/FUB" genérico
  let cleanName = nameStr;
  if (cleanName.toUpperCase().endsWith("/FUB")) {
    cleanName = cleanName.slice(0, -4);
  }

  const partsSlash = cleanName.split("/");
  if (partsSlash.length > 1) {
    const firstPart = partsSlash[0].trim();
    if (firstPart.length <= 8) {
      return firstPart;
    }
    const lastPart = partsSlash[partsSlash.length - 1].trim();
    if (lastPart.length <= 8 && lastPart.toUpperCase() !== "FUB") {
      return lastPart;
    }
  }

  const parts = cleanName.split(" - ");
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.length <= 10 && lastPart.toUpperCase() !== "FUB") {
      return lastPart;
    }
    const firstPart = parts[0].trim();
    if (firstPart.length <= 8) {
      return firstPart;
    }
  }

  const dashParts = cleanName.split("-");
  if (dashParts.length > 1) {
    const lastPart = dashParts[dashParts.length - 1].trim();
    if (lastPart.length <= 6 && lastPart.toUpperCase() !== "FUB") {
      return lastPart;
    }
  }

  if (cleanName.length <= 12) {
    return cleanName;
  }

  const words = cleanName.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 2);
  if (words.length > 1) {
    const initials = words.map(w => w[0]).join("").toUpperCase();
    if (initials.length >= 2 && initials.length <= 5) return initials;
  }
  return cleanName.slice(0, 12) + "...";
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

function SingleSel({ label, opts, sel, set }: { label: string; opts: string[]; sel: string | null; set: (v: string | null) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: "#475569" }}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, background: "white", fontSize: 9, cursor: "pointer", width: 130, gap: 4, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {sel || "Todas as Áreas"}
            </span>
            <ChevronDown size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 210, padding: 0 }}>
          <Command>
            <CommandInput placeholder="Buscar…" />
            <CommandList style={{ maxHeight: 200, overflowY: "auto" }}>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {opts.map(o => (
                  <CommandItem key={o} value={o} onSelect={() => set(sel === o ? null : o)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 10px", background: sel === o ? "#eff6ff" : "transparent" }}>
                    <span style={{ fontSize: 10, color: sel === o ? "#2563eb" : "#0f172a", fontWeight: sel === o ? 700 : 500 }} title={o}>
                      {o}
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

function EstruturaSearch({
  selNivel1,
  selNivel2,
  selNivel3,
  onSelect,
  recordsForOrganogram
}: {
  selNivel1: string | null;
  selNivel2: string | null;
  selNivel3: string | null;
  onSelect: (n1: string | null, n2: string | null, n3: string | null) => void;
  recordsForOrganogram: any[];
}) {
  const searchOptions = useMemo(() => {
    const list: Array<{
      type: "n1" | "n2" | "n3";
      id: string;
      label: string;
      n1: string;
      n2?: string;
      n3?: string;
    }> = [];

    const activeN1 = new Set<string>();
    const activeN2 = new Map<string, { sigla: string; name: string; n1: string }>();
    const activeN3 = new Map<string, { ugr: string; sigla: string; name: string; n1: string; n2: string }>();

    recordsForOrganogram.forEach((r: any) => {
      const ugrCode = String(r.ugr || "").trim();
      const h = ugrHierarchy[ugrCode];
      if (h) {
        activeN1.add(h.nivel1);
        
        const n2Key = `${h.nivel1}:${h.sigla_n2}`;
        if (!activeN2.has(n2Key)) {
          activeN2.set(n2Key, { sigla: h.sigla_n2, name: h.name_n2, n1: h.nivel1 });
        }

        const n3Key = ugrCode;
        if (!activeN3.has(n3Key)) {
          activeN3.set(n3Key, { ugr: ugrCode, sigla: h.sigla_n3, name: h.name_n3, n1: h.nivel1, n2: h.sigla_n2 });
        }
      }
    });

    // 1. Nível 1
    NIVEL1_CATEGORIES.forEach(cat => {
      if (activeN1.has(cat)) {
        list.push({
          type: "n1",
          id: `n1:${cat}`,
          label: cat,
          n1: cat
        });
      }
    });

    // 2. Nível 2
    const sortedN2 = Array.from(activeN2.values()).sort((a, b) => a.sigla.localeCompare(b.sigla));
    sortedN2.forEach(item => {
      list.push({
        type: "n2",
        id: `n2:${item.n1}:${item.sigla}`,
        label: `${item.sigla} - ${item.name}`,
        n1: item.n1,
        n2: item.sigla
      });
    });

    // 3. Nível 3
    const sortedN3 = Array.from(activeN3.values()).sort((a, b) => a.sigla.localeCompare(b.sigla));
    sortedN3.forEach(item => {
      list.push({
        type: "n3",
        id: `n3:${item.ugr}`,
        label: `UGR ${item.ugr} - ${item.sigla} (${item.name})`,
        n1: item.n1,
        n2: item.n2,
        n3: item.ugr
      });
    });

    return list;
  }, [recordsForOrganogram]);

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const visibleOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Quando não há busca, mostra APENAS o Nível 1 (as macro-áreas do jeito que estava)
      return searchOptions.filter(o => o.type === "n1");
    }
    // Quando digita, pesquisa no label de todos os níveis (Nível 1, Nível 2 e Nível 3)
    return searchOptions.filter(o => o.label.toLowerCase().includes(q));
  }, [searchOptions, searchQuery]);

  const buttonLabel = useMemo(() => {
    if (selNivel3) {
      const h = ugrHierarchy[selNivel3];
      return h ? `UGR ${selNivel3} - ${h.sigla_n3}` : `UGR ${selNivel3}`;
    }
    if (selNivel2) {
      return selNivel2;
    }
    if (selNivel1) {
      return selNivel1;
    }
    return "Todas as Áreas";
  }, [selNivel1, selNivel2, selNivel3]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: "#475569" }}>Estrutura</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 6px", border: "1px solid #cbd5e1", borderRadius: 5, background: "white", fontSize: 9, cursor: "pointer", width: 130, gap: 4, textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", flex: 1 }}>
              {buttonLabel}
            </span>
            <ChevronDown size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 210, padding: 0 }}>
          <Command>
            <CommandInput placeholder="Buscar por unidade, depto, UGR..." value={searchQuery} onValueChange={setSearchQuery} />
            <CommandList style={{ maxHeight: 250, overflowY: "auto", paddingTop: "6px" }}>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {visibleOptions.map(o => {
                  let isSelected = false;
                  if (o.type === "n1") {
                    isSelected = selNivel1 === o.n1 && !selNivel2 && !selNivel3;
                  } else if (o.type === "n2") {
                    isSelected = selNivel2 === o.n2 && !selNivel3;
                  } else if (o.type === "n3") {
                    isSelected = selNivel3 === o.n3;
                  }

                  return (
                    <CommandItem
                      key={o.id}
                      value={o.label}
                      onSelect={() => {
                        if (isSelected) {
                          onSelect(null, null, null);
                        } else {
                          onSelect(o.n1, o.n2 || null, o.n3 || null);
                        }
                        setOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "5px 8px",
                        background: isSelected ? "#eff6ff" : "transparent"
                      }}
                    >
                      <span style={{
                        fontSize: 9.5,
                        color: isSelected ? "#2563eb" : "#0f172a",
                        fontWeight: isSelected ? 700 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }} title={o.label}>
                        {o.label}
                      </span>
                    </CommandItem>
                  );
                })}
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

  // Estados dos filtros de estrutura (UGR)
  const [selNivel1, setSelNivel1] = useState<string | null>(null);
  const [selNivel2, setSelNivel2] = useState<string | null>(null);
  const [selNivel3, setSelNivel3] = useState<string | null>(null);

  const [selPI, setSelPI] = useState<string[]>([]);
  const [selOrigem, setSelOrigem] = useState<string>("all");
  const [selTaxaExec, setSelTaxaExec] = useState<string[]>([]);
  const selStatus = "all";

  const handleNivel1Change = (val: string | null) => {
    setSelNivel1(val);
    setSelNivel2(null);
    setSelNivel3(null);
  };

  const handleNivel2Change = (val: string | null) => {
    setSelNivel2(val);
    setSelNivel3(null);
  };

  // Estado do registro selecionado para o modal de naturezas
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const planosInternos = useMemo(() => {
    let filtered = records;
    
    // Apply Nivel 1, 2, 3 filters
    if (selNivel1) {
      filtered = filtered.filter((d: any) => ugrHierarchy[String(d.ugr || "").trim()]?.nivel1 === selNivel1);
    }
    if (selNivel2) {
      filtered = filtered.filter((d: any) => ugrHierarchy[String(d.ugr || "").trim()]?.sigla_n2 === selNivel2);
    }
    if (selNivel3) {
      filtered = filtered.filter((d: any) => String(d.ugr || "").trim() === selNivel3);
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
  }, [records, selNivel1, selNivel2, selNivel3, selTaxaExec]);

  const taxasDeExecucaoDisponiveis = useMemo(() => {
    let filtered = records;
    
    // Apply Nivel 1, 2, 3 filters
    if (selNivel1) {
      filtered = filtered.filter((d: any) => ugrHierarchy[String(d.ugr || "").trim()]?.nivel1 === selNivel1);
    }
    if (selNivel2) {
      filtered = filtered.filter((d: any) => ugrHierarchy[String(d.ugr || "").trim()]?.sigla_n2 === selNivel2);
    }
    if (selNivel3) {
      filtered = filtered.filter((d: any) => String(d.ugr || "").trim() === selNivel3);
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
  }, [records, selNivel1, selNivel2, selNivel3, selPI]);

  const recordsForOrganogram = useMemo(() => {
    return records.filter((d: any) => {
      const pi = (d.plano_interno || "").trim();
      
      // Filtro de PI
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
  }, [records, selPI, selOrigem, selStatus, selTaxaExec]);

  const activeNivel1Categories = useMemo(() => {
    return NIVEL1_CATEGORIES.filter(cat => 
      recordsForOrganogram.some((r: any) => {
        const h = ugrHierarchy[String(r.ugr || "").trim()];
        return h && h.nivel1 === cat;
      })
    );
  }, [recordsForOrganogram]);

  // Se a Área selecionada não estiver mais ativa por conta do filtro do PI, reseta os níveis de UGR
  useEffect(() => {
    if (selNivel1 && !activeNivel1Categories.includes(selNivel1)) {
      setSelNivel1(null);
      setSelNivel2(null);
      setSelNivel3(null);
    }
  }, [activeNivel1Categories, selNivel1]);

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
      const ugr = String(d.ugr || "").trim();
      const h = ugrHierarchy[ugr];
      const pi = (d.plano_interno || "").trim();
      
      if (selNivel1) {
        if (!h || h.nivel1 !== selNivel1) return false;
      }
      if (selNivel2) {
        if (!h || h.sigla_n2 !== selNivel2) return false;
      }
      if (selNivel3) {
        if (!h || h.ugr !== selNivel3) return false;
      }

      // Filtro de PI
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
  }, [records, selNivel1, selNivel2, selNivel3, selPI, selOrigem, selStatus, selTaxaExec]);

  // Filtros aplicados sobre a tabela de adiantamentos
  const filteredAdiantamentos = useMemo(() => {
    if (!adiantamentos || adiantamentos.length === 0) return [];
    return adiantamentos.filter((d: any) => {
      const u = (d.unidade || "").trim().toUpperCase();
      const uClean = u === "FCTE" ? "FCE" : u;

      if (selNivel3) {
        const h3 = ugrHierarchy[selNivel3];
        if (h3) {
          const sig3 = String(h3.sigla_n3 || "").toUpperCase();
          if (uClean !== sig3) return false;
        } else {
          return false;
        }
      } 
      else if (selNivel2) {
        const sig2 = selNivel2.toUpperCase();
        if (uClean !== sig2) {
          const belongsToN2 = Object.values(ugrHierarchy).some(h => 
            String(h.sigla_n2 || "").toUpperCase() === sig2 && 
            String(h.sigla_n3 || "").toUpperCase() === uClean
          );
          if (!belongsToN2) return false;
        }
      } 
      else if (selNivel1) {
        const belongsToN1 = Object.values(ugrHierarchy).some(h => 
          h.nivel1 === selNivel1 && 
          (String(h.sigla_n2 || "").toUpperCase() === uClean || 
           String(h.sigla_n3 || "").toUpperCase() === uClean)
        );
        if (!belongsToN1) return false;
      }

      return true;
    });
  }, [adiantamentos, selNivel1, selNivel2, selNivel3]);

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

    // Somas apenas para Matriz (exclui Custos Indiretos e Arrecadação) — usadas em Debitado e Executado
    const EXCLUDED_CODES = new Set([
      ...(PI_GROUPS["Custos Indiretos"] || []),
      ...(PI_GROUPS["Arrecadação"] || [])
    ]);
    let mtz_aprovado = 0;
    let mtz_disp_tg  = 0;
    let mtz_emp_tg   = 0;

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

      // Acumula apenas registros que NÃO são Custos Indiretos nem Arrecadação
      const pi = (d.plano_interno || "").trim();
      if (!EXCLUDED_CODES.has(pi)) {
        mtz_aprovado += Number(d.valor_aprovado) || 0;
        mtz_disp_tg  += Number(d.credito_disponivel_tg) || 0;
        mtz_emp_tg   += Number(d.despesas_empenhadas_tg) || 0;
      }

      if (d.in_matrix && d.in_tg) count_ambos++;
      else if (d.in_matrix) count_matriz++;
      else if (d.in_tg) count_tg++;
    });

    // Debitado e Executado excluem CI (somente Matriz Acadêmica + Administrativa)
    const debitado_tg  = mtz_aprovado - mtz_disp_tg - mtz_emp_tg;
    const executado_tg = mtz_aprovado - mtz_disp_tg;
    const pct_exec = mtz_aprovado > 0 ? (executado_tg / mtz_aprovado) * 100 : 0;

    return {
      valor_aprovado, despesas_empenhadas_matriz, credito_disponivel_matriz, despesas_debitadas_matriz, total_executado_matriz, pct_exec,
      credito_disponivel_tg, despesas_empenhadas_tg, despesas_empenhadas_a_liquidar_tg, despesas_liquidadas_tg, total_tg,
      debitado_tg, executado_tg,
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
    if (loading || !records || records.length === 0 || (!selNivel1 && !selNivel2 && !selNivel3)) return null;

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
      const ugr = String(r.ugr || "").trim();
      const h = ugrHierarchy[ugr];
      if (selNivel3) {
        return ugr === selNivel3;
      }
      if (selNivel2) {
        return h && h.sigla_n2 === selNivel2;
      }
      if (selNivel1) {
        return h && h.nivel1 === selNivel1;
      }
      return false;
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

    const unitsText = (() => {
      if (selNivel3) {
        return ugrHierarchy[selNivel3]?.name_n3 || selNivel3;
      }
      if (selNivel2) {
        const found = Object.values(ugrHierarchy).find(h => h.sigla_n2 === selNivel2);
        return found ? found.name_n2 : selNivel2;
      }
      if (selNivel1) {
        return selNivel1;
      }
      return "Universidade de Brasília";
    })();

    return {
      unitsText,
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
  }, [selNivel1, selNivel2, selNivel3, records, loading]);

  const hasFilter = selNivel1 !== null || selNivel2 !== null || selNivel3 !== null || selPI.length > 0 || selOrigem !== "all" || selTaxaExec.length > 0;

  const cleanFilters = () => {
    setSelNivel1(null);
    setSelNivel2(null);
    setSelNivel3(null);
    setSelPI([]);
    setSelOrigem("all");
    setSelTaxaExec([]);
  };

  const selectionLabel = useMemo(() => {
    const parts = [];
    if (selNivel3) {
      parts.push(ugrHierarchy[selNivel3]?.name_n3 || selNivel3);
    } else if (selNivel2) {
      const found = Object.values(ugrHierarchy).find(h => h.sigla_n2 === selNivel2);
      parts.push(found ? found.name_n2 : selNivel2);
    } else if (selNivel1) {
      parts.push(selNivel1);
    }
    if (selPI.length > 0) {
      parts.push(selPI.join(", "));
    }
    return parts.length > 0 ? parts.join(" | ") : "Matriz + Custos Indiretos + Arrecadação";
  }, [selNivel1, selNivel2, selNivel3, selPI]);

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

          <div style={{ ...s.panel, padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <EstruturaSearch
              selNivel1={selNivel1}
              selNivel2={selNivel2}
              selNivel3={selNivel3}
              onSelect={(n1, n2, n3) => {
                setSelNivel1(n1);
                setSelNivel2(n2);
                setSelNivel3(n3);
              }}
              recordsForOrganogram={recordsForOrganogram}
            />
            <MultiSel label="Plano Interno" opts={planosInternos} sel={selPI} set={setSelPI} />




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
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1e293b", background: "#f1f5f9", padding: "4px 12px", borderRadius: 12, border: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <Layers size={12} style={{ color: "#64748b" }} />
                {selectionLabel}
              </span>
            </div>
            {(() => {
              const isSimplifiedKpis = (selPI.length === 1 && (selPI[0] === "Custos Indiretos" || selPI[0] === "Arrecadação")) || 
                (filteredRecords.length > 0 && filteredRecords.every((d: any) => {
                  const pi = (d.plano_interno || "").trim();
                  const isCiOrArr = (PI_GROUPS["Custos Indiretos"] || []).includes(pi) || (PI_GROUPS["Arrecadação"] || []).includes(pi);
                  return isCiOrArr || !d.in_matrix;
                }));
              
              if (isSimplifiedKpis) {
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
                  <KpiCard title="Debitado"      value={fmt(T.debitado_tg)} sub="Dotação - Disp. TG - Emp. TG (Matriz)" color="#f59e0b" icon="🧾" tooltip="Calculado por fórmula: Dotação − Crédito Disponível TG − Empenhado TG. Exclui Custos Indiretos." />
                  <KpiCard title="Executado"     value={fmt(T.executado_tg)}            sub="Dotação − Disponível TG"    color="#10b981" icon="⚡" tooltip="Calculado por fórmula: Valor Aprovado − Crédito Disponível TG." />
                  <KpiCard title="% Executado"   value={T.pct_exec.toFixed(2) + "%"}    sub="Em relação à dotação"       color="#8b5cf6" icon="📈" tooltip="Calculado por fórmula: Executado TG / Valor Aprovado." />
                </div>
              );
            })()}
          </div>

          <UnitOrganogram 
            selNivel1={selNivel1}
            selNivel2={selNivel2}
            selNivel3={selNivel3}
            onSelectNivel1={handleNivel1Change}
            onSelectNivel2={handleNivel2Change}
            onSelectNivel3={setSelNivel3}
            records={recordsForOrganogram}
          />

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
                      { name: "UGR", width: "5%" },
                      { name: "UNIDADE", width: "13%" },
                      { name: "DESCRIÇÃO", width: "18%" },
                      { name: "DOTAÇÃO", width: "10%" },
                      { name: "DISPONÍVEL", width: "10%" },
                      { name: "EMPENHADO", width: "10%" },
                      { name: "DEBITADO", width: "10%" },
                      { name: "% EXECUTADO", width: "11%" },
                      { name: "DETALHAMENTO", width: "10%" }
                    ].map(h => (
                      <th key={h.name} style={{ ...s.th, padding: "6px 2px", fontSize: "9px", width: h.width }}>{h.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredRecords].sort((a: any, b: any) => {
                    const ugrA = String(a.ugr ?? "");
                    const ugrB = String(b.ugr ?? "");
                    const cmpUgr = ugrA.localeCompare(ugrB, "pt-BR", { numeric: true });
                    if (cmpUgr !== 0) return cmpUgr;

                    const labelA = piLabel(a.plano_interno) || "";
                    const labelB = piLabel(b.plano_interno) || "";
                    const hasMatrizA = labelA.toLowerCase().includes("matriz");
                    const hasMatrizB = labelB.toLowerCase().includes("matriz");

                    if (hasMatrizA && !hasMatrizB) return -1;
                    if (!hasMatrizA && hasMatrizB) return 1;

                    return labelA.localeCompare(labelB, "pt-BR");
                  }).map((d: any, i: number) => {
                    const diff = Math.abs(d.despesas_empenhadas_matriz - d.despesas_empenhadas_tg);
                    
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", fontWeight: 700 }}>{d.ugr}</td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2 }} title={ugrHierarchy[String(d.ugr || "").trim()]?.name_n3 || d.unidade}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>
                            {ugrHierarchy[String(d.ugr || "").trim()]?.name_n3 || d.unidade || "—"}
                          </span>
                        </td>
                        <td style={{ ...s.td, padding: "6px 2px", fontSize: "9.5px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.2, textAlign: "center" }} title={`${d.plano_interno} - ${piLabel(d.plano_interno)}`}>
                          <span style={{ fontWeight: 600, color: "#4f46e5" }}>{piLabel(d.plano_interno)}</span>
                          <div style={{ fontSize: "8px", color: "#64748b", marginTop: "2px", fontFamily: "monospace" }}>{d.plano_interno}</div>
                        </td>

                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 600, color: "#0f172a" }}>{d.in_matrix ? fmt(d.valor_aprovado) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 700 }}>{d.in_tg ? fmt(d.credito_disponivel_tg) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 700 }}>{d.in_tg ? fmt(d.despesas_empenhadas_tg) : "—"}</td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", color: "#0f172a", fontWeight: 700 }}>
                          {(() => {
                            const pi = (d.plano_interno || "").trim();
                            const isCiOrArr = (PI_GROUPS["Custos Indiretos"] || []).includes(pi) || (PI_GROUPS["Arrecadação"] || []).includes(pi);
                            if (isCiOrArr) return "—";
                            return (d.in_matrix || d.in_tg) ? fmt((Number(d.valor_aprovado)||0) - (Number(d.credito_disponivel_tg)||0) - (Number(d.despesas_empenhadas_tg)||0)) : "—";
                          })()}
                        </td>
                        <td style={{ ...s.td, padding: "6px 4px", fontSize: "10px", fontWeight: 700, color: "#0f172a", textAlign: "center" }}>
                          {d.in_matrix ? (() => {
                            const aprovado = Number(d.valor_aprovado) || 0;
                            const disponivel = Number(d.credito_disponivel_tg) || 0;
                            const executado = aprovado - disponivel;
                            const taxa = aprovado > 0 ? (executado / aprovado) * 100 : 0;
                            return taxa.toFixed(1) + "%";
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
