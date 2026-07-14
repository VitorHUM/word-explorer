import { MotionFade } from "@/components/shared/motion-fade";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import Link from "next/link";

export function AuthFormShell({
  title,
  footer,
  children,
}: {
  title: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <MotionFade className="w-full max-w-md" delay={0.05}>
        <section className="w-full rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Link className="font-primary text-2xl text-primary" href="/">
                Word Explorer
              </Link>
              <h1 className="font-primary text-3xl text-text">{title}</h1>
            </div>
            <ThemeToggle />
          </div>
          {children}
          <div className="mt-6 text-sm text-muted">{footer}</div>
        </section>
      </MotionFade>
    </main>
  );
}
