"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

type TapRevealProps = {
  prompt: string;
  explanation: string;
};

export function TapReveal({ prompt, explanation }: TapRevealProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-widget rounded-lg bg-secondary/40 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">{prompt}</p>
        <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : "Reveal"}
        </Button>
      </div>
      {open && <p className="text-muted-foreground mt-4 text-sm leading-6">{explanation}</p>}
    </div>
  );
}
