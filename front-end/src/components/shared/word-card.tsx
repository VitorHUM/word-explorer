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

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      {!onPreview ? (
        <Link
          aria-label={`Abrir detalhes de ${word}`}
          className="absolute inset-0 rounded-2xl"
          href={destination}
        />
      ) : null}
      <div className="relative z-10">
        <Link
          className="font-primary text-lg text-primary hover:text-primary-strong"
          href={destination}
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
      <div className="relative z-10 flex items-center gap-2">
        {onPreview ? (
          <Button onClick={onPreview} size="sm" variant="secondary">
            Ver detalhes
          </Button>
        ) : null}
        {action}
      </div>
    </motion.div>
  );
}
