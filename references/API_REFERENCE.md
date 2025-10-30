# Image Generation API (Seedream 4.0 API)

## Models and Capabilities

### seedream-4.0
- **Generate multiple images in sequence (batch):** Set `sequential_image_generation` to `auto`.
    - Batch of related images from text prompt (up to 15 images).
    - Batch of related images from single reference image + text prompt (up to 14 images).
    - Batch of related images from multiple reference images (2-10) + text prompt (total input reference images + output images ≤ 15).
- **Generate a single image:** Set `sequential_image_generation` to `disabled`.
    - Single image from text prompt.
    - Single image from single reference image + text prompt.
    - Single image from multiple reference images (2-10) + text prompt.

## Input Image Requirements

- **Image URL:** Must be accessible.
- **Base64 encoding:** `data:image/<image format>;base64,<Base64 encoding>`. `<image format>` must be lowercase (e.g., `data:image/png;base64,...`).
- **Requirements:**
    - **Format:** jpeg, png
    - **Aspect ratio (width/height):** [1/3, 3]
    - **Width and height (px):** > 14
    - **Size:** No more than 10 MB
    - **Total pixels:** No more than 6000x6000
- **Seedream-4.0:** Supports a maximum of 10 reference images.

## Output Image Resolution

### Method 1: Specify resolution keywords
- Describe aspect ratio, shape, or purpose in the prompt. Model determines final width/height.
- **Optional values:** `1K`, `2K`, `4K`

### Method 2: Specify width and height in pixels
- **Default value:** `2048x2048`
- **Total pixels range:** `[1280x720, 4096x4096]`
- **Aspect ratio range:** `[1/16, 16]`
- **Common aspect ratios and pixel values:**
    | Aspect ratio | Width and Height Pixel Values |
    |--------------|-------------------------------|
    | 1:1          | 2048x2048                     |
    | 4:3          | 2304x1728                     |
    | 3:4          | 1728x2304                     |
    | 16:9         | 2560x1440                     |
    | 9:16         | 1440x2560                     |
    | 3:2          | 2496x1664                     |
    | 2:3          | 1664x2496                     |
    | 21:9         | 3024x1296                     |

## Seed Values

- Different seed values (or not specifying, or -1 for random) produce different results for the same request.
- The same seed value produces similar, but not guaranteed identical, results for the same request.

## `sequential_image_generation` Parameter

- `auto`: Model automatically determines if and how many images to return based on the prompt.
- `disabled`: Disables batch generation; only one image is generated.
- **Value range (for batch generation):** `[1, 15]`

## `stream` Parameter (will always be false for us)

- `false`: Non-streaming output. All images returned in one-shot after generation completes.
- `true`: Streaming output. Each image returned immediately after generation. Effective for both single and batch generation.

## `response_format` Parameter

- `url`: Returns a download link for the image. Link is valid for 24 hours. Download promptly.
- `b64_json`: Returns image data as a Base64-encoded string in JSON format.

## `watermark` Parameter (will always be false for us)

- `false`: No watermark.
- `true`: Adds "AI generated" watermark in the bottom-right corner.

## `quality` Parameter

- `standard`: Higher quality, longer generation time.
- `fast`: Shorter generation time, average quality.

## Error Handling

- **Content filter rejection:** The next image generation task in a batch will still be requested; other images in the same request are unaffected.
- **Internal service error (500):** The next image generation task will not be requested.

## API Endpoint and Example

**Endpoint:** `POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations`

**Request Example: Text to image**

```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Interstellar travel, a black hole, from which a nearly shattered vintage train bursts forth, visually striking, cinematic blockbuster, apocalyptic vibe, dynamic, contrasting colors, OC render, ray tracing, motion blur, depth of field, surrealism, deep blue. The image uses delicate and rich color layers to shape the subject and scene, with realistic textures. The dark style background’s light and shadow effects create an atmospheric mood, blending artistic fantasy with an exaggerated wide-angle perspective, lens flare, reflections, extreme light and shadow, intense gravitational pull, devouring.",
    "sequential_image_generation": "disabled",
    "response_format": "url",
    "size": "2K",
    "stream": false,
    "watermark": true
}'
```

**Response Example:**

```json
{
    "model": "seedream-4-0-250828",
    "created": 1757323224,
    "data": [
        {
            "url": "https://...",
            "size": "1760x2368"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": 16280,
        "total_tokens": 16280
    }
}
```

**Request Example: Image to Image**
```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Generate a close-up image of a dog lying on lush grass.",
    "image": "https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imageToimage.png",
    "sequential_image_generation": "disabled",
    "response_format": "url",
    "size": "2K",
    "stream": false,
    "watermark": true
}'
```

**Response Example: Image to Image**
```json
{
    "model": "seedream-4-0-250828",
    "created": 1757323224,
    "data": [
        {
            "url": "https://...",
            "size": "1760x2368"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": 16280,
        "total_tokens": 16280
    }
}
```

**Request Example: Multi-Image Bending**
```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Replace the clothing in image 1 with the outfit from image 2.",
    "image": ["https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imagesToimage_1.png", "https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imagesToimage_2.png"],
    "sequential_image_generation": "disabled",
    "size": "2K"
}'
```

**Response Example: Multi-Image Bending**
```json
{
    "model": "seedream-4-0-250828",
    "created": 1757323224,
    "data": [
        {
            "url": "https://...",
            "size": "1760x2368"
        }
    ],
    "usage": {
        "generated_images": 1,
        "output_tokens": 16280,
        "total_tokens": 16280
    }
}
```

**Request Example: Text to Batch Image**
```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \

  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Generate a series of 4 coherent illustrations focusing on the same corner of a courtyard across the four seasons, presented in a unified style that captures the unique colors, elements, and atmosphere of each season.",
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": {
        "max_images": 4
    },
    "size": "2k"
}'
```

**Response Example: Text to Batch Image** (None specifically provided)



**Request Example: Multi Image to Batch Image**
```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Generate 3 images of a girl and a cow plushie happily riding a roller coaster in an amusement park, depicting morning, noon, and night.",
    "image": ["https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imagesToimages_1.png", "https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imagesToimages_2.png"],
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": {
        "max_images": 3
    },
    "size": "2K"
}'
```

**Response Example: Multi Image to Batch Image**
```json
{
  "model": "seedream-4-0-250828",
  "created": 1757388756,
  "data": [
    {
      "url": "https://...",
      "size": "2720x1536"
    },
    {
      "url": "https://...",
      "size": "2720x1536"
    },
    {
      "url": "https://...",
      "size": "2720x1536"
    }
  ],
  "usage": {
    "generated_images": 3,
    "output_tokens": 48960,
    "total_tokens": 48960
  }
}
```

**Request Example: Streaming Output**
```bash
curl -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "Using this LOGO as a reference, create a visual design system for an outdoor sports brand named GREEN, including packaging bags, hats, paper boxes, wristbands, lanyards, etc. Main visual tone is green, with a fun, simple, and modern style.",
    "image": "https://ark-doc.tos-ap-southeast-1.bytepluses.com/seededit_i2i.jpeg",
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": {
        "max_images": 3
    },
    "size": "2K",
    "stream": true
}'
```

**Response Example: Streaming Output**
```json
event: image_generation.partial_succeeded
data: {
  "type": "image_generation.partial_succeeded",
  "model": "seedream-4-0-250828",
  "created": 1757396757,
  "image_index": 0,
  "url": "https://...",
  "size": "2496x1664"
}

event: image_generation.partial_succeeded
data: {
  "type": "image_generation.partial_succeeded",
  "model": "seedream-4-0-250828",
  "created": 1757396785,
  "image_index": 1,
  "url": "https://...",
  "size": "2496x1664"
}

event: image_generation.partial_succeeded
data: {
  "type": "image_generation.partial_succeeded",
  "model": "seedream-4-0-250828",
  "created": 1757396825,
  "image_index": 2,
  "url": "https://...",
  "size": "2496x1664"
}

event: image_generation.completed
data: {
  "type": "image_generation.completed",
  "model": "seedream-4-0-250828",
  "created": 1757396825,
  "usage": {
    "generated_images": 3,
    "output_tokens": 48672,
    "total_tokens": 48672
  }
}

data: [DONE]
```
