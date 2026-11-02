import { describe, expect, it } from "vitest";
import { buildTree, collectTreeIds } from "./tree";

type Node = { id: string; parentId?: string | null; name: string };

const rows: Node[] = [
  { id: "0002", parentId: null, name: "B" },
  { id: "0001", parentId: null, name: "A" },
  { id: "000102", parentId: "0001", name: "A2" },
  { id: "000101", parentId: "0001", name: "A1" },
  { id: "9999", parentId: "missing", name: "Orphan" },
];

const config = {
  id: (row: Node) => row.id,
  parentId: (row: Node) => row.parentId,
};

describe("buildTree", () => {
  it("sorts roots and children by code", () => {
    const tree = buildTree(rows, config);
    expect(tree.map((node) => node.id)).toEqual(["0001", "0002", "9999"]);
    expect(tree[0].subRows?.map((node) => node.id)).toEqual([
      "000101",
      "000102",
    ]);
  });

  it("treats a missing parent as a root", () => {
    const tree = buildTree(rows, config);
    expect(tree.some((node) => node.id === "9999")).toBe(true);
  });

  it("does not mutate the source rows", () => {
    const copy = rows.map((row) => ({ ...row }));
    buildTree(rows, config);
    expect(rows).toEqual(copy);
  });
});

describe("collectTreeIds", () => {
  it("collects the node and all descendants", () => {
    const tree = buildTree(rows, config);
    expect(collectTreeIds(tree[0])).toEqual(["0001", "000101", "000102"]);
  });
});
