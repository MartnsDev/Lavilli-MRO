export async function decodeQrFrame(
  source: HTMLImageElement | HTMLVideoElement,
) {
  const width =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source.naturalWidth;
  const height =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source.naturalHeight;
  if (!width || !height) return null;
  const scale = Math.min(1, 1600 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const { decodeQrPixels } = await import("./domain/qr-pixels");
  return decodeQrPixels(pixels.data, pixels.width, pixels.height);
}
