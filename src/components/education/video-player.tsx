"use client";

import { Button } from "@/components/ui/button";
import { MaximizeIcon, PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useRef, useState } from "react";

type VideoPlayerProps = {
  title: string;
  videoUrl?: string;
  posterUrl?: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function VideoPlayer({ title, videoUrl, posterUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function updateProgress(value: string) {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Number(value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function updateSpeed(value: string) {
    const video = videoRef.current;
    const nextSpeed = Number(value);
    setSpeed(nextSpeed);
    if (video) video.playbackRate = nextSpeed;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function openFullscreen() {
    const video = videoRef.current;
    if (video?.requestFullscreen) {
      void video.requestFullscreen();
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-black shadow-3xl">
      <div className="relative aspect-video bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="h-full w-full object-cover"
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_35%),linear-gradient(135deg,_#050505,_#1f2937)] p-8 text-center text-white">
            <p className="text-sm text-white/60">Video lesson preview</p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
              Add a lesson video URL to replace this premium placeholder with playback.
            </p>
          </div>
        )}
      </div>
      <div className="space-y-3 bg-black/95 p-3 text-white sm:p-4">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => updateProgress(event.target.value)}
          disabled={!videoUrl}
          className="accent-success h-1 w-full"
          aria-label="Video progress"
        />
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button size="icon" variant="secondary" onClick={togglePlay} disabled={!videoUrl} aria-label="Play lesson">
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <span className="min-w-20 text-xs text-white/70">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <Button size="icon" variant="ghost" onClick={toggleMute} disabled={!videoUrl} aria-label="Mute lesson">
            {muted ? <VolumeXIcon /> : <Volume2Icon />}
          </Button>
          <select
            value={speed}
            onChange={(event) => updateSpeed(event.target.value)}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs"
            aria-label="Playback speed"
          >
            {[0.75, 1, 1.25, 1.5, 2].map((item) => (
              <option key={item} value={item} className="bg-black">
                {item}x
              </option>
            ))}
          </select>
          <Button
            className="ml-auto"
            size="icon"
            variant="ghost"
            onClick={openFullscreen}
            disabled={!videoUrl}
            aria-label="Fullscreen"
          >
            <MaximizeIcon />
          </Button>
        </div>
      </div>
    </section>
  );
}
