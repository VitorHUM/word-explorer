import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type WordCardProps = {
  word: string;
  added?: string;
  action?: React.ReactNode;
  onPreview?: () => void;
};

export function WordCard({ word, added, action, onPreview }: WordCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-color-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link className="font-primary text-lg text-color-primary hover:text-color-accent" href={`/word/${word}`}>
          {word}
        </Link>
        {added ? <p className="font-secondary text-sm text-color-muted">{formatDate(added)}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {onPreview ? (
          <Button onClick={onPreview} size="sm" variant="secondary">
            Ver detalhes
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
