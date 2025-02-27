import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import MembrosPage from "@/pages/membros";
import GruposPage from "@/pages/grupos";
import LiderancaPage from "@/pages/lideranca";
import RelatoriosPage from "@/pages/relatorios";
import UsuariosPage from "@/pages/usuarios";
import PerfilPage from "@/pages/perfil";
import ConfiguracoesPage from "@/pages/configuracoes";
import AssinaturasPage from "@/pages/assinaturas";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/membros" component={MembrosPage} />
      <ProtectedRoute path="/grupos" component={GruposPage} />
      <ProtectedRoute path="/lideranca" component={LiderancaPage} />
      <ProtectedRoute path="/relatorios" component={RelatoriosPage} />
      <ProtectedRoute path="/usuarios" component={UsuariosPage} />
      <ProtectedRoute path="/perfil" component={PerfilPage} />
      <ProtectedRoute path="/configuracoes" component={ConfiguracoesPage} />
      <ProtectedRoute path="/assinaturas" component={AssinaturasPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;