import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../src/lib/server/queries", () => ({
  get: async () => ({
    id: "00000000-0000-4000-8000-000000000001",
    name: "Documento de teste isolado",
  }),
  referenceLabels: async () => ({}),
}));
vi.mock("../src/lib/server/db", () => ({
  securityBoundaryReady: async () => false,
  db: () => ({
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: [], error: null }),
      };
      return query;
    },
  }),
}));
vi.mock("../src/components/record-actions", () => ({
  RecordActions: () => null,
}));
vi.mock("../src/components/related-records", () => ({
  RelatedRecords: () => null,
}));

it("renders a clear notice instead of an unusable file picker on the existing schema", async () => {
  const { default: Detail } =
    await import("../src/app/(hangar)/records/[entity]/[id]/page");
  const tree = await Detail({
    params: Promise.resolve({
      entity: "documents",
      id: "00000000-0000-4000-8000-000000000001",
    }),
  });
  const html = renderToStaticMarkup(tree);
  expect(html).toContain(
    "O envio de arquivos ainda não está disponível neste ambiente.",
  );
  expect(html).not.toContain('type="file"');
  expect(html).toContain("Documento de teste isolado");
});
