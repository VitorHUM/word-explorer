import { WordSearchPanel } from "@/components/shared/word-search-panel";
import { HomeHistorySection } from "@/features/home/home-history-section";

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <WordSearchPanel />
      <HomeHistorySection />
    </div>
  );
}
