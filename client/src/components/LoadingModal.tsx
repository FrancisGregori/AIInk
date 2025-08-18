import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
}

export default function LoadingModal({ 
  isOpen, 
  title = "Procesando...", 
  description = "Por favor espera mientras procesamos tu solicitud."
}: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-dark-gray border-medium-gray max-w-sm mx-4 text-center">
        <div className="flex flex-col items-center space-y-4 py-4">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-light-gray">{description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
