import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import App from "./App";
import GraficosPage from "./GraficosPage";
import ComparativosPage from "./ComparativosPage";

export default function Router() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Switch>
        <Route path="/" component={App} />
        <Route path="/dashboard" component={App} />
        <Route path="/graficos" component={GraficosPage} />
        <Route path="/comparisons" component={ComparativosPage} />
        <Route component={App} />
      </Switch>
    </WouterRouter>
  );
}
