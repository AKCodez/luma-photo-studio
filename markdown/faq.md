---
title: FAQ | Luma Agents
description: Frequently asked questions about the Luma Agents API — uni-1, prompts, aspect ratios, reference images, image editing, rate limits, billing, moderation, and more.
---

Answers to common questions about the Luma Agents API and the [uni-1](/guides/model/index.md) image model. Each section links into the relevant guide for deeper detail; the [API Reference](/api/index.md) is the complete schema.

Can’t find your question? Email <support+luma-agents-api@lumalabs.ai>. Include the `X-Request-Id` from the affected response — see [Request tracing](/guides/rate-limits#using-x-request-id-for-tracing/index.md).

## Getting started

What is the Luma Agents API?

A REST API for generating and editing images with Luma’s [uni-1](https://lumalabs.ai/uni-1) model. A single endpoint, `POST /v1/generations`, handles both text-to-image and image-to-image. Submit a job, poll `GET /v1/generations/{id}`, then download the image from the presigned URL. See the [Quickstart](/index.md) for an end-to-end example.

What is uni-1?

`uni-1` is Luma’s unified image generation and editing model. It handles text-to-image and image-to-image through the same endpoint, with support for text rendering, spatial reasoning, multi-panel output, and style transfer. See [About uni-1](/guides/model/index.md) for the capability matrix.

How do I get an API key?

Create an account at [platform.lumalabs.ai](https://platform.lumalabs.ai), generate a key from the developer dashboard, and set it as `LUMA_AGENTS_API_KEY`:

Terminal window

```
export LUMA_AGENTS_API_KEY="luma-api-..."
```

Keys start with the prefix `luma-api-`. Treat them like passwords; never commit them to source control or ship them to client-side code.

I lost my API key. Can I retrieve it?

No. The raw key is shown exactly once, at creation. The server stores only a hash. Revoke the lost key from the dashboard and create a new one.

Can I have multiple API keys?

Yes. Create as many keys as you need and name each one (e.g. `production`, `staging`) for tracking and selective revocation.

Generations, rate limits, and concurrent-job slots are scoped to the **client**, not the individual key. Multiple keys belonging to the same client share quota and can poll each other’s generations. To get isolated quota or visibility, ask support to provision a separate client, not just another key.

What is the base URL?

```
https://agents.lumalabs.ai/v1
```

There is no staging or sandbox environment. Use a test key and small generations to experiment.

How do I authenticate requests?

Pass your API key as a Bearer token in the `Authorization` header. Both endpoints require authentication; missing or malformed auth is rejected.

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A sunset over the ocean"}'
```

Which SDKs are available?

Official Python, TypeScript, Go, and CLI SDKs are coming soon. Until they ship, call the REST API directly with cURL or your HTTP client of choice. See [SDKs](/#sdks/index.md) in the Quickstart.

Is the API synchronous or asynchronous?

Asynchronous. `POST /v1/generations` returns `201` immediately with a job ID and `state: "queued"`. Poll `GET /v1/generations/{id}` until the state reaches `completed` or `failed`. See the [Quickstart](/index.md) for the full pattern.

---

## Prompts

What is the maximum prompt length?

6,000 characters. Prompts must be between 1 and 6,000 characters; anything outside that range is rejected. Clarity matters more than length — most production prompts fit comfortably under 1,000 characters.

What is the minimum prompt length?

1 character. Empty strings are rejected. A few words is usually enough; longer, more specific prompts produce better results.

Does uni-1 support non-English prompts?

`uni-1` is optimized for English. Other languages may work to varying degrees, but results are less reliable. Write prompts in English, or translate before sending, for best output.

Does the API support negative prompts?

No. There is no `negative_prompt` parameter. Describe what you do want, positively — “a serene empty beach at dawn” works better than “a beach without people”.

How do I render text inside an image?

Put the exact text in quotes inside your prompt so the model knows to render it literally:

```
{ "prompt": "A coffee shop storefront with a wooden sign that reads \"MORNING BREW\" in hand-painted serif letters" }
```

Shorter strings (under roughly 20 characters) render most reliably. Long passages of text may be partially garbled.

Can I reproduce the same image from the same prompt?

Not deterministically. Each generation uses a different random seed and there is no public `seed` parameter. For visual consistency across multiple images, pair the same prompt with one or more `image_ref` references as style anchors — see [Image generation: image\_ref](/guides/image-generation#image_ref/index.md).

How should I structure my prompts?

Be specific about subject, setting, lighting, style, and composition. Name styles explicitly (“oil painting”, “35mm film photograph”) rather than hoping the model infers them. For edits, describe only the change. For multi-reference requests, label each reference’s role (“use the color palette from the first reference”). See the [Image generation guide](/guides/image-generation/index.md) for worked examples.

---

## Aspect ratios and output

Which aspect ratios are supported?

Nine values: `3:1`, `2:1`, `16:9`, `3:2`, `1:1`, `2:3`, `9:16`, `1:2`, `1:3`. Anything else (e.g. `4:3`, `5:4`) is rejected. See [About uni-1](/guides/model#aspect-ratios/index.md) for the full table with typical use cases.

What is the default aspect ratio?

There is no fixed default. When `aspect_ratio` is omitted or `null`, the model selects a ratio based on the prompt. Pass `"16:9"` explicitly if you want a consistent widescreen default — `uni-1` is generally tuned best at 16:9.

What output formats does uni-1 support?

Two: `png` (lossless, best for graphics and sharp-edged content) and `jpeg` (smaller files, best for photographs). Omit `output_format` to let the model pick based on the prompt.

What is the output resolution?

For `type: "image"`, the model picks the resolution based on the chosen aspect ratio — there is no `1K/2K/4K` selector. For `type: "image_edit"`, the output preserves the source image’s original dimensions.

Can I generate multiple images in a single request?

No. Each request returns one image. To generate variations, submit multiple requests in parallel — up to 10 can run concurrently per client (see [Rate limits](/guides/rate-limits/index.md)).

For multi-panel layouts (e.g. a 4-panel storyboard on one canvas), describe the layout in the prompt and pick an appropriate aspect ratio.

How long do output URLs remain valid?

Output URLs are presigned and valid for 1 hour. After that the link stops working. To get a fresh URL, call `GET /v1/generations/{id}` again — every poll mints a new presigned URL with a fresh 1-hour window. Download to your own storage promptly; do not hand presigned URLs to end users.

---

## Image editing and reference images

Can I edit existing images, or is this text-to-image only?

`uni-1` supports both. Use `type: "image"` for text-to-image (with optional `image_ref` for style or content guidance) and `type: "image_edit"` for image-to-image editing (provide a `source` image and describe the change). See [Image editing](/guides/image-editing/index.md) for full details.

What is the difference between `source` and `image_ref`?

`source` is the image you want to edit; it is required for `type: "image_edit"` and rejected for `type: "image"`. `image_ref` is an optional list of reference images for style, color, or composition guidance, available on both types. On `image_edit`, the `source` occupies one of the 9 reference slots, leaving up to 8 entries for `image_ref`.

How many reference images can I pass?

Up to 9 for `type: "image"`, or up to 8 for `type: "image_edit"` (the `source` image takes the ninth slot). Exceeding either limit is rejected.

What is the maximum image size for `source` and `image_ref`?

50 MB per image (52,428,800 bytes). The limit applies to both URL-fetched and base64-encoded images, and to both `source` and `image_ref` entries. Oversized payloads are rejected, with the offending field name in the `detail`:

```
{ "detail": "source: image exceeds 50 MB limit" }
{ "detail": "image_ref[2]: image exceeds 50 MB limit" }
```

For URL fetches the proxy streams the response and aborts when it crosses 50 MB. For base64, the limit is checked on the decoded byte length. For production traffic, target under 4 MB per image at JPEG quality 85–92.

What image formats can I upload for reference or source?

Common raster formats — JPEG, PNG, WebP, and still-frame GIF — are accepted. When you send base64 `data`, `media_type` is required (e.g. `"image/jpeg"`, `"image/png"`). Non-image content (PDF, video, HTML) is rejected with `"image_ref[0]: content-type is not an image"`.

URL or base64: which should I use?

Each `source` and `image_ref` entry must provide exactly one of `url` or `data`. Never both, never neither:

| Entry shape                                   | Result                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `{"url": "https://..."}`                      | Valid                                                                   |
| `{"data": "...", "media_type": "image/jpeg"}` | Valid                                                                   |
| `{"url": "...", "data": "..."}`               | Rejected: `"image_ref[0]: provide either 'url' or 'data', not both"`    |
| `{}`                                          | Rejected: `"image_ref[0]: provide either 'url' or 'data', not neither"` |
| `{"data": "..."}` without `media_type`        | Rejected: `"image_ref[0]: 'media_type' is required with 'data'"`        |

Use a URL when the image is already hosted publicly; it avoids upload bandwidth on your side. Use base64 for private images, local files, dev environments, or when the URL ingestion subsystem is temporarily unavailable (see [Service unavailable](/guides/error-handling#503--service-unavailable/index.md)).

What requirements does a reference URL need to meet?

URLs are fetched server-side through a Cloudflare edge proxy with strict SSRF protection. The URL must:

- Use `https://` (plain `http://` is rejected).
- Resolve to a public IP. RFC1918, loopback, and link-local addresses are rejected.
- Not redirect from HTTPS to HTTP at any point in the chain.
- Resolve via public DNS (the proxy cannot reach VPNs or internal hostnames).
- Return a successful response with an `image/*` content-type.
- Be under 50 MB and respond within roughly 18 seconds.

Signed URLs (e.g. S3 presigned, Cloudinary signed delivery) work as long as the signature is valid at request time. If you can’t meet these requirements, send the image as base64 `data`.

Does uni-1 support inpainting or outpainting with masks?

No. There is no mask parameter. Editing is prompt-based: describe the change in natural language and `uni-1` applies it while preserving unmentioned parts of the image. Examples — “replace the background with a tropical beach at sunset”, “change the car’s color to midnight blue”, “convert to a bold manga illustration with clean ink outlines”.

Can I control how closely the output follows a reference image?

There is no explicit strength or adherence slider; control is through the prompt. For loose guidance, name the attribute you want (“use the color palette from the reference”). For tight guidance, be specific (“closely match the composition, color grading, and lighting of the reference, but change the subject to a jazz musician”). With multiple references, label each one’s role so the model doesn’t have to guess.

Does an edit preserve the source image’s dimensions?

Yes. For `type: "image_edit"`, the output matches the source image’s width and height. Do not pass `aspect_ratio` on edit requests — it is silently ignored.

---

## Advanced generation features

What styles are supported?

Two `style` values: `auto` (the default; the model picks based on your prompt) and `manga` (multi-panel comic-page aesthetic with ink outlines and screentone shading). `manga` requires a portrait aspect ratio — `2:3`, `9:16`, `1:2`, or `1:3` — and is rejected for landscape or square ratios. For other stylized looks (oil painting, film noir, anime illustration, ukiyo-e), leave `style` at `auto` and describe the style in the prompt.

Does `aspect_ratio` apply to image edits?

No. For `type: "image_edit"`, the output dimensions are determined by the source image and `aspect_ratio` is silently ignored. To change an image’s aspect ratio, crop the source yourself before sending.

What does `web_search: true` do?

The model searches the web for visual references before generating, then uses what it finds to ground the output. This noticeably improves accuracy for prompts that name real-world landmarks, products, or public figures. Web search adds a few seconds of latency, so leave it off for purely imaginative prompts.

```
{
  "prompt": "The Eiffel Tower at golden hour with cherry blossoms in the foreground",
  "web_search": true
}
```

Can I generate a video with this API?

No. `uni-1` is image-only, and `type` accepts `image` and `image_edit`. For video generation, see Luma’s [Dream Machine](https://lumalabs.ai/dream-machine).

Can I cancel a running generation?

There is no cancel endpoint. A generation runs until it reaches `completed`, `failed`, or the 1-hour active-job TTL. To stop caring about a result in practice, stop polling — your client won’t see the output, and the concurrent-job slot is released when the job terminates.

---

## Polling, states, and timing

What are the generation states?

Four values: `queued` (waiting to be picked up), `processing` (running), `completed` (success — `output` contains download URLs), and `failed` (check `failure_reason` and `failure_code`). `completed` and `failed` are terminal; poll until you reach one of them.

How often should I poll?

Every 2–5 seconds is a sensible default. For production, use exponential backoff capped at around 5 seconds and a hard timeout of about 2 minutes for standard generations. See the [Quickstart](/index.md) for a polling template.

Is the GET endpoint rate limited?

Not by the documented generation RPM bucket (the one reflected in `X-RateLimit-*` headers on submit). Poll cadences of every 1–5 seconds are fine.

An API-wide abuse-prevention ceiling does exist as a backstop against runaway loops, sized so well-behaved integrators never see it. If you hit it, the response is a rate-limit error with `Retry-After` only, no `X-RateLimit-*` headers. Back off to a more reasonable interval.

How long does a generation typically take?

Standard generations and edits typically complete in 15–60 seconds. `web_search: true` adds a few seconds for the search phase. Always set a timeout in your polling loop — never wait indefinitely.

My generation has been queued for a long time. What should I do?

Check three things:

1. Concurrent-job slot is free. If you’re at 10 active jobs, new submissions wait for one to terminate.
2. Wait an additional 30–60 seconds and poll again — short queue spikes are normal.
3. If still stuck after a few minutes, contact support and include the `X-Request-Id` from the submit response.

---

## Rate limits and concurrency

What are the default rate limits?

Two limits, both per client:

| Limit                     | Default | Applies to                                       |
| ------------------------- | ------- | ------------------------------------------------ |
| Requests per minute (RPM) | 30      | `POST /v1/generations`, rolling 60-second window |
| Concurrent jobs           | 10      | Active (non-terminal) generations at any time    |

Exceeding either returns a rate-limit error. See [Rate limits and headers](/guides/rate-limits/index.md) for full detail.

How does the RPM sliding window work?

Each request is timestamped, and the API counts how many requests landed in the last 60 seconds at the moment a new one arrives. There is no fixed reset — requests age out individually after 60 seconds. See [the timeline example](/guides/rate-limits#how-the-rpm-limit-works/index.md) for a walk-through.

What do the rate-limit headers mean?

Successful `POST /v1/generations` responses include three headers describing your current quota:

| Header                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `X-RateLimit-Limit`     | Your maximum RPM                                   |
| `X-RateLimit-Remaining` | Requests remaining in the current 60-second window |
| `X-RateLimit-Reset`     | Unix timestamp when the current window ends        |

When you’re rate-limited, `Retry-After` reports the minimum seconds to wait before retrying.

How do I tell RPM from concurrent-job rate limiting?

Both surface as the same rate-limit error. Read the `detail` field to distinguish them:

| `detail`                     | Cause      | What to do                                      |
| ---------------------------- | ---------- | ----------------------------------------------- |
| `"Rate limit exceeded"`      | RPM        | Wait `Retry-After` seconds, then retry          |
| `"Too many concurrent jobs"` | Concurrent | Wait for an active job to terminate, then retry |

Concurrent-job rejections use a fixed `Retry-After: 60` and do not include `X-RateLimit-*` headers.

How can I increase my rate limits?

Rate limits vary by plan. Your current limits are reflected in `X-RateLimit-Limit` on every successful response. For higher limits, contact support with your use case and expected traffic.

---

## Errors

Where can I find the full list of error responses?

The [Error handling](/guides/error-handling/index.md) guide is the source of truth — it lists every status the API can return, the exact `detail` string for each case, and whether the error is retryable. Branch on the status code in your client and consult the guide when adding handling for a new case.

What is the difference between synchronous and asynchronous failures?

Synchronous errors are returned immediately from the POST with a `detail` message; branch on the status code. Asynchronous failures happen after the submit has already been accepted and are surfaced when polling: `state` becomes `failed`, with `failure_reason` (human-readable) and `failure_code` (machine-readable). A robust client handles both.

What are the asynchronous `failure_code` values?

| `failure_code`      | Description                                   | Action                          |
| ------------------- | --------------------------------------------- | ------------------------------- |
| `content_moderated` | Input or output flagged by content moderation | Modify the prompt, do not retry |
| `generation_failed` | Internal model error                          | Retry the same request          |
| `budget_exhausted`  | Credits ran out mid-generation                | Add credits, then retry         |
| `output_not_found`  | Generated output could not be retrieved       | Retry the same request          |

See [Error handling — Asynchronous failures](/guides/error-handling#asynchronous-failures/index.md).

What does `content_moderated` mean? Can I retry?

It indicates the prompt, reference images, or generated output was flagged by content moderation. Do not retry the same request — the decision will be the same. Modify the prompt or swap reference images, then resubmit.

My output URL stopped working. What’s wrong?

Presigned URLs expire after 1 hour; once the signature has expired, storage refuses the download. Call `GET /v1/generations/{id}` to mint a new presigned URL with a fresh 1-hour window.

My reference image was rejected as unprocessable. Now what?

The reference was syntactically valid but couldn’t be processed. The `detail` field tells you exactly what to fix:

| `detail`                                       | Fix                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `"image_ref[0]: invalid base64 data"`          | Re-encode the image (e.g. `base64.b64encode(bytes).decode("utf-8")`)                  |
| `"image_ref[0]: failed to fetch URL"`          | Confirm the URL is publicly reachable                                                 |
| `"source: failed to fetch URL"`                | The origin did not return the image successfully — confirm it serves a valid response |
| `"image_ref[0]: content-type is not an image"` | The URL is not serving an image — check for HTML or PDF redirects                     |

What should I do with the `X-Request-Id` header?

Log the value from every response and include it in support requests. You can also send your own `X-Request-Id` to trace requests through your own system; the server echoes it back. See [Request tracing](/guides/rate-limits#using-x-request-id-for-tracing/index.md).

---

## Content moderation and safety

What content is not allowed?

The full policy lives in the [Terms of Service](https://lumalabs.ai/legal/tos) and acceptable-use policy. The model blocks:

- Child sexual abuse material (zero tolerance)
- Sexually explicit content
- Non-consensual intimate imagery and deepfakes of real people
- Graphic violence and gore
- Content promoting self-harm or dangerous acts
- Hateful content targeting protected groups
- Infringing or trademarked imagery in misleading contexts

Moderation runs on inputs (`prompt`, `source`, `image_ref`) and outputs.

Can I disable content moderation?

No. Moderation is enforced on every input and output and cannot be disabled.

My prompt was moderated but feels benign. What happened?

Moderation is conservative by design. Common causes of false positives include named public figures, words with dual meanings (violence-adjacent verbs, medical terminology), and reference images depicting real people. Rephrase with a more generic subject (“a jazz musician” instead of a specific name), swap reference images if needed, and resubmit.

---

## Billing and credits

A dedicated pricing page is **coming soon** — the answers below describe how billing works mechanically. Per-action credit prices are TBD and will be published before GA.

How is pricing calculated?

Generations are priced in credits. The price for a single request depends on the action type (`image` vs. `image_edit`) and the number of reference images; quality modes (capability-gated) reserve a multiple of the base price. Per-action credit prices are published on the pricing page (TBD).

Do I pay for failed generations?

Synchronous errors are never charged; the credit reserve is released the moment the request is rejected. For asynchronous failures, the charge depends on the `failure_code`:

| `failure_code`      | Charge                  |
| ------------------- | ----------------------- |
| `content_moderated` | Refunded                |
| `generation_failed` | Refunded                |
| `output_not_found`  | Refunded                |
| `budget_exhausted`  | Partial charge possible |

If you believe you were charged for a failure that should have been refunded, contact support with the generation ID and `X-Request-Id`.

How do I check my credit balance?

Balance lookup will be exposed via the developer dashboard. The dashboard URL will be linked from the pricing page once published (TBD).

What happens if I run out of credits at submit time?

`POST /v1/generations` rejects the request immediately. The request is not queued and no credits are deducted. Add credits and resubmit.

```
{ "detail": "Insufficient credits. Please add credits to continue." }
```

What happens if I run out of credits mid-generation?

A reserve is placed at submit time covering the maximum possible charge. If consumption exceeds the reserve mid-generation (rare; only possible with quality modes), the generation fails with `failure_code: "budget_exhausted"`. Add credits and resubmit.

```
{
  "state": "failed",
  "failure_code": "budget_exhausted",
  "failure_reason": "Insufficient credits to complete this generation."
}
```

Can I set up auto-reload?

Yes. Configure a `threshold_credits` and `reload_amount_credits`; when your balance drops below the threshold, Stripe charges your default payment method for the reload amount. The dashboard configuration UI will be linked from the pricing page once published (TBD).

Is there a free tier?

To be published on the pricing page (TBD).

---

## Data handling and privacy

Does Luma train on my API inputs or outputs?

Review the current data-handling policy in the [Terms of Service](https://lumalabs.ai/legal/tos) and privacy policy. For enterprise agreements with custom data-handling guarantees, contact sales.

How long are my generations stored?

Generation metadata (IDs, prompts, state) is retained for operational and billing purposes. Output images are stored long enough to serve presigned URLs, with new URLs minted on every poll. Retention beyond that follows the published privacy policy. For deletion or data-export requests, email <support+luma-agents-api@lumalabs.ai>.

Who owns the generated images?

Ownership and licensing are governed by Luma’s [Terms of Service](https://lumalabs.ai/legal/tos), which covers commercial-use rights. When in doubt, review the TOS or contact sales.

---

## Troubleshooting

My API key is rejected, but it works elsewhere.

The `detail` field on the auth error tells you exactly which case you’re in — branch on it to debug:

| `detail`                       | Likely fix                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `"Missing or invalid API key"` | Add `Authorization: Bearer <key>` and confirm the key starts with `luma-api-`        |
| `"Invalid API key"`            | Key value doesn’t match any active key — re-copy the full key, or generate a new one |
| `"API key has been revoked"`   | Generate a new key — revoked keys cannot be restored                                 |
| `"API key has expired"`        | Generate a new key — keys can have an `expires_at`                                   |

Other things to check:

1. **Environment variable not expanded** — verify `LUMA_AGENTS_API_KEY` is set in the shell running your code.
2. **Whitespace or newline** — common when copy-pasting from a dashboard. Trim before use.
3. **Bearer scheme is case-sensitive** — `bearer` (lowercase) is not accepted.

I just created a generation but GET says it doesn’t exist.

Three possible causes, all returning the same `"Generation not found"` to prevent enumeration:

1. **Wrong account or client.** Generations are scoped per client. A key from a different client cannot see it even with a correct ID.
2. **Typo in the ID.** Copy it directly from the `id` field of the submit response.
3. **Invalid UUID format.** The path parameter must parse as a UUID.

My reference URL works in a browser but the API rejects it.

The fetch proxy is stricter than a browser. Common causes:

1. The URL redirects to HTML (e.g. a login wall); the proxy sees HTML, not an image.
2. The URL is `http://` (proxy is HTTPS-only) or resolves to a private IP.
3. A short-lived signed URL expired between copy and fetch.
4. The origin returns a non-200 status, or a content-type that is not `image/*`.

When in doubt, download the image yourself and send it as base64 `data`.

Reference URLs are failing with a service-unavailable error.

The URL ingestion subsystem is temporarily unavailable. Send the image as base64 `data` instead:

```
import base64, httpx


resp = httpx.get("https://example.com/reference.jpg")
b64 = base64.b64encode(resp.content).decode("utf-8")


generation = client.generations.create(
    prompt="A similar scene but at sunset",
    image_ref=[{"data": b64, "media_type": "image/jpeg"}],
)
```

If you don’t need reference images, retry the request without them.

How do I report a bug or get support?

Email <support+luma-agents-api@lumalabs.ai>. Include:

1. The `X-Request-Id` from the affected response (submit and/or poll).
2. The generation ID.
3. Request parameters, with API keys redacted.
4. Expected versus actual behavior.

Request IDs let support trace a specific request through our logs quickly.

---

## Versioning

What API version am I using?

Every response includes `X-API-Version`. The current value is `2026-04-01`. You do not need to send a version header — there is currently a single version.

How are breaking changes communicated?

Breaking changes ship behind a new `X-API-Version` value; the previous version remains available during a deprecation window. Watch the [API Reference](/api/index.md) and changelog for announcements.

---

## Next steps

- [**Quickstart**](/index.md) — Submit your first generation
- [**About uni-1**](/guides/model/index.md) — Model capabilities and output specs
- [**Image generation**](/guides/image-generation/index.md) — Every parameter with examples
- [**Image editing**](/guides/image-editing/index.md) — Edit existing images with natural language
- [**Rate limits and headers**](/guides/rate-limits/index.md) — Rate limiting and retry strategies
- [**Error handling**](/guides/error-handling/index.md) — Every error code with troubleshooting
- [**API Reference**](/api/index.md) — Complete endpoint specifications
