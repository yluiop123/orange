package com.orange.domain.system.tree;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TreeIndexTest {

    private record Node(String id, String parentId, boolean enabled) {
    }

    private static final List<Node> NODES = List.of(
            new Node("00", null, true),
            new Node("0001", "00", true),
            new Node("0002", "00", false),
            new Node("000101", "0001", false),
            new Node("000201", "0002", true)
    );

    private static TreeIndex<Node> index() {
        return TreeIndex.of(NODES, Node::id, Node::parentId);
    }

    @Test
    void subtreeIncludesRootsAndDescendants() {
        assertThat(index().subtreeIds(Set.of("0001")))
                .containsExactlyInAnyOrder("0001", "000101");
    }

    @Test
    void ancestorIdsWalkToRoot() {
        assertThat(index().withAncestorIds(List.of(NODES.get(3))))
                .containsExactlyInAnyOrder("000101", "0001", "00");
    }

    @Test
    void enabledDescendantIgnoresTheNodeItself() {
        TreeIndex<Node> index = index();

        assertThat(index.hasEnabledDescendant("00", Node::enabled)).isTrue();
        assertThat(index.hasEnabledDescendant("0002", Node::enabled)).isTrue();
        assertThat(index.hasEnabledDescendant("0001", Node::enabled)).isFalse();
    }

    @Test
    void deleteOrderPutsDeepestFirst() {
        assertThat(index().deleteOrder(Set.of("00", "0001", "000101")))
                .extracting(Node::id)
                .containsExactly("000101", "0001", "00");
    }

    @Test
    void missingParentAndCyclesDoNotHang() {
        TreeIndex<Node> broken = TreeIndex.of(
                List.of(new Node("a", "b", true), new Node("b", "a", true)),
                Node::id,
                Node::parentId);

        assertThat(broken.depth("a")).isGreaterThanOrEqualTo(0);
        assertThat(broken.subtreeIds(Set.of("a")))
                .containsExactlyInAnyOrder("a", "b");
    }
}
