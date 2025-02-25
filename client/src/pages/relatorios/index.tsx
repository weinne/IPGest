import { Navigate, Route, Switch } from "wouter";
import { Navigation } from "@/components/layout/navigation";
import MembrosReport from "./membros";
import EstatisticasReport from "./estatisticas";
import OcorrenciasReport from "./ocorrencias";
import GraficosReport from "./graficos";

export default function RelatoriosPage() {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-8">
      <Navigation />
      <Switch>
        <Route path="/relatorios/membros" component={MembrosReport} />
        <Route path="/relatorios/estatisticas" component={EstatisticasReport} />
        <Route path="/relatorios/ocorrencias" component={OcorrenciasReport} />
        <Route path="/relatorios/graficos" component={GraficosReport} />
        <Route path="/relatorios">
          <Navigate to="/relatorios/membros" />
        </Route>
      </Switch>
    </div>
  );
}