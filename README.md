# Luma Photo Studio

Drop one face. Walk out with a 12-image photoshoot.

**Live demo:** https://luma-photo-studio.vercel.app

A single-page studio that takes up to three reference photos of your face and produces a curated 12-image shoot. Three modes: pre-built **Packs** (GTA 6, Editorial, Dating Profile, Cinematic, Tech Founder, Streetwear, Travel, Dark Academia, Y2K, Album Cover, Magazine Cover, Anime Con, Simpsons-inspired), **Surprise Me** (Claude invents 12 distinct scenes from a one-word vibe), and **Custom** (write your own). Click any image to edit it in plain English.

Built with [Luma Uni-1 / Photon](https://lumalabs.ai/uni-1) for image generation, Claude Sonnet for scene authoring, Next.js, and Vercel.

---

## What it does

- **Multi-reference upload** — drop up to 3 photos for a stronger likeness lock
- **11 curated Packs** — each pack auto-fills 12 hand-written scene prompts in a distinct aesthetic
- **Surprise Me** — type a one-word vibe ("hacker", "tokyo at 3am") and Claude composes 12 unique scenes
- **Custom** — write your own 12 prompts
- **Plain-English editing** — click any image, type "make the jacket red" and only that changes
- **History** — every past shoot is browsable at `/history`
- **Permalinks** — `/shoots/{id}` for any shoot, shareable

## Tech stack

- **Next.js 15.5** App Router + React 19 + TypeScript strict
- **Tailwind CSS** + shadcn primitives + Framer Motion
- **@anthropic-ai/sdk** — Claude Sonnet 4.5 for surprise scene authoring (tool calling)
- **Luma Dream Machine API** — `photon-1` model with `character_ref` face lock and `modify_image_ref` for edits
- **Vercel Blob** — direct browser-to-blob uploads (bypasses 4.5 MB serverless body cap), per-image state stored as separate JSON blobs to avoid concurrent-write races
- **React Query + Sonner** for client polling and toasts

---

## Quick start (local)

```bash
# 1. Clone
git clone https://github.com/AKCodez/luma-photo-studio
cd luma-photo-studio

# 2. Install
npm install

# 3. Configure env (see next section)
cp .env.example .env.local
# Edit .env.local and paste your three keys

# 4. Run
npm run dev
# open http://localhost:3000
```

That's it. The studio runs against your own Luma + Anthropic + Vercel Blob accounts.

---

## Environment variables

Create `.env.local` from `.env.example` and fill in:

| Variable | What it's for | Where to get it |
|---|---|---|
| `LUMA_API_KEY` | Image generation + editing | https://lumalabs.ai/dream-machine/api/keys |
| `ANTHROPIC_API_KEY` | Surprise Me scene authoring | https://console.anthropic.com/ |
| `BLOB_READ_WRITE_TOKEN` | Image + manifest storage | Vercel Dashboard → Storage → Create Blob Store → Connect to project. Or use `vercel env pull .env.local` after linking. |

**Local dev without Vercel Blob:** if `BLOB_READ_WRITE_TOKEN` is missing, the app falls back to local filesystem storage at `./data/` and `./public/uploads`, `./public/shoots/`. Generated images are served by Next.js. Uploads still need to be reachable by Luma's servers though, so for testing `character_ref` on localhost you'll want a tunnel (e.g. `ngrok http 3000`) or just deploy to Vercel.

> **Security:** `.env`, `.env.local`, and `.env*.local` are gitignored. **Never commit real keys.** When you fork, double-check before your first push.

---

## Deploying to Vercel

This repo is set up to auto-deploy on every push to `master`.

```bash
# 1. Push your fork to GitHub (public or private)
gh repo create my-photo-studio --public --source=. --push

# 2. Link to Vercel
vercel link

# 3. Add a Blob store (auto-injects BLOB_READ_WRITE_TOKEN)
vercel blob create-store luma-store
# answer 'y' when asked to connect to project

# 4. Push your two API keys as encrypted env vars
vercel env add LUMA_API_KEY production
vercel env add ANTHROPIC_API_KEY production
# (repeat for preview / development if you want)

# 5. Deploy
vercel deploy --prod
```

Or skip the CLI and use the Vercel dashboard: import the GitHub repo, add the env vars under Settings → Environment Variables, attach a Blob store under Storage, redeploy.

---

## Repo layout

```
app/
  layout.tsx                          Fonts, providers
  page.tsx                            Studio entry (state machine in <Stage/>)
  globals.css                         Theme tokens + tailwind
  history/page.tsx                    Past shoots grid
  shoots/[id]/page.tsx                Shoot permalink
  api/
    upload/route.ts                   handleUpload for direct browser→Blob
    shoots/route.ts                   POST: create base + 12 queued image states
    shoots/[id]/route.ts              GET: aggregated manifest
    shoots/[id]/generate/[index]/route.ts
                                      POST: run ONE Luma generation (synchronous)
    edit/route.ts                     POST: modify_image_ref edit
    surprise/route.ts                 POST: Claude tool-call for 12 scenes
components/
  studio/                             Stage state machine + step components
  ui/                                 Button, Dialog, Input, Textarea
lib/
  luma.ts                             Luma client + LumaError
  anthropic.ts                        Claude client
  shoot.ts                            startSceneGeneration helper
  storage.ts                          Blob/FS storage abstraction
  packs.ts                            11 packs × 12 hand-written scene prompts
  surprisePrompt.ts                   System prompt for Surprise Me
  types.ts                            Shared types
```

---

## Personalize it with Claude Code

This whole project was built by talking to [Claude Code](https://claude.com/claude-code). You can fork it and ask Claude to add anything you want.

### Setup Claude Code (one-time)

```bash
# Install
npm install -g @anthropic-ai/claude-code

# Open this repo in Claude Code
cd luma-photo-studio
claude
```

### Things you can ask Claude to add

Just paste these into the Claude Code prompt:

#### Add a new pack

> Add a "Wes Anderson" pack with 12 scenes — symmetrical centered framing, pastel palette, tweed and embroidered jackets, single-point perspective, anywhere from a Continental hotel lobby to a yellow submarine. Keep the tone of the existing packs in `lib/packs.ts`.

#### Change the visual theme

> Switch the accent colour from ember (`#d97757`) to a deep forest green throughout the app. Update `globals.css`, `tailwind.config.ts`, and any spots that reference `ember-` classes.

#### Add a new mode beyond packs / surprise / custom

> Add a fourth mode called "Album" that takes a 60-second YouTube link, transcribes the lyrics with Whisper, and uses Claude to turn each line into a visual prompt. Show a fourth card in the ModePicker.

#### Personalize the homepage copy

> Change the homepage hero to say "Luma photoshoot for [my name]" and replace the helper copy under the dropzone with my own brand voice.

#### Wire up auth

> Add Clerk auth via the Vercel Marketplace. Anyone can browse, but only signed-in users can run shoots. Gate `/history` to the signed-in user only.

#### Tighten the prompts

> The Cinematic pack is rendering too dark. Lighten every Cinematic scene by adding "soft fill light, lifted shadows" while keeping the rest of each prompt intact.

#### Add a video pack

> Add a new "Motion" pack that uses Luma's video generation endpoint instead of image. Each scene generates a 5-second clip. Reuse character_ref the same way. Show videos in the gallery with play-on-hover.

#### Migrate storage

> Move from Vercel Blob to Cloudflare R2. Keep the storage interface in `lib/storage.ts` the same shape so nothing else has to change.

### Tips for steering Claude

- **Point at files.** "In `lib/packs.ts`, add a new pack at the top of the array …" produces a more reliable diff than open-ended asks.
- **Lock in style.** "Match the existing pack format — same field names, same prompt density, same writing voice."
- **Verify before merging.** Claude runs `npx tsc --noEmit && npx eslint . --quiet` after every change. Confirm both pass before you push.
- **Iterate visually.** Claude has Chrome browser access; ask "screenshot the result and tell me what's off" after a change.
- **Keep secrets out.** Claude won't paste real API keys into the repo, but if you share keys in chat, scrub them from your transcript before sharing publicly.

---

## Architecture notes

A few decisions worth knowing if you're hacking on this.

**Client-driven generation fan-out.** `POST /api/shoots` only writes the base manifest and 12 `queued` image states, then returns. The browser then fires 12 parallel `POST /api/shoots/{id}/generate/{i}` calls — each is its own serverless invocation that runs one Luma generation start→poll→download→save synchronously. This is the only pattern that works on Vercel — fire-and-forget background work after a response is killed when the function instance ends.

**Per-image blob state.** Each image's status lives in `shoots/{id}/image-{i}.json`. The aggregated manifest is computed at read time. This avoids 12 concurrent generation jobs racing to overwrite a single shared `manifest.json`.

**Direct browser uploads.** `/api/upload` uses `handleUpload` from `@vercel/blob/client`, returning a one-shot upload token to the browser. The file streams directly from the browser to Blob, bypassing Vercel's 4.5 MB serverless body limit (cap is 100 MB).

**Face lock.** Every Luma call sends `character_ref: { identity0: { images: [...refs], weight: 0.95 } }`. Up to 4 reference images per identity per [Luma's docs](https://docs.lumalabs.ai/docs/image-generation).

**Edit pattern.** `modify_image_ref` with weight 0.05 + the original `character_ref` keeps composition stable while letting the prompt move only what you ask. Each edit becomes a new variant alongside the original.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Every scene fails with `"failed to moderate image"` | Luma can't fetch your reference URL (e.g. localhost) | Deploy to Vercel, or run a tunnel like `ngrok http 3000` |
| `413 Content Too Large` on upload | Hitting Vercel's serverless body cap | Should not happen — uploads go direct to Blob. Confirm `BLOB_READ_WRITE_TOKEN` is set. |
| Image stuck on `queued` for 10+ min | Browser tab was closed before fan-out completed; serverless can't resume in the background | Reopen the shoot URL — completed images are persisted, but anything still queued won't restart automatically |
| Blocked Simpsons / branded prompts | Luma moderation hits trademarked names | Use the `simpsons-inspired` pack which is reworded with generic descriptors |
| History page is empty in production | Blob store isn't connected | `vercel blob create-store …` and answer yes to link, then redeploy |

---

## Credits

- [Luma Labs Uni-1 / Dream Machine](https://lumalabs.ai/uni-1)
- [Anthropic Claude](https://claude.com)
- Built end-to-end with [Claude Code](https://claude.com/claude-code) — every line.
