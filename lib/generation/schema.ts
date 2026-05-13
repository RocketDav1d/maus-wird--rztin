import { z } from "zod";

export const questionTypeZ = z.enum(["recall", "reasoning", "clinical_case"]);
export const priorityZ = z.enum(["high", "med", "low", "skip"]);

export const topicEntryZ = z.object({
  topic: z.string(),
  priority: priorityZ,
  page_start: z.number().int().min(1),
  page_end: z.number().int().min(1),
  rationale_de: z.string(),
});
export type TopicEntry = z.infer<typeof topicEntryZ>;

export const topicMapZ = z.object({
  topics: z.array(topicEntryZ),
});

export const keyPointZ = z.object({
  point_de: z.string(),
  required: z.boolean(),
  synonyms_de: z.array(z.string()),
});
export type KeyPoint = z.infer<typeof keyPointZ>;

export const cardCandidateZ = z.object({
  question_de: z.string(),
  question_type: questionTypeZ,
  difficulty: z.number().int().min(1).max(3),
  topic_tags: z.array(z.string()),
  expected_answer_de: z.string(),
  answer_key_points: z.array(keyPointZ),
  source_page: z.number().int().min(1),
  source_section_heading: z.string(),
  source_quote_de: z.string(),
  exam_likeness: z.number().int().min(1).max(10),
});
export type CardCandidate = z.infer<typeof cardCandidateZ>;

export const cardBatchZ = z.object({
  candidates: z.array(cardCandidateZ),
});

export const groundingZ = z.object({
  supported: z.enum(["yes", "no", "partial"]),
  reason_de: z.string(),
});

export const validateResultZ = z.object({
  verdict: z.enum(["correct", "incorrect", "incomplete"]),
  hit_key_points: z.array(
    z.object({
      point_de: z.string(),
      hit: z.boolean(),
    }),
  ),
  feedback_de: z.string(),
});
export type ValidateResult = z.infer<typeof validateResultZ>;
