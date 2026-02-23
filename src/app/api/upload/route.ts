import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename and add unique timestamp
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${originalName}`;

        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filePath = join(uploadDir, filename);

        // In a real app, you might want to ensure the directory exists first
        await writeFile(filePath, buffer);
        console.log(`Saved file to ${filePath}`);

        // Return the public URL
        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 });
    }
}
