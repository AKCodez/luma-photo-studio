---
title: About uni-1 | Luma Agents
description: Capabilities, strengths, and output specifications for Luma's uni-1 image model.
---

uni-1 is Luma’s image generation model. It handles both **image generation** (text to image) and **image editing** (modifying existing images with text instructions) through a single API endpoint.

## Capabilities

| Capability                      | Description                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Text rendering**              | Renders readable text on signs, labels, book covers, and other surfaces. Put exact text in quotes in your prompt.                                       |
| **Spatial reasoning**           | Produces accurate shadows, correct perspective, and physically plausible object layouts.                                                                |
| **Cultural styles**             | Understands visual traditions — manga panels with screentone shading, ukiyo-e woodblock prints, film noir lighting, art house cinema framing, and more. |
| **Reference-guided generation** | Accepts up to 9 reference images via `image_ref` for text-to-image, or up to 8 for image editing (where the `source` image occupies its own slot).      |
| **Image editing**               | Modifies existing images via `source` — change backgrounds, swap objects, transfer styles while preserving unmentioned parts.                           |
| **Web search grounding**        | When `web_search: true`, searches the web for visual references before generating.                                                                      |
| **Multi-panel output**          | Generates multi-panel sequences (e.g., storyboards) with consistent style when described in the prompt.                                                 |

## Parameters

| Parameter       | Type           | Default              | Description                                                                                 |
| --------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `prompt`        | string         | **required**         | Text description of the image (1–6,000 characters)                                          |
| `type`          | string         | `"image"`            | `"image"` for generation, `"image_edit"` for editing                                        |
| `model`         | string         | `"uni-1"`            | Model to use                                                                                |
| `aspect_ratio`  | string \| null | `null` (model picks) | Output dimensions ([9 options](/guides/image-generation#aspect_ratio/index.md))             |
| `style`         | string         | `"auto"`             | `"auto"` or `"manga"`                                                                       |
| `output_format` | string \| null | `null` (model picks) | `"png"` or `"jpeg"`                                                                         |
| `web_search`    | boolean        | `false`              | Search the web for visual references before generating                                      |
| `image_ref`     | array          | `[]`                 | Up to 9 reference images for `type: "image"`, or 8 for `type: "image_edit"` (URL or base64) |
| `source`        | object \| null | —                    | Source image for editing (required when `type: "image_edit"`)                               |

For detailed parameter documentation, see [Image generation](/guides/image-generation/index.md) and [Image editing](/guides/image-editing/index.md).

## Strengths

- **Photorealistic scenes** — Natural lighting, material textures, and depth of field
- **Text rendering** — Readable text on signs, labels, and surfaces with accurate letterforms
- **Multi-panel consistency** — Multiple views of the same scene with consistent perspective
- **Style transfer** — Faithfully adopts artistic styles from reference images or text descriptions
- **Spatial precision** — Correct object placement, shadows, reflections, and perspective
- **Cultural visual language** — Manga, cinematic framing, traditional art styles

## Output specifications

### Aspect ratios

| Value  | Orientation          | Typical use case                |
| ------ | -------------------- | ------------------------------- |
| `3:1`  | Ultra-wide landscape | Panoramic banners               |
| `2:1`  | Wide landscape       | Website headers                 |
| `16:9` | Standard widescreen  | Hero images, desktop wallpapers |
| `3:2`  | Classic landscape    | Traditional photography         |
| `1:1`  | Square               | Profile pictures, social media  |
| `2:3`  | Classic portrait     | Book covers, posters            |
| `9:16` | Standard portrait    | Mobile wallpapers, stories      |
| `1:2`  | Tall portrait        | Vertical banners                |
| `1:3`  | Ultra-tall portrait  | Tall signage                    |

### Output formats

| Format | Best for                       |
| ------ | ------------------------------ |
| `png`  | Lossless quality               |
| `jpeg` | Smaller file size, photographs |

When `output_format` is omitted, the model picks a format based on the prompt.

### Presigned URL expiry

Generated images are delivered as presigned URLs that expire after **1 hour**. Download images promptly or request a fresh URL by polling `GET /v1/generations/{id}` again.

## Next steps

- [**Image generation**](/guides/image-generation/index.md) — Full parameter reference
- [**Image editing**](/guides/image-editing/index.md) — Modify existing images with text prompts and reference images
- [**FAQ**](/guides/faq/index.md) — Quick answers to common questions
- [**API Reference**](/api/index.md) — Complete endpoint specifications
