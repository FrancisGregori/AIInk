import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JobProvider } from "@/contexts/JobContext";
import JobNotification from "@/components/JobNotification";
import Home from "@/pages/home";
import StencilTool from "@/pages/stencil-tool";
import DesignEditor from "@/pages/design-editor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/stencil-tool" component={StencilTool} />
      <Route path="/design-editor" component={DesignEditor} />
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
