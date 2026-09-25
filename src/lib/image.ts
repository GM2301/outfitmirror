// src/lib/image.ts
// Client-side helpers for wardrobe photos.

const MAX_SIDE = 1024;

// Shrinks a camera photo (often 3-12 MB) to a 1024px JPEG before it's stored.
// Used when background removal fails and the original photo is kept - it was
// previously uploaded at full size, which is what made the wardrobe slow.
// Browsers apply EXIF orientation when drawing to a canvas, so the result is
// always upright.
export function shrinkPhoto(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas error")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob); else reject(new Error("Blob error"));
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Load failed")); };
    img.src = url;
  });
}

export function extensionFor(blob: Blob): string {
  if (blob.type === "image/webp") return "webp";
  if (blob.type === "image/png") return "png";
  return "jpg";
}

// Wardrobe photo paths are unique per upload, so browsers and the CDN can
// cache them for a year instead of re-downloading on every visit.
export const PHOTO_CACHE_CONTROL = "31536000";
