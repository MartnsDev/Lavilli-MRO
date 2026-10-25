import { mkdir, copyFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const root = "public/ocr/v7";
await mkdir(join(root, "core"), { recursive: true });
await mkdir(join(root, "lang"), { recursive: true });
const tesseract = dirname(require.resolve("tesseract.js/package.json"));
const core = dirname(require.resolve("tesseract.js-core/package.json"));
await copyFile(
  join(tesseract, "dist/worker.min.js"),
  join(root, "worker.min.js"),
);
await copyFile(
  join(tesseract, "dist/worker.min.js.LICENSE.txt"),
  join(root, "worker.min.js.LICENSE.txt"),
);
for (const name of await readdir(core)) {
  if (/^tesseract-core.*\.wasm(?:\.js)?$/.test(name) || name === "LICENSE")
    await copyFile(join(core, name), join(root, "core", name));
}
for (const language of ["eng", "por"]) {
  const data = dirname(
    require.resolve(`@tesseract.js-data/${language}/package.json`),
  );
  await copyFile(
    join(data, "4.0.0_best_int", `${language}.traineddata.gz`),
    join(root, "lang", `${language}.traineddata.gz`),
  );
}
await writeFile(
  join(root, "NOTICE.txt"),
  "Tesseract.js and Tesseract.js-core: Apache-2.0 (https://github.com/naptha/tesseract.js). Language data packages: MIT (https://github.com/naptha/tessdata). Files generated from pinned npm dependencies; images are processed locally in the browser.\n",
);
console.log("Local OCR assets prepared (worker, WASM and eng/por models).");
