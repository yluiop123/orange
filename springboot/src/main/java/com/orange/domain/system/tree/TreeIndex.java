package com.orange.domain.system.tree;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * 树形资源的纯内存索引：一次加载，反复查询后代、祖先、深度和删除顺序。
 * 不依赖 JPA，可用普通单元测试覆盖。
 */
public final class TreeIndex<T> {

    private final Map<String, T> byId;
    private final Map<String, List<T>> childrenByParent;
    private final Function<T, String> idFn;
    private final Function<T, String> parentFn;

    private TreeIndex(Collection<T> all,
                      Function<T, String> idFn,
                      Function<T, String> parentFn) {
        this.idFn = idFn;
        this.parentFn = parentFn;
        this.byId = new LinkedHashMap<>();
        this.childrenByParent = new LinkedHashMap<>();
        for (T node : all) {
            byId.put(idFn.apply(node), node);
        }
        for (T node : all) {
            String parentId = parentFn.apply(node);
            if (parentId != null) {
                childrenByParent.computeIfAbsent(parentId, key -> new ArrayList<>()).add(node);
            }
        }
    }

    public static <T> TreeIndex<T> of(Collection<T> all,
                                      Function<T, String> idFn,
                                      Function<T, String> parentFn) {
        return new TreeIndex<>(all, idFn, parentFn);
    }

    public T get(String id) {
        return byId.get(id);
    }

    /** 包含传入根节点本身，按 BFS 顺序返回整棵子树。 */
    public Set<String> subtreeIds(Collection<String> roots) {
        Set<String> visited = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>(roots);
        while (!queue.isEmpty()) {
            String id = queue.poll();
            if (visited.add(id)) {
                childrenByParent.getOrDefault(id, List.of())
                        .forEach(child -> queue.add(idFn.apply(child)));
            }
        }
        return visited;
    }

    /** 返回匹配节点及其全部祖先的 id。 */
    public Set<String> withAncestorIds(Collection<T> matched) {
        Set<String> ids = new LinkedHashSet<>();
        for (T node : matched) {
            ids.add(idFn.apply(node));
        }
        for (T node : matched) {
            String parentId = parentFn.apply(node);
            while (parentId != null && ids.add(parentId)) {
                T parent = byId.get(parentId);
                parentId = parent == null ? null : parentFn.apply(parent);
            }
        }
        return ids;
    }

    /** 只检查后代，不检查节点自身。 */
    public boolean hasEnabledDescendant(String id, Predicate<T> enabled) {
        Deque<String> queue = new ArrayDeque<>();
        childrenByParent.getOrDefault(id, List.of())
                .forEach(child -> queue.add(idFn.apply(child)));
        Set<String> visited = new LinkedHashSet<>();
        while (!queue.isEmpty()) {
            String childId = queue.poll();
            if (!visited.add(childId)) {
                continue;
            }
            T child = byId.get(childId);
            if (child != null && enabled.test(child)) {
                return true;
            }
            childrenByParent.getOrDefault(childId, List.of())
                    .forEach(item -> queue.add(idFn.apply(item)));
        }
        return false;
    }

    /** 过滤出目标节点，按深度从深到浅排序，保证先删子节点。 */
    public List<T> deleteOrder(Collection<String> ids) {
        Set<String> target = new LinkedHashSet<>(ids);
        return byId.values().stream()
                .filter(node -> target.contains(idFn.apply(node)))
                .sorted(Comparator.comparingInt((T node) -> depth(idFn.apply(node))).reversed())
                .toList();
    }

    public int depth(String id) {
        int depth = 0;
        Set<String> visited = new LinkedHashSet<>();
        String current = id;
        while (current != null && visited.add(current)) {
            T node = byId.get(current);
            current = node == null ? null : parentFn.apply(node);
            if (current != null) {
                depth++;
            }
        }
        return depth;
    }
}
