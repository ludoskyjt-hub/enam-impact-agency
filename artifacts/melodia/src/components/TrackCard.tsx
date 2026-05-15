import { Play, Pause, Music } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import type { Track } from "@/lib/api";
import { formatDuration } from "@/lib/api";

interface Props {
  track: Track;
  queue?: Track[];
  compact?: boolean;
}

export default function TrackCard({ track, queue, compact = false }: Props) {
  const { track: current, isPlaying, play, togglePlay } = usePlayer();
  const isCurrent = current?.trackId === track.trackId;

  const handlePlay = () => {
    if (isCurrent) { togglePlay(); return; }
    if (!track.previewUrl) { window.open(track.trackViewUrl, "_blank"); return; }
    play(track, queue);
  };

  if (compact) {
    return (
      <div onClick={handlePlay}
           className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all hover:scale-[1.01]"
           style={{ background: isCurrent ? "rgba(155,77,255,0.15)" : "rgba(22,0,40,0.6)", border: `1px solid ${isCurrent ? "rgba(155,77,255,0.4)" : "rgba(155,77,255,0.1)"}` }}>
        <div className="relative flex-shrink-0">
          <img src={track.artworkUrl100} alt={track.trackName} className="w-10 h-10 rounded-lg object-cover" />
          <div className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 transition-opacity ${isCurrent || "group-hover:opacity-100 opacity-0"}`}>
            {isCurrent && isPlaying
              ? <Pause className="w-4 h-4 text-white" fill="white" />
              : <Play  className="w-4 h-4 text-white ml-0.5" fill="white" />}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{track.trackName}</p>
          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{track.artistName}</p>
        </div>
        {isCurrent && isPlaying && (
          <div className="flex items-end gap-0.5 flex-shrink-0">
            {[1,2,3].map(i => <div key={i} className="eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
        )}
        <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
          {formatDuration(track.trackTimeMillis)}
        </span>
      </div>
    );
  }

  return (
    <div onClick={handlePlay}
         className="group cursor-pointer transition-all hover:scale-[1.02]"
         style={{ minWidth: 160 }}>
      <div className="relative mb-3">
        <img src={track.artworkUrl100} alt={track.trackName}
             className="w-full aspect-square rounded-2xl object-cover shadow-lg" />
        <div className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 transition-opacity ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #9b4dff, #6b21d4)", boxShadow: "0 4px 20px rgba(155,77,255,0.5)" }}>
            {isCurrent && isPlaying
              ? <Pause className="w-5 h-5 text-white" fill="white" />
              : <Play  className="w-5 h-5 text-white ml-0.5" fill="white" />}
          </div>
        </div>
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 left-2 flex items-end gap-0.5">
            {[1,2,3].map(i => <div key={i} className="eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
        )}
        {!track.previewUrl && (
          <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-0.5 text-xs" style={{ color: "var(--muted)" }}>
            <Music className="w-3 h-3 inline mr-1" />iTunes
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-white truncate">{track.trackName}</p>
      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{track.artistName}</p>
    </div>
  );
}
