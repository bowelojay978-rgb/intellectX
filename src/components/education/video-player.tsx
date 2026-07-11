"use client";

import {
  CaptionsIcon,
  LoaderCircleIcon,
  MaximizeIcon,
  PauseIcon,
  PictureInPicture,
  PlayIcon,
  RepeatIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VideoPlayerProps = {
  title: string;
  videoUrl?: string;
  posterUrl?: string;
};

type PictureInPictureDocument = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
};

type PictureInPictureVideo = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<unknown>;
};

const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const totalSeconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function VideoPlayer({ title, videoUrl, posterUrl }: VideoPlayerProps) {
  const playerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ended, setEnded] = useState(false);
  const [looping, setLooping] = useState(false);
  const [captionsAvailable, setCaptionsAvailable] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [pictureInPictureAvailable, setPictureInPictureAvailable] = useState(false);

  const playedPercent = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;

  useEffect(() => {
    const pictureInPictureDocument = document as PictureInPictureDocument;
    const video = videoRef.current as PictureInPictureVideo | null;

    setPictureInPictureAvailable(
      Boolean(pictureInPictureDocument.pictureInPictureEnabled && video?.requestPictureInPicture),
    );

    function handleEnterPictureInPicture() {
      setPipActive(true);
    }

    function handleLeavePictureInPicture() {
      setPipActive(false);
    }

    video?.addEventListener("enterpictureinpicture", handleEnterPictureInPicture);
    video?.addEventListener("leavepictureinpicture", handleLeavePictureInPicture);

    return () => {
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
      video?.removeEventListener("enterpictureinpicture", handleEnterPictureInPicture);
      video?.removeEventListener("leavepictureinpicture", handleLeavePictureInPicture);
    };
  }, [videoUrl]);

  function scheduleControlsHide(force = false) {
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
    }

    if (!playing && !force) return;

    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2500);
  }

  function revealControls() {
    setShowControls(true);
    scheduleControlsHide();
  }

  async function togglePlay() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setHasError(false);

    if (video.ended || ended) {
      video.currentTime = 0;
      setCurrentTime(0);
      setEnded(false);
    }

    if (video.paused) {
      try {
        await video.play();
        setPlaying(true);
        scheduleControlsHide(true);
      } catch {
        setHasError(true);
      }
      return;
    }

    video.pause();
    setPlaying(false);
    setShowControls(true);
  }

  function seekTo(nextTime: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration)) return;

    const safeTime = clamp(nextTime, 0, duration || 0);
    video.currentTime = safeTime;
    setCurrentTime(safeTime);
    setEnded(false);
    revealControls();
  }

  function skipBy(seconds: number) {
    seekTo((videoRef.current?.currentTime ?? currentTime) + seconds);
  }

  function updateProgress(value: string) {
    seekTo(Number(value));
  }

  function updateSpeed(value: number) {
    const video = videoRef.current;
    const nextSpeed = clamp(value, playbackSpeeds[0], playbackSpeeds[playbackSpeeds.length - 1]);
    setSpeed(nextSpeed);
    if (video) video.playbackRate = nextSpeed;
    revealControls();
  }

  function stepSpeed(direction: -1 | 1) {
    const currentSpeedIndex = playbackSpeeds.findIndex((item) => item === speed);
    const safeIndex = currentSpeedIndex >= 0 ? currentSpeedIndex : playbackSpeeds.indexOf(1);
    const nextIndex = clamp(safeIndex + direction, 0, playbackSpeeds.length - 1);
    updateSpeed(playbackSpeeds[nextIndex]);
  }

  function updateVolume(value: number) {
    const video = videoRef.current;
    const nextVolume = clamp(value, 0, 1);

    setVolume(nextVolume);
    setMuted(nextVolume === 0);

    if (video) {
      video.volume = nextVolume;
      video.muted = nextVolume === 0;
    }

    revealControls();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted || volume === 0) {
      const restoredVolume = volume === 0 ? 0.5 : volume;
      video.muted = false;
      video.volume = restoredVolume;
      setVolume(restoredVolume);
      setMuted(false);
    } else {
      video.muted = true;
      setMuted(true);
    }

    revealControls();
  }

  function toggleLoop() {
    const video = videoRef.current;
    if (!video) return;
    const nextLooping = !looping;
    video.loop = nextLooping;
    setLooping(nextLooping);
    revealControls();
  }

  function toggleCaptions() {
    const video = videoRef.current;
    if (!video || video.textTracks.length === 0) return;

    const nextEnabled = !captionsEnabled;
    for (let index = 0; index < video.textTracks.length; index += 1) {
      video.textTracks[index].mode = nextEnabled && index === 0 ? "showing" : "disabled";
    }
    setCaptionsEnabled(nextEnabled);
    revealControls();
  }

  async function togglePictureInPicture() {
    const video = videoRef.current as PictureInPictureVideo | null;
    const pictureInPictureDocument = document as PictureInPictureDocument;

    if (!video?.requestPictureInPicture || !pictureInPictureAvailable) return;

    try {
      if (pictureInPictureDocument.pictureInPictureElement && pictureInPictureDocument.exitPictureInPicture) {
        await pictureInPictureDocument.exitPictureInPicture();
        setPipActive(false);
      } else {
        await video.requestPictureInPicture();
        setPipActive(true);
      }
    } catch {
      setPipActive(false);
    }
  }

  async function toggleFullscreen() {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (player.requestFullscreen) {
        await player.requestFullscreen();
      }
    } catch {
      // The browser can reject fullscreen when it was not initiated by a direct user gesture.
    }
  }

  function updateBufferedProgress(video: HTMLVideoElement, knownDuration = duration) {
    if (knownDuration <= 0 || video.buffered.length === 0) {
      setBufferedPercent(0);
      return;
    }

    let furthestBufferedEnd = 0;
    for (let index = 0; index < video.buffered.length; index += 1) {
      furthestBufferedEnd = Math.max(furthestBufferedEnd, video.buffered.end(index));
    }

    setBufferedPercent(clamp((furthestBufferedEnd / knownDuration) * 100, 0, 100));
  }

  function handleLoadedMetadata(video: HTMLVideoElement) {
    setDuration(video.duration);
    setCurrentTime(video.currentTime);
    setVolume(video.volume);
    setMuted(video.muted);
    setSpeed(video.playbackRate);
    setCaptionsAvailable(video.textTracks.length > 0);
    setHasError(false);
    updateBufferedProgress(video, video.duration);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!videoUrl) return;

    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea, button")) return;

    const key = event.key;

    if (key === " " || key.toLowerCase() === "k") {
      event.preventDefault();
      void togglePlay();
      return;
    }

    if (key === "ArrowLeft") {
      event.preventDefault();
      skipBy(-5);
      return;
    }

    if (key === "ArrowRight") {
      event.preventDefault();
      skipBy(5);
      return;
    }

    if (key.toLowerCase() === "j") {
      event.preventDefault();
      skipBy(-10);
      return;
    }

    if (key.toLowerCase() === "l") {
      event.preventDefault();
      skipBy(10);
      return;
    }

    if (key.toLowerCase() === "m") {
      event.preventDefault();
      toggleMute();
      return;
    }

    if (key.toLowerCase() === "f") {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }

    if (key.toLowerCase() === "c") {
      event.preventDefault();
      toggleCaptions();
      return;
    }

    if (key === ">") {
      event.preventDefault();
      stepSpeed(1);
      return;
    }

    if (key === "<") {
      event.preventDefault();
      stepSpeed(-1);
      return;
    }

    if (/^[0-9]$/.test(key) && duration > 0) {
      event.preventDefault();
      seekTo((Number(key) / 10) * duration);
    }
  }

  const volumeIcon = muted || volume === 0 ? <VolumeXIcon /> : volume < 0.5 ? <Volume1Icon /> : <Volume2Icon />;

  return (
    <section
      ref={playerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
      }}
      aria-label={`${title} video player`}
      className="group relative overflow-hidden rounded-lg border border-white/10 bg-black text-white shadow-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            preload="metadata"
            playsInline
            className="h-full w-full cursor-pointer object-contain"
            onClick={() => void togglePlay()}
            onDoubleClick={() => void toggleFullscreen()}
            onLoadedMetadata={(event) => handleLoadedMetadata(event.currentTarget)}
            onDurationChange={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onProgress={(event) => updateBufferedProgress(event.currentTarget)}
            onPlay={() => {
              setPlaying(true);
              setEnded(false);
              setBuffering(false);
              scheduleControlsHide(true);
            }}
            onPause={() => {
              setPlaying(false);
              setShowControls(true);
            }}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
              setShowControls(true);
            }}
            onError={() => {
              setHasError(true);
              setBuffering(false);
              setPlaying(false);
              setShowControls(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_35%),linear-gradient(135deg,_#050505,_#1f2937)] p-8 text-center text-white">
            <p className="text-sm text-white/60">Video lesson preview</p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
              Add a lesson video URL to replace this preview with playback.
            </p>
          </div>
        )}

        {videoUrl && hasError ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/85 p-6 text-center">
            <div className="max-w-md">
              <p className="text-lg font-semibold">This video could not be played.</p>
              <p className="mt-2 text-sm leading-6 text-white/65">Check the video source or try again later.</p>
            </div>
          </div>
        ) : null}

        {videoUrl && buffering && !hasError ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/20">
            <LoaderCircleIcon className="size-10 animate-spin" aria-label="Buffering video" />
          </div>
        ) : null}

        {videoUrl && !hasError && (!playing || ended) ? (
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="absolute inset-0 z-[5] m-auto grid size-16 place-items-center rounded-full bg-black/70 text-white transition hover:scale-105 hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={ended ? "Replay lesson" : "Play lesson"}
            title={ended ? "Replay" : "Play (K)"}
          >
            {ended ? <RotateCcwIcon className="size-7" /> : <PlayIcon className="ml-1 size-7 fill-current" />}
          </button>
        ) : null}

        {videoUrl ? (
          <div
            className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pt-12 pb-3 transition-opacity duration-200 sm:px-4 ${
              showControls || !playing ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="relative mb-3 h-4">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                <div className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${bufferedPercent}%` }} />
                <div className="bg-success absolute inset-y-0 left-0" style={{ width: `${playedPercent}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step="0.1"
                value={Math.min(currentTime, duration || 0)}
                onChange={(event) => updateProgress(event.target.value)}
                className="absolute inset-0 h-4 w-full cursor-pointer opacity-0"
                aria-label="Video progress"
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="grid size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={playing ? "Pause lesson" : ended ? "Replay lesson" : "Play lesson"}
                title={playing ? "Pause (K)" : ended ? "Replay" : "Play (K)"}
              >
                {playing ? <PauseIcon /> : ended ? <RotateCcwIcon /> : <PlayIcon className="fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => skipBy(-10)}
                className="hidden size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:grid"
                aria-label="Back 10 seconds"
                title="Back 10 seconds (J)"
              >
                <RotateCcwIcon />
              </button>

              <button
                type="button"
                onClick={() => skipBy(10)}
                className="hidden size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:grid"
                aria-label="Forward 10 seconds"
                title="Forward 10 seconds (L)"
              >
                <RotateCwIcon />
              </button>

              <div className="group/volume flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label={muted ? "Unmute lesson" : "Mute lesson"}
                  title={muted ? "Unmute (M)" : "Mute (M)"}
                >
                  {volumeIcon}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(event) => updateVolume(Number(event.target.value))}
                  className="accent-success hidden h-1 w-20 cursor-pointer sm:block"
                  aria-label="Video volume"
                />
              </div>

              <span className="ml-1 whitespace-nowrap text-xs text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleCaptions}
                  disabled={!captionsAvailable}
                  className={`hidden size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35 sm:grid ${
                    captionsEnabled ? "bg-white/20" : ""
                  }`}
                  aria-label={captionsEnabled ? "Turn captions off" : "Turn captions on"}
                  aria-pressed={captionsEnabled}
                  title={captionsAvailable ? "Captions (C)" : "No captions available"}
                >
                  <CaptionsIcon />
                </button>

                <button
                  type="button"
                  onClick={toggleLoop}
                  className={`hidden size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:grid ${
                    looping ? "bg-white/20 text-success" : ""
                  }`}
                  aria-label={looping ? "Turn loop off" : "Loop video"}
                  aria-pressed={looping}
                  title="Loop video"
                >
                  <RepeatIcon />
                </button>

                <select
                  value={speed}
                  onChange={(event) => updateSpeed(Number(event.target.value))}
                  className="h-9 rounded-full border border-white/10 bg-black/55 px-2 text-xs text-white outline-none focus:ring-2 focus:ring-white sm:px-3"
                  aria-label="Playback speed"
                  title="Playback speed (< / >)"
                >
                  {playbackSpeeds.map((item) => (
                    <option key={item} value={item} className="bg-black">
                      {item}x
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void togglePictureInPicture()}
                  disabled={!pictureInPictureAvailable}
                  className={`hidden size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35 md:grid ${
                    pipActive ? "bg-white/20" : ""
                  }`}
                  aria-label={pipActive ? "Exit picture in picture" : "Picture in picture"}
                  title={pictureInPictureAvailable ? "Picture in picture" : "Picture in picture unavailable"}
                >
                  <PictureInPicture />
                </button>

                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="grid size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Fullscreen"
                  title="Fullscreen (F)"
                >
                  <MaximizeIcon />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {videoUrl ? (
        <p className="sr-only">
          Keyboard shortcuts: K or Space play and pause, J and L skip ten seconds, left and right arrows seek five seconds,
          M mutes, F enters fullscreen, C toggles captions when available, number keys seek by percentage, and greater-than or
          less-than changes playback speed.
        </p>
      ) : null}
    </section>
  );
}
