import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decks } from "@/lib/db/schema";
import { parsePdf } from "@/lib/pdf/parse";
import { setExtractedText } from "@/lib/generation/storage";

const MAX_PAGES = 120;

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Nur PDF erlaubt." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Bitte Namen angeben." }, { status: 400 });
  }

  let parsed;
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    parsed = await parsePdf(buf);
  } catch (err) {
    console.error("PDF parse failed", err);
    return NextResponse.json(
      { error: "PDF konnte nicht gelesen werden." },
      { status: 400 },
    );
  }

  if (parsed.totalPages === 0 || parsed.totalChars < 200) {
    return NextResponse.json(
      { error: "Kein lesbarer Text im PDF gefunden." },
      { status: 400 },
    );
  }

  const cappedPages = parsed.pages.slice(0, MAX_PAGES);

  const [deck] = await db
    .insert(decks)
    .values({
      userId: session.user.id,
      name,
      sourceFilename: file.name,
      totalPages: cappedPages.length,
      status: "processing",
      progressStage: "ready_to_generate",
    })
    .returning();

  await setExtractedText(deck.id, cappedPages);

  return NextResponse.json({ id: deck.id });
}
