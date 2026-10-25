import { it, expect } from "vitest";
import QRCode from "qrcode";
import sharp from "sharp";
import { decodeQrPixels } from "../src/lib/domain/qr-pixels";
const masks = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const cases = masks.flatMap((mask) => [
  { mask, jpeg: false },
  { mask, jpeg: true },
]);
it.each(cases)(
  "reads QR mask $mask after JPEG conversion=$jpeg",
  async ({ mask, jpeg }) => {
    // Exact valid payload missed by the original decoder during CI; no production record.
    const text =
      "http://localhost:3100/records/locations/f7a43678-ea9a-4429-a7af-88444d19995b";
    let image = await QRCode.toBuffer(text, {
      width: 700,
      margin: 4,
      maskPattern: mask,
    });
    if (jpeg) image = await sharp(image).jpeg({ quality: 90 }).toBuffer();
    const { data, info } = await sharp(image)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(
      decodeQrPixels(new Uint8ClampedArray(data), info.width, info.height),
    ).toBe(text);
  },
);
