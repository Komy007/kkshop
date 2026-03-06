import { Storage } from '@google-cloud/storage';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

// Initialize GCS client relying on GOOGLE_APPLICATION_CREDENTIALS in .env
const storage = new Storage({});

const bucketName = process.env.GCS_BUCKET_NAME || 'kkshop-images';

async function main() {
    console.log(`Starting GCS Cleanup for bucket: ${bucketName}...`);

    // 1. Get all blobs from GCS
    const [files] = await storage.bucket(bucketName).getFiles();
    const gcsFiles = files.map(f => f.name);
    console.log(`Found ${gcsFiles.length} files in GCS.`);

    // 2. Get all valid image URLs from DB
    const [products, productImages, reviews, users, siteSettings] = await Promise.all([
        prisma.product.findMany({ select: { imageUrl: true }, where: { imageUrl: { not: null } } }),
        prisma.productImage.findMany({ select: { url: true } }),
        prisma.productReview.findMany({ select: { imageUrl: true }, where: { imageUrl: { not: null } } }),
        prisma.user.findMany({ select: { image: true }, where: { image: { not: null } } }),
        prisma.siteSetting.findMany({ select: { value: true } })
    ]);

    const validUrls = new Set<string>();

    products.forEach(p => p.imageUrl && validUrls.add(p.imageUrl));
    productImages.forEach(pi => validUrls.add(pi.url));
    reviews.forEach(r => r.imageUrl && validUrls.add(r.imageUrl));
    users.forEach(u => u.image && validUrls.add(u.image));

    // Settings might contain deep logo URLs
    siteSettings.forEach(s => {
        try {
            const data = s.value as any;
            if (data?.logoUrl) validUrls.add(data.logoUrl);
            if (data?.faviconUrl) validUrls.add(data.faviconUrl);
        } catch (e) { }
    });

    console.log(`Found ${validUrls.size} unique valid image URLs in Database.`);

    const bucketUrlPrefix = `https://storage.googleapis.com/${bucketName}/`;

    // 3. Find orphaned files
    const orphanedFiles: string[] = [];

    for (const gcsFile of gcsFiles) {
        // Construct standard URL format used in DB
        const fileUrl = `${bucketUrlPrefix}${gcsFile}`;

        if (!validUrls.has(fileUrl)) {
            orphanedFiles.push(gcsFile);
        }
    }

    console.log(`Identified ${orphanedFiles.length} orphaned files in GCS.`);

    // 4. Delete orphaned files
    if (orphanedFiles.length > 0) {
        console.log('\n--- Orphaned Files to Delete ---');
        orphanedFiles.forEach(f => console.log(` - ${f}`));

        const isDryRun = process.argv.includes('--dry-run');

        if (isDryRun) {
            console.log('\nDRY RUN: No files were deleted.');
        } else {
            console.log('\nDeleting files...');
            let deletedCount = 0;
            for (const file of orphanedFiles) {
                try {
                    await storage.bucket(bucketName).file(file).delete();
                    deletedCount++;
                } catch (error) {
                    console.error(`Failed to delete ${file}:`, (error as Error).message);
                }
            }
            console.log(`Successfully deleted ${deletedCount} files.`);
        }
    } else {
        console.log('No orphaned files found. Storage is clean!');
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error('Fatal error during cleanup:', e);
    prisma.$disconnect();
    process.exit(1);
});
