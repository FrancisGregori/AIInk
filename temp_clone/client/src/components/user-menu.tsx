import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, CreditCard } from 'lucide-react';

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 text-gray-200 hover:text-white">
          <User className="h-4 w-4" />
          <span className="text-sm truncate max-w-[150px]">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800">
        <DropdownMenuLabel className="text-gray-200">Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Plan: Gratuito</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem 
          onClick={signOut}
          className="text-red-400 hover:text-red-300 focus:text-red-300"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}