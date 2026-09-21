import { useNavigation } from "react-router";
import { cn } from "@/lib/cn";

/** Barrinha no topo enquanto uma rota (lazy) carrega — a interface não "trava" em branco. */
export function NavigationProgress() {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-[90] h-1 bg-gold-500 transition-all duration-500",
        busy ? "w-2/3 opacity-100" : "w-full opacity-0",
      )}
    />
  );
}
