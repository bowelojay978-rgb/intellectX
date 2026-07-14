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
import { useEffect, useId, useRef, useState } from "react";

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

type MediaNotice = {
  message: string;
  retryable?: boolean;
  announcement?: "polite" | "assertive";
};

const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
const defaultPosterUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%232563eb'/%3E%3C/svg%3E";

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function isInteractiveKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, a, input, select, textarea, [role='button'], [role='menuitem'], [role='menuitemradio'], [contenteditable='true']",
      ),
    )
  );
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
  const retryTimeRef = useRef(0);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const speedOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const settingsMenuId = useId();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canUsePictureInPicture, setCanUsePictureInPicture] = useState(false);
  const [canUseFullscreen, setCanUseFullscreen] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<MediaNotice | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    setCanUseFullscreen(Boolean(videoUrl && playerRef.current?.requestFullscreen));
    setCanUsePictureInPicture(
      Boolean(videoUrl && video && document.pictureInPictureEnabled && "requestPictureInPicture" in video),
    );
  }, [videoUrl]);

  useEffect(() => {
    if (!settingsOpen) return;

    const selectedSpeedIndex = playbackSpeeds.indexOf(speed);
    const frame = window.requestAnimationFrame(() => speedOptionRefs.current[selectedSpeedIndex]?.focus());

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !settingsContainerRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [settingsOpen, speed]);

  async function togglePlay() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setMediaNotice(null);

    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      await video.play();
    } catch {
      setMediaNotice({ message: "This video could not start. Check your connection or try again." });
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
    window.requestAnimationFrame(() => settingsButtonRef.current?.focus());
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

  async function openFullscreen() {
    const player = playerRef.current;
    if (!player || !canUseFullscreen) return;

    setMediaNotice(null);

    try {
      await player.requestFullscreen();
    } catch {
      setMediaNotice({ message: "Fullscreen is not available right now. Continue watching in the current view." });
    }
  }

  async function openPictureInPicture() {
    const video = videoRef.current;
    if (!video || !canUsePictureInPicture || !("requestPictureInPicture" in video)) return;

    setMediaNotice(null);

    try {
      await video.requestPictureInPicture();
    } catch {
      setMediaNotice({ message: "Picture in picture is not available right now. Continue watching in the player." });
    }
  }

  function retryVideo() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    retryTimeRef.current = Number.isFinite(video.currentTime) ? Math.max(video.currentTime, 0) : currentTime;
    setMediaNotice(null);
    setPlaying(false);
    video.load();
  }

  function handleKeyboard(event: React.KeyboardEvent<HTMLElement>) {
    if (isInteractiveKeyboardTarget(event.target)) return;

    const key = event.key.toLowerCase();
    if (key === " " || key === "k") {
      event.preventDefault();
      void togglePlay();
    } else if (key === "arrowright") {
      event.preventDefault();
      seekTo(currentTime + 5);
    } else if (key === "arrowleft") {
      event.preventDefault();
      seekTo(currentTime - 5);
    } else if (key === "m") {
      toggleMute();
    } else if (key === "f") {
      void openFullscreen();
    }
  }

  function handleSettingsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setSettingsOpen(false);
    window.requestAnimationFrame(() => settingsButtonRef.current?.focus());
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]" aria-label="Lesson video and playlist">
      <section
        ref={playerRef}
        tabIndex={0}
        onKeyDown={handleKeyboard}
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-blue-600 shadow-3xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${title} video player`}
      >
        <div className="relative aspect-video bg-blue-600" onDoubleClick={() => void openFullscreen()}>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl ?? defaultPosterUrl}
              className="h-full w-full cursor-pointer bg-blue-600 object-contain"
              onClick={() => void togglePlay()}
              onLoadedMetadata={(event) => {
                const loadedDuration = event.currentTarget.duration;
                setDuration(loadedDuration);
                const retryTime = Math.min(
                  retryTimeRef.current,
                  Number.isFinite(loadedDuration) ? loadedDuration : retryTimeRef.current,
                );
                if (retryTime > 0) {
                  event.currentTarget.currentTime = retryTime;
                  setCurrentTime(retryTime);
                }
                retryTimeRef.current = 0;
                setMediaNotice(null);
              }}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPlaying={() => {
                setPlaying(true);
                setMediaNotice(null);
              }}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onWaiting={() =>
                setMediaNotice({
                  message: "Video is buffering. Playback will resume automatically.",
                  announcement: "polite",
                })
              }
              onCanPlay={() =>
                setMediaNotice((notice) => (notice?.announcement === "polite" ? null : notice))
              }
              onStalled={() =>
                setMediaNotice({
                  message: "Video playback was interrupted. Retry from your current position or check your connection.",
                  retryable: true,
                })
              }
              onError={() =>
                setMediaNotice({
                  message: "This video could not be loaded. Check your connection or try again.",
                  retryable: true,
                })
              }
              playsInline
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-blue-600 p-8 text-center text-white">
              <span className="grid size-16 place-items-center rounded-full bg-white/10">
                <PlayIcon className="size-7" />
              </span>
              <p className="mt-5 text-sm text-white/70">Video lesson preview</p>
              <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                This lesson is ready for an instructor video. Notes and learning activities remain available below.
              </p>
            </div>
          )}

          {mediaNotice ? (
            <div
              role={mediaNotice.announcement === "polite" ? "status" : "alert"}
              aria-atomic="true"
              className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-3 rounded-lg border border-white/15 bg-black/85 p-3 text-sm text-white shadow-xl backdrop-blur sm:inset-x-4"
            >
              <p className="leading-5">{mediaNotice.message}</p>
              {mediaNotice.retryable ? (
                <button
                  type="button"
                  onClick={retryVideo}
                  aria-label="Retry video playback"
                  className="shrink-0 rounded-md border border-white/20 px-2 py-1 text-xs font-medium hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}

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
              <PlayerButton onClick={() => void togglePlay()} disabled={!videoUrl} label={playing ? "Pause" : "Play"}>
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
                <PlayerButton
                  onClick={() => void openPictureInPicture()}
                  disabled={!videoUrl || !canUsePictureInPicture}
                  label={canUsePictureInPicture ? "Picture in picture" : "Picture in picture unavailable"}
                >
                  <PictureInPictureIcon />
                </PlayerButton>
                <div
                  ref={settingsContainerRef}
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setSettingsOpen(false);
                    }
                  }}
                >
                  <PlayerButton
                    ref={settingsButtonRef}
                    onClick={() => setSettingsOpen((open) => !open)}
                    disabled={!videoUrl}
                    label="Playback settings"
                    aria-haspopup="menu"
                    aria-expanded={settingsOpen}
                    aria-controls={settingsOpen ? settingsMenuId : undefined}
                  >
                    <SettingsIcon />
                  </PlayerButton>
                  {settingsOpen ? (
                    <div
                      id={settingsMenuId}
                      role="menu"
                      aria-label="Playback speed"
                      onKeyDown={handleSettingsKeyDown}
                      className="absolute right-0 bottom-11 w-44 rounded-lg border border-white/10 bg-black/95 p-2 shadow-2xl"
                    >
                      <p className="px-2 py-1 text-xs font-medium text-white/60">Playback speed</p>
                      {playbackSpeeds.map((item, index) => (
                        <button
                          key={item}
                          ref={(element) => {
                            speedOptionRefs.current[index] = element;
                          }}
                          type="button"
                          role="menuitemradio"
                          aria-checked={speed === item}
                          onClick={() => updateSpeed(item)}
                          className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                          <span>{item === 1 ? "Normal" : `${item}x`}</span>
                          {speed === item ? <span aria-hidden="true">✓</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <PlayerButton
                  onClick={() => void openFullscreen()}
                  disabled={!videoUrl || !canUseFullscreen}
                  label={canUseFullscreen ? "Fullscreen" : "Fullscreen unavailable"}
                >
                  <MaximizeIcon />
                </PlayerButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside
        className="overflow-hidden rounded-xl border border-border/70 bg-background/70"
        aria-label="Course video playlist"
      >
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
                <div className="relative aspect-video overflow-hidden rounded-md bg-blue-600">
                  {item.posterUrl ? (
                    <Image src={item.posterUrl} alt="" fill sizes="128px" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-white/80">
                      <PlayIcon className="size-5" />
                    </div>
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
