import { describe, expect, it } from "vitest";
import { buildTree, collectTreeIds } from "./tree";

type Node = { id: string; parentId?: string | null; order: number; name: string };

const rows: Node[] = [
  { id: "b", parentId: null, order: 1, name: "B" },
  { id: "a", parentId: null, order: 0, name: "A" },
  { id: "a2", parentId: "a", order: 1, name: "A2" },
  { id: "a1", parentId: "a", order: 0, name: "A1" },
  { id: "orphan", parentId: "missing", order: 2, name: "Orphan" },
];

const config = {
  id: (row: Node) => row.id,
  parentId: (row: Node) => row.parentId,
  order: (row: Node) => row.order,
};

describe("buildTree", () => {
  it("sorts roots and children by order", () => {
    const tree = buildTree(rows, config);
    expect(tree.map((node) => node.id)).toEqual(["a", "b", "orphan"]);
    expect(tree[0].subRows?.map((node) => node.id)).toEqual(["a1", "a2"]);
  });

  it("treats a missing parent as a root", () => {
    const tree = buildTree(rows, config);
    expect(tree.some((node) => node.id === "orphan")).toBe(true);
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
    expect(collectTreeIds(tree[0])).toEqual(["a", "a1", "a2"]);
  });
});
