import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated } from "@/lib/auth";

import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory/index";
import ProductDetail from "@/pages/inventory/product-detail";
import Customers from "@/pages/customers/index";
import Sales from "@/pages/sales/index";
import Settings from "@/pages/settings";
import AiAgent from "@/pages/ai-agent";
import Subscription from "@/pages/subscription";
import Pricing from "@/pages/pricing";
import Stats from "@/pages/stats";
import UsersPage from "@/pages/users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  if (!isAuthenticated()) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/inventory">{() => <ProtectedRoute component={Inventory} />}</Route>
      <Route path="/inventory/:id">{() => <ProtectedRoute component={ProductDetail} />}</Route>
      <Route path="/customers">{() => <ProtectedRoute component={Customers} />}</Route>
      <Route path="/sales">{() => <ProtectedRoute component={Sales} />}</Route>
      <Route path="/ai-agent">{() => <ProtectedRoute component={AiAgent} />}</Route>
      <Route path="/subscription">{() => <ProtectedRoute component={Subscription} />}</Route>
      <Route path="/pricing">{() => <ProtectedRoute component={Pricing} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/stats">{() => <ProtectedRoute component={Stats} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={UsersPage} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
