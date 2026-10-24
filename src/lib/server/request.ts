import "server-only";
export async function boundedBytes(request: Request, max: number) {
  const size = Number(request.headers.get("content-length"));
  if (Number.isFinite(size) && size > max) throw Error("PAYLOAD_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > max) {
        await reader.cancel();
        throw Error("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function jsonBody(request: Request, max = 65536) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw Error("INVALID_OPERATION");
  return JSON.parse(new TextDecoder().decode(await boundedBytes(request, max)));
}
export async function formBody(request: Request, max: number) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw Error("INVALID_OPERATION");
  const bytes = await boundedBytes(request, max);
  return new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type")! },
    body: bytes as BodyInit,
  }).formData();
}
