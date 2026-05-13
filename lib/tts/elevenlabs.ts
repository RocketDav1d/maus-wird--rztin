import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) console.warn("ELEVENLABS_API_KEY not set");

export const elevenlabs = new ElevenLabsClient({ apiKey });

export const TTS_DEFAULTS = {
  voiceId: process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM",
  modelId: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
};

/** Returns a ReadableStream of MP3 audio bytes. */
export async function streamSpeech(text: string) {
  const stream = await elevenlabs.textToSpeech.stream(TTS_DEFAULTS.voiceId, {
    text,
    modelId: TTS_DEFAULTS.modelId,
    outputFormat: "mp3_44100_128",
  });
  return stream;
}
