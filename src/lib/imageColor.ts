import sharp from 'sharp';

/**
 * 이미지 URL에서 배경색을 추출한다.
 * "전체 평균"이 아닌 가장자리(테두리 2px 링) 픽셀 평균을 사용해
 * 상품 자체 색에 오염되지 않도록 한다.
 * 실패 시 null 반환(예외 throw 없음).
 */
export async function getDominantBgColor(imageUrl: string): Promise<string | null> {
    try {
        const res = await fetch(imageUrl);
        if (!res.ok) return null;
        const buffer = Buffer.from(await res.arrayBuffer());

        const SIZE = 40;
        const BORDER = 2; // 바깥 2px 둘레만 샘플링

        const { data, info } = await sharp(buffer)
            .resize(SIZE, SIZE, { fit: 'fill' })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const { width, height, channels } = info;
        let r = 0, g = 0, b = 0, count = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const isBorder =
                    x < BORDER || x >= width - BORDER ||
                    y < BORDER || y >= height - BORDER;
                if (!isBorder) continue;

                const idx = (y * width + x) * channels;
                const alpha = data[idx + 3] ?? 255;
                if (alpha < 30) continue; // 거의 투명한 픽셀 제외

                r += data[idx] ?? 0;
                g += data[idx + 1] ?? 0;
                b += data[idx + 2] ?? 0;
                count++;
            }
        }

        if (count === 0) return '#FFFFFF';

        const toHex = (v: number) => Math.round(v / count).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (err) {
        console.warn('[imageColor] getDominantBgColor failed:', err);
        return null;
    }
}
