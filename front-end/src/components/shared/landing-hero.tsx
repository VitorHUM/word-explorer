import { MotionFade } from "@/components/shared/motion-fade";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { BookOpenText, Heart, History, Search } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Search,
    title: "Busca",
    description:
      "Pesquise palavras em inglês com feedback rápido e detalhes completos.",
  },
  {
    icon: History,
    title: "Histórico pessoal",
    description: "Acompanhe as últimas palavras consultadas em sua conta.",
  },
  {
    icon: Heart,
    title: "Favoritos",
    description: "Monte sua própria lista de palavras para revisar depois.",
  },
];

export function LandingHero() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <MotionFade
          className="mb-12 flex items-center justify-between"
          delay={0.05}
        >
          <Link className="font-primary text-2xl text-primary" href="/">
            Word Explorer
          </Link>
          <ThemeToggle />
        </MotionFade>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <MotionFade className="space-y-6" delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">
              <BookOpenText className="h-4 w-4 text-primary" />
              Dicionário, histórico e favoritos
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-primary text-4xl leading-tight text-text sm:text-5xl">
                Um dicionário em inglês feito para pesquisar, aprender e guardar
                o que importa.
              </h1>
              <p className="max-w-2xl font-secondary text-base text-muted sm:text-lg">
                O Word Explorer, busca por palavras, histórico de consultas e
                favoritos em uma experiência simples, responsiva e direta.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register">Criar conta</Link>
              </Button>
            </div>
          </MotionFade>

          <MotionFade className="grid gap-4" delay={0.18}>
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
                  key={feature.title}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-primary text-xl text-text">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </MotionFade>
        </div>
      </div>
    </main>
  );
}
