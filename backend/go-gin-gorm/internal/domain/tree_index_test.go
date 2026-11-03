package domain

import "testing"

type testNode struct {
	id       string
	parentID *string
	enabled  bool
}

func node(id string, parent *string, enabled bool) testNode {
	return testNode{id: id, parentID: parent, enabled: enabled}
}

func strptr(value string) *string { return &value }

func TestTreeIndexSubtreeAndAncestors(t *testing.T) {
	root := node("00", nil, true)
	child := node("0001", strptr("00"), true)
	grandchild := node("000101", strptr("0001"), true)
	sibling := node("0002", strptr("00"), false)
	all := []testNode{root, child, grandchild, sibling}
	index := NewTreeIndex(all,
		func(n testNode) string { return n.id },
		func(n testNode) *string { return n.parentID },
	)

	subtree := index.SubtreeIDs([]string{"0001"})
	for _, id := range []string{"0001", "000101"} {
		if !subtree[id] {
			t.Fatalf("subtree missing %q", id)
		}
	}
	if subtree["00"] || subtree["0002"] {
		t.Fatalf("subtree leaked outside branch: %+v", subtree)
	}

	ancestors := index.WithAncestorIDs([]testNode{grandchild})
	for _, id := range []string{"000101", "0001", "00"} {
		if !ancestors[id] {
			t.Fatalf("ancestors missing %q", id)
		}
	}

	order := index.DeleteOrder(subtree)
	if len(order) != 2 || order[0].id != "000101" {
		t.Fatalf("delete order = %+v, want deepest first", order)
	}
	if index.Depth("000101") != 2 {
		t.Fatalf("depth = %d, want 2", index.Depth("000101"))
	}
}

func TestTreeIndexEnabledDescendant(t *testing.T) {
	root := node("00", nil, true)
	child := node("0001", strptr("00"), true)
	grandchild := node("000101", strptr("0001"), false)
	index := NewTreeIndex([]testNode{root, child, grandchild},
		func(n testNode) string { return n.id },
		func(n testNode) *string { return n.parentID },
	)
	enabled := func(n testNode) bool { return n.enabled }
	if !index.HasEnabledDescendant("00", enabled) {
		t.Fatal("expected an enabled descendant")
	}
	if index.HasEnabledDescendant("0001", enabled) {
		t.Fatal("grandchild is disabled; no enabled descendant expected")
	}
}
