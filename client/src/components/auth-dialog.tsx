import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: "es" | "en";
  toolType: "stencil" | "design";
}

export function AuthDialog({ open, onOpenChange, language = "es", toolType }: AuthDialogProps) {
  const credits = toolType === "stencil" ? 5 : 3;
  
  const content = {
    es: {
      title: "Inicia sesión para continuar",
      description: toolType === "stencil" 
        ? "Para generar stencils profesionales, necesitas iniciar sesión. Cada stencil usa 5 créditos."
        : "Para editar y transformar diseños, necesitas iniciar sesión. Cada diseño usa 3 créditos.",
      features: [
        "Acceso a todos los modelos AI",
        "Galería personal de diseños",
        "Descarga en alta resolución",
        "Historial de trabajos"
      ],
      signIn: "Iniciar Sesión",
      cancel: "Cancelar"
    },
    en: {
      title: "Sign in to continue",
      description: toolType === "stencil"
        ? "To generate professional stencils, you need to sign in. Each stencil uses 5 credits."
        : "To edit and transform designs, you need to sign in. Each design uses 3 credits.",
      features: [
        "Access to all AI models",
        "Personal design gallery",
        "High resolution downloads",
        "Job history"
      ],
      signIn: "Sign In",
      cancel: "Cancel"
    }
  };

  const t = content[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="pt-3">
            {t.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-4 text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="text-2xl font-bold">{credits}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === "es" ? "créditos por" : "credits per"} {toolType === "stencil" ? "stencil" : language === "es" ? "diseño" : "design"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "es" ? "Beneficios incluidos:" : "Included benefits:"}
            </p>
            <ul className="space-y-1">
              {t.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {t.signIn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}