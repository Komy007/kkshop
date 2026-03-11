import { NextResponse, NextRequest } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { auth } from '@/auth';

const GCS_BUCKET = process.env.GCS_BUCKET_NAME || 'kkshop-images';

// Initialize GCS — in Cloud Run, uses the service account automatically (no key file needed)
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const MAX_SIZE_MB = 10;

export async function POST(request: NextRequest) {
    try {
        // ── Auth Guard: only ADMIN / SUPERADMIN can upload ──────────────────
        const session = await auth();
        const role = session?.user?.role;
        if (!session?.user || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: '파일이 없습니다' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: '지원하지 않는 파일 형식입니다 (JPG/PNG/WebP만 가능)' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return NextResponse.json({ success: false, error: `파일 크기는 ${MAX_SIZE_MB}MB 이내여야 합니다` }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Build unique filename — e.g. products/1709123456789_product.jpg
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const ext = file.type === 'image/webp' ? '.webp' : file.name.split('.').pop() || 'jpg';
        const gcsFilename = `products/${timestamp}_${safeName}`;

        // Upload to GCS
        const gcsFile = bucket.file(gcsFilename);
        await gcsFile.save(buffer, {
            contentType: file.type,
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Public URL (bucket has allUsers read access)
        const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsFilename}`;

        console.log(`[Upload] Saved to GCS: ${publicUrl}`);
        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error: any) {
        console.error('[Upload] Error:', error);
        return NextResponse.json({ success: false, error: '업로드 실패: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
