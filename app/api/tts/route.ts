import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { streamSpeech } from "@/lib/tts/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || text.length > 2000) {
    return new Response("Bad text", { status: 400 });
  }

  try {
    const stream = await streamSpeech(text);
    return new Response(stream as unknown as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS failed", err);
    return new Response("TTS failed", { status: 500 });
  }
}
