"""In-memory tree index used for ancestors, descendants and delete ordering.

The index is deliberately independent of SQLAlchemy so the tree rules can be
unit tested without a database.
"""

from __future__ import annotations

from collections import deque
from collections.abc import Callable, Collection, Iterable
from typing import Generic, TypeVar

T = TypeVar("T")


class TreeIndex(Generic[T]):
    def __init__(
        self,
        nodes: Iterable[T],
        id_fn: Callable[[T], str],
        parent_fn: Callable[[T], str | None],
    ) -> None:
        self._id_fn = id_fn
        self._parent_fn = parent_fn
        self._by_id: dict[str, T] = {}
        self._children: dict[str, list[T]] = {}

        materialised = list(nodes)
        for node in materialised:
            self._by_id[id_fn(node)] = node
        for node in materialised:
            parent_id = parent_fn(node)
            if parent_id is not None:
                self._children.setdefault(parent_id, []).append(node)

    def get(self, node_id: str) -> T | None:
        return self._by_id.get(node_id)

    def subtree_ids(self, roots: Collection[str]) -> set[str]:
        """Return the roots and every descendant (breadth-first)."""
        visited: set[str] = set()
        queue: deque[str] = deque(roots)
        while queue:
            node_id = queue.popleft()
            if node_id in visited:
                continue
            visited.add(node_id)
            for child in self._children.get(node_id, ()):
                queue.append(self._id_fn(child))
        return visited

    def with_ancestor_ids(self, matched: Iterable[T]) -> set[str]:
        """Return the matched ids plus every ancestor id."""
        nodes = list(matched)
        ids: set[str] = {self._id_fn(node) for node in nodes}
        for node in nodes:
            parent_id = self._parent_fn(node)
            while parent_id is not None and parent_id not in ids:
                ids.add(parent_id)
                parent = self._by_id.get(parent_id)
                parent_id = self._parent_fn(parent) if parent is not None else None
        return ids

    def has_enabled_descendant(self, node_id: str, enabled: Callable[[T], bool]) -> bool:
        """Check descendants only; the node itself is excluded."""
        queue: deque[str] = deque(self._id_fn(child) for child in self._children.get(node_id, ()))
        visited: set[str] = set()
        while queue:
            child_id = queue.popleft()
            if child_id in visited:
                continue
            visited.add(child_id)
            child = self._by_id.get(child_id)
            if child is not None and enabled(child):
                return True
            for grandchild in self._children.get(child_id, ()):
                queue.append(self._id_fn(grandchild))
        return False

    def delete_order(self, ids: Collection[str]) -> list[T]:
        """Return nodes deepest first so children are removed before parents."""
        targets = set(ids)
        selected = [node for node in self._by_id.values() if self._id_fn(node) in targets]
        return sorted(selected, key=lambda node: self.depth(self._id_fn(node)), reverse=True)

    def depth(self, node_id: str) -> int:
        depth = 0
        visited: set[str] = set()
        current: str | None = node_id
        while current is not None and current not in visited:
            visited.add(current)
            node = self._by_id.get(current)
            current = self._parent_fn(node) if node is not None else None
            if current is not None:
                depth += 1
        return depth
