import { NextResponse, NextRequest } from 'next/server';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import { auth } from '@/auth';

const GCS_BUCKET = process.env.GCS_BUCKET_NAME || 'kkshop-images';

// Initialize GCS — in Cloud Run, uses the service account automatically (no key file needed)
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const MAX_SIZE_MB = 10;
// Max output width — anything larger is resized down. 1600px covers retina mobile + desktop.
const MAX_OUTPUT_WIDTH = 1600;
// WebP quality — 82 is the sweet spot (visually identical to 90, ~25% smaller files).
const WEBP_QUALITY = 82;

// Magic byte signatures for real image validation
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/jpg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function isValidMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;
    return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte));
}

/**
 * Convert any input image to optimized WebP.
 * - Strips EXIF/GPS metadata (privacy)
 * - Resizes to MAX_OUTPUT_WIDTH if larger (preserves aspect ratio)
 * - Quality 82 WebP — typically 70–85% smaller than original JPEG
 * - When `square=true`: center-crops to 1600×1600 (main gallery thumbnails)
 * GIF special case: keep as-is (sharp can lose animation frames easily).
 */
async function processImage(
    buffer: Buffer,
    mimeType: string,
    square: boolean,
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
    // GIF: pass through (preserve animation)
    if (mimeType === 'image/gif') {
        return { buffer, ext: 'gif', contentType: 'image/gif' };
    }
    const pipeline = sharp(buffer, { failOn: 'truncated' }).rotate(); // auto-rotate via EXIF then strip metadata
    const resized = square
        ? pipeline.resize({
              width: MAX_OUTPUT_WIDTH,
              height: MAX_OUTPUT_WIDTH,
              fit: 'cover',
              position: 'center',
              withoutEnlargement: false, // upscale small images so all gallery thumbs match
          })
        : pipeline.resize({ width: MAX_OUTPUT_WIDTH, withoutEnlargement: true });
    const optimized = await resized.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
    return { buffer: optimized, ext: 'webp', contentType: 'image/webp' };
}

export async function POST(request: NextRequest) {
    try {
        // ── Auth Guard: ADMIN / SUPERADMIN / SUPPLIER can upload ────────────
        const session = await auth();
        const role = session?.user?.role;
        if (!session?.user || !['ADMIN', 'SUPERADMIN', 'SUPPLIER'].includes(role ?? '')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // ?crop=square → main-gallery thumbnails (1:1 center crop)
        // (no param)   → detail-page images (keep aspect ratio)
        const url = new URL(request.url);
        const cropSquare = url.searchParams.get('crop') === 'square';

        const data = await request.formData();

        // Support both single 'file' and multiple 'files' keys
        const singleFile = data.get('file') as File | null;
        const multiFiles = data.getAll('files') as File[];
        const filesToUpload: File[] = singleFile ? [singleFile] : multiFiles.filter(f => f instanceof File && f.size > 0);

        if (filesToUpload.length === 0) {
            return NextResponse.json({ success: false, error: 'No file provided · 파일이 없습니다' }, { status: 400 });
        }

        const uploadedUrls: string[] = [];
        let totalSavedBytes = 0;

        for (const file of filesToUpload) {
            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json({ success: false, error: 'Unsupported file type (JPG/PNG/WebP only) · 지원하지 않는 파일 형식입니다' }, { status: 400 });
            }

            // Validate file size
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                return NextResponse.json({ success: false, error: `File must be under ${MAX_SIZE_MB}MB · 파일 크기는 ${MAX_SIZE_MB}MB 이내여야 합니다` }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const inputBuffer = Buffer.from(bytes);

            // Verify actual file content matches declared MIME type (magic bytes)
            if (!isValidMagicBytes(inputBuffer, file.type)) {
                return NextResponse.json({ success: false, error: 'File content does not match declared type. Upload a real image.' }, { status: 400 });
            }

            // ── Optimize: resize + WebP convert (Cambodia mobile = slow 4G/3G) ──
            let processed: { buffer: Buffer; ext: string; contentType: string };
            try {
                processed = await processImage(inputBuffer, file.type, cropSquare);
            } catch (procErr: any) {
                console.error('[Upload] Image processing failed:', procErr?.message);
                return NextResponse.json({ success: false, error: 'Image could not be processed. The file may be corrupt.' }, { status: 400 });
            }

            const savedBytes = inputBuffer.length - processed.buffer.length;
            totalSavedBytes += savedBytes;

            // Build unique filename — strip original extension, use webp/gif
            const timestamp = Date.now();
            const rand = Math.random().toString(36).slice(2, 8);
            const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40);
            const gcsFilename = `products/${timestamp}_${rand}_${baseName}.${processed.ext}`;

            // Upload to GCS
            const gcsFile = bucket.file(gcsFilename);
            await gcsFile.save(processed.buffer, {
                contentType: processed.contentType,
                metadata: { cacheControl: 'public, max-age=31536000, immutable' },
            });

            const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsFilename}`;
            uploadedUrls.push(publicUrl);
            console.log(`[Upload] ${file.name}: ${inputBuffer.length}B → ${processed.buffer.length}B (saved ${Math.round((savedBytes / inputBuffer.length) * 100)}%) → ${publicUrl}`);
        }

        const publicUrl = uploadedUrls[0];
        return NextResponse.json({
            success: true,
            url: publicUrl,
            urls: uploadedUrls,
            savedBytes: totalSavedBytes,
        });

    } catch (error: any) {
        console.error('[Upload] Error:', error);
        return NextResponse.json({ success: false, error: '업로드 실패: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
