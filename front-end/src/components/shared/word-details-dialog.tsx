import { WordDetailsView } from "@/components/shared/word-details-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function WordDetailsDialog({
  onClose,
  word,
}: {
  onClose: () => void;
  word: string | null;
}) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={Boolean(word)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogTitle className="sr-only">Detalhes da palavra</DialogTitle>
        <DialogDescription className="sr-only">
          Visualização detalhada da palavra selecionada.
        </DialogDescription>
        <div className="p-2">
          {word ? <WordDetailsView showBackLink={false} word={word} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
