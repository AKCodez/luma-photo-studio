---
title: Quickstart | Luma Agents
description: Generate and edit images with the Luma Agents REST API — quickstart, SDKs, and authentication.
---

The Luma Agents API provides access to [uni-1](https://lumalabs.ai/uni-1), Luma’s image generation and editing model. The API is asynchronous: submit a generation request, poll for the result, and download your image.

## Quickstart

The workflow is three steps:

1. **Submit** a generation request via `POST /v1/generations`
2. **Poll** for status via `GET /v1/generations/{generation_id}`
3. **Download** images from presigned URLs once the state reaches `completed`

**Prerequisites:** A Luma API key (set as `LUMA_AGENTS_API_KEY`) and one of the official SDKs installed — see [SDKs](#sdks) below.

### Generate an image

- [Python](#tab-panel-54)
- [TypeScript](#tab-panel-55)
- [Go](#tab-panel-56)
- [cURL](#tab-panel-57)

```
import time
from luma_agents import Luma


client = Luma()


# 1. Submit
generation = client.generations.create(
    prompt="A glass of iced coffee on a marble countertop, morning light streaming through a window",
    aspect_ratio="16:9",
)


# 2. Poll
while generation.state not in ("completed", "failed"):
    time.sleep(2)
    generation = client.generations.get(generation.id)


# 3. Download
if generation.state == "completed":
    print(f"Image URL: {generation.output[0].url}")
else:
    print(f"Failed: {generation.failure_reason} (code: {generation.failure_code})")
```

```
import Luma from "luma-agents";


const client = new Luma();


// 1. Submit
let generation = await client.generations.create({
  prompt:
    "A glass of iced coffee on a marble countertop, morning light streaming through a window",
  aspect_ratio: "16:9",
});


// 2. Poll
while (generation.state !== "completed" && generation.state !== "failed") {
  await new Promise((r) => setTimeout(r, 2000));
  generation = await client.generations.get(generation.id);
}


// 3. Download
if (generation.state === "completed") {
  console.log(`Image URL: ${generation.output![0].url}`);
} else {
  console.error(`Failed: ${generation.failure_reason} (code: ${generation.failure_code})`);
}
```

```
package main


import (
    "context"
    "fmt"
    "time"


    "github.com/lumalabs/luma-agents-go"
)


func main() {
    client := lumaagents.NewClient()


    // 1. Submit
    generation, err := client.Generations.New(context.TODO(), lumaagents.GenerationNewParams{
        Prompt:      lumaagents.F("A glass of iced coffee on a marble countertop, morning light streaming through a window"),
        AspectRatio: lumaagents.F(lumaagents.GenerationNewParamsAspectRatio16_9),
    })
    if err != nil {
        panic(err)
    }


    // 2. Poll
    for generation.State != lumaagents.GenerationStateCompleted &&
        generation.State != lumaagents.GenerationStateFailed {
        time.Sleep(2 * time.Second)
        generation, err = client.Generations.Get(context.TODO(), generation.ID)
        if err != nil {
            panic(err)
        }
    }


    // 3. Download
    if generation.State == lumaagents.GenerationStateCompleted {
        fmt.Printf("Image URL: %s\n", generation.Output[0].URL)
    } else {
        fmt.Printf("Failed: %s (code: %s)\n", generation.FailureReason, generation.FailureCode)
    }
}
```

Terminal window

```
# 1. Submit
RESPONSE=$(curl -s -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A glass of iced coffee on a marble countertop, morning light streaming through a window",
    "aspect_ratio": "16:9"
  }')


ID=$(echo "$RESPONSE" | jq -r '.id')


# 2. Poll
while true; do
  RESULT=$(curl -s -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
    "https://agents.lumalabs.ai/v1/generations/$ID")
  STATE=$(echo "$RESULT" | jq -r '.state')
  [ "$STATE" = "completed" ] || [ "$STATE" = "failed" ] && break
  sleep 2
done


# 3. Download
echo "$RESULT" | jq -r '.output[0].url'
```

**Production polling:** The example above uses a fixed 2-second interval for simplicity. In production, add a timeout and use exponential backoff:

```
deadline = time.time() + 120  # 2-minute timeout
interval = 0.5


while generation.state not in ("completed", "failed"):
    if time.time() > deadline:
        raise TimeoutError(f"Generation {generation.id} did not complete within timeout")
    time.sleep(interval)
    interval = min(interval * 1.5, 5)  # Back off up to 5s
    generation = client.generations.get(generation.id)
```

## Authentication

Every request requires a Bearer token in the `Authorization` header. Set your API key as the `LUMA_AGENTS_API_KEY` environment variable — the official SDKs read it automatically.

Terminal window

```
export LUMA_AGENTS_API_KEY="luma-api-..."
```

## Base URL

```
https://agents.lumalabs.ai/v1
```

## Endpoints

| Method | Path                              | Description                            |
| ------ | --------------------------------- | -------------------------------------- |
| `POST` | `/v1/generations`                 | Submit an image generation or edit job |
| `GET`  | `/v1/generations/{generation_id}` | Poll for generation status and output  |

See the [API Reference](/api/index.md) for complete request/response schemas.

## SDKs

- [Python](#tab-panel-58)
- [TypeScript](#tab-panel-59)
- [Go](#tab-panel-60)
- [CLI](#tab-panel-61)

Terminal window

```
pip install luma-agents
```

Terminal window

```
npm install luma-agents
```

Terminal window

```
go get github.com/lumalabs/luma-agents-go
```

Terminal window

```
go install 'github.com/lumalabs/luma-agents-cli/cmd/luma-agents-cli@latest'
```

**SDKs coming soon.** The official Python, TypeScript, Go, and CLI packages are in the works. Until they ship, use the REST API directly with the cURL examples above.

## Response headers

Every response includes `X-Request-Id` and `X-API-Version` headers. Successful generation requests also include rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`). See [Rate limits and headers](/guides/rate-limits/index.md) for details.

## Next steps

- [**About uni-1**](/guides/model/index.md) — Model capabilities, limitations, and output specifications
- [**Image generation**](/guides/image-generation/index.md) — Full parameter reference for text-to-image
- [**Image editing**](/guides/image-editing/index.md) — Modify existing images with text prompts and reference images
- [**Rate limits and headers**](/guides/rate-limits/index.md) — Rate limiting, response headers, and retry strategies
- [**Error handling**](/guides/error-handling/index.md) — Every error code with troubleshooting steps
- [**FAQ**](/guides/faq/index.md) — Quick answers to common questions
- [**API Reference**](/api/index.md) — Complete endpoint specifications
