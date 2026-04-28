---
title: Image editing | Luma Agents
description: Edit existing images with text prompts using the Luma Agents API — background replacement, style transfer, object modification, and more.
---

Modify existing images with natural language instructions. Describe the edit you want and [uni-1](/guides/model/index.md) applies it while preserving the parts of the image you did not mention. For generating new images from text, see [Image generation](/guides/image-generation/index.md).

## When to use image editing

Use `type: "image_edit"` when you have an existing image and want to modify it. Use `type: "image"` with `image_ref` when you want to create something new inspired by a reference.

| Scenario                              | Use                                        | Why                                                            |
| ------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Change a photo’s background           | `image_edit` + `source`                    | Keeps the subject, only changes the background                 |
| Convert a photo to manga style        | `image_edit` + `source` + `style: "manga"` | Transforms the existing image                                  |
| Create a new image in a similar style | `image` + `image_ref`                      | Generates something new using the reference for style guidance |
| Combine elements from multiple images | `image` + `image_ref` (multiple)           | Compositing, not editing a single source                       |

## Basic request

An image edit requires three things: `type` set to `"image_edit"`, a `source` image, and a `prompt` describing the edit.

- [Python](#tab-panel-6)
- [TypeScript](#tab-panel-7)
- [Go](#tab-panel-8)
- [cURL](#tab-panel-9)
- [CLI](#tab-panel-10)

```
from luma_agents import Luma


client = Luma()


generation = client.generations.create(
    type="image_edit",
    prompt="Change the sky to a dramatic sunset with orange and purple clouds",
    source={"url": "https://example.com/landscape.jpg"},
)
```

```
import Luma from "luma-agents";


const client = new Luma();


const generation = await client.generations.create({
  type: "image_edit",
  prompt: "Change the sky to a dramatic sunset with orange and purple clouds",
  source: { url: "https://example.com/landscape.jpg" },
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Type:   lumaagents.F(lumaagents.GenerationNewParamsTypeImageEdit),
    Prompt: lumaagents.F("Change the sky to a dramatic sunset with orange and purple clouds"),
    Source: lumaagents.F(lumaagents.GenerationNewParamsSource{
        URL: lumaagents.F("https://example.com/landscape.jpg"),
    }),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image_edit",
    "prompt": "Change the sky to a dramatic sunset with orange and purple clouds",
    "source": {
      "url": "https://example.com/landscape.jpg"
    }
  }'
```

Terminal window

```
luma-agents-cli generations create \
  --type image_edit \
  --prompt "Change the sky to a dramatic sunset with orange and purple clouds" \
  --source-url "https://example.com/landscape.jpg"
```

## Source image

The `source` field accepts a single image — either as a URL or inline base64 data.

**From a URL:**

```
{
  "source": {
    "url": "https://example.com/photo.jpg"
  }
}
```

**From base64 data:**

```
{
  "source": {
    "data": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "media_type": "image/jpeg"
  }
}
```

The `source` field is **required** for `image_edit` and **rejected** for `image` type requests. Provide either `url` or `data` — not both. URLs must be publicly accessible. Base64 images require `media_type`. Maximum image size is 50 MB.

## Style transfer with `style`

Combine `source` with the `style` parameter to apply a style preset to an existing image:

- [Python](#tab-panel-11)
- [TypeScript](#tab-panel-12)
- [Go](#tab-panel-13)
- [cURL](#tab-panel-14)

```
generation = client.generations.create(
    type="image_edit",
    prompt="Convert to a bold manga illustration with clean ink outlines and vivid flat colors",
    source={"url": "https://example.com/photograph.jpg"},
    style="manga",
)
```

```
const generation = await client.generations.create({
  type: "image_edit",
  prompt: "Convert to a bold manga illustration with clean ink outlines and vivid flat colors",
  source: { url: "https://example.com/photograph.jpg" },
  style: "manga",
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Type:   lumaagents.F(lumaagents.GenerationNewParamsTypeImageEdit),
    Prompt: lumaagents.F("Convert to a bold manga illustration with clean ink outlines and vivid flat colors"),
    Source: lumaagents.F(lumaagents.GenerationNewParamsSource{
        URL: lumaagents.F("https://example.com/photograph.jpg"),
    }),
    Style: lumaagents.F(lumaagents.GenerationNewParamsStyleManga),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image_edit",
    "prompt": "Convert to a bold manga illustration with clean ink outlines and vivid flat colors",
    "source": {"url": "https://example.com/photograph.jpg"},
    "style": "manga"
  }'
```

## Using reference images with edits

Combine `source` (the image to edit) with `image_ref` (style/content references) to guide the edit. Up to 8 reference images are supported.

**Single reference — apply a color grading from a reference:**

- [Python](#tab-panel-15)
- [TypeScript](#tab-panel-16)
- [Go](#tab-panel-17)
- [cURL](#tab-panel-18)

```
generation = client.generations.create(
    type="image_edit",
    prompt="Apply the color grading from the reference to the source image",
    source={"url": "https://example.com/my-photo.jpg"},
    image_ref=[
        {"url": "https://example.com/color-reference.jpg"},
    ],
)
```

```
const generation = await client.generations.create({
  type: "image_edit",
  prompt: "Apply the color grading from the reference to the source image",
  source: { url: "https://example.com/my-photo.jpg" },
  image_ref: [{ url: "https://example.com/color-reference.jpg" }],
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Type:   lumaagents.F(lumaagents.GenerationNewParamsTypeImageEdit),
    Prompt: lumaagents.F("Apply the color grading from the reference to the source image"),
    Source: lumaagents.F(lumaagents.GenerationNewParamsSource{
        URL: lumaagents.F("https://example.com/my-photo.jpg"),
    }),
    ImageRef: lumaagents.F([]lumaagents.GenerationNewParamsImageRef{
        {URL: lumaagents.F("https://example.com/color-reference.jpg")},
    }),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image_edit",
    "prompt": "Apply the color grading from the reference to the source image",
    "source": {"url": "https://example.com/my-photo.jpg"},
    "image_ref": [{"url": "https://example.com/color-reference.jpg"}]
  }'
```

**Multiple references — combine lighting from one and texture from another:**

- [Python](#tab-panel-19)
- [TypeScript](#tab-panel-20)
- [Go](#tab-panel-21)
- [cURL](#tab-panel-22)

```
generation = client.generations.create(
    type="image_edit",
    prompt="Apply the lighting from the first reference and the texture from the second to the source image",
    source={"url": "https://example.com/my-photo.jpg"},
    image_ref=[
        {"url": "https://example.com/lighting-reference.jpg"},
        {"url": "https://example.com/texture-reference.jpg"},
    ],
)
```

```
const generation = await client.generations.create({
  type: "image_edit",
  prompt:
    "Apply the lighting from the first reference and the texture from the second to the source image",
  source: { url: "https://example.com/my-photo.jpg" },
  image_ref: [
    { url: "https://example.com/lighting-reference.jpg" },
    { url: "https://example.com/texture-reference.jpg" },
  ],
});
```

```
generation, err := client.Generations.New(ctx, lumaagents.GenerationNewParams{
    Type:   lumaagents.F(lumaagents.GenerationNewParamsTypeImageEdit),
    Prompt: lumaagents.F("Apply the lighting from the first reference and the texture from the second to the source image"),
    Source: lumaagents.F(lumaagents.GenerationNewParamsSource{
        URL: lumaagents.F("https://example.com/my-photo.jpg"),
    }),
    ImageRef: lumaagents.F([]lumaagents.GenerationNewParamsImageRef{
        {URL: lumaagents.F("https://example.com/lighting-reference.jpg")},
        {URL: lumaagents.F("https://example.com/texture-reference.jpg")},
    }),
})
```

Terminal window

```
curl -X POST https://agents.lumalabs.ai/v1/generations \
  -H "Authorization: Bearer $LUMA_AGENTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image_edit",
    "prompt": "Apply the lighting from the first reference and the texture from the second to the source image",
    "source": {"url": "https://example.com/my-photo.jpg"},
    "image_ref": [
      {"url": "https://example.com/lighting-reference.jpg"},
      {"url": "https://example.com/texture-reference.jpg"}
    ]
  }'
```

When using multiple references, always label each reference’s role in the prompt: “Apply the lighting from the first reference and the texture from the second.” Without explicit labels, the model guesses which aspects to pull from each image.

## Common edit types

### Object modification

Change colors, materials, or properties of objects in the image:

```
generation = client.generations.create(
    type="image_edit",
    prompt="Change the car's color to midnight blue with a metallic finish",
    source={"url": "https://example.com/car-photo.jpg"},
)
```

### Background replacement

Replace the background while preserving the subject:

```
generation = client.generations.create(
    type="image_edit",
    prompt="Replace the background with a tropical beach at sunset, "
           "warm golden light matching the direction of light on the subject",
    source={"url": "https://example.com/portrait.jpg"},
)
```

### Lighting adjustment

Change the lighting or time of day:

```
generation = client.generations.create(
    type="image_edit",
    prompt="Change the lighting to dramatic golden hour with long shadows from the left",
    source={"url": "https://example.com/scene.jpg"},
)
```

**Be specific about what to change and what to preserve.** “Replace the background with a tropical beach” is better than “make it look tropical.” For complex edits (background + color + style), do them as separate sequential operations for more predictable results.

## Validation rules

These constraints are specific to `image_edit` requests. General constraints from [Image generation](/guides/image-generation#validation-rules/index.md) also apply.

| Rule          | Constraint                                               |
| ------------- | -------------------------------------------------------- |
| `type`        | Must be `"image_edit"`                                   |
| `source`      | **Required.** Must provide `url` or `data` — not both    |
| `source.url`  | Must be publicly accessible. Max 50 MB                   |
| `source.data` | Must be valid base64. Requires `media_type`              |
| `image_ref`   | Optional. Up to 8 additional reference images            |
| `prompt`      | Required. 1–6,000 characters describing the desired edit |

**Common validation errors:**

| Mistake                                 | HTTP code | Error                                                |
| --------------------------------------- | --------- | ---------------------------------------------------- |
| Missing `source`                        | 400       | `"source is required for type 'image_edit'"`         |
| Providing `source` with `type: "image"` | 400       | `"source is only valid for type 'image_edit'"`       |
| `source` with both `url` and `data`     | 400       | `"source: provide either 'url' or 'data', not both"` |
| `source.data` without `media_type`      | 400       | `"source: 'media_type' is required with 'data'"`     |
| `source` image over 50 MB               | 413       | `"source: image exceeds 50 MB limit"`                |
| Unreachable `source.url`                | 422       | `"source: failed to fetch URL"`                      |
| Invalid `source.data`                   | 422       | `"source: invalid base64 data"`                      |

## Response

The response format is identical to image generation — poll `GET /v1/generations/{id}` until the state reaches `completed` or `failed`.

```
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "image_edit",
  "state": "completed",
  "model": "uni-1",
  "created_at": "2026-04-08T12:00:00Z",
  "output": [
    {
      "type": "image",
      "url": "https://storage.example.com/generations/a1b2c3d4/output.png?X-Amz-Expires=3600&..."
    }
  ],
  "failure_reason": null,
  "failure_code": null
}
```

## Full example

The submit-poll-download workflow for image editing is identical to image generation — set `type: "image_edit"` and include a `source` image. See the [Quickstart](/index.md) for the complete polling pattern.

## Next steps

- [**Image generation**](/guides/image-generation/index.md) — Generate new images from text
- [**About uni-1**](/guides/model/index.md) — Model capabilities and limitations
- [**Error handling**](/guides/error-handling/index.md) — Every error code with troubleshooting steps
- [**FAQ**](/guides/faq/index.md) — Quick answers to common questions
- [**API Reference**](/api/index.md) — Complete endpoint specifications
