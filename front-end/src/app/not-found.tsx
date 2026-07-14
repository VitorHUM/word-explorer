import { AppShell } from "@/components/shared/app-shell";
import { MotionFade } from "@/components/shared/motion-fade";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <AppShell>
      <MotionFade>
        <section className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl gap-8 border border-border bg-surface px-6 py-14 text-center shadow-sm sm:px-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-soft text-primary">
            <SearchX className="h-10 w-10" />
          </div>

          <h2 className="font-primary text-3xl font-semibold text-text">
            Página não encontrada por aqui.
          </h2>
          <p className="max-w-2xl font-secondary text-base text-muted sm:text-lg">
            A página que você tentou acessar não existe, foi movida ou não está
            disponível.
          </p>

          <Button asChild>
            <Link href="/home">
              <Home className="mr-2 h-4 w-4" />
              Voltar para o início
            </Link>
          </Button>
        </section>
      </MotionFade>
    </AppShell>
  );
}
