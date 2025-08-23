import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { CreditsData } from "@/lib/api";

export function CreditsDisplay() {
  const { data: credits, isLoading } = useQuery<CreditsData>({
    queryKey: ["/api/credits"],
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <Coins className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  const needsMoreCredits = credits.available < 5; // Less than 1 stencil

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
      needsMoreCredits 
        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
        : "bg-gray-100 dark:bg-gray-800"
    }`}>
      <Coins className="h-4 w-4" />
      <span className="text-sm font-medium">
        {credits.available} Credits
      </span>
      {needsMoreCredits && (
        <Link href="/pricing">
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
            Get More
          </Button>
        </Link>
      )}
    </div>
  );
}

export function CreditsRequirement({ cost, action }: { cost: number; action: string }) {
  const { data: credits } = useQuery<CreditsData>({
    queryKey: ["/api/credits"],
    retry: false,
  });

  if (!credits) return null;

  const hasEnoughCredits = credits.available >= cost;

  // Solo mostrar mensaje cuando NO hay suficientes créditos
  if (hasEnoughCredits) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
      <Coins className="h-3 w-3" />
      <span>Requires {cost} credits (you have {credits.available})</span>
    </div>
  );
}