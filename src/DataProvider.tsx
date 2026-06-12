import { createContext, useContext, useEffect, useState } from "react";

interface DataContextType {
  data: any[];
  meta: { lastUpdated: string; filename: string };
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  data: [],
  meta: { lastUpdated: "", filename: "" },
  loading: true,
  error: null,
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ lastUpdated: "", filename: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 0. Se estiver rodando localmente (desenvolvimento), força o uso do arquivo local
    if (import.meta.env.DEV) {
      fetch("./data.json")
        .then(res => res.json())
        .then(json => {
          setData(json);
          fetch("./metadata.json")
            .then(res => res.json())
            .then(metaJson => {
              setMeta(metaJson);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        })
        .catch(e => {
          console.error("Erro ao carregar dados locais (DEV):", e);
          setError("Não foi possível carregar os dados locais.");
          setLoading(false);
        });
      return;
    }

    // 1. Tenta buscar os dados do portal principal DPO-DOR (em produção)
    fetch("https://dpo-dor.onrender.com/custos-indiretos/data.json")
      .then(res => {
        if (!res.ok) throw new Error("Erro ao acessar API do DPO");
        return res.json();
      })
      .then(json => {
        setData(json);
        // Tenta buscar os metadados do portal principal
        fetch("https://dpo-dor.onrender.com/custos-indiretos/metadata.json")
          .then(res => res.json())
          .then(metaJson => {
            setMeta(metaJson);
            setLoading(false);
          })
          .catch(() => setLoading(false)); // ignora erro do meta se o data funcionou
      })
      .catch(err => {
        console.warn("Falha ao buscar DPO-DOR remoto. Tentando base local (fallback).", err);
        // 2. Se falhar (ex: rodando offline), tenta buscar localmente da pasta public
        fetch("./data.json")
          .then(res => res.json())
          .then(json => {
            setData(json);
            fetch("./metadata.json")
              .then(res => res.json())
              .then(metaJson => {
                setMeta(metaJson);
                setLoading(false);
              })
              .catch(() => setLoading(false));
          })
          .catch(e => {
            console.error(e);
            setError("Não foi possível conectar ao servidor principal nem carregar os dados locais.");
            setLoading(false);
          });
      });
  }, []);

  return (
    <DataContext.Provider value={{ data, meta, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}
