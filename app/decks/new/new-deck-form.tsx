"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_FILE_MB = 25;

export function NewDeckForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.error("Bitte ein PDF auswählen.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`PDF darf maximal ${MAX_FILE_MB} MB groß sein.`);
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name.trim() || file.name.replace(/\.pdf$/i, ""));

    startTransition(async () => {
      try {
        const res = await fetch("/api/decks", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Upload fehlgeschlagen (${res.status}).`);
        }
        const data = (await res.json()) as { id: string };
        router.push(`/decks/${data.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Wie soll der Stapel heißen?</Label>
        <Input
          id="name"
          placeholder="z. B. Innere Medizin – Kapitel 4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file">PDF mit deinem Lernstoff</Label>
        <label
          htmlFor="file"
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-input rounded-lg py-10 cursor-pointer hover:border-foreground/40 transition-colors"
        >
          {file ? (
            <>
              <FileText className="size-8 text-foreground/70" />
              <span className="font-medium text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground" />
              <span className="text-sm">PDF aussuchen oder hierher ziehen</span>
              <span className="text-xs text-muted-foreground">
                max. {MAX_FILE_MB} MB · am besten ≤ 80 Seiten
              </span>
            </>
          )}
          <Input
            id="file"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <Button type="submit" disabled={pending || !file} size="lg">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Lade hoch …
          </>
        ) : (
          "Stapel anlegen 🐭"
        )}
      </Button>
    </form>
  );
}
