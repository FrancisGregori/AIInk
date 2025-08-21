import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Coins, User, ArrowLeft, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User as UserType } from '@shared/schema';
import { Link } from 'wouter';

export default function AdminCredits() {
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [creditsToAdd, setCreditsToAdd] = useState('50');
  
  // Get current user info
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  // Mutation to add credits
  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      return apiRequest('POST', '/api/admin/add-credits', { userId, credits });
    },
    onSuccess: () => {
      toast({
        title: "Créditos agregados",
        description: `Se agregaron ${creditsToAdd} créditos exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setCreditsToAdd('50');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron agregar los créditos",
        variant: "destructive",
      });
    },
  });

  const handleAddCredits = () => {
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) {
      toast({
        title: "Error",
        description: "Debes especificar un ID de usuario",
        variant: "destructive",
      });
      return;
    }

    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      toast({
        title: "Error",
        description: "La cantidad de créditos debe ser un número positivo",
        variant: "destructive",
      });
      return;
    }

    addCreditsMutation.mutate({ userId: targetUserId, credits });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Perfil
          </Button>
        </Link>
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon"
            title="Volver al Inicio"
          >
            <X className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Administrador de Créditos - Testing
          </CardTitle>
          <CardDescription>
            Herramienta temporal para agregar créditos y probar el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta es una herramienta de desarrollo. En producción, los créditos se comprarán mediante el sistema de pagos.
            </AlertDescription>
          </Alert>

          {currentUser && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tu cuenta actual</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">ID: {currentUser.id}</p>
                  <p className="text-lg font-bold">{currentUser.credits || 0} créditos</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">
                ID de Usuario (opcional - dejar vacío para agregar a tu cuenta)
              </Label>
              <Input
                id="userId"
                placeholder={currentUser?.id || "ID del usuario"}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                data-testid="input-user-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">
                Cantidad de Créditos
              </Label>
              <div className="flex gap-2">
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  data-testid="input-credits"
                />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsToAdd('10')}
                  >
                    10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsToAdd('50')}
                  >
                    50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsToAdd('100')}
                  >
                    100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsToAdd('500')}
                  >
                    500
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAddCredits}
              disabled={addCreditsMutation.isPending}
              className="w-full"
              data-testid="button-add-credits"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addCreditsMutation.isPending ? 'Agregando...' : `Agregar ${creditsToAdd} Créditos`}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Costos del Sistema:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Stencil Tool: 5 créditos por generación</li>
              <li>• Design Editor: 3 créditos por edición</li>
              <li>• Chat con IA: Gratis (no consume créditos)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}