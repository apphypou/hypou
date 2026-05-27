import { Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  mine?: boolean;
}

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

// Fix duration for WebM/Opus blobs that report Infinity (Chrome MediaRecorder bug)
const fixDuration = (audio: HTMLAudioElement): Promise<number> =>
  new Promise((resolve) => {
    if (isFinite(audio.duration) && audio.duration > 0) {
      resolve(audio.duration);
      return;
    }
    const onSeeked = () => {
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("seeked", onSeeked);
      audio.currentTime = 0;
      resolve(isFinite(audio.duration) ? audio.duration : 0);
    };
    const onDur = () => {
      if (isFinite(audio.duration) && audio.duration > 0 && audio.duration !== Infinity) {
        audio.removeEventListener("durationchange", onDur);
        audio.removeEventListener("seeked", onSeeked);
        resolve(audio.duration);
      }
    };
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("seeked", onSeeked);
    try {
      audio.currentTime = 1e101;
    } catch {
      resolve(0);
    }
  });

export const AudioPlayer = ({ src, mine }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = src;
    audioRef.current = audio;

    const onLoaded = async () => {
      const d = await fixDuration(audio);
      setDuration(d);
      setReady(true);
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const v = Number(e.target.value);
    a.currentTime = (v / 100) * duration;
    setCurrent(a.currentTime);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const remaining = ready ? duration - current : 0;

  // Mine bubble is cyan; use WHITE accents (not black) for legibility.
  const accent = mine ? "bg-white" : "bg-primary";
  const trackBg = mine ? "bg-white/30" : "bg-foreground/10";
  const accentText = mine ? "text-white/85" : "text-foreground/70";
  const btnBg = mine ? "bg-white/25 text-white" : "bg-primary/15 text-primary";

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={toggle}
        className={`h-9 w-9 shrink-0 rounded-full ${btnBg} flex items-center justify-center transition-transform active:scale-95`}
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className={`relative h-1.5 rounded-full ${trackBg} overflow-hidden`}>
          <div className={`absolute inset-y-0 left-0 ${accent} rounded-full`} style={{ width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={onSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Posição do áudio"
          />
        </div>
        <span className={`text-[10px] font-mono tabular-nums ${accentText}`}>
          {ready ? formatTime(playing || current > 0 ? current : duration) : "--:--"}
        </span>
      </div>
    </div>
  );
};
