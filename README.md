# maus-arzt

Voice-driven flashcard trainer for the German oral medical board exam (mündliche Prüfung).
Upload a PDF, get an AI examiner that reads questions in German, listens to spoken answers,
and validates them against a rubric of key points.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (base-nova) · Drizzle ORM + Postgres
· Auth.js v5 · **Anthropic Claude Opus 4.7** (reasoning) · OpenAI Whisper + embeddings · ElevenLabs · motion (Framer)

---

## What it does

1. Log in (single seeded user).
2. Upload a German medical PDF.
3. The app extracts text, builds a topic map (Pass 1), then generates exam-style questions
   per topic chunk (Pass 2). Questions are scored for "exam-likeness", filtered for
   source-grounding and triviality, deduped, and saved as a reviewable deck.
4. Review/edit/reject cards in the deck UI.
5. Hit "Training starten" — the agent reads each question aloud (ElevenLabs, German voice).
6. Hold the push-to-talk button (or hold Space) to record your spoken answer.
7. Whisper transcribes, GPT-5 grades the transcript against the card's rubric of key points.
8. Card border turns:
   - **green** → correct, slides to the left pile.
   - **red** → wrong, rotates to back of the deck.
   - **amber** → incomplete, stays on top for retry.

---

## Local setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.local.example .env.local
# edit .env.local — see "Environment" section below

# 3. Create the schema in your Postgres database
npm run db:push

# 4. Seed the single user (uses SEED_USER_EMAIL + SEED_USER_PASSWORD from env)
npm run db:seed

# 5. Dev
npm run dev
```

Then open <http://localhost:3000> and log in with the seeded credentials.

---

## Environment variables

See `.env.local.example`. The non-obvious ones:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Any Postgres connection string. Locally: a Docker postgres or a free Neon project. On Vercel: provisioned by the Neon integration. |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32`. |
| `ANTHROPIC_API_KEY` | Required. Used for Claude Opus 4.7 (question generation, source-grounding QC, and spoken-answer validation). |
| `ANTHROPIC_MODEL` | Default `claude-opus-4-7`. Adaptive thinking + `xhigh` effort on the generate call, `high` elsewhere. Long German system prompts use prompt caching across the chunks of a single generation run. |
| `OPENAI_WHISPER_MODEL` | Default `whisper-1` (most accurate for German medical vocab). |
| `OPENAI_EMBEDDING_MODEL` | Default `text-embedding-3-small` (used to dedup generated questions). |
| `ELEVENLABS_VOICE_ID` | Pick a German-friendly Multilingual v2 voice from <https://elevenlabs.io/app/voice-library>. The default is the public "Rachel" voice — fine for testing, but swap to one she finds easy to listen to for 30+ min. |
| `ELEVENLABS_MODEL_ID` | Default `eleven_multilingual_v2`. Don't use `eleven_turbo_v2_5` for German medical terms — it mispronounces medical Latin. |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | The one account that can log in. Re-run `npm run db:seed` to update the password. |

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo.
3. **Storage** → add **Neon Postgres** (Vercel's bundled offering). Vercel auto-injects
   `DATABASE_URL`.
4. **Environment variables**: add the rest (`AUTH_SECRET`, `OPENAI_API_KEY`,
   `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`).
5. Set `AUTH_TRUST_HOST=true`.
6. After the first deploy, run schema push + seed once against the prod DB:
   ```bash
   # locally, with prod DATABASE_URL exported (pull from Vercel)
   vercel env pull .env.production
   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d= -f2-) npm run db:push
   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d= -f2-) \
   SEED_USER_EMAIL=... SEED_USER_PASSWORD=... npm run db:seed
   ```
7. Done — your girlfriend can log in from any device with a mic.

### Function timeouts

The generation pipeline can take 5–10 minutes for a full PDF (~80 pages). The
`/api/decks/[id]/generate` route sets `maxDuration = 800` (Vercel Fluid Compute / Pro).
On Hobby tier you're capped at 60s — keep test PDFs to ~10 pages until you upgrade.

---

## How question quality is enforced

The "right questions" problem was the critical product risk. The pipeline is built around it:

1. **Pass 1 (topic map)** — Claude Opus 4.7 reads page-starts of the whole doc, marks each topic
   `high | med | low | skip`. Footnotes, glossaries, history sections get `skip`.
2. **Pass 2 (per-chunk generation)** — system prompt includes a persona ("Du bist Prüfer im
   mündlichen Staatsexamen"), an **anti-pattern list** (no trivia, no single-fact lookups),
   a **good-question rubric** (differentials, "Was wäre Ihr nächster Schritt", clinical
   vignettes), and **4 hand-curated few-shot examples** in German. The model over-generates
   5–8 candidates per chunk with a self-scored `exam_likeness`. The system prompt is
   ephemeral-cached so every chunk after the first reuses the cached prefix (cheaper + faster).
3. **Card schema** — every card stores `answer_key_points: [{point_de, required, synonyms_de[]}]`.
   This rubric is what the validator scores against, not a paragraph match. Synonyms
   handle "Herzinfarkt" ↔ "Myokardinfarkt".
4. **Automated QC** before review:
   - **Source grounding**: Claude verifies each `expected_answer` is supported by its
     `source_quote`. Drops hallucinations.
   - **Semantic dedup**: question embeddings clustered at cosine ≥ 0.88.
   - **Triviality filter**: regex on forbidden patterns, drops if `expected_answer`
     < 12 words or fewer than 2 required key points.
5. **Human review** — every generated card lands in the review UI with status `pending`.
   You can edit question, expected answer, individual key points (incl. their required
   flag and synonyms), or reject. The quiz only includes non-rejected cards.

The prompts live in [lib/generation/prompts.ts](lib/generation/prompts.ts). Tune them
against your actual PDF — that's where the biggest quality wins are.

---

## Project layout

```
app/
  login/              auth page + server action
  decks/new/          PDF upload + generation kickoff
  decks/[id]/         deck review (edit/reject cards)
  decks/[id]/quiz/    voice quiz UI
  api/
    auth/             Auth.js handlers
    decks/            create + generate (SSE) + card patch + quiz reset
    tts/              ElevenLabs proxy
    stt/              Whisper transcription
    validate/         GPT-5 rubric validation
auth.ts               Auth.js config (Credentials + JWT)
proxy.ts              route protection (Next.js 16 middleware replacement)
components/ui/        shadcn primitives
components/quiz/      flashcard stack, push-to-talk, quiz state machine
lib/db/               Drizzle schema + client
lib/pdf/              unpdf wrapper
lib/generation/       the question-quality pipeline (prompts, two-pass, QC)
lib/tts/              ElevenLabs helper
lib/stt/              Whisper helper
lib/validate/         rubric-based answer scoring
scripts/              seed + migrate scripts (run with `tsx`)
```

---

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:push` | Sync the Drizzle schema to your DB (dev/preview). |
| `npm run db:generate` | Generate SQL migration files (for prod). |
| `npm run db:migrate` | Apply migration files. |
| `npm run db:studio` | Drizzle Studio (DB browser). |
| `npm run db:seed` | Create/update the single user from `SEED_USER_*` env vars. |
