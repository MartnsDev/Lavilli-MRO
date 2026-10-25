import jsQR from "jsqr";
// Independent QR detector covers valid finder patterns the multi-format reader can miss.
export function decodeQrPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  if (!width || !height || data.length !== 4 * width * height) return null;
  return (
    jsQR(data, width, height, { inversionAttempts: "attemptBoth" })?.data ||
    null
  );
}
