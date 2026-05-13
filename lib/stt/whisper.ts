import { toFile } from "openai";
import { openai, MODELS } from "@/lib/generation/openai";

/**
 * Transcribe an audio blob with Whisper. Forces German language to improve
 * accuracy on medical Latin/German hybrid vocabulary.
 */
export async function transcribeAudio(
  audio: Blob,
  filename = "audio.webm",
): Promise<string> {
  const file = await toFile(audio, filename, { type: audio.type || "audio/webm" });
  const r = await openai.audio.transcriptions.create({
    file,
    model: MODELS.whisper,
    language: "de",
    response_format: "json",
    prompt:
      "Mündliche medizinische Prüfung. Erwartete Fachbegriffe: Myokardinfarkt, NSTEMI, STEMI, Differentialdiagnose, Anamnese, Auskultation, Pneumonie, Pneumothorax, COPD, ASS, Heparin, Troponin, EKG, Koronarangiographie.",
  });
  return typeof r === "string" ? r : (r.text ?? "");
}
