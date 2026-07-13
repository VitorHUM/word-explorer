import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type WordCardProps = {
  word: string;
  added?: string;
  action?: React.ReactNode;
  onPreview?: () => void;
  subtitle?: string;
};

export function WordCard({ word, added, action, onPreview, subtitle }: WordCardProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <Link className="font-primary text-lg text-primary hover:text-primary-strong" href={`/word/${word}`}>
          {word}
        </Link>
        {added ? <p className="font-secondary text-sm text-muted">{formatDate(added)}</p> : null}
        {subtitle ? <p className="font-secondary text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
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
