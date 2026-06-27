"use client";

import { Button } from "@/components/ui/button";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { useMutation } from "convex/react";
import { SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

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
  const saveConvexNote = useMutation(convexApi.notes.upsertLessonNote);

  return (
    <NotesEditorCore
      lessonId={lessonId}
      onSave={(body) =>
        saveConvexNote({
          userKey: "demo-user",
          lessonStableId: lessonId,
          body,
        }).catch((error) => {
          console.warn("Unable to sync lesson note to Convex", error);
        })
      }
    />
  );
}

type NotesEditorCoreProps = NotesEditorProps & {
  onSave?: (body: string) => void;
};

function NotesEditorCore({ lessonId, onSave }: NotesEditorCoreProps) {
  const storageKey = `intellectx:lesson-note:${lessonId}`;
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNote(window.localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  function saveNote() {
    window.localStorage.setItem(storageKey, note);
    onSave?.(note);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="animate-widget flex min-h-80 flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-tight">Lesson notes</h2>
          <p className="text-muted-foreground text-sm">
            {convexEnv.isConfigured ? "Ready for Convex sync" : "Saved locally until Convex is configured."}
          </p>
        </div>
        <Button size="sm" onClick={saveNote}>
          <SaveIcon />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Capture key ideas, questions, and next actions while you learn..."
        className="bg-secondary/35 focus:ring-ring/40 min-h-72 flex-1 resize-none rounded-lg border border-transparent px-4 py-3 text-sm leading-6 outline-none backdrop-blur focus:ring-2"
      />
    </section>
  );
}
