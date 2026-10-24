export function fileType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 5 &&
    Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-"
  )
    return "application/pdf";
  if (
    bytes.length >= 8 &&
    Buffer.from(bytes.subarray(0, 8)).toString("hex") === "89504e470d0a1a0a"
  )
    return "image/png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  return null;
}
export function validExtension(name: string, mime: string) {
  const ext = name.toLowerCase().split(".").pop();
  return mime === "application/pdf"
    ? ext === "pdf"
    : mime === "image/png"
      ? ext === "png"
      : mime === "image/jpeg"
        ? ["jpg", "jpeg"].includes(ext ?? "")
        : false;
}
