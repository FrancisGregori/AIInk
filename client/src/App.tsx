import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JobProvider } from "@/contexts/JobContext";
import JobNotification from "@/components/JobNotification";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import StencilTool from "@/pages/stencil-tool";
import DesignEditor from "@/pages/design-editor";
import Pricing from "@/pages/pricing";
import AuthLanding from "@/pages/auth-landing";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/pricing" component={Pricing} />
      
      {/* Show different home page based on authentication */}
      {!isAuthenticated ? (
        <>
          <Route path="/" component={AuthLanding} />
          <Route path="/stencil-tool" component={AuthLanding} />
          <Route path="/design-editor" component={AuthLanding} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/stencil-tool" component={StencilTool} />
          <Route path="/design-editor" component={DesignEditor} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JobProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </JobProvider>
    </QueryClientProvider>
  );
}

export default App;
