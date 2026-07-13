import { WordDetailsView } from "@/components/shared/word-details-view";

export default async function WordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word } = await params;

  return <WordDetailsView word={decodeURIComponent(word)} />;
}
