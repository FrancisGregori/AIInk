import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { ArrowLeft, CreditCard, User, Mail, Calendar, Package, LogOut } from "lucide-react";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { signOut } = useFirebaseAuth();
  const { toast } = useToast();
  
  // Fetch credits data
  const { data: credits } = useQuery({
    queryKey: ["/api/credits"],
    enabled: isAuthenticated,
  });
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-zinc-400 mb-6">Please sign in to view your profile</p>
              <Link href="/login">
                <Button className="bg-white text-black hover:bg-gray-200">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-2xl">
        {/* Back Button */}
        <div className="flex justify-start items-center mb-6">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-zinc-400">Manage your account and credits</p>
        </div>

        {/* User Information Card */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <span className="font-medium">{user.email || "Not provided"}</span>
            </div>
            
            <Separator className="bg-zinc-800" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <User className="h-4 w-4" />
                <span>User ID</span>
              </div>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            
            {user.createdAt && (
              <>
                <Separator className="bg-zinc-800" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>Member Since</span>
                  </div>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credits Card */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credits ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">
                    {credits.available}
                  </div>
                  <div className="text-zinc-400">Available Credits</div>
                </div>
                
                <Separator className="bg-zinc-800" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-zinc-400">Monthly Allowance</div>
                    <div className="font-medium">{credits.monthlyAllowance} credits</div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Credits Used</div>
                    <div className="font-medium">{credits.used} credits</div>
                  </div>
                </div>
                
                <Separator className="bg-zinc-800" />
                
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Stencil Generation</span>
                    <span className="font-medium text-white">5 credits</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Design Editor</span>
                    <span className="font-medium text-white">3 credits</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Current Plan</span>
                <span className="font-medium capitalize">
                  {credits?.subscriptionTier || "Free"}
                </span>
              </div>
              
              <Link href="/pricing">
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Sign Out Button */}
        <div className="mt-8">
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-900 text-red-500 hover:bg-red-900/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
}