// Local processing only: normalize orientation, remove metadata and fit phone photos to the upload limit.
export async function preparePhoto(file: File): Promise<File> {
  if (
    !/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) ||
    file.size > 20 * 1024 * 1024
  )
    throw Error(
      "Escolha uma foto JPEG, PNG ou uma foto da câmera de até 20 MB.",
    );
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw Error(
        "Não foi possível abrir a foto. Use JPEG ou PNG neste navegador.",
      );
    }
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 48000000
    )
      throw Error(
        "A foto é muito grande. Use uma imagem de até 48 megapixels.",
      );
    const scale = Math.min(
      1,
      3000 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw Error("Não foi possível preparar a foto neste navegador.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.7]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= 4 * 1024 * 1024)
        return new File([blob], "foto-documento.jpg", { type: "image/jpeg" });
    }
    throw Error(
      "A foto ainda excede 4 MB. Fotografe apenas a área necessária.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
