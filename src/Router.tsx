import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import App from "./App";
import GraficosPage from "./GraficosPage";
import ComparativosPage from "./ComparativosPage";
import LandingPage from "./LandingPage";

export default function Router() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={App} />
        <Route path="/graficos/academica">
          {() => <GraficosPage initialMatrix="Matriz Acadêmica" />}
        </Route>
        <Route path="/graficos/administrativa">
          {() => <GraficosPage initialMatrix="Matriz Administrativa" />}
        </Route>
        <Route path="/graficos">
          {() => <GraficosPage initialMatrix="Matriz Acadêmica" />}
        </Route>
        <Route path="/comparisons" component={ComparativosPage} />
        <Route component={LandingPage} />
      </Switch>
    </WouterRouter>
  );
}
