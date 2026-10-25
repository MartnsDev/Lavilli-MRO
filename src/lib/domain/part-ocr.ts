const labels = {
  partNumber:
    /(?:^|[\s|;])(?:PART\s*(?:NUMBER|NO)|P\s*[/.-]?\s*N)\b\.?\s*[:#=\-]?\s*(.*)/i,
  serialNumber:
    /(?:^|[\s|;])(?:SERIAL\s*(?:NUMBER|NO)?|S\s*[/.-]?\s*N|(?:NUMERO|N[O°º]?)\s*(?:DE\s*)?SERIE)\b\.?\s*[:#=\-]?\s*(.*)/i,
};
export function identifiersFromText(text: string) {
  const lines = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const output = { partNumber: "", serialNumber: "" };
  for (const key of Object.keys(labels) as Array<keyof typeof labels>) {
    for (let i = 0; i < lines.length; i++) {
      const match = labels[key].exec(lines[i]);
      if (!match) continue;
      const candidate = (match[1] || lines[i + 1] || "").replace(
        /\s*([/-])\s*/g,
        "$1",
      );
      if (
        !match[1] &&
        Object.values(labels).some((label) => label.test(candidate))
      )
        continue;
      const value = candidate.match(
        /^[A-Z0-9][A-Z0-9._/-]{0,63}(?=$|\s|[,;|])/i,
      )?.[0];
      if (
        value &&
        !/^(?:PART|NUMBER|SERIAL|DESCRIPTION|PN|SN|P\/N|S\/N)$/i.test(value)
      ) {
        output[key] = value;
        break;
      }
    }
  }
  return output;
}
