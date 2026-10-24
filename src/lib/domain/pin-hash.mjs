// Portable representation: avoids dotenv expansion of Argon2's dollar signs.
/** @param {string} hash @returns {string} */
export function encodePinHash(hash) {
  if (!hash.startsWith("$argon2id$"))
    throw new Error("PIN_CONFIGURATION_INVALID");
  return "argon2id:" + Buffer.from(hash, "utf8").toString("base64url");
}
/** @param {string} value @returns {string} */
export function decodePinHash(value) {
  const stored = value.trim();
  let decoded = stored;
  if (stored.startsWith("argon2id:")) {
    const content = stored.slice(9);
    if (!/^[A-Za-z0-9_-]+$/.test(content))
      throw new Error("PIN_CONFIGURATION_INVALID");
    decoded = Buffer.from(content, "base64url").toString("utf8");
  }
  if (!decoded.startsWith("$argon2id$"))
    throw new Error("PIN_CONFIGURATION_INVALID");
  return decoded;
}
