import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { processEnv } from "@next/env";
import { encodePinHash, decodePinHash } from "../src/lib/domain/pin-hash.mjs";

describe("portable password hashing across Next environment reloads", () => {
  it("preserves the Argon2id hash through the actual Next dotenv loader", async () => {
    const password = randomBytes(8).toString("hex"),
      original = await hash(password, {
        algorithm: 2,
        memoryCost: 4096,
        timeCost: 1,
      }),
      stored = encodePinHash(original),
      key = "LAVILLI_PIN_TEST_" + randomBytes(8).toString("hex").toUpperCase();
    const files = [
      { path: ".env.local", contents: key + "=" + stored + "\n", env: {} },
    ];
    const previous = process.env.__NEXT_PROCESSED_ENV;
    try {
      processEnv(files, "/tmp", { info: () => {}, error: () => {} }, true);
      const parsed = (files[0].env as Record<string, string>)[key];
      expect(parsed).toBe(stored);
      expect(await verify(decodePinHash(parsed), password)).toBe(true);
      expect(stored).not.toContain("$");
    } finally {
      delete process.env[key];
      if (previous === undefined) delete process.env.__NEXT_PROCESSED_ENV;
      else process.env.__NEXT_PROCESSED_ENV = previous;
    }
  });
  it("also accepts raw Argon2id hashes supplied directly by a hosting secret manager", async () => {
    const original = await hash(randomBytes(8).toString("hex"), {
      algorithm: 2,
      memoryCost: 4096,
      timeCost: 1,
    });
    expect(decodePinHash(original)).toBe(original);
    expect(decodePinHash(encodePinHash(original))).toBe(original);
  });
  it("rejects a publishable API key or malformed value used as a PIN hash", () => {
    for (const value of [
      "invalid",
      "argon2id:invalid",
      "argon2id:!!",
      "sb_publishable_test",
    ])
      expect(() => decodePinHash(value)).toThrow("PIN_CONFIGURATION_INVALID");
  });
});
