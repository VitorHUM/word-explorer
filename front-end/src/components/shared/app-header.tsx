"use client";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { cn } from "@/lib/utils";
import { BookOpenText, Heart, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/home", label: "Início", icon: House },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/dictionary", label: "Dicionário", icon: BookOpenText },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="font-primary text-xl text-primary" href="/home">
            Word Explorer
          </Link>
          <p className="font-secondary text-sm text-muted">
            Seu dicionário pessoal para explorar palavras em inglês.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-1 rounded-full bg-surface-soft p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-accent",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "bg-primary text-white"
                    : "text-text hover:bg-accent-soft",
                )}
                href={link.href}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
