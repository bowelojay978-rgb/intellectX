"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { useConvex, useConvexAuth, useMutation } from "convex/react";
import { AlertCircleIcon, CheckCircle2Icon, FilmIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type MediaKind = "video" | "poster";

type LessonMediaItem = {
  stableId: string;
  title: string;
  order: number;
  externalVideoUrl: string | null;
  externalPosterUrl: string | null;
  video: { url: string | null; contentType: string; size: number } | null;
  poster: { url: string | null; contentType: string; size: number } | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptedTypes(kind: MediaKind) {
  return kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp";
}

export function InstructorLessonMediaManager({ courseStableId }: { courseStableId: string }) {
  if (!convexEnv.isConfigured) {
    return null;
  }

  return <ConvexInstructorLessonMediaManager courseStableId={courseStableId} />;
}

function ConvexInstructorLessonMediaManager({ courseStableId }: { courseStableId: string }) {
  const convex = useConvex();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const generateUploadUrl = useMutation(convexApi.staffMedia.generateStaffMediaUploadUrl);
  const registerUpload = useMutation(convexApi.staffMedia.registerStaffMediaUpload);
  const attachMedia = useMutation(convexApi.staffMedia.attachLessonMedia);
  const removeMedia = useMutation(convexApi.staffMedia.removeLessonMedia);
  const [lessons, setLessons] = useState<LessonMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadLessons = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const result = await convex.query(convexApi.staffMedia.listInstructorLessonMedia, { courseStableId });
      setLessons((result as LessonMediaItem[]) ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load lesson media.");
    } finally {
      setLoading(false);
    }
  }, [convex, courseStableId, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void loadLessons();
    }
  }, [isAuthenticated, isLoading, loadLessons]);

  async function uploadFile(lessonStableId: string, kind: MediaKind, file: File) {
    const key = `${lessonStableId}:${kind}`;
    setBusyKey(key);
    setError(null);
    setNotice(null);

    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as { storageId?: string };
      if (!payload.storageId) {
        throw new Error("Convex storage did not return a storage ID.");
      }

      await registerUpload({ storageId: payload.storageId as never, kind });
      await attachMedia({
        courseStableId,
        lessonStableId,
        storageId: payload.storageId as never,
        kind,
      });
      setNotice(`${kind === "video" ? "Video" : "Poster"} uploaded and attached to the lesson.`);
      await loadLessons();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to upload lesson media.");
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(lessonStableId: string, kind: MediaKind) {
    const key = `${lessonStableId}:${kind}`;
    setBusyKey(key);
    setError(null);
    setNotice(null);
    try {
      await removeMedia({ courseStableId, lessonStableId, kind });
      setNotice(`${kind === "video" ? "Video" : "Poster"} removed from the lesson.`);
      await loadLessons();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to remove lesson media.");
    } finally {
      setBusyKey(null);
    }
  }

  if (isLoading || loading) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading lesson media…</CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardHeader>
        <CardTitle>Lesson video uploads</CardTitle>
        <p className="text-muted-foreground text-sm leading-6">
          Upload MP4, WebM, or MOV videos up to 500 MB and optional JPEG, PNG, or WebP posters up to 10 MB. Uploads are authorized and validated server-side before attachment.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" />
            <p>{error}</p>
          </div>
        ) : null}
        {notice ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p>{notice}</p>
          </div>
        ) : null}

        {lessons.length > 0 ? (
          lessons.map((lesson, index) => (
            <div key={lesson.stableId} className="rounded-lg border border-border/70 bg-background/60 p-4">
              <div className="mb-4">
                <p className="font-medium">{index + 1}. {lesson.title || lesson.stableId}</p>
                <p className="text-muted-foreground mt-1 text-xs">{lesson.stableId}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <MediaControl
                  icon={<FilmIcon className="size-4" />}
                  label="Lesson video"
                  kind="video"
                  lesson={lesson}
                  busy={busyKey === `${lesson.stableId}:video`}
                  onUpload={(file) => uploadFile(lesson.stableId, "video", file)}
                  onRemove={() => remove(lesson.stableId, "video")}
                />
                <MediaControl
                  icon={<ImageIcon className="size-4" />}
                  label="Poster image"
                  kind="poster"
                  lesson={lesson}
                  busy={busyKey === `${lesson.stableId}:poster`}
                  onUpload={(file) => uploadFile(lesson.stableId, "poster", file)}
                  onRemove={() => remove(lesson.stableId, "poster")}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Save at least one lesson in the course builder before uploading lesson media.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MediaControl({
  icon,
  label,
  kind,
  lesson,
  busy,
  onUpload,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  kind: MediaKind;
  lesson: LessonMediaItem;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const media = kind === "video" ? lesson.video : lesson.poster;
  const externalUrl = kind === "video" ? lesson.externalVideoUrl : lesson.externalPosterUrl;
  const displayUrl = media?.url ?? externalUrl;

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-center gap-2 font-medium">
        {icon}
        {label}
      </div>
      {displayUrl ? (
        <div className="mt-3 text-sm">
          <a href={displayUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            Open current media
          </a>
          {media ? (
            <p className="text-muted-foreground mt-1 text-xs">{media.contentType} · {formatBytes(media.size)}</p>
          ) : (
            <p className="text-muted-foreground mt-1 text-xs">External URL from course draft</p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">No media attached.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-secondary/60">
          <UploadIcon className="size-4" />
          {busy ? "Uploading…" : media ? "Replace upload" : "Upload file"}
          <input
            type="file"
            accept={acceptedTypes(kind)}
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {media ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onRemove}>
            <Trash2Icon className="size-4" />
            Remove upload
          </Button>
        ) : null}
      </div>
    </div>
  );
}
