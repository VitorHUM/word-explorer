import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

type WordCardProps = {
  word: string;
  added?: string;
  action?: React.ReactNode;
  onPreview?: () => void;
  subtitle?: string;
  href?: string;
};

export function WordCard({
  word,
  added,
  action,
  onPreview,
  subtitle,
  href,
}: WordCardProps) {
  const destination = href ?? `/word/${word}`;
  const isPreviewable = Boolean(onPreview);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!onPreview || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    onPreview();
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between ${isPreviewable ? "cursor-pointer" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      onClick={onPreview}
      onKeyDown={handleKeyDown}
      role={isPreviewable ? "button" : undefined}
      tabIndex={isPreviewable ? 0 : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="relative z-10">
        <Link
          className="font-primary text-lg text-primary hover:text-primary-strong"
          href={destination}
          onClick={(event) => event.stopPropagation()}
        >
          {word}
        </Link>
        {added ? (
          <p className="font-secondary text-sm text-muted">
            {formatDate(added)}
          </p>
        ) : null}
        {subtitle ? (
          <p className="font-secondary text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div
        className="relative z-10 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        {onPreview ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={destination}>Ver detalhes</Link>
          </Button>
        ) : null}
        {action}
      </div>
    </motion.div>
  );
}
