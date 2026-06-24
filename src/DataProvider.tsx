import { createContext, useContext, useEffect, useState } from "react";

interface DataContextType {
  records: any[];
  adiantamentos: any[];
  meta: { lastUpdated: string; filename: string };
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  records: [],
  adiantamentos: [],
  meta: { lastUpdated: "", filename: "" },
  loading: true,
  error: null,
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<any[]>([]);
  const [adiantamentos, setAdiantamentos] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ lastUpdated: "", filename: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("./data.json")
      .then(res => {
        if (!res.ok) throw new Error("Erro ao carregar data.json");
        return res.json();
      })
      .then(json => {
        if (json && typeof json === "object" && "records" in json) {
          setRecords(json.records || []);
          setAdiantamentos(json.adiantamentos || []);
        } else {
          // Fallback se o JSON for uma lista simples
          setRecords(Array.isArray(json) ? json : []);
          setAdiantamentos([]);
        }
        
        fetch("./metadata.json")
          .then(res => res.json())
          .then(metaJson => {
            setMeta(metaJson);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(e => {
        console.error("Erro ao carregar dados locais:", e);
        setError("Não foi possível carregar os dados.");
        setLoading(false);
      });
  }, []);

  return (
    <DataContext.Provider value={{ records, adiantamentos, meta, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}
