import { useState, useMemo, useEffect } from "react";
import { useData } from "./DataProvider";
import DashboardLayout from "./components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { Checkbox } from "./components/ui/checkbox";
import { X, ChevronDown } from "lucide-react";
import { FonteBadge } from "./components/ui/FonteBadge";

const fmt = (v: number) => isNaN(v) ? "R$ 0" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);



const fmtK = (v: number) => !v||isNaN(v) ? "—" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",notation:"compact",maximumFractionDigits:1}).format(v);
const pct = (a:number,b:number) => b>0 ? ((a/b)*100).toFixed(1)+"%" : "0%";

const SEMAFOR: Record<string,{bg:string;border:string;color:string;label:string;icon:string}> = {
  verde:    {bg:"#dcfce7",border:"#86efac",color:"#166534",label:"Ressarcido",icon:"●"},
  vermelho: {bg:"#fee2e2",border:"#fca5a5",color:"#991b1b",label:"Pendente",icon:"○"},
};



function MultiSel({label,opts,sel,set}:{label:string;opts:string[];sel:string[];set:(v:string[])=>void}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
      <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,background:"white",fontSize:11,cursor:"pointer",width:168,gap:4}}>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.length>0?`${sel.length} selecionado(s)`:"Todos"}</span>
            <ChevronDown size={13} style={{opacity:0.5,flexShrink:0}}/>
          </button>
        </PopoverTrigger>
        <PopoverContent style={{width:200,padding:0}}>
          <Command>
            <CommandInput placeholder="Buscar…"/>
            {opts.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc",cursor:"pointer"}}
                onClick={()=>set(sel.length===opts.length?[]:[...opts])}>
                <Checkbox checked={sel.length===opts.length&&opts.length>0} style={{pointerEvents:"none"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>Todos</span>
              </div>
            )}
            <CommandList>
              <CommandEmpty>Nenhum.</CommandEmpty>
              <CommandGroup>
                {opts.map(o=>(
                  <CommandItem key={o} value={o} onSelect={()=>set(sel.includes(o)?sel.filter(x=>x!==o):[...sel,o])} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                    <Checkbox checked={sel.includes(o)} style={{pointerEvents:"none"}}/>
                    <span style={{fontSize:11}}>{o}</span>
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

function KpiCard({title,value,sub,color,icon}:{title:React.ReactNode;value:string;sub?:string;color:string;icon:string}) {
  return (
    <div style={{background:"white",borderRadius:10,border:"1px solid #e2e8f0",borderLeft:`4px solid ${color}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",padding:"12px 14px"}}>
      <div style={{fontSize:9,fontWeight:600,color:"#64748b",letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:4,flexWrap:"nowrap",whiteSpace:"nowrap",overflow:"hidden"}}>
        <span style={{fontSize:16}}>{icon}</span> {title}
      </div>
      <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginTop:5,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{sub}</div>}
    </div>
  );
}

export function calcUnidadeValues(d: any) {
  const sem = d.semaforo;
  const pago = Number(d.total_pago_tg) || 0;
  const emp = Number(d.empenhado) || 0;

  let aRessarcirVal: number | null = null;
  let ressarcidoVal: number | null = null;

  if (sem === 'verde') {
    ressarcidoVal = pago / 2;
    aRessarcirVal = null;
  } else if (emp > 0 && pago > 0) {
    aRessarcirVal = pago / 2;
    ressarcidoVal = null;
  } else {
    aRessarcirVal = null;
    ressarcidoVal = null;
  }

  return { aRessarcirVal, ressarcidoVal };
}

export default function App() {
  const { data: rawData, loading } = useData();

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

  const [selUnidade, setSelUnidade] = useState<string[]>([]);
  const [selSemaforo, setSelSemaforo] = useState("all");
  const [selAno, setSelAno] = useState("all");
  const [selFonte, setSelFonte] = useState("all");

  const unidades = useMemo(()=>Array.from(new Set(allData.map((d:any)=>(d.centro_custo||"").trim()).filter(Boolean))).sort() as string[],[allData]);
  const anos = useMemo(() => {
    const dataByFonte = selFonte === "all" ? allData : allData.filter((d: any) => d.fonte === selFonte);
    return Array.from(new Set(dataByFonte.map((d: any) => d.ano).filter(Boolean))).sort() as number[];
  }, [allData, selFonte]);

  useEffect(() => {
    if (selAno !== "all" && !anos.includes(Number(selAno))) {
      setSelAno("all");
    }
  }, [anos, selAno]);

  const hasFilter = selUnidade.length>0||selSemaforo!=="all"||selAno!=="all"||selFonte!=="all";

  const filtered = useMemo(()=>{
    return allData.filter((d:any)=>{
      const cc=(d.centro_custo||"").trim();
      if(selUnidade.length>0&&!selUnidade.includes(cc)) return false;
      if(selSemaforo!=="all"&&d.semaforo!==selSemaforo) return false;
      if(selAno!=="all"&&String(d.ano)!==selAno) return false;
      if(selFonte!=="all"&&d.fonte!==selFonte) return false;
      return true;
    });
  },[allData,selUnidade,selSemaforo,selAno,selFonte]);

  const T = useMemo(()=>{
    const n = (key:string)=>filtered.reduce((s:number,d:any)=>s+(Number(d[key])||0),0);
    const empenhado = n('empenhado');
    const liquidado = n('liquidado');
    const pago_tg     = n('total_pago_tg');
    const rap         = n('total_rap');
    const total_ci    = n('total_ci');

    let ressarcido = 0;
    let a_ressarcir = 0;
    filtered.forEach((d: any) => {
      const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(d);
      ressarcido += (ressarcidoVal || 0);
      a_ressarcir += (aRessarcirVal || 0);
    });

    const verde    = filtered.filter((d:any)=>d.semaforo==='verde').length;
    const vermelho = filtered.filter((d:any)=>d.semaforo==='vermelho').length;
    const qtd_nes      = new Set(filtered.map((d:any)=>d.ne_key).filter(Boolean)).size;
    const qtd_teds     = new Set(filtered.map((d:any)=>d.num_ted).filter(Boolean)).size;
    const qtd_unidades = new Set(filtered.map((d:any)=>d.centro_custo).filter(Boolean)).size;
    return {empenhado,liquidado,pago_tg,rap,total_ci,ressarcido,a_ressarcir,verde,vermelho,qtd_nes,qtd_teds,qtd_unidades,total:filtered.length};
  },[filtered]);



  const s: Record<string,React.CSSProperties> = {
    panel: {background:"white",borderRadius:10,border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
    th: {fontSize:10,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:"0.06em",padding:"9px 10px",textAlign:"center" as const,background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:600},
    td: {padding:"9px 10px",fontSize:11,borderBottom:"1px solid #f1f5f9",verticalAlign:"middle" as const,textAlign:"center" as const},
    sectionTitle: {fontWeight:700,fontSize:14,color:"#0f172a",padding:"14px 16px",borderBottom:"1px solid #e8edf2"},
  };

  const labelFonte = selFonte === "all" ? "TED / Emenda" : selFonte;

  return (
    <DashboardLayout>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Carregando dados em tempo real...</div>
      ) : (
      <div style={{display:"flex",flexDirection:"column",gap:22}}>

        {/* Header */}
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:"#0f172a",margin:0,display:"flex",alignItems:"center"}}>
            Dashboard Custos Indiretos <FonteBadge fonte={selFonte} size="lg" />
          </h1>
          <p style={{fontSize:13,color:"#64748b",marginTop:4,margin:"4px 0 0"}}>
            Painel Integrado: Controle Manual + Tesouro Gerencial · {filtered.length} registros
          </p>
        </div>

        {/* Filters */}
        <div style={{...s.panel,padding:"14px 16px",display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-end"}}>
          <MultiSel label="Unidade / Centro de Custo" opts={unidades} sel={selUnidade} set={setSelUnidade}/>
          <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Status Ressarcimento</span>
            <select value={selSemaforo} onChange={e=>setSelSemaforo(e.target.value)}
              style={{padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,background:"white",cursor:"pointer",width:168}}>
              <option value="all">Todos</option>
              <option value="verde">🟢 Ressarcido</option>
              <option value="vermelho">🔴 Pendente</option>
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Ano</span>
            <select value={selAno} onChange={e=>setSelAno(e.target.value)}
              style={{padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,background:"white",cursor:"pointer",width:100}}>
              <option value="all">Todos</option>
              {anos.map(a=><option key={a} value={String(a)}>{a}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Fonte</span>
            <select value={selFonte} onChange={e=>setSelFonte(e.target.value)}
              style={{padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,background:"white",cursor:"pointer",width:120}}>
              <option value="all">Todas</option>
              <option value="TED">Apenas TED</option>
              <option value="Emenda">Apenas Emenda</option>
            </select>
          </div>
          {hasFilter&&(
            <button onClick={()=>{setSelUnidade([]);setSelSemaforo("all");setSelAno("all");setSelFonte("all");}}
              style={{display:"flex",alignItems:"center",gap:4,padding:"5px 11px",border:"1px solid #d1d5db",borderRadius:6,background:"white",fontSize:11,cursor:"pointer",alignSelf:"flex-end"}}>
              <X size={12}/> Limpar
            </button>
          )}
        </div>

        {/* KPIs Row 1 — Tesouro Gerencial */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>📊 Execução Financeira — Tesouro Gerencial</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total Empenhado <FonteBadge fonte={selFonte} size="xs" /></span>}  value={fmt(T.empenhado)}  sub={`base TG`}                           color="#3b82f6" icon="📋"/>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total Pago (TG) <FonteBadge fonte={selFonte} size="xs" /></span>}  value={fmt(T.pago_tg)}    sub={pct(T.pago_tg,T.empenhado)}         color="#10b981" icon="💳"/>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total a Pagar <FonteBadge fonte={selFonte} size="xs" /></span>}    value={fmt(T.empenhado - T.pago_tg)} sub={`${pct(T.empenhado - T.pago_tg,T.empenhado)} do empenhado`} color="#f59e0b" icon="⏳"/>
          </div>
        </div>

        {/* KPIs Row 2 — Partilha de Recursos (50% / 50%) */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>🤝 Partilha de Custos Indiretos (50% / 50%)</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Pago à Unidade (50%) <FonteBadge fonte={selFonte} size="xs" /></span>} value={fmt(T.pago_tg / 2)} sub="Destinado à Unidade Executora" color="#6366f1" icon="🏢"/>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Pago à UnB (50%) <FonteBadge fonte={selFonte} size="xs" /></span>}     value={fmt(T.pago_tg / 2)} sub="Destinado à Administração Central" color="#ec4899" icon="🏛️"/>
          </div>
        </div>

        {/* KPIs Row 3 — Controle de Ressarcimento — Base Manual */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>🗂️ Controle de Ressarcimento — Base Manual</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Ressarcido (Unidade) <FonteBadge fonte={selFonte} size="xs" /></span>}  value={fmt(T.ressarcido)}  sub={pct(T.ressarcido,T.total_ci / 2)}  color="#14b8a6" icon="💰"/>
            <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>A Ressarcir (Unidade) <FonteBadge fonte={selFonte} size="xs" /></span>} value={fmt(T.a_ressarcir)} sub={pct(T.a_ressarcir,T.total_ci / 2)} color="#ef4444" icon="⚠️"/>
          </div>
        </div>



        {/* Main Table */}
        <div style={s.panel}>
          <div style={{...s.sectionTitle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{display:"flex",alignItems:"center"}}>Tabela Analítica — Processos <FonteBadge fonte={selFonte} size="sm" /></span>
            <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>{filtered.length} registros</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["Status","Fonte","Unidade","Processo SEI (Ressarcimento C.I.)","NE","Empenhado","Pago (TG)","A Ressarcir (Unidade)","Ressarcido (Unidade)"].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d:any,i:number)=>{
                  const sem = SEMAFOR[d.semaforo]||SEMAFOR.vermelho;
                  return (
                    <tr key={i} style={{background:i%2===0?"white":"#fafafa"}}>
                      <td style={s.td}>
                        <span style={{display:"inline-block",padding:"2px 7px",borderRadius:12,border:`1px solid ${sem.border}`,background:sem.bg,color:sem.color,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>
                          {sem.icon} {sem.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{background: d.fonte==="TED"?"#eff6ff":"#fdf4ff", color: d.fonte==="TED"?"#3b82f6":"#d946ef", padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600}}>
                          {d.fonte}
                        </span>
                      </td>
                      <td style={s.td}><span style={{fontWeight:600,color:"#0f172a"}}>{d.centro_custo||"—"}</span></td>
                      <td style={{...s.td,maxWidth:200}}>
                        <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:10,color:"#374151"}} title={d.sei}>{d.sei||"—"}</div>
                        {d.num_ted&&<div style={{fontSize:9,color:"#94a3b8"}}>{String(d.num_ted).toLowerCase().startsWith(String(d.fonte).toLowerCase()) ? d.num_ted : `${d.fonte}: ${d.num_ted}`}</div>}
                      </td>
                      <td style={s.td}><span style={{fontSize:10,color:"#6366f1",fontWeight:600}}>{d.ne_key||"—"}</span></td>
                      <td style={{...s.td,fontWeight:600}}>{d.empenhado>0?fmtK(d.empenhado):"—"}</td>

                      <td style={s.td}>{d.total_pago_tg>0?fmtK(d.total_pago_tg):"—"}</td>
                      {(() => {
                        const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(d);
                        return (
                          <>
                            <td style={{...s.td,color:aRessarcirVal !== null?"#ef4444":"#94a3b8",fontWeight:700}}>{aRessarcirVal !== null?fmtK(aRessarcirVal):"—"}</td>
                            <td style={{...s.td,color:ressarcidoVal !== null?"#10b981":"#94a3b8",fontWeight:700}}>{ressarcidoVal !== null?fmtK(ressarcidoVal):"—"}</td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}
