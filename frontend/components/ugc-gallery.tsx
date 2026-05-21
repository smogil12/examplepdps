"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PixleeCdnPhotos {
  small_url: string;
  medium_url: string;
  large_url: string;
  original_url: string;
  square_medium_url: string;
  attributed_medium_url: string;
}

interface PixleeViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  imgWidth: number;
  imgHeight: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  product_id: number;
}

interface PixleeProduct {
  id: number;
  title: string;
  price: number | null;
  currency: string | null;
  image: string;
  image_thumb_square: string | null;
  link: string;
  description: string;
}

interface PixleePhoto {
  id: number;
  user_name: string;
  photo_title: string;
  source: string;
  avatar_url: string;
  platform_link: string;
  content_type: string;
  like_count: number;
  width: number;
  height: number;
  submitted_at: number;
  pixlee_cdn_photos: PixleeCdnPhotos;
  viewport: Partial<PixleeViewport>;
  bounding_box_products: BoundingBox[];
  products: PixleeProduct[];
}

interface PixleeResponse {
  data: PixleePhoto[];
  total: number;
  page: number;
  per_page: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasRealViewport(vp: Partial<PixleeViewport>): vp is PixleeViewport {
  return (
    typeof vp.width === "number" &&
    vp.width > 1 &&
    typeof vp.height === "number" &&
    typeof vp.x === "number" &&
    typeof vp.y === "number" &&
    typeof vp.imgWidth === "number" &&
    typeof vp.imgHeight === "number"
  );
}

function isRealHotspot(bb: BoundingBox) {
  return !(bb.width === 1 && bb.height === 1 && bb.x === 0 && bb.y === 0);
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isIg = source === "instagram";
  return (
    <span
      className={cn(
        "p-1.5 rounded-full text-white flex items-center justify-center",
        isIg
          ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"
          : "bg-gray-600"
      )}
    >
      {isIg ? (
        <InstagramIcon className="w-4 h-4" />
      ) : (
        <ExternalLink className="w-4 h-4" />
      )}
    </span>
  );
}

// ── Hotspot dot + product popup ───────────────────────────────────────────────

function HotspotDot({
  bb,
  product,
  imgWidth,
  imgHeight,
}: {
  bb: BoundingBox;
  product?: PixleeProduct;
  imgWidth: number;
  imgHeight: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Pixlee positions at 1/3 into the bounding box (not center), matching their widget's formula
  const dotLeft = (((bb.x + bb.width  / 3) / imgWidth)  * 100).toFixed(4);
  const dotTop  = (((bb.y + bb.height / 3) / imgHeight) * 100).toFixed(4);

  return (
    <div
      ref={ref}
      className="absolute z-20"
      style={{
        left: `${dotLeft}%`,
        top: `${dotTop}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-full bg-white/90 border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label={product?.title ?? "Tagged product"}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-black" />
        </button>

        {open && product && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
            {product.image_thumb_square && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_thumb_square}
                alt={product.title}
                className="w-full h-28 object-cover"
              />
            )}
            <div className="p-3">
              <p className="font-semibold text-gray-900 text-sm leading-snug">{product.title}</p>
              {product.price != null && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {product.currency ? `${product.currency} ` : ""}${product.price}
                </p>
              )}
              {product.link && (
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full bg-black text-white text-xs font-medium py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Shop now
                </a>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

// ── Gallery card ──────────────────────────────────────────────────────────────

function GalleryCard({
  photo,
  onClick,
}: {
  photo: PixleePhoto;
  onClick: () => void;
}) {
  const vp = photo.viewport;
  const useViewportCrop = hasRealViewport(vp);

  return (
    <div
      className="break-inside-avoid mb-3 group relative overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300"
      onClick={onClick}
    >
      {useViewportCrop ? (
        /* Viewport-cropped view: CSS background-image positioned to show only the crop region */
        <div
          style={{
            aspectRatio: `${vp.width} / ${vp.height}`,
            backgroundImage: `url(${photo.pixlee_cdn_photos.large_url})`,
            backgroundRepeat: "no-repeat",
            // Scale background so viewport.width fills 100% of container
            backgroundSize: `${(vp.imgWidth / vp.width) * 100}% ${(vp.imgHeight / vp.height) * 100}%`,
            // Offset: x / (imgWidth - vpWidth) * 100%, same for y
            backgroundPosition: `${vp.imgWidth > vp.width ? (vp.x / (vp.imgWidth - vp.width)) * 100 : 0}% ${vp.imgHeight > vp.height ? (vp.y / (vp.imgHeight - vp.height)) * 100 : 0}%`,
          }}
        />
      ) : (
        // Pre-cropped square from Pixlee CDN
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.pixlee_cdn_photos.square_medium_url}
          alt={decodeURIComponent(photo.photo_title || `Photo by @${photo.user_name}`)}
          className="w-full object-cover block"
          loading="lazy"
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
        <div className="flex justify-end">
          <SourceBadge source={photo.source} />
        </div>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.avatar_url}
            alt={photo.user_name}
            className="w-7 h-7 rounded-full border-2 border-white object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${photo.user_name}`;
            }}
          />
          <span className="text-white text-xs font-semibold truncate drop-shadow">
            @{photo.user_name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: PixleePhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];
  const productMap = new Map(photo.products.map((p) => [p.id, p]));
  const hotspots = photo.bounding_box_products.filter(isRealHotspot);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col lg:flex-row w-full max-w-5xl mx-4 bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image + hotspots panel */}
        {/*
          inline-block wrapper sizes to exactly the rendered <img> dimensions —
          no letterboxing gap between the wrapper and the visible image pixels.
          Hotspots at (bb.x + bb.w/2) / photo.width % then map 1-to-1 to
          the displayed image regardless of the screen size.
          We use original_url so intrinsic dimensions = photo.width × photo.height exactly.
        */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-2">
          <div className="relative" style={{ display: "inline-block", lineHeight: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.pixlee_cdn_photos.original_url}
              alt={decodeURIComponent(photo.photo_title || `Photo by @${photo.user_name}`)}
              style={{ maxHeight: "82vh", maxWidth: "100%", display: "block" }}
            />

            {/* Hotspot dots — % relative to photo.width × photo.height (= original_url intrinsic) */}
            {hotspots.map((bb) => (
              <HotspotDot
                key={`${bb.product_id}-${bb.x}-${bb.y}`}
                bb={bb}
                product={productMap.get(bb.product_id)}
                imgWidth={photo.width}
                imgHeight={photo.height}
              />
            ))}
          </div>
        </div>

        {/* Info sidebar */}
        <div className="w-full lg:w-72 flex flex-col bg-white flex-shrink-0">
          {/* User header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.avatar_url}
              alt={photo.user_name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${photo.user_name}`;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">@{photo.user_name}</p>
              <p className="text-xs text-gray-400">
                {new Date(photo.submitted_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <SourceBadge source={photo.source} />
          </div>

          {/* Caption */}
          {photo.photo_title && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {decodeURIComponent(photo.photo_title)}
              </p>
            </div>
          )}

          {/* Tagged products list */}
          {photo.products.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Products in this photo
              </p>
              {photo.products.map((product) => (
                <a
                  key={product.id}
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group/product"
                >
                  {product.image_thumb_square ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_thumb_square}
                      alt={product.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover/product:text-blue-600 transition-colors">
                      {product.title}
                    </p>
                    {product.price != null && (
                      <p className="text-xs text-gray-500">
                        ${product.price}
                        {product.currency ? ` ${product.currency}` : ""}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover/product:text-blue-500 flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 mt-auto">
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <Heart className="w-4 h-4" />
              <span>{photo.like_count.toLocaleString()}</span>
            </div>
            {photo.platform_link && (
              <a
                href={photo.platform_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View original
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prev / Next */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
        {index + 1} / {photos.length}
      </div>
    </div>
  );
}

// ── Main gallery ──────────────────────────────────────────────────────────────

export default function UGCGallery() {
  const [photos, setPhotos] = useState<PixleePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ugc?per_page=30");
        if (!res.ok) throw new Error("Failed to load gallery");
        const data: PixleeResponse = await res.json();
        setPhotos(data.data.filter((p) => p.content_type === "image"));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : i === 0 ? photos.length - 1 : i - 1)),
    [photos.length]
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : i === photos.length - 1 ? 0 : i + 1)),
    [photos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, prev, next]);

  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="break-inside-avoid mb-3 aspect-square bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 p-4">
        {photos.map((photo, index) => (
          <GalleryCard key={photo.id} photo={photo} onClick={() => setLightboxIndex(index)} />
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
