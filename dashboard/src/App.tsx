import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import OfflineBanner from "@/components/OfflineBanner";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { I18nProvider } from "@/lib/i18n";
import { useEffect } from "react";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Expenses from "@/pages/expenses";
import ExpenseNew from "@/pages/expense-new";
import ExpenseDetail from "@/pages/expense-detail";
import Employees from "@/pages/employees";
import Accounts from "@/pages/accounts";
import Reports from "@/pages/reports";
import Momo from "@/pages/momo";
import SettingsPage from "@/pages/settings";
import TeamPage from "@/pages/team";
import BudgetsPage from "@/pages/budgets";
import CompliancePage from "@/pages/compliance";
import AuditPage from "@/pages/audit";
import RecurringPage from "@/pages/recurring";
import ImportPage from "@/pages/import";
import AfiwaChatPage from "@/pages/afiwa"; // ✅ NOUVEAU — AFIWA Chat

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60_000,
      gcTime: 7 * 24 * 60 * 60_000,
      networkMode: "offlineFirst", // ✅ Offline-first
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

try {
  const cached = localStorage.getItem("benin-expense-rq-cache");
  if (cached) {
    const { clientState } = JSON.parse(cached);
    queryClient.setQueryData(["__hydrate__"], clientState);
  }
} catch { /* ignore */ }

window.addEventListener("beforeunload", () => {
  try {
    const state = queryClient.getQueryCache().getAll().map(q => ({
      queryKey: q.queryKey,
      data: q.state.data,
    }));
    localStorage.setItem("benin-expense-rq-cache", JSON.stringify({ clientState: state, ts: Date.now() }));
  } catch { /* ignore */ }
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold animate-pulse">B</div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;
  return <Layout><Component /></Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login"    component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/">            {() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/expenses/new">{() => <ProtectedRoute component={ExpenseNew} />}</Route>
      <Route path="/expenses/:id">{() => <ProtectedRoute component={ExpenseDetail} />}</Route>
      <Route path="/expenses">    {() => <ProtectedRoute component={Expenses} />}</Route>
      <Route path="/employees">   {() => <ProtectedRoute component={Employees} />}</Route>
      <Route path="/accounts">    {() => <ProtectedRoute component={Accounts} />}</Route>
      <Route path="/momo">        {() => <ProtectedRoute component={Momo} />}</Route>
      <Route path="/reports">     {() => <ProtectedRoute component={Reports} />}</Route>
      <Route path="/settings">    {() => <ProtectedRoute component={SettingsPage} />}</Route>
      <Route path="/team">        {() => <ProtectedRoute component={TeamPage} />}</Route>
      <Route path="/budgets">     {() => <ProtectedRoute component={BudgetsPage} />}</Route>
      <Route path="/compliance">  {() => <ProtectedRoute component={CompliancePage} />}</Route>
      <Route path="/audit">       {() => <ProtectedRoute component={AuditPage} />}</Route>
      <Route path="/recurring">   {() => <ProtectedRoute component={RecurringPage} />}</Route>
      <Route path="/import">      {() => <ProtectedRoute component={ImportPage} />}</Route>

      {/* ✅ NOUVEAU — AFIWA Chat conversationnel */}
      <Route path="/afiwa">       {() => <ProtectedRoute component={AfiwaChatPage} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineBanner />
        <I18nProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </AuthProvider>
        </I18nProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
