import { lazy, Suspense } from "react";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

// Lazy loading: cada página só é baixada quando o usuário navegar até ela
const App = lazy(() => import("./App"));
const GraficosPage = lazy(() => import("./GraficosPage"));
const ComparativosPage = lazy(() => import("./ComparativosPage"));
const LandingPage = lazy(() => import("./LandingPage"));

function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
      color: "#38bdf8",
      fontSize: 14,
      fontFamily: "sans-serif",
      gap: 10,
    }}>
      <div style={{
        width: 20, height: 20, border: "2px solid #38bdf8",
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      Carregando...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Router() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/dashboard" component={App} />
          <Route path="/graficos" component={GraficosPage} />
          <Route path="/comparisons" component={ComparativosPage} />
          <Route component={LandingPage} />
        </Switch>
      </Suspense>
    </WouterRouter>
  );
}
