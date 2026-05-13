import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { transcribeAudio } from "@/lib/stt/whisper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Keine Audio-Datei." }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "Leere Aufnahme." }, { status: 400 });
  }
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Aufnahme zu groß." }, { status: 400 });
  }

  try {
    const text = await transcribeAudio(audio);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("STT failed", err);
    return NextResponse.json(
      { error: "Transkription fehlgeschlagen." },
      { status: 500 },
    );
  }
}
