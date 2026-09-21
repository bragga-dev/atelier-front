import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints/auth";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

const COOLDOWN_SECONDS = 60;

/** Reenvia o e-mail de confirmação, com pausa entre envios (o backend limita a 3 por hora). */
export function ResendVerification({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);

  const mutation = useMutation({
    mutationFn: () => authApi.resendVerification(email),
    onSuccess: (data) => {
      toast.success(data.detail);
      setCooldown(COOLDOWN_SECONDS);
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  return (
    <Button
      variant="outline"
      onClick={() => mutation.mutate()}
      loading={mutation.isPending}
      disabled={cooldown > 0}
    >
      {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail de confirmação"}
    </Button>
  );
}
