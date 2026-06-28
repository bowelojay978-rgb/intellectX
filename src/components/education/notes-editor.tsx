"use client";

import { Button } from "@/components/ui/button";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { useMutation, useQuery } from "convex/react";
import { SaveIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type NotesEditorProps = {
  lessonId: string;
};

export function NotesEditor({ lessonId }: NotesEditorProps) {
  if (!convexEnv.isConfigured) {
    return <NotesEditorCore lessonId={lessonId} />;
  }

  return <ConvexNotesEditor lessonId={lessonId} />;
}

function ConvexNotesEditor({ lessonId }: NotesEditorProps) {
  const [userKey, setUserKey] = useState<string | null>(null);
  const note = useQuery(
    convexApi.notes.getLessonNote,
    userKey
      ? {
          userKey,
          lessonStableId: lessonId,
        }
      : "skip",
  );
  const saveConvexNote = useMutation(convexApi.notes.upsertLessonNote);

  useEffect(() => {
    const storageKey = "intellectx:notes-user-key";
    const existingKey = window.localStorage.getItem(storageKey);

    if (existingKey) {
      setUserKey(existingKey);
      return;
    }

    const nextKey =
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const scopedKey = `local-notes:${nextKey}`;
    window.localStorage.setItem(storageKey, scopedKey);
    setUserKey(scopedKey);
  }, []);

  return (
    <NotesEditorCore
      lessonId={lessonId}
      initialBody={note?.body}
      isLoading={userKey === null || note === undefined}
      onSave={async (body) => {
        if (!userKey) {
          throw new Error("Notes session is still loading.");
        }

        await saveConvexNote({
          userKey,
          lessonStableId: lessonId,
          body,
        });
      }}
    />
  );
}

type NotesEditorCoreProps = NotesEditorProps & {
  initialBody?: string;
  isLoading?: boolean;
  onSave?: (body: string) => Promise<void> | void;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function NotesEditorCore({ lessonId, initialBody, isLoading = false, onSave }: NotesEditorCoreProps) {
  const storageKey = `intellectx:lesson-note:${lessonId}`;
  const [note, setNote] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const hasEdited = useRef(false);

  useEffect(() => {
    setNote(window.localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  useEffect(() => {
    if (initialBody === undefined || hasEdited.current) {
      return;
    }

    setNote(initialBody);
    window.localStorage.setItem(storageKey, initialBody);
  }, [initialBody, storageKey]);

  async function saveNote() {
    setSaveStatus("saving");

    try {
      window.localStorage.setItem(storageKey, note);
      await onSave?.(note);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (error) {
      console.warn("Unable to save lesson note", error);
      setSaveStatus("error");
    }
  }

  const statusText =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Save failed. Try again."
          : convexEnv.isConfigured
            ? isLoading
              ? "Loading saved note..."
              : "Ready for Convex sync."
            : "Saved locally until Convex is configured.";

  return (
    <section className="animate-widget flex min-h-80 flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-tight">Lesson notes</h2>
          <p className="text-muted-foreground text-sm" role="status" aria-live="polite">
            {statusText}
          </p>
        </div>
        <Button size="sm" onClick={saveNote} disabled={saveStatus === "saving"}>
          <SaveIcon />
          {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Save"}
        </Button>
      </div>
      <textarea
        value={note}
        onChange={(event) => {
          hasEdited.current = true;
          setNote(event.target.value);
          if (saveStatus === "error") {
            setSaveStatus("idle");
          }
        }}
        placeholder="Capture key ideas, questions, and next actions while you learn..."
        className="bg-secondary/35 focus:ring-ring/40 min-h-72 flex-1 resize-none rounded-lg border border-transparent px-4 py-3 text-sm leading-6 outline-none backdrop-blur focus:ring-2"
      />
    </section>
  );
}
