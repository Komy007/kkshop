const { execSync } = require('child_process');

try {
    console.log("Fetching image list from Artifact Registry...");
    const output = execSync('gcloud artifacts docker images list asia-southeast1-docker.pkg.dev/kkshop-487905/cloud-run-source-deploy/kkshop --sort-by=~UPDATE_TIME --format=json', { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
    const images = JSON.parse(output);

    if (images.length <= 1) {
        console.log("No old images to delete. Only " + images.length + " image(s) found.");
        process.exit(0);
    }

    console.log(`Found ${images.length} images. Keeping the latest 1, deleting ${images.length - 1}...`);

    // Keep the latest 1 image (index 0), delete the rest
    for (let i = 1; i < images.length; i++) {
        const imagePath = images[i].package;
        console.log(`[${i}/${images.length - 1}] Deleting ${imagePath}`);
        execSync(`gcloud artifacts docker images delete ${imagePath} --quiet`, { stdio: 'inherit' });
    }
    console.log("Artifact Registry cleanup complete!");
} catch (e) {
    console.error("Cleanup failed:", e.message || e);
}
