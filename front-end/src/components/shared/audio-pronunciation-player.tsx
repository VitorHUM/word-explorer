"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const playbackRates = [0.5, 1, 1.5];

export function AudioPronunciationPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.playbackRate = playbackRate;
  }, [playbackRate]);

  async function togglePlay() {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    await audioElement.play();
    setIsPlaying(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3">
      <audio onEnded={() => setIsPlaying(false)} ref={audioRef} src={audioUrl} />
      <Button onClick={togglePlay} size="sm" type="button" variant="secondary">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <span className="text-sm text-muted">Pronúncia</span>
      <Select
        className="w-24"
        onChange={(event) => setPlaybackRate(Number(event.target.value))}
        value={String(playbackRate)}
      >
        {playbackRates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </Select>
    </div>
  );
}
