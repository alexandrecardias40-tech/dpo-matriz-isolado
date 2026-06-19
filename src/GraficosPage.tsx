import { useMemo, useState, useEffect } from "react";
import { useData } from "./DataProvider";
import DashboardLayout from "./components/DashboardLayout";
import CINetworkChart from "./components/CINetworkChart";
import { ArrowLeft } from "lucide-react";
import { FonteBadge } from "./components/ui/FonteBadge";

const fmt  = (v: number) => isNaN(v)||!v ? "R$ 0" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0,maximumFractionDigits:0}).format(v);
const fmtK = (v: number) => {
  if (isNaN(v) || !v) return "—";
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

export function calcUnidadeValues(d: any) {
  // Para Emendas, confiamos 100% no dado do backend (build_data.py)
  if (d.fonte === "Emenda") {
    const a = Number(d.a_ressarcir) || 0;
    const r = Number(d.ressarcido) || 0;
    const emp = Number(d.empenhado) || 0;
    const pago = Number(d.total_pago_tg) || 0;
    
    // Regra solicitada: só entra o valor "a ressarcir" quando houver empenho e pagamento juntos
    const canHaveRessarcir = (emp > 0 && pago > 0);

    return {
      aRessarcirVal: (a > 0 && canHaveRessarcir) ? a / 2 : null,
      ressarcidoVal: r > 0 ? r / 2 : null,
    };
  }

  // Para TED, mantemos a lógica clássica da interface (que baseia no TG)
  const sem = d.semaforo;
  const pago = Number(d.total_pago_tg) || 0;
  const emp = Number(d.empenhado) || 0;

  let aRessarcirVal: number | null = null;
  let ressarcidoVal: number | null = null;

  if (sem === 'verde') {
    ressarcidoVal = pago / 2;
    aRessarcirVal = null;
  } else if (sem === 'amarelo') {
    aRessarcirVal = pago / 2;
    ressarcidoVal = null;
  } else if (emp > 0 && pago > 0) {
    aRessarcirVal = pago / 2;
    ressarcidoVal = null;
  } else {
    aRessarcirVal = null;
    ressarcidoVal = null;
  }

  return { aRessarcirVal, ressarcidoVal };
}
const pct  = (a:number,b:number) => b>0 ? ((a/b)*100).toFixed(1)+"%" : "—";

// Agrega dados por Centro de Custo
function buildByCC(data: any[]) {
  const m: Record<string,any> = {};
  data.forEach((d:any) => {
    const cc = (d.centro_custo||"Outros").trim();
    if (!m[cc]) m[cc] = {
      centro_custo: cc, empenhado: 0, total_pago_tg: 0, ressarcido: 0,
      a_ressarcir: 0, total_ci: 0, qtd_nes: 0,
      semaforo_verde: 0, semaforo_amarelo: 0, semaforo_vermelho: 0, registros: []
    };
    m[cc].empenhado     += Number(d.empenhado)    ||0;
    m[cc].total_pago_tg += Number(d.total_pago_tg)||0;
    m[cc].ressarcido    += Number(d.ressarcido)   ||0;
    m[cc].a_ressarcir   += Number(d.a_ressarcir)  ||0;
    m[cc].total_ci      += Number(d.total_ci)     ||0;
    m[cc].qtd_nes       += 1;
    if (d.semaforo==='verde')    m[cc].semaforo_verde   += 1;
    if (d.semaforo==='vermelho') m[cc].semaforo_vermelho+= 1;
    m[cc].registros.push(d);
  });
  return Object.values(m).sort((a:any,b:any)=>b.empenhado-a.empenhado);
}

const SEMAFOR: Record<string,{bg:string;border:string;color:string;label:string}> = {
  verde:    {bg:"#dcfce7",border:"#86efac",color:"#166534",label:"Ressarcido"},
  amarelo:  {bg:"#fef9c3",border:"#fde047",color:"#713f12",label:"Parcial"},
  vermelho: {bg:"#fee2e2",border:"#fca5a5",color:"#991b1b",label:"Pendente"},
};

function DetailPanel({ cc, onBack }: { cc: any; onBack: ()=>void }) {
  const [selAno, setSelAno] = useState("all");
  const [selFonte, setSelFonte] = useState("all");

  const s = {
    card: { background:"white", borderRadius:10, border:"1px solid #e2e8f0", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", padding:"14px 16px" } as React.CSSProperties,
    th:   { fontSize:10, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.06em", padding:"9px 10px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", fontWeight:600, textAlign:"center" as const },
    td:   { padding:"9px 10px", fontSize:11, borderBottom:"1px solid #f1f5f9", verticalAlign:"middle" as const, textAlign:"center" as const },
  };

  const anos = useMemo(() => {
    const records = selFonte === "all" ? cc.registros : cc.registros.filter((r: any) => r.fonte === selFonte);
    return Array.from(new Set(records.map((r: any) => r.ano).filter(Boolean))).sort() as number[];
  }, [cc.registros, selFonte]);

  useEffect(() => {
    if (selAno !== "all" && !anos.includes(Number(selAno))) {
      setSelAno("all");
    }
  }, [anos, selAno]);

  const filteredRegistros = useMemo(() => {
    return cc.registros.filter((r: any) => {
      if (selAno !== "all" && String(r.ano) !== selAno) return false;
      if (selFonte !== "all" && r.fonte !== selFonte) return false;
      return true;
    });
  }, [cc.registros, selAno, selFonte]);

  const stats = useMemo(() => {
    let empenhado = 0;
    let total_pago_tg = 0;
    let ressarcido = 0;
    let a_ressarcir = 0;
    let verde = 0;
    let vermelho = 0;

    filteredRegistros.forEach((r: any) => {
      empenhado     += Number(r.empenhado)     || 0;
      total_pago_tg += Number(r.total_pago_tg) || 0;

      const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(r);
      ressarcido    += (ressarcidoVal || 0);
      a_ressarcir   += (aRessarcirVal || 0);

      if (r.semaforo === 'verde') verde += 1;
      if (r.semaforo === 'vermelho') vermelho += 1;
    });

    return { empenhado, total_pago_tg, ressarcido, a_ressarcir, verde, vermelho, total: filteredRegistros.length };
  }, [filteredRegistros]);

  const totPct = (n:number,d:number) => d>0 ? `${((n/d)*100).toFixed(0)}%` : "—";

  // Barras de progresso
  const Bar = ({ value, max, color }: { value:number; max:number; color:string }) => (
    <div style={{ height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden", marginTop:4 }}>
      <div style={{ height:"100%", width:`${max>0?(value/max)*100:0}%`, background:color, borderRadius:3, transition:"width 0.6s ease" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, padding:"0 2px" }}>
      {/* Cabeçalho */}
      <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap: "wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={onBack}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:"1px solid #e2e8f0", borderRadius:8, background:"white", fontSize:12, cursor:"pointer", fontWeight:600, color:"#374151", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <ArrowLeft size={14}/> Voltar ao Grafo
          </button>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>{cc.centro_custo}</h2>
            <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>{stats.total} registros · Centro de Custo</p>
          </div>
        </div>
      </div>

      {/* KPIs principais */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
        {[
          { label:<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total Empenhado <FonteBadge fonte={selFonte} size="xs" /></span>,  value:fmt(stats.empenhado),   color:"#3b82f6", sub:"Tesouro Gerencial",                      icon:"📋" },
          { label:<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total Pago (TG) <FonteBadge fonte={selFonte} size="xs" /></span>,  value:fmt(stats.total_pago_tg),color:"#10b981", sub:pct(stats.total_pago_tg,stats.empenhado)+" do empenhado", icon:"💳" },
          { label:<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Ressarcido (Unidade) <FonteBadge fonte={selFonte} size="xs" /></span>,  value:fmt(stats.ressarcido),  color:"#14b8a6", sub:"Total acumulado", icon:"💰" },
          { label:<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>A Ressarcir (Unidade) <FonteBadge fonte={selFonte} size="xs" /></span>, value:fmt(stats.a_ressarcir), color:"#ef4444", sub:"Total acumulado", icon:"⚠️" },
        ].map(k => (
          <div key={typeof k.label === 'string' ? k.label : Math.random()} style={{ ...s.card, borderLeft:`4px solid ${k.color}`, padding:"12px" }}>
            <div style={{ fontSize:9, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em", display:"flex", alignItems:"center", gap:4, flexWrap:"nowrap", whiteSpace:"nowrap", overflow:"hidden" }}>{k.icon} {k.label}</div>
            <div style={{ fontSize:19, fontWeight:800, color:"#0f172a", marginTop:4, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Semáforo de ressarcimento */}
      <div style={{ ...s.card }}>
        <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:12 }}>Status de Ressarcimento</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { label:"🟢 Ressarcidos",  n:stats.verde,  color:"#22c55e", bg:"#f0fdf4" },
            { label:"🔴 Pendentes",    n:stats.vermelho,   color:"#ef4444", bg:"#fff5f5" },
          ].map(r => (
            <div key={r.label} style={{ background:r.bg, borderRadius:8, padding:"12px 14px", border:`1px solid ${r.color}33` }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#374151" }}>{r.label}</div>
              <div style={{ fontSize:26, fontWeight:800, color:r.color, lineHeight:1.1, margin:"4px 0" }}>{r.n}</div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>{totPct(r.n,stats.total)} dos registros</div>
              <Bar value={r.n} max={stats.total} color={r.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de registros */}
      <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", fontWeight:700, fontSize:13, color:"#0f172a", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ display:"flex", alignItems:"center" }}>Processos <FonteBadge fonte={selFonte} size="sm" /></span>
            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:400 }}>{stats.total} registros</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"center" }}>
              <div style={{fontSize:11,fontWeight:600,color:"#475569", display: "flex", gap: 4, alignItems: "center"}}>
                Origem
                <span style={{background: "#e2e8f0", color: "#1e293b", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700}}>
                  {selFonte === "all" ? "TED / EMENDA" : selFonte.toUpperCase()}
                </span>
              </div>
              <select value={selFonte} onChange={e=>setSelFonte(e.target.value)}
                style={{ padding:"4px 8px", border:"1px solid #d1d5db", borderRadius:6, fontSize:11, background:"white", cursor:"pointer", minWidth:140, boxShadow:"0 1px 2px rgba(0,0,0,0.05)" }}>
                <option value="all">Todas as Origens</option>
                <option value="TED">Somente TED</option>
                <option value="Emenda">Somente Emenda</option>
              </select>
            </div>
            
            <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"center" }}>
              <span style={{ fontSize:11, fontWeight:600, color:"#475569" }}>Ano</span>
              <select value={selAno} onChange={e=>setSelAno(e.target.value)}
                style={{ padding:"4px 8px", border:"1px solid #d1d5db", borderRadius:6, fontSize:11, background:"white", cursor:"pointer", minWidth:100, boxShadow:"0 1px 2px rgba(0,0,0,0.05)" }}>
                <option value="all">Todos</option>
                {anos.map(a=><option key={a} value={String(a)}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ overflowX:"auto", maxHeight:320, overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
            <thead style={{ position:"sticky", top:0, zIndex:1 }}>
              <tr>
                {["Status","Processo SEI (Ressarcimento C.I.)","NE","Empenhado","Pago (TG)","A Ressarcir (Unidade)","Ressarcido (Unidade)","ND Ressarcimento"].map(h=>(
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRegistros.map((d:any, i:number) => {
                const sem = SEMAFOR[d.semaforo]||SEMAFOR.vermelho;
                return (
                  <tr key={i} style={{ background:i%2===0?"white":"#fafbfc" }}>
                    <td style={s.td}>
                      <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:12, border:`1px solid ${sem.border}`, background:sem.bg, color:sem.color, fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>
                        {sem.label}
                      </span>
                    </td>
                    <td style={{ ...s.td, maxWidth:180 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#374151" }} title={d.sei}>{d.sei||"—"}</div>
                      {d.num_ted&&<div style={{ fontSize:9, color:"#94a3b8" }}>{String(d.num_ted).toLowerCase().startsWith(String(d.fonte).toLowerCase()) ? d.num_ted : `${d.fonte}: ${d.num_ted}`}</div>}
                    </td>
                    <td style={s.td}><span style={{ color:"#6366f1", fontWeight:600, fontSize:10 }}>{d.ne_key||"—"}</span></td>
                    <td style={{ ...s.td, fontWeight:600 }}>{d.empenhado>0?fmtK(d.empenhado):"—"}</td>
                    <td style={s.td}>{d.total_pago_tg>0?fmtK(d.total_pago_tg):"—"}</td>
                     {(() => {
                       const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(d);
                       return (
                         <>
                           <td style={{ ...s.td, color:aRessarcirVal !== null?"#ef4444":"#94a3b8", fontWeight:700 }}>{aRessarcirVal !== null?fmtK(aRessarcirVal):"—"}</td>
                           <td style={{ ...s.td, color:ressarcidoVal !== null?"#10b981":"#94a3b8", fontWeight:700 }}>{ressarcidoVal !== null?fmtK(ressarcidoVal):"—"}</td>
                         </>
                       );
                     })()}
                    <td style={{ ...s.td, maxWidth:140, color:"#64748b", fontSize:10 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.nd_ressarcimento||"—"}</div>
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
  const { data: rawData, loading } = useData();
  const [selected, setSelected] = useState<any>(null);

  const allData = useMemo(() => {
    return rawData.map((d: any) => {
      let fav = (d.favorecido || "").trim();
      const upperFav = fav.toUpperCase();
      if (upperFav.includes("COMPANHIA DE SANEAMENTO")) {
        fav = "CAESB";
      } else if (upperFav.includes("NEOENERGIA") || upperFav.includes("NEO ENERGIA")) {
        fav = "NEO ENERGIA";
      } else if (upperFav.includes("RCA PRODUTOS")) {
        fav = "RCA";
      }
      return { ...d, favorecido: fav };
    }).filter((d: any) => d.ano >= 2020);
  }, [rawData]);

  const byCC = useMemo(() => buildByCC(allData), [allData]);

  const handleNodeClick = (nodeData: any) => {
    if (!nodeData) return;
    const cc = byCC.find((c:any) => c.centro_custo === nodeData.centro_custo);
    if (cc) setSelected(cc);
  };

  // Calcula a altura disponível para o gráfico (viewport - header do layout)
  const chartHeight = typeof window !== "undefined" ? window.innerHeight - 72 : 600;

  return (
    <DashboardLayout hideUpdateBadge={!selected}>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Carregando dados em tempo real...</div>
      ) : selected ? (
        // Vista de detalhe
        <DetailPanel cc={selected} onBack={() => setSelected(null)} />
      ) : (
        // Vista do grafo — tela cheia sem padding extra
        <div style={{ margin:"-24px -24px 0", position:"relative" }}>
          <div style={{ position:"absolute", top:16, left:20, zIndex:10, pointerEvents:"none" }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:"rgba(255,255,255,0.9)", margin:0, textShadow:"0 2px 8px rgba(0,0,0,0.6)" }}>
              Ecossistema de Custos Indiretos
            </h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", margin:"2px 0 0" }}>
              {byCC.length} unidades · {allData.length} registros · Clique em uma unidade para detalhar
            </p>
          </div>
          <CINetworkChart data={byCC} height={chartHeight} onNodeClick={handleNodeClick} />
        </div>
      )}
    </DashboardLayout>
  );
}
