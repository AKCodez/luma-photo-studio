---
title: Rate limits and headers | Luma Agents
description: How rate limiting works, what headers mean, and how to handle every response scenario.
---

The Luma Agents API enforces rate limits to ensure reliable service for all users. This guide explains how the limits work, what every response header means, and how to build integrations that handle rate limits gracefully.

See the [API Reference](/api/index.md) for complete response header documentation.

## Rate limit types

The API enforces two independent rate limits on `POST /v1/generations`:

| Limit                         | Default | Description                                                        |
| ----------------------------- | ------- | ------------------------------------------------------------------ |
| **Requests per minute (RPM)** | 30      | Maximum number of generation requests per 60-second sliding window |
| **Concurrent jobs**           | 10      | Maximum number of active (non-terminal) generations at any time    |

Both limits are evaluated per API key. A request must pass **both** checks to succeed — exceeding either one returns HTTP 429.

Rate limits may vary by plan. Your specific limits are reflected in the `X-RateLimit-Limit` header on every successful response.

---

## How the RPM limit works

The RPM limit uses a **sliding window** algorithm. Each request is timestamped, and the API counts how many requests occurred in the last 60 seconds. There is no fixed reset boundary — the window slides continuously.

**Example timeline (30 RPM limit):**

```
Time    Requests in window    Outcome
─────   ──────────────────    ──────────────────────────
12:00   1                     Allowed (29 remaining)
12:00   2                     Allowed (28 remaining)
12:00   3                     Allowed (27 remaining)
...
12:00   30                    Allowed (0 remaining)
12:00   31                    429 — Rate limit exceeded
12:01   30                    429 — first request at 12:00 hasn't aged out yet
12:01   29                    Allowed — oldest request aged out of 60s window
```

Because this is a sliding window, you don’t get a full refill at a fixed boundary. Requests age out individually as they pass the 60-second mark.

---

## Response headers

### On every response

These headers are included on **all** responses — success or error, on both endpoints:

| Header          | Example                                | Description                                                                                               |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `X-Request-Id`  | `550e8400-e29b-41d4-a716-446655440000` | Unique request identifier. Echoes your `X-Request-Id` header if provided, otherwise server-generated UUID |
| `X-API-Version` | `2026-04-01`                           | The API version that processed this request                                                               |

### On successful `POST /v1/generations` (HTTP 201)

In addition to the standard headers, successful generation submissions include rate limit headers:

| Header                  | Example      | Description                                                    |
| ----------------------- | ------------ | -------------------------------------------------------------- |
| `X-RateLimit-Limit`     | `30`         | Your maximum RPM allowance                                     |
| `X-RateLimit-Remaining` | `17`         | Requests remaining in the current sliding window               |
| `X-RateLimit-Reset`     | `1712592060` | Unix timestamp when the current window ends (now + 60 seconds) |

**Full response headers example:**

```
HTTP/1.1 201 Created
Content-Type: application/json
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
X-API-Version: 2026-04-01
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 17
X-RateLimit-Reset: 1712592060
```

### On rate limit exceeded (HTTP 429 — RPM)

When the RPM limit is exceeded, the response includes all rate limit headers plus `Retry-After`:

| Header                  | Example      | Description                                                                              |
| ----------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `Retry-After`           | `12`         | Seconds until the oldest request in the window expires, freeing a slot. Minimum value: 1 |
| `X-RateLimit-Limit`     | `30`         | Your maximum RPM allowance                                                               |
| `X-RateLimit-Remaining` | `0`          | Always `0` when rate limited                                                             |
| `X-RateLimit-Reset`     | `1712592012` | Unix timestamp when the oldest request ages out                                          |

**Full response example:**

```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 12
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712592012
X-Request-Id: 661f9500-f30c-52e5-b827-557766551111
X-API-Version: 2026-04-01
```

```
{
  "detail": "Rate limit exceeded"
}
```

**How `Retry-After` is calculated:** The server finds the oldest request in your 60-second window and computes how many seconds remain until it ages out. This is the minimum wait time before a slot opens. The value is always at least 1 second.

### On concurrent job limit exceeded (HTTP 429)

When you have too many active generations:

```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-Request-Id: 772a0611-a41d-63f6-c938-668877662222
X-API-Version: 2026-04-01
```

```
{
  "detail": "Too many concurrent jobs"
}
```

Note the differences from RPM rate limiting:

- **`detail`** says `"Too many concurrent jobs"` instead of `"Rate limit exceeded"`
- **`Retry-After`** is fixed at `60` seconds (not dynamically computed)
- **No** `X-RateLimit-*` headers (those only apply to RPM)

**How to tell them apart:** Check the `detail` field in the response body.

| `detail` value               | Limit type | What to do                                            |
| ---------------------------- | ---------- | ----------------------------------------------------- |
| `"Rate limit exceeded"`      | RPM        | Wait `Retry-After` seconds, then retry                |
| `"Too many concurrent jobs"` | Concurrent | Wait for an active generation to complete, then retry |

### On `GET /v1/generations/{id}` (HTTP 200)

The GET endpoint returns standard headers only — no rate limit headers:

```
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-Id: 883b1722-b52e-74a7-d049-779988773333
X-API-Version: 2026-04-01
```

**Polling cadence.** The GET endpoint is not subject to the documented generation RPM bucket (the one reflected in `X-RateLimit-*` on POST 201). Poll cadences of every 1–5 seconds are fine; 2–5 second intervals are recommended.

An API-wide abuse-prevention ceiling exists as a backstop against runaway loops (thousands of requests per minute against any `/v1/*` endpoint). It is sized so well-behaved integrators never see it. If you do hit it, the response is HTTP 429 with `Retry-After` only — no `X-RateLimit-*` headers, since this bucket is internal abuse detection, not a documented rate-limit surface.

---

## Understanding `X-RateLimit-Remaining`

The `X-RateLimit-Remaining` value tells you how many more requests you can make before hitting the RPM limit. Because the window is sliding, this number can both decrease (as you make requests) and increase (as old requests age out).

**Example over time:**

```
12:00:00  POST → 201  X-RateLimit-Remaining: 29   (made 1st request)
12:00:01  POST → 201  X-RateLimit-Remaining: 28   (made 2nd request)
12:00:02  POST → 201  X-RateLimit-Remaining: 27   (made 3rd request)
...no requests for 58 seconds...
12:00:59  POST → 201  X-RateLimit-Remaining: 28   (1st request aged out, made new one)
12:01:00  POST → 201  X-RateLimit-Remaining: 28   (2nd request aged out, made new one)
12:01:01  POST → 201  X-RateLimit-Remaining: 28   (3rd request aged out, made new one)
```

## Understanding `X-RateLimit-Reset`

`X-RateLimit-Reset` is the Unix timestamp when the current window ends. Since this is a sliding window, this value equals “now + 60 seconds” — it represents when your current requests will start aging out, not a fixed global reset time.

**Using it in code:**

```
import time


def seconds_until_reset(headers):
    reset_ts = int(headers.get("X-RateLimit-Reset", 0))
    return max(0, reset_ts - int(time.time()))
```

## Understanding `Retry-After`

`Retry-After` tells you the **minimum** number of seconds to wait before a slot opens. It’s calculated as:

```
Retry-After = (oldest_request_timestamp + 60) - now
```

This is always at least 1 second. After waiting this long, exactly one slot opens. If you need multiple slots, you may need to wait longer.

---

## Concurrent jobs

A generation is considered an “active job” from the moment it’s submitted until it reaches a terminal state (`completed` or `failed`). Active jobs are tracked for up to 1 hour, after which they are automatically pruned.

**Lifecycle of a concurrent job slot:**

```
POST /generations → 201          ← Job slot consumed
GET /generations/{id} → "queued"      ← Slot still held
GET /generations/{id} → "processing"  ← Slot still held
GET /generations/{id} → "completed"   ← Slot released
                                     (or "failed" → slot released)
```

If all your concurrent slots are occupied, you must wait for at least one generation to reach a terminal state before submitting a new one. The API does not queue excess requests — they are rejected immediately with HTTP 429.

---

## Fail-open behavior

If the rate limiting infrastructure (Redis) is temporarily unavailable, the API **allows requests through** rather than blocking them. This is a deliberate design choice — rate limiting is a fairness mechanism, not a security boundary.

You may occasionally observe requests succeeding without rate limit headers when this happens. Do not rely on this behavior.

---

## Retry strategies

### Basic: respect `Retry-After`

The simplest approach — wait exactly as long as the server says:

- [Python](#tab-panel-48)
- [TypeScript](#tab-panel-49)
- [Go](#tab-panel-50)

```
import time


def create_generation(client, **kwargs):
    try:
        return client.generations.create(**kwargs)
    except Exception as e:
        if hasattr(e, "status_code") and e.status_code == 429:
            retry_after = int(e.response.headers.get("Retry-After", 5))
            time.sleep(retry_after)
            return client.generations.create(**kwargs)
        raise
```

```
async function createGeneration(client: Luma, params: CreateParams) {
  try {
    return await client.generations.create(params);
  } catch (e: any) {
    if (e.status === 429) {
      const retryAfter = parseInt(e.headers?.get("retry-after") ?? "5", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return await client.generations.create(params);
    }
    throw e;
  }
}
```

```
generation, err := client.Generations.New(ctx, params)
if err != nil {
    var apiErr *lumaagents.Error
    if errors.As(err, &apiErr) && apiErr.StatusCode == 429 {
        retryAfter, _ := strconv.Atoi(apiErr.Response.Header.Get("Retry-After"))
        if retryAfter == 0 { retryAfter = 5 }
        time.Sleep(time.Duration(retryAfter) * time.Second)
        generation, err = client.Generations.New(ctx, params)
    }
}
```

### Recommended: exponential backoff with jitter

For production systems handling multiple 429 scenarios:

- [Python](#tab-panel-51)
- [TypeScript](#tab-panel-52)
- [Go](#tab-panel-53)

```
import time
import random


def create_with_backoff(client, max_retries=5, **kwargs):
    for attempt in range(max_retries):
        try:
            return client.generations.create(**kwargs)
        except Exception as e:
            if not hasattr(e, "status_code") or e.status_code != 429:
                raise
            if attempt == max_retries - 1:
                raise


            # Prefer Retry-After header; fall back to exponential backoff
            retry_after = None
            if hasattr(e, "response") and e.response is not None:
                retry_after = e.response.headers.get("Retry-After")


            if retry_after:
                wait = int(retry_after) + random.uniform(0, 1)  # Add jitter
            else:
                wait = (2 ** attempt) + random.uniform(0, 1)


            time.sleep(wait)
```

```
async function createWithBackoff(
  client: Luma,
  params: CreateParams,
  maxRetries = 5
): Promise<Generation> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.generations.create(params);
    } catch (e: any) {
      if (e.status !== 429 || attempt === maxRetries - 1) throw e;


      const retryAfter = e.headers?.get("retry-after");
      const wait = retryAfter
        ? parseInt(retryAfter, 10) * 1000 + Math.random() * 1000
        : 2 ** attempt * 1000 + Math.random() * 1000;


      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("unreachable");
}
```

```
func createWithBackoff(ctx context.Context, client *lumaagents.Client, params lumaagents.GenerationNewParams, maxRetries int) (*lumaagents.Generation, error) {
    for attempt := 0; attempt < maxRetries; attempt++ {
        generation, err := client.Generations.New(ctx, params)
        if err == nil {
            return generation, nil
        }


        var apiErr *lumaagents.Error
        if !errors.As(err, &apiErr) || apiErr.StatusCode != 429 || attempt == maxRetries-1 {
            return nil, err
        }


        retryAfter := apiErr.Response.Header.Get("Retry-After")
        var wait time.Duration
        if retryAfter != "" {
            secs, _ := strconv.Atoi(retryAfter)
            wait = time.Duration(secs)*time.Second + time.Duration(rand.Intn(1000))*time.Millisecond
        } else {
            wait = time.Duration(1<<attempt)*time.Second + time.Duration(rand.Intn(1000))*time.Millisecond
        }
        time.Sleep(wait)
    }
    return nil, fmt.Errorf("max retries exceeded")
}
```

### Advanced: proactive throttling

Don’t wait for 429 — slow down proactively as you approach the limit:

```
import time


class RateLimitedClient:
    def __init__(self, client):
        self.client = client
        self._remaining = None
        self._reset_at = None


    def create(self, **kwargs):
        # If we know we're close to the limit, wait proactively
        if self._remaining is not None and self._remaining <= 2:
            if self._reset_at is not None:
                wait = max(0, self._reset_at - time.time())
                if wait > 0:
                    time.sleep(wait)


        generation = self.client.generations.create(**kwargs)


        # Update tracking from response headers (SDK-specific)
        # self._remaining = int(response.headers["X-RateLimit-Remaining"])
        # self._reset_at = int(response.headers["X-RateLimit-Reset"])


        return generation
```

### Handling concurrent job limits

For the concurrent job limit, the strategy is different — you need to wait for existing jobs to complete, not just wait a fixed duration:

```
import time


def create_respecting_concurrency(client, max_wait=300, **kwargs):
    deadline = time.time() + max_wait


    while time.time() < deadline:
        try:
            return client.generations.create(**kwargs)
        except Exception as e:
            if not hasattr(e, "status_code") or e.status_code != 429:
                raise


            detail = ""
            if hasattr(e, "body") and isinstance(e.body, dict):
                detail = e.body.get("detail", "")


            if "concurrent" in detail.lower():
                # Wait for a job to finish — poll more aggressively
                time.sleep(5)
            else:
                # RPM limit — use Retry-After
                retry_after = int(e.response.headers.get("Retry-After", 5))
                time.sleep(retry_after)


    raise TimeoutError("Could not submit generation within timeout")
```

---

## Using `X-Request-Id` for tracing

### Sending your own request ID

Include `X-Request-Id` in your request to trace it through your system:

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: myapp-user42-batch7-req003" \
  -d '{"prompt": "A sunset over the ocean"}'
```

The server echoes your value back in the response:

```
X-Request-Id: myapp-user42-batch7-req003
```

### Server-generated request IDs

If you don’t send `X-Request-Id`, the server generates a UUID:

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

### Best practices for request tracing

1. **Generate unique IDs per attempt** — If you retry a failed request, use a new request ID so you can distinguish attempts in logs
2. **Include context in the ID** — Encode user ID, batch ID, or job type for easier debugging: `myapp-user42-batch7-req003`
3. **Log the response ID** — Always capture the `X-Request-Id` from responses for support escalation
4. **Quote it in support requests** — When contacting support about a failed request, include the `X-Request-Id` to enable fast lookup

---

## `X-API-Version` header

The `X-API-Version` header is returned on all responses to `/v1/*` endpoints. It indicates which API version processed your request.

| Current value | Meaning             |
| ------------- | ------------------- |
| `2026-04-01`  | Initial API version |

This header is informational. You do not need to send a version header in your requests — the API currently has a single version.

---

## Header summary by scenario

### `POST /v1/generations` — Success (201)

| Header                  | Present | Example        |
| ----------------------- | ------- | -------------- |
| `X-Request-Id`          | Always  | `550e8400-...` |
| `X-API-Version`         | Always  | `2026-04-01`   |
| `X-RateLimit-Limit`     | Always  | `30`           |
| `X-RateLimit-Remaining` | Always  | `17`           |
| `X-RateLimit-Reset`     | Always  | `1712592060`   |

### `POST /v1/generations` — RPM Rate Limited (429)

| Header                  | Present | Example        |
| ----------------------- | ------- | -------------- |
| `X-Request-Id`          | Always  | `550e8400-...` |
| `X-API-Version`         | Always  | `2026-04-01`   |
| `Retry-After`           | Always  | `12`           |
| `X-RateLimit-Limit`     | Always  | `30`           |
| `X-RateLimit-Remaining` | Always  | `0`            |
| `X-RateLimit-Reset`     | Always  | `1712592012`   |

### `POST /v1/generations` — Concurrent Job Limited (429)

| Header                  | Present | Example        |
| ----------------------- | ------- | -------------- |
| `X-Request-Id`          | Always  | `550e8400-...` |
| `X-API-Version`         | Always  | `2026-04-01`   |
| `Retry-After`           | Always  | `60`           |
| `X-RateLimit-Limit`     | No      | —              |
| `X-RateLimit-Remaining` | No      | —              |
| `X-RateLimit-Reset`     | No      | —              |

### `POST /v1/generations` — Other errors (400, 401, 402, 403, 413, 422, 502, 503)

| Header          | Present | Example        |
| --------------- | ------- | -------------- |
| `X-Request-Id`  | Always  | `550e8400-...` |
| `X-API-Version` | Always  | `2026-04-01`   |
| `X-RateLimit-*` | No      | —              |
| `Retry-After`   | No      | —              |

### `GET /v1/generations/{id}` — All responses (200, 401, 404)

| Header          | Present | Example        |
| --------------- | ------- | -------------- |
| `X-Request-Id`  | Always  | `550e8400-...` |
| `X-API-Version` | Always  | `2026-04-01`   |
| `X-RateLimit-*` | No      | —              |
| `Retry-After`   | No      | —              |
