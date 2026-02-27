/**
 * GCS WebP Image Utilities
 *
 * Provides helpers for serving product images from Google Cloud Storage
 * with automatic WebP format and responsive sizing.
 */

// Default GCS bucket name — configure via env variable
const GCS_BUCKET = process.env.NEXT_PUBLIC_GCS_BUCKET || 'kkshop-images';
const GCS_BASE_URL = `https://storage.googleapis.com/${GCS_BUCKET}`;

/**
 * Image size presets optimized for Cambodia mobile bandwidth
 */
export const IMAGE_SIZES = {
    thumbnail: { width: 128, height: 128 },
    card: { width: 400, height: 500 },
    hero: { width: 800, height: 1000 },
    full: { width: 1200, height: 1500 },
    banner: { width: 1920, height: 600 },
} as const;

export type ImagePreset = keyof typeof IMAGE_SIZES;

/**
 * Get a GCS image URL for a product image
 * @param path - relative path within the bucket (e.g., "products/serum-01.webp")
 * @returns Full GCS URL
 */
export function getGcsImageUrl(path: string): string {
    if (!path) return '';

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Ensure path doesn't start with /
    const cleanPath = path.replace(/^\/+/, '');
    return `${GCS_BASE_URL}/${cleanPath}`;
}

/**
 * Get optimized image props for next/image component
 * @param src  - Image source (GCS path or full URL)
 * @param preset - Size preset name
 * @returns Object with src, width, height for next/image
 */
export function getImageProps(src: string, preset: ImagePreset = 'card') {
    const size = IMAGE_SIZES[preset];
    return {
        src: getGcsImageUrl(src),
        width: size.width,
        height: size.height,
    };
}

/**
 * Get a placeholder blur data URL for product images
 * Uses a tiny gradient as blur placeholder to avoid layout shift (CLS)
 */
export function getBlurPlaceholder(): string {
    return 'data:image/svg+xml;base64,' + btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#272431" />
                    <stop offset="100%" style="stop-color:#17151e" />
                </linearGradient>
            </defs>
            <rect width="400" height="500" fill="url(#g)" />
        </svg>`
    );
}

/**
 * Generate responsive srcSet for manual <img> tags (when not using next/image)
 * Each size serves WebP via GCS
 */
export function getResponsiveSrcSet(basePath: string, widths: number[] = [320, 640, 960, 1200]): string {
    return widths
        .map(w => `${getGcsImageUrl(basePath)}?w=${w} ${w}w`)
        .join(', ');
}
