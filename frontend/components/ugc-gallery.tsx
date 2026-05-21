"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PixleeCdnPhotos {
  small_url: string;
  medium_url: string;
  large_url: string;
  original_url: string;
  square_medium_url: string;
  attributed_medium_url: string;
}

interface PixleePhoto {
  id: number;
  user_name: string;
  photo_title: string;
  source: string;
  source_url: string;
  thumbnail_url: string;
  medium_url: string;
  big_url: string;
  avatar_url: string;
  platform_link: string;
  content_type: string;
  like_count: number;
  height: number;
  width: number;
  submitted_at: number;
  pixlee_cdn_photos: PixleeCdnPhotos;
}

interface PixleeResponse {
  data: PixleePhoto[];
  total: number;
  page: number;
  per_page: number;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function SourceIcon({ source }: { source: string }) {
  if (source === "instagram") {
    return <InstagramIcon className="w-4 h-4" />;
  }
  return <ExternalLink className="w-4 h-4" />;
}

function sourceColor(source: string) {
  if (source === "instagram") return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400";
  return "bg-gray-600";
}

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

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

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

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
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
      {/* Gallery grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 p-4 space-y-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-3 group relative overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300"
            onClick={() => openLightbox(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.pixlee_cdn_photos?.square_medium_url || photo.pixlee_cdn_photos?.medium_url}
              alt={decodeURIComponent(photo.photo_title || `Photo by @${photo.user_name}`)}
              className="w-full object-cover block"
              loading="lazy"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
              {/* Source badge */}
              <div className="flex justify-end">
                <span className={cn("text-white p-1.5 rounded-full", sourceColor(photo.source))}>
                  <SourceIcon source={photo.source} />
                </span>
              </div>

              {/* User info */}
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
        ))}
      </div>

      {/* Lightbox */}
      {activePhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Content */}
          <div
            className="relative flex flex-col lg:flex-row w-full max-w-5xl mx-4 bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image panel */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-64 lg:min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.pixlee_cdn_photos?.large_url || activePhoto.pixlee_cdn_photos?.original_url}
                alt={decodeURIComponent(activePhoto.photo_title || `Photo by @${activePhoto.user_name}`)}
                className="max-h-[60vh] lg:max-h-[90vh] w-full object-contain"
              />
            </div>

            {/* Info panel */}
            <div className="w-full lg:w-80 flex flex-col bg-white">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePhoto.avatar_url}
                  alt={activePhoto.user_name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${activePhoto.user_name}`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">@{activePhoto.user_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activePhoto.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className={cn("text-white p-1.5 rounded-full flex-shrink-0", sourceColor(activePhoto.source))}>
                  <SourceIcon source={activePhoto.source} />
                </span>
              </div>

              {/* Caption */}
              <div className="flex-1 p-4 overflow-y-auto">
                {activePhoto.photo_title && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {decodeURIComponent(activePhoto.photo_title)}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Heart className="w-4 h-4" />
                  <span>{activePhoto.like_count.toLocaleString()}</span>
                </div>
                {activePhoto.platform_link && (
                  <a
                    href={activePhoto.platform_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View on {activePhoto.source === "instagram" ? "Instagram" : "source"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prev / Next arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
