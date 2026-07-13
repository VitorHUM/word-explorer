import Link from "next/link";

export function AuthFormShell({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-color-white px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-color-border bg-color-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 space-y-2">
          <Link className="font-primary text-2xl text-color-primary" href="/">
            Word Explorer
          </Link>
          <h1 className="font-primary text-3xl text-color-text">{title}</h1>
          <p className="font-secondary text-sm text-color-muted">{description}</p>
        </div>
        {children}
        <div className="mt-6 text-sm text-color-muted">{footer}</div>
      </section>
    </main>
  );
}
