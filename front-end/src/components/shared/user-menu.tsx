"use client";

import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserMenu() {
  const router = useRouter();
  const logoutMutation = useLogout();
  const sessionQuery = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((currentState) => !currentState)}
        size="sm"
        variant="outline"
      >
        <User className="h-4 w-4 sm:mr-2" />
        <span className="sr-only sm:not-sr-only">
          {sessionQuery.data?.name ?? "Conta"}
        </span>
        <ChevronDown className="hidden h-4 w-4 sm:ml-2 sm:block" />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-border bg-surface p-2 shadow-lg"
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Link
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text hover:bg-surface-soft"
              href="/profile"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              Perfil
            </Link>
            <button
              aria-busy={logoutMutation.isPending}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-text hover:bg-surface-soft"
              disabled={logoutMutation.isPending}
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Saindo..." : "Sair"}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
