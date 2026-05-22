# Pixlee UGC Gallery — Implementation Notes

## API Endpoint

```
GET https://distillery.pixlee.co/api/v2/albums/{albumId}/photos?api_key={key}
```

Proxied server-side through `/api/ugc` (Next.js route) to keep the API key off the client and enable caching.

---

## Gallery Grid — Cropped Tile Images

### Which image field to use

Each photo object in the API response contains two sets of image URLs:

- **Instagram CDN** (`thumbnail_url`, `medium_url`, `big_url`, `source_url`) — these URLs expire and will 404 after a short window.
- **`pixlee_cdn_photos`** — stable Pixlee-hosted copies that never expire.

```json
"pixlee_cdn_photos": {
  "small_url":          "https://static.pxlecdn.com/photos/{id}/thumb/...",
  "medium_url":         "https://static.pxlecdn.com/photos/{id}/medium/...",
  "large_url":          "https://static.pxlecdn.com/photos/{id}/xl/...",
  "original_url":       "https://static.pxlecdn.com/photos/{id}/original/...",
  "square_medium_url":  "https://static.pxlecdn.com/photos/{id}/square_medium/...",
  "attributed_medium_url": "..."
}
```

**Always use `pixlee_cdn_photos.*` URLs.** The gallery grid uses `square_medium_url` (pre-cropped to a square by Pixlee) as the default tile image.

### Viewport-based crop (when `viewport` is populated)

Some photos include a `viewport` object that describes a crop window the creator defined:

```json
"viewport": {
  "x":        522.5,
  "y":        900,
  "width":    900,
  "height":   900,
  "imgWidth": 1440,
  "imgHeight": 1800
}
```

- `x`, `y` — top-left corner of the crop region in the **original image's pixel space**
- `width`, `height` — size of the crop window (pixels)
- `imgWidth`, `imgHeight` — intrinsic dimensions of the original image

When `viewport` has real values (all numeric and `width > 1`), the gallery card uses a CSS `background-image` crop instead of the `square_medium_url`. The card renders a `<div>` with:

```css
background-image: url(pixlee_cdn_photos.large_url);
background-size:  {imgWidth/vpWidth*100}%  {imgHeight/vpHeight*100}%;
background-position: {x/(imgWidth-vpWidth)*100}%  {y/(imgHeight-vpHeight)*100}%;
```

**How the math works:**

1. `background-size` scales the full image so that the crop region fills 100% of the tile.  
   - If the crop is 900 px wide inside a 1440 px image, the background is scaled to `1440/900 = 160%` of the tile width.

2. `background-position` in CSS percentage is relative to the *available travel* of the background, not the element size.  
   The formula `x / (imgWidth - vpWidth) * 100` converts the pixel offset into that relative percentage correctly.

When `viewport` is empty (`{}`), the tile falls back to `square_medium_url` — Pixlee has already applied a square crop server-side.

---

## Lightbox — Hotspot Positioning

### Hotspot data in the API response

Each photo has two relevant arrays:

#### `bounding_box_products`
```json
[
  {
    "x":          808,
    "y":          442,
    "width":      330,
    "height":     296,
    "product_id": 65464647
  }
]
```

- `x`, `y` — top-left corner of the tagged region in **original image pixel coordinates**
- `width`, `height` — size of the tagged region (pixels)
- `product_id` — foreign key into the `products` array on the same photo object

**Filtering placeholder hotspots:** Unset bounding boxes appear as `{x:0, y:0, width:1, height:1}`. These are filtered out before rendering.

#### `products`
```json
[
  {
    "id":                65464647,
    "title":             "Red Glove",
    "price":             null,
    "image_thumb_square": "https://static.pxlecdn.com/products/65464647/primary/thumb_square/...",
    "link":              "https://..."
  }
]
```

Product lookup: build a `Map<id, product>` from `products`, then look up each bounding box's `product_id`.

### Image used in the lightbox

The lightbox displays `pixlee_cdn_photos.original_url`. This is critical because `photo.width` and `photo.height` (from the API) exactly match the **intrinsic pixel dimensions of `original_url`** — verified via `Content-Type` inspection. The `large_url` (xl variant) is resized to ~819 px and its dimensions do not exactly match `photo.width × photo.height`, which would introduce a coordinate mismatch.

### Container sizing

The image is rendered inside a `display: inline-block` wrapper:

```jsx
<div style={{ display: "inline-block", lineHeight: 0 }}>
  <img
    src={pixlee_cdn_photos.original_url}
    style={{ maxHeight: "82vh", maxWidth: "100%", display: "block" }}
  />
  {/* hotspot dots */}
</div>
```

`inline-block` makes the wrapper size itself to **exactly the rendered image dimensions** — no letterboxing gap, no overflow clipping. This means any `position: absolute` child with `left: X%; top: Y%` maps directly and accurately to image pixel coordinates regardless of screen size.

### Hotspot position formula

The formula was sourced directly from Pixlee's production lightbox JS bundle (`lightbox_v2-*.js`):

```js
// Pixlee's source (adapted for non-square container):
T = bounding_box.width  / 3
P = bounding_box.height / 3

left (%) = (bb.x + T) / photo.width  * 100
top  (%) = (bb.y + P) / photo.height * 100
```

**Why `/3` and not `/2` (center)?**

Pixlee anchors the hotspot marker at **1/3 of the way into the bounding box from the top-left corner**, not the geometric center. This makes the marker visually "point into" the tagged object rather than floating at its midpoint.

In Pixlee's own codebase, the formula also adds letterbox offsets (`k` and `x`) that compensate for their fixed square container. Because our container matches the image's exact aspect ratio (no letterboxing), those offsets are zero and are omitted.

**Coordinate space:** `bb.x / bb.y / bb.width / bb.height` are always in the pixel space of the original image — the same space as `photo.width × photo.height`. No scaling is needed before applying the percentage formula.

### Product popup

Clicking a hotspot dot opens an inline tooltip showing `image_thumb_square`, `title`, `price`, and a link to `product.link`. Clicking outside dismisses it via a `mousedown` listener.
