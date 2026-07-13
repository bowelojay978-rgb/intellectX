"use client";

import { Button } from "@/components/ui/button";
import {
  CaptionsIcon,
  MaximizeIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  SettingsIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

type VideoPlaylistItem = {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  posterUrl?: string;
};

type VideoPlayerProps = {
  title: string;
  videoUrl?: string;
  posterUrl?: string;
  currentLessonId?: string;
  playlist?: VideoPlaylistItem[];
};

const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function VideoPlayer({
  title,
  videoUrl,
  posterUrl,
  currentLessonId,
  playlist = [],
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  function seekTo(value: number) {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Math.min(Math.max(value, 0), duration || 0);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function updateSpeed(nextSpeed: number) {
    setSpeed(nextSpeed);
    setSettingsOpen(false);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
  }

  function updateVolume(nextVolume: number) {
    const video = videoRef.current;
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
    if (video) {
      video.volume = nextVolume;
      video.muted = nextVolume === 0;
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function openFullscreen() {
    if (playerRef.current?.requestFullscreen) void playerRef.current.requestFullscreen();
  }

  function openPictureInPicture() {
    const video = videoRef.current;
    if (video && "requestPictureInPicture" in video) void video.requestPictureInPicture();
  }

  function handleKeyboard(event: React.KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;

    const key = event.key.toLowerCase();
    if (key === " " || key === "k") {
      event.preventDefault();
      togglePlay();
    } else if (key === "arrowright") {
      seekTo(currentTime + 5);
    } else if (key === "arrowleft") {
      seekTo(currentTime - 5);
    } else if (key === "m") {
      toggleMute();
    } else if (key === "f") {
      openFullscreen();
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]" aria-label="Lesson video and playlist">
      <section
        ref={playerRef}
        tabIndex={0}
        onKeyDown={handleKeyboard}
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-3xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${title} video player`}
      >
        <div className="relative aspect-video bg-black" onDoubleClick={openFullscreen}>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              className="h-full w-full cursor-pointer object-contain"
              onClick={togglePlay}
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              playsInline
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_35%),linear-gradient(135deg,_#050505,_#1f2937)] p-8 text-center text-white">
              <span className="grid size-16 place-items-center rounded-full bg-white/10">
                <PlayIcon className="size-7" />
              </span>
              <p className="mt-5 text-sm text-white/60">Video lesson preview</p>
              <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                This lesson is ready for an instructor video. Notes and learning activities remain available below.
              </p>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pt-12 pb-3 text-white sm:px-4">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seekTo(Number(event.target.value))}
              disabled={!videoUrl}
              className="h-1 w-full cursor-pointer accent-red-500"
              aria-label="Video progress"
            />
            <div className="mt-2 flex items-center gap-1 sm:gap-2">
              <PlayerButton onClick={togglePlay} disabled={!videoUrl} label={playing ? "Pause" : "Play"}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </PlayerButton>
              <PlayerButton onClick={toggleMute} disabled={!videoUrl} label={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeXIcon /> : <Volume2Icon />}
              </PlayerButton>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => updateVolume(Number(event.target.value))}
                disabled={!videoUrl}
                className="hidden h-1 w-20 accent-white sm:block"
                aria-label="Volume"
              />
              <span className="ml-1 text-xs text-white/75">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <PlayerButton disabled label="Captions unavailable">
                  <CaptionsIcon />
                </PlayerButton>
                <PlayerButton onClick={openPictureInPicture} disabled={!videoUrl} label="Picture in picture">
                  <PictureInPictureIcon />
                </PlayerButton>
                <div className="relative">
                  <PlayerButton
                    onClick={() => setSettingsOpen((open) => !open)}
                    disabled={!videoUrl}
                    label="Playback settings"
                  >
                    <SettingsIcon />
                  </PlayerButton>
                  {settingsOpen ? (
                    <div className="absolute right-0 bottom-11 w-44 rounded-lg border border-white/10 bg-black/95 p-2 shadow-2xl">
                      <p className="px-2 py-1 text-xs font-medium text-white/60">Playback speed</p>
                      {playbackSpeeds.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => updateSpeed(item)}
                          className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-white/10"
                        >
                          <span>{item === 1 ? "Normal" : `${item}x`}</span>
                          {speed === item ? <span aria-hidden="true">✓</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <PlayerButton onClick={openFullscreen} disabled={!videoUrl} label="Fullscreen">
                  <MaximizeIcon />
                </PlayerButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="overflow-hidden rounded-xl border border-border/70 bg-background/70" aria-label="Course video playlist">
        <div className="border-b border-border/70 px-4 py-3">
          <p className="font-semibold">Course playlist</p>
          <p className="text-muted-foreground mt-1 text-xs">{playlist.length} lessons</p>
        </div>
        <div className="max-h-[32rem] space-y-1 overflow-y-auto p-2">
          {playlist.map((item, index) => {
            const active = item.id === currentLessonId;
            return (
              <Link
                key={item.id}
                href={`/learn/${item.id}`}
                aria-current={active ? "page" : undefined}
                className={`grid grid-cols-[8rem_1fr] gap-3 rounded-lg p-2 transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-secondary/70"
                }`}
              >
                <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                  {item.posterUrl ? (
                    <Image src={item.posterUrl} alt="" fill sizes="128px" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-white/60"><PlayIcon className="size-5" /></div>
                  )}
                  <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
                    {item.duration}
                  </span>
                </div>
                <div className="min-w-0 py-0.5">
                  <p className="line-clamp-2 text-sm font-medium leading-5">{item.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">Lesson {index + 1}</p>
                  {active ? <p className="text-primary mt-1 text-xs font-medium">Now learning</p> : null}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </section>
  );
}

function PlayerButton({
  label,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "variant" | "aria-label"> & { label: string }) {
  return <Button type="button" size="icon" variant="ghost" aria-label={label} title={label} {...props} />;
}
