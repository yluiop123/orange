namespace Orange.Api.Domain;

/// <summary>
/// Pure in-memory tree index: load once, then answer descendant, ancestor, depth and
/// delete-order questions. No database dependency, easy to unit-test.
/// </summary>
public sealed class TreeIndex<T>
{
    private readonly Dictionary<string, T> _byId = new(StringComparer.Ordinal);
    private readonly Dictionary<string, List<T>> _childrenByParent = new(StringComparer.Ordinal);
    private readonly Func<T, string> _idOf;
    private readonly Func<T, string?> _parentOf;

    private TreeIndex(IEnumerable<T> all, Func<T, string> idOf, Func<T, string?> parentOf)
    {
        _idOf = idOf;
        _parentOf = parentOf;
        var items = all.ToList();
        foreach (var node in items)
        {
            _byId[idOf(node)] = node;
        }
        foreach (var node in items)
        {
            var parentId = parentOf(node);
            if (parentId is not null)
            {
                if (!_childrenByParent.TryGetValue(parentId, out var children))
                {
                    children = new List<T>();
                    _childrenByParent[parentId] = children;
                }
                children.Add(node);
            }
        }
        Order = items.Select(idOf).ToList();
    }

    public static TreeIndex<T> Of(IEnumerable<T> all, Func<T, string> idOf, Func<T, string?> parentOf)
        => new(all, idOf, parentOf);

    private List<string> Order { get; }

    public T? Get(string id) => _byId.GetValueOrDefault(id);

    /// <summary>Includes the supplied roots themselves, in BFS order.</summary>
    public HashSet<string> SubtreeIds(IEnumerable<string> roots)
    {
        var visited = new HashSet<string>(StringComparer.Ordinal);
        var queue = new Queue<string>(roots);
        while (queue.Count > 0)
        {
            var id = queue.Dequeue();
            if (!visited.Add(id))
            {
                continue;
            }
            if (_childrenByParent.TryGetValue(id, out var children))
            {
                foreach (var child in children)
                {
                    queue.Enqueue(_idOf(child));
                }
            }
        }
        return visited;
    }

    /// <summary>Returns the matched nodes plus all their ancestors.</summary>
    public HashSet<string> WithAncestorIds(IEnumerable<T> matched)
    {
        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var node in matched)
        {
            ids.Add(_idOf(node));
        }
        foreach (var node in matched)
        {
            var parentId = _parentOf(node);
            while (parentId is not null && ids.Add(parentId))
            {
                parentId = _byId.TryGetValue(parentId, out var parent) ? _parentOf(parent) : null;
            }
        }
        return ids;
    }

    /// <summary>Checks descendants only, never the node itself.</summary>
    public bool HasEnabledDescendant(string id, Func<T, bool> isEnabled)
    {
        var queue = new Queue<string>();
        if (_childrenByParent.TryGetValue(id, out var directChildren))
        {
            foreach (var child in directChildren)
            {
                queue.Enqueue(_idOf(child));
            }
        }
        var visited = new HashSet<string>(StringComparer.Ordinal);
        while (queue.Count > 0)
        {
            var childId = queue.Dequeue();
            if (!visited.Add(childId))
            {
                continue;
            }
            if (_byId.TryGetValue(childId, out var child) && isEnabled(child))
            {
                return true;
            }
            if (_childrenByParent.TryGetValue(childId, out var children))
            {
                foreach (var grandChild in children)
                {
                    queue.Enqueue(_idOf(grandChild));
                }
            }
        }
        return false;
    }

    /// <summary>Deepest first, so children are deleted before their parents.</summary>
    public List<T> DeleteOrder(IEnumerable<string> ids)
    {
        var target = new HashSet<string>(ids, StringComparer.Ordinal);
        return Order
            .Where(target.Contains)
            .Select((id, position) => (Node: _byId[id], Position: position, Depth: Depth(id)))
            .OrderByDescending(item => item.Depth)
            .ThenBy(item => item.Position)
            .Select(item => item.Node)
            .ToList();
    }

    public int Depth(string id)
    {
        var depth = 0;
        var visited = new HashSet<string>(StringComparer.Ordinal);
        var current = id;
        while (current is not null && visited.Add(current))
        {
            if (!_byId.TryGetValue(current, out var node))
            {
                break;
            }
            current = _parentOf(node);
            if (current is not null)
            {
                depth++;
            }
        }
        return depth;
    }
}
