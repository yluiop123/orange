from app.security.passwords import (
    generate_temporary_password,
    hash_password,
    verify_password,
)
from app.policies.tree_index import TreeIndex


class Node:
    def __init__(self, node_id, parent_id, status="1"):
        self.id = node_id
        self.parent_id = parent_id
        self.status = status


def build_tree():
    nodes = [
        Node("00", None),
        Node("01", "00"),
        Node("0101", "01"),
        Node("010101", "0101"),
        Node("02", "00"),
    ]
    return TreeIndex(nodes, lambda node: node.id, lambda node: node.parent_id), nodes


def test_subtree_and_ancestor_walks():
    index, _ = build_tree()

    assert index.subtree_ids({"00"}) == {"00", "01", "0101", "010101", "02"}
    assert index.subtree_ids({"0101"}) == {"0101", "010101"}

    matched = [index.get("010101")]
    assert index.with_ancestor_ids(matched) == {"010101", "0101", "01", "00"}


def test_has_enabled_descendant_ignores_the_node_itself():
    index, nodes = build_tree()

    assert index.has_enabled_descendant("00", lambda node: node.status == "1") is True
    leaf = index.get("02")
    assert index.has_enabled_descendant(leaf.id, lambda node: node.status == "1") is False

    for node in nodes:
        if node.id in {"0101", "010101"}:
            node.status = "0"
    assert index.has_enabled_descendant("00", lambda node: node.status == "1") is True
    assert index.has_enabled_descendant("01", lambda node: node.status == "1") is False


def test_delete_order_is_deepest_first():
    index, _ = build_tree()

    ordered = [node.id for node in index.delete_order({"00", "0101", "010101"})]
    assert ordered.index("010101") < ordered.index("0101")
    assert ordered.index("0101") < ordered.index("00")


def test_temporary_password_is_twelve_characters_and_hashes_verify():
    temporary = generate_temporary_password()
    assert len(temporary) == 12

    hashed = hash_password(temporary)
    assert verify_password(temporary, hashed) is True
    assert verify_password("wrong-password", hashed) is False
    assert verify_password(temporary, "{bcrypt}" + hashed) is True
    assert verify_password(temporary, None) is False
