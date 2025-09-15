import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JobProvider } from "@/contexts/JobContext";
import JobNotification from "@/components/JobNotification";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/home";
import StencilTool from "@/pages/stencil-tool";
import DesignEditor from "@/pages/design-editor";
import Pricing from "@/pages/pricing";
import SimpleLogin from "@/pages/simple-login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import Gallery from "@/pages/gallery";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/login" component={SimpleLogin} />
      <Route path="/signup" component={Signup} />

      {/* Protected routes - Require authentication */}
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/gallery">
        <ProtectedRoute>
          <Gallery />
        </ProtectedRoute>
      </Route>
      <Route path="/stencil-tool">
          <StencilTool />
      </Route>
      <Route path="/design-editor">
          <DesignEditor />
      </Route>
      <Route path="/checkout">
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </Route>
      <Route path="/subscribe">
        <ProtectedRoute>
          <Subscribe />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseAuthProvider>
        <JobProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </JobProvider>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
