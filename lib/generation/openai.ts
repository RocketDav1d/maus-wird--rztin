import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("OPENAI_API_KEY not set");
}

export const openai = new OpenAI({ apiKey });

/**
 * Reasoning (question generation + validation) lives on Anthropic Claude Opus 4.7
 * via lib/generation/anthropic.ts. OpenAI is kept only for Whisper (STT) and
 * embeddings (semantic dedup) — Anthropic doesn't offer those.
 */
export const MODELS = {
  embedding: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  whisper: process.env.OPENAI_WHISPER_MODEL ?? "whisper-1",
} as const;
