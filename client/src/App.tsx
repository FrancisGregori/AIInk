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
import SimpleLogin from "@/pages/simple-login";
import Profile from "@/pages/profile";
import Gallery from "@/pages/gallery";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes - Anyone can explore */}
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/login" component={SimpleLogin} />
      <Route path="/profile" component={Profile} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/stencil-tool" component={StencilTool} />
      <Route path="/design-editor" component={DesignEditor} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      
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
