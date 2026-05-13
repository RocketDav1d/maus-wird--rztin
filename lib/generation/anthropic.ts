import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("ANTHROPIC_API_KEY not set");
}

export const anthropic = new Anthropic({ apiKey });

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

/**
 * Validation model — used by the rubric-based answer checker in the quiz hot path.
 * Defaults to Haiku 4.5 because validation is structured classification against a
 * known rubric, not deep reasoning. Haiku gives ~3–5× lower latency.
 *
 * Note: `effort` and adaptive `thinking` are NOT passed to this model — both
 * either don't apply to Haiku or actively error. Keep the validate call site
 * lean unless you switch this to Opus/Sonnet, in which case re-add them.
 */
export const ANTHROPIC_VALIDATE_MODEL =
  process.env.ANTHROPIC_VALIDATE_MODEL ?? "claude-haiku-4-5";

/**
 * Standard ephemeral cache marker — 5-minute TTL.
 * Apply to system prompts that are reused across many requests in a single
 * generation run (per-chunk generation, per-card grounding, per-answer validation).
 * Cache only kicks in once the prefix exceeds the model's minimum (4096 tokens on
 * Opus 4.7); below that it's a silent no-op. Either way it doesn't hurt.
 */
export const CACHE_EPHEMERAL = { type: "ephemeral" as const };
