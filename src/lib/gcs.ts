import { Storage } from '@google-cloud/storage';

const GCS_BUCKET = process.env.GCS_BUCKET_NAME || 'kkshop-images';
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

/**
 * Convert a public GCS URL to a GCS object path.
 * e.g. "https://storage.googleapis.com/kkshop-images/products/abc.jpg"
 *    → "products/abc.jpg"
 * Returns null if the URL is not a GCS URL for this bucket (e.g. Unsplash/external).
 */
export function gcsPathFromUrl(url: string): string | null {
    const prefix = `https://storage.googleapis.com/${GCS_BUCKET}/`;
    if (!url || !url.startsWith(prefix)) return null;
    return url.slice(prefix.length);
}

/**
 * Delete one or more GCS objects by their public URLs.
 * Silently skips external URLs (Unsplash, etc.) and non-existent files.
 * Never throws — failures are logged but don't break the caller.
 */
export async function deleteGCSFiles(urls: string[]): Promise<void> {
    const paths = urls.map(gcsPathFromUrl).filter((p): p is string => p !== null);
    if (paths.length === 0) return;

    const results = await Promise.allSettled(
        paths.map(path => bucket.file(path).delete({ ignoreNotFound: true }))
    );

    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            console.error(`[GCS] Failed to delete ${paths[i]}:`, result.reason);
        } else {
            console.log(`[GCS] Deleted: ${paths[i]}`);
        }
    });
}
