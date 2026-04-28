---
title: Image generation | Luma Agents
description: Complete parameter reference for generating images with the Luma Agents API — prompts, aspect ratios, styles, reference images, web search, and output formats.
---

Create images from text descriptions. This guide covers every parameter for `type: "image"` requests. For editing existing images, see [Image editing](/guides/image-editing/index.md).

## Basic request

At minimum, you need a `prompt`:

- [Python](#tab-panel-23)
- [TypeScript](#tab-panel-24)
- [Go](#tab-panel-25)
- [cURL](#tab-panel-26)
- [CLI](#tab-panel-27)

```
from luma_agents import Luma


client = Luma()


generation = client.generations.create(
    prompt="An astronaut riding a horse on Mars, oil painting style",
)
```

```
import Luma from "luma-agents";


const client = new Luma();


const generation = await client.generations.create({
  prompt: "An astronaut riding a horse on Mars, oil painting style",
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Prompt: lumaagents.F("An astronaut riding a horse on Mars, oil painting style"),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "An astronaut riding a horse on Mars, oil painting style"}'
```

Terminal window

```
luma-agents-cli generations create \
  --prompt "An astronaut riding a horse on Mars, oil painting style"
```

When no other parameters are specified, the API uses these defaults: `model: "uni-1"`, `type: "image"`, `style: "auto"`. `aspect_ratio` and `output_format` are left unset so the model can pick an appropriate value based on the prompt — pass them explicitly to force a specific ratio or format.

## Parameters

### `prompt` (required)

A text description of the image to generate, from 1 to 6,000 characters. Be specific about subject, setting, lighting, style, and mood for best results.

```
{
  "prompt": "A neon-lit Tokyo alley in the rain, reflections on wet pavement, cinematic photography"
}
```

### `model`

The model to use. Defaults to `"uni-1"`.

```
{
  "model": "uni-1"
}
```

### `aspect_ratio`

Controls the output image dimensions. When omitted (or `null`), the model selects an appropriate ratio based on the prompt. Pass one of the supported values below to force a specific ratio.

| Value  | Orientation          |
| ------ | -------------------- |
| `3:1`  | Ultra-wide landscape |
| `2:1`  | Wide landscape       |
| `16:9` | Standard widescreen  |
| `3:2`  | Classic landscape    |
| `1:1`  | Square               |
| `2:3`  | Classic portrait     |
| `9:16` | Standard portrait    |
| `1:2`  | Tall portrait        |
| `1:3`  | Ultra-tall portrait  |

- [Python](#tab-panel-28)
- [TypeScript](#tab-panel-29)
- [Go](#tab-panel-30)
- [cURL](#tab-panel-31)

```
generation = client.generations.create(
    prompt="A white cat wearing a tiny crown, sitting on a stack of old books",
    aspect_ratio="1:1",
)
```

```
const generation = await client.generations.create({
  prompt: "A white cat wearing a tiny crown, sitting on a stack of old books",
  aspect_ratio: "1:1",
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Prompt:      lumaagents.F("A white cat wearing a tiny crown, sitting on a stack of old books"),
    AspectRatio: lumaagents.F(lumaagents.GenerationNewParamsAspectRatio1_1),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A white cat wearing a tiny crown, sitting on a stack of old books",
    "aspect_ratio": "1:1"
  }'
```

### `style`

Applies a style preset to the generation. Defaults to `"auto"`.

| Value   | Description                                                    |
| ------- | -------------------------------------------------------------- |
| `auto`  | Model selects the best style for the prompt                    |
| `manga` | Manga/anime aesthetic with ink outlines and screentone shading |

- [Python](#tab-panel-32)
- [TypeScript](#tab-panel-33)
- [Go](#tab-panel-34)
- [cURL](#tab-panel-35)

```
generation = client.generations.create(
    prompt="A warrior standing at the edge of a cliff overlooking a vast ocean",
    style="manga",
    aspect_ratio="2:3",
)
```

```
const generation = await client.generations.create({
  prompt: "A warrior standing at the edge of a cliff overlooking a vast ocean",
  style: "manga",
  aspect_ratio: "2:3",
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Prompt:      lumaagents.F("A warrior standing at the edge of a cliff overlooking a vast ocean"),
    Style:       lumaagents.F(lumaagents.GenerationNewParamsStyleManga),
    AspectRatio: lumaagents.F(lumaagents.GenerationNewParamsAspectRatio2_3),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A warrior standing at the edge of a cliff overlooking a vast ocean",
    "style": "manga",
    "aspect_ratio": "2:3"
  }'
```

The `manga` style works best with action scenes, character portraits, and dramatic compositions. For subtle anime-inspired aesthetics, describe the style in your prompt instead — e.g., “anime-inspired illustration with soft pastel colors”.

### `output_format`

Sets the output image format. When omitted (or `null`), the model selects an appropriate format based on the prompt. Pass an explicit value to force a specific format.

| Value  | Best for                       |
| ------ | ------------------------------ |
| `png`  | Lossless quality               |
| `jpeg` | Smaller file size, photographs |

### `web_search`

When set to `true`, the model searches the web for visual references before generating. This improves accuracy for prompts that reference real-world subjects, landmarks, or products.

- [Python](#tab-panel-36)
- [TypeScript](#tab-panel-37)
- [Go](#tab-panel-38)
- [cURL](#tab-panel-39)

```
generation = client.generations.create(
    prompt="The Eiffel Tower at golden hour with cherry blossoms in the foreground",
    web_search=True,
)
```

```
const generation = await client.generations.create({
  prompt: "The Eiffel Tower at golden hour with cherry blossoms in the foreground",
  web_search: true,
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Prompt:    lumaagents.F("The Eiffel Tower at golden hour with cherry blossoms in the foreground"),
    WebSearch: lumaagents.F(true),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The Eiffel Tower at golden hour with cherry blossoms in the foreground",
    "web_search": true
  }'
```

Web search adds a few seconds to generation time but dramatically improves accuracy for prompts that reference specific real-world subjects.

### `image_ref`

Provide up to 9 reference images to guide the generation. Each reference accepts either a `url` (publicly accessible) or inline `data` (base64-encoded with `media_type`) — not both.

**Single reference image:**

- [Python](#tab-panel-40)
- [TypeScript](#tab-panel-41)
- [Go](#tab-panel-42)
- [cURL](#tab-panel-43)

```
generation = client.generations.create(
    prompt="A similar scene but at sunset, with warm orange and pink tones",
    image_ref=[
        {"url": "https://example.com/reference.jpg"},
    ],
)
```

```
const generation = await client.generations.create({
  prompt: "A similar scene but at sunset, with warm orange and pink tones",
  image_ref: [
    { url: "https://example.com/reference.jpg" },
  ],
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Prompt: lumaagents.F("A similar scene but at sunset, with warm orange and pink tones"),
    ImageRef: lumaagents.F([]lumaagents.GenerationNewParamsImageRef{
        {URL: lumaagents.F("https://example.com/reference.jpg")},
    }),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A similar scene but at sunset, with warm orange and pink tones",
    "image_ref": [
      {"url": "https://example.com/reference.jpg"}
    ]
  }'
```

**Multiple references — combine different visual aspects:**

- [Python](#tab-panel-44)
- [TypeScript](#tab-panel-45)
- [Go](#tab-panel-46)
- [cURL](#tab-panel-47)

```
generation = client.generations.create(
    prompt="Use the color palette from the first reference and the composition from the second. "
           "Create a portrait of a jazz musician in a smoky club.",
    image_ref=[
        {"url": "https://example.com/color-reference.jpg"},
        {"url": "https://example.com/composition-reference.jpg"},
    ],
)
```

```
const generation = await client.generations.create({
  prompt:
    "Use the color palette from the first reference and the composition from the second. " +
    "Create a portrait of a jazz musician in a smoky club.",
  image_ref: [
    { url: "https://example.com/color-reference.jpg" },
    { url: "https://example.com/composition-reference.jpg" },
  ],
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Prompt: lumaagents.F(
        "Use the color palette from the first reference and the composition from the second. " +
        "Create a portrait of a jazz musician in a smoky club.",
    ),
    ImageRef: lumaagents.F([]lumaagents.GenerationNewParamsImageRef{
        {URL: lumaagents.F("https://example.com/color-reference.jpg")},
        {URL: lumaagents.F("https://example.com/composition-reference.jpg")},
    }),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Use the color palette from the first reference and the composition from the second. Create a portrait of a jazz musician in a smoky club.",
    "image_ref": [
      {"url": "https://example.com/color-reference.jpg"},
      {"url": "https://example.com/composition-reference.jpg"}
    ]
  }'
```

**Using base64 data instead of a URL:**

```
{
  "prompt": "Reimagine this in watercolor style",
  "image_ref": [
    {
      "data": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      "media_type": "image/png"
    }
  ]
}
```

Each `image_ref` entry must provide either `url` or `data` — not both. URLs must be publicly accessible. Base64 images must include `media_type`. Maximum 50 MB per image, up to 9 references total.

When using multiple references, explicitly label each image’s role in the prompt: “Use the first reference for the color palette” and “Use the second for the composition.” Without labels, the model guesses which aspects to pull from each reference.

## Validation rules

| Rule               | Constraint                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `prompt`           | Required. 1–6,000 characters                                                                       |
| `model`            | Must be a supported model (currently `uni-1`). Defaults to `uni-1`                                 |
| `type`             | Must be `image` or `image_edit`. Defaults to `image`                                               |
| `aspect_ratio`     | Must be one of the 9 supported values, or `null` (default — model picks)                           |
| `style`            | Must be `auto` or `manga`. Defaults to `auto`                                                      |
| `output_format`    | Must be `png` or `jpeg`, or `null` (default — model picks)                                         |
| `image_ref`        | Maximum 9 entries. Each must provide `url` or `data` — not both                                    |
| `image_ref[].data` | Must be valid base64. Requires `media_type`                                                        |
| `image_ref[].url`  | Must be publicly accessible. Max 50 MB                                                             |
| `web_search`       | Must be a boolean. Defaults to `false`                                                             |
| `source`           | Must be `null` or omitted for `type: "image"`. See [Image editing](/guides/image-editing/index.md) |

When `aspect_ratio` or `output_format` is set to `null`, the model selects an appropriate value based on the prompt.

See [Error handling](/guides/error-handling/index.md) for the full list of validation errors.

## Response

A successful request returns HTTP 201 with a `GenerationResponse`:

```
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "type": "image",
  "state": "queued",
  "model": "uni-1",
  "created_at": "2026-04-08T12:00:00Z",
  "output": [],
  "failure_reason": null,
  "failure_code": null
}
```

### Generation states

| State        | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| `queued`     | Job is waiting to be picked up                                |
| `processing` | Image is being generated                                      |
| `completed`  | Generation succeeded — `output` contains download URLs        |
| `failed`     | Generation failed — check `failure_reason` and `failure_code` |

Poll `GET /v1/generations/{id}` until the state reaches `completed` or `failed`. See the [Quickstart](/index.md) for polling examples.

### Output URLs

On completion, `output` contains one or more objects with presigned download URLs:

```
{
  "output": [
    {
      "type": "image",
      "url": "https://storage.example.com/generations/d290f1ee/output.png?X-Amz-Expires=3600&..."
    }
  ]
}
```

Presigned URLs expire after **1 hour**. Download images promptly or generate new URLs by polling the endpoint again.

## Next steps

- [**Image editing**](/guides/image-editing/index.md) — Modify existing images with text prompts and reference images
- [**About uni-1**](/guides/model/index.md) — Model capabilities and limitations
- [**Error handling**](/guides/error-handling/index.md) — Every error code with troubleshooting steps
- [**FAQ**](/guides/faq/index.md) — Quick answers to common questions
- [**API Reference**](/api/index.md) — Complete endpoint specifications
