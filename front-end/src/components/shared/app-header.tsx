"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/dictionary", label: "Dicionario" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogout();
  const sessionQuery = useSession();

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  }

  return (
    <header className="border-b border-color-border bg-color-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="font-primary text-xl text-color-primary" href="/">
            Word Explorer
          </Link>
          <p className="font-secondary text-sm text-color-muted">
            {sessionQuery.data ? `Ola, ${sessionQuery.data.name}` : "Carregando sessao..."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-1 rounded-full bg-color-surface p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-accent",
                  pathname === link.href
                    ? "bg-color-primary text-color-white"
                    : "text-color-text hover:bg-color-accent-light",
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button onClick={handleLogout} size="sm" variant="outline">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
