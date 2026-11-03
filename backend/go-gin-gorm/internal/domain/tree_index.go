package domain

// TreeIndex is a pure in-memory index over a tree resource. Services load all
// rows once and reuse the index for ancestors, descendants, depth and delete
// ordering, which keeps the rules testable without a database.
type TreeIndex[T any] struct {
	byID     map[string]T
	children map[string][]T
	order    []T
	idFn     func(T) string
	parentFn func(T) *string
}

func NewTreeIndex[T any](all []T, idFn func(T) string, parentFn func(T) *string) *TreeIndex[T] {
	index := &TreeIndex[T]{
		byID:     make(map[string]T, len(all)),
		children: make(map[string][]T),
		order:    all,
		idFn:     idFn,
		parentFn: parentFn,
	}
	for _, node := range all {
		index.byID[idFn(node)] = node
	}
	for _, node := range all {
		if parent := parentFn(node); parent != nil && *parent != "" {
			index.children[*parent] = append(index.children[*parent], node)
		}
	}
	return index
}

func (t *TreeIndex[T]) Get(id string) (T, bool) {
	node, ok := t.byID[id]
	return node, ok
}

// SubtreeIDs returns the requested roots plus every descendant, breadth first.
func (t *TreeIndex[T]) SubtreeIDs(roots []string) map[string]bool {
	visited := make(map[string]bool, len(roots))
	queue := append([]string(nil), roots...)
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if visited[id] {
			continue
		}
		visited[id] = true
		for _, child := range t.children[id] {
			queue = append(queue, t.idFn(child))
		}
	}
	return visited
}

// WithAncestorIDs returns the matched ids plus all of their ancestors.
func (t *TreeIndex[T]) WithAncestorIDs(matched []T) map[string]bool {
	ids := make(map[string]bool, len(matched))
	for _, node := range matched {
		ids[t.idFn(node)] = true
	}
	for _, node := range matched {
		parentID := t.parentFn(node)
		for parentID != nil && *parentID != "" && !ids[*parentID] {
			ids[*parentID] = true
			parent, ok := t.byID[*parentID]
			if !ok {
				break
			}
			parentID = t.parentFn(parent)
		}
	}
	return ids
}

// HasEnabledDescendant checks descendants only, never the node itself.
func (t *TreeIndex[T]) HasEnabledDescendant(id string, enabled func(T) bool) bool {
	visited := make(map[string]bool)
	queue := append([]string(nil), idsOf(t.children[id], t.idFn)...)
	for len(queue) > 0 {
		childID := queue[0]
		queue = queue[1:]
		if visited[childID] {
			continue
		}
		visited[childID] = true
		child, ok := t.byID[childID]
		if ok && enabled(child) {
			return true
		}
		for _, grandChild := range t.children[childID] {
			queue = append(queue, t.idFn(grandChild))
		}
	}
	return false
}

// DeleteOrder filters the indexed rows to the target ids, deepest first.
func (t *TreeIndex[T]) DeleteOrder(target map[string]bool) []T {
	result := make([]T, 0, len(target))
	for _, node := range t.order {
		if target[t.idFn(node)] {
			result = append(result, node)
		}
	}
	// Stable insertion sort by descending depth; trees are small.
	for i := 1; i < len(result); i++ {
		for j := i; j > 0 && t.Depth(t.idFn(result[j])) > t.Depth(t.idFn(result[j-1])); j-- {
			result[j], result[j-1] = result[j-1], result[j]
		}
	}
	return result
}

func (t *TreeIndex[T]) Depth(id string) int {
	depth := 0
	visited := make(map[string]bool)
	current := id
	for {
		node, ok := t.byID[current]
		if !ok {
			break
		}
		parent := t.parentFn(node)
		if parent == nil || *parent == "" || visited[*parent] {
			break
		}
		visited[*parent] = true
		current = *parent
		depth++
	}
	return depth
}

func idsOf[T any](nodes []T, idFn func(T) string) []string {
	ids := make([]string, 0, len(nodes))
	for _, node := range nodes {
		ids = append(ids, idFn(node))
	}
	return ids
}
