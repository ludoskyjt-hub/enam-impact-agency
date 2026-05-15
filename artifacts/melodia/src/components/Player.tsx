/**
 * Player.tsx — Mini lecteur audio persistent en bas de page (style Spotify)
 */
import { Play, Pause, SkipBack, SkipForward, Volume2, ExternalLink } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { formatDuration } from "@/lib/api";

export default function Player() {
  const { track, isPlaying, progress, volume, duration, togglePlay, seek, setVolume, playNext, playPrev } = usePlayer();
  if (!track) return null;

  const elapsed = formatDuration((progress / 100) * duration * 1000);
  const total   = formatDuration(duration * 1000);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 slide-up"
         style={{ background: "rgba(10,0,16,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(155,77,255,0.2)" }}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">

        {/* Artwork + infos */}
        <div className="flex items-center gap-3 w-56 min-w-0 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <img src={track.artworkUrl100} alt={track.trackName}
                 className="w-12 h-12 rounded-lg object-cover shadow-lg" />
            {isPlaying && (
              <div className="absolute inset-0 flex items-end justify-center pb-1 gap-0.5 bg-black/40 rounded-lg">
                {[1,2,3].map(i => <div key={i} className="eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{track.trackName}</p>
            <p className="text-xs truncate" style={{ color: "rgba(155,77,255,0.8)" }}>{track.artistName}</p>
          </div>
        </div>

        {/* Controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button onClick={playPrev} className="text-gray-400 hover:text-white transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #9b4dff, #6b21d4)" }}>
              {isPlaying
                ? <Pause className="w-4 h-4 text-white" fill="white" />
                : <Play  className="w-4 h-4 text-white ml-0.5" fill="white" />}
            </button>
            <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 text-right">{elapsed}</span>
            <div className="flex-1 h-1 rounded-full cursor-pointer relative group"
                 style={{ background: "rgba(155,77,255,0.2)" }}
                 onClick={e => {
                   const rect = e.currentTarget.getBoundingClientRect();
                   seek(((e.clientX - rect.left) / rect.width) * 100);
                 }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${progress}%`, background: "linear-gradient(90deg, #9b4dff, #c084fc)" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity -mt-px"
                   style={{ left: `calc(${progress}% - 6px)` }} />
            </div>
            <span className="text-xs text-gray-500 w-8">{total}</span>
          </div>
        </div>

        {/* Volume + lien */}
        <div className="flex items-center gap-3 w-32 flex-shrink-0 justify-end">
          <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input type="range" min="0" max="1" step="0.05" value={volume}
                 onChange={e => setVolume(Number(e.target.value))}
                 className="w-16 accent-purple-500 cursor-pointer" />
          <a href={track.trackViewUrl} target="_blank" rel="noopener noreferrer"
             className="text-gray-500 hover:text-purple-400 transition-colors flex-shrink-0"
             title="Ouvrir dans iTunes/Apple Music">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <p className="text-center text-xs pb-1.5" style={{ color: "rgba(155,77,255,0.4)" }}>
        🎵 Extrait 30s · iTunes — {track.primaryGenreName}
      </p>
    </div>
  );
}
