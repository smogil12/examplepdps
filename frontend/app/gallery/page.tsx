import { Suspense } from "react";
import UGCGallery from "@/components/ugc-gallery";
import { Images } from "lucide-react";

export const metadata = {
  title: "UGC Gallery",
  description: "Community photos and social content gallery",
};

function GallerySkeleton() {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="break-inside-avoid mb-3 aspect-square bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            ← Back
          </a>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-1.5 rounded-lg text-white">
              <Images className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900">UGC Gallery</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Made by our community
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Real photos from real people. Click any image to explore.
        </p>
      </div>

      {/* Gallery */}
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<GallerySkeleton />}>
          <UGCGallery />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-100 text-center text-sm text-gray-400">
        Powered by <span className="font-medium text-gray-600">Pixlee</span>
      </footer>
    </div>
  );
}
