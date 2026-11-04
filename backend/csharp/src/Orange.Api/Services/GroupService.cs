using Microsoft.EntityFrameworkCore;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Services;

public sealed class GroupService
{
    private readonly OrangeDbContext _db;
    private readonly SqlDialect _dialect;

    public GroupService(OrangeDbContext db, SqlDialect dialect)
    {
        _db = db;
        _dialect = dialect;
    }

    public async Task<List<GroupBean>> QueryAsync(QueryGroupRequest request, CancellationToken cancellationToken)
    {
        var query = _db.Groups.AsNoTracking();
        if (!string.IsNullOrEmpty(request.Id))
        {
            var pattern = QueryUtils.LikePrefix(request.Id);
            query = query.Where(SearchPredicate.Like<Group>(group => group.Id, pattern, _dialect));
        }
        if (!string.IsNullOrEmpty(request.Name))
        {
            var pattern = QueryUtils.LikePrefix(request.Name);
            query = query.Where(group => group.Name != null)
                .Where(SearchPredicate.Like<Group>(group => group.Name, pattern, _dialect));
        }
        if (!string.IsNullOrEmpty(request.Status) && request.Status != EffectivePermissions.StatusAll)
        {
            query = query.Where(group => group.Status == request.Status);
        }

        var matched = await query.OrderBy(group => group.Id).ToListAsync(cancellationToken);
        var textFilter = !string.IsNullOrWhiteSpace(request.Id) || !string.IsNullOrWhiteSpace(request.Name);
        if (!textFilter)
        {
            return matched.Select(ToBean).ToList();
        }

        // Text filters also return ancestors so the client can keep the tree shape.
        var all = await _db.Groups.AsNoTracking().OrderBy(group => group.Id).ToListAsync(cancellationToken);
        var index = TreeIndex<Group>.Of(all, group => group.Id, group => group.ParentId);
        var ids = index.WithAncestorIds(matched);
        return all.Where(group => ids.Contains(group.Id)).OrderBy(group => group.Id).Select(ToBean).ToList();
    }

    public async Task<GroupBean> GetAsync(string id, CancellationToken cancellationToken)
    {
        var group = await _db.Groups.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("组织不存在");
        return ToBean(group);
    }

    public async Task<GroupBean> AddChildAsync(AddChildGroupRequest request, CancellationToken cancellationToken)
    {
        var id = request.Id;
        var parentId = QueryUtils.TrimToNull(request.ParentId);
        CodePolicy.Group.Validate(id, parentId);
        if (await _db.Groups.AnyAsync(group => group.Id == id, cancellationToken))
        {
            throw new BusinessException("组织编码已存在");
        }
        if (parentId is not null && !await _db.Groups.AnyAsync(group => group.Id == parentId, cancellationToken))
        {
            throw new BusinessException("父组织不存在");
        }

        var group = new Group
        {
            Id = id,
            Name = request.Name,
            ParentId = parentId,
            Status = EffectivePermissions.StatusEnabled
        };
        _db.Groups.Add(group);
        await _db.SaveChangesAsync(cancellationToken);
        return ToBean(group);
    }

    public async Task EditAsync(string id, string? name, string? status, CancellationToken cancellationToken)
    {
        var group = await _db.Groups.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("组织不存在");

        if (name is not null)
        {
            group.Name = name;
        }
        if (status is not null)
        {
            var disabling = group.Status != EffectivePermissions.StatusDisabled
                && status == EffectivePermissions.StatusDisabled;
            if (disabling)
            {
                await AssertNoEnabledDescendantsAsync(group.Id, cancellationToken);
            }
            group.Status = status;
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(IReadOnlyCollection<string> ids, CancellationToken cancellationToken)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var all = await _db.Groups.ToListAsync(cancellationToken);
        var index = TreeIndex<Group>.Of(all, group => group.Id, group => group.ParentId);
        var requested = ids.Distinct(StringComparer.Ordinal).ToList();
        var selected = requested.Where(id => index.Get(id) is not null).ToList();
        if (selected.Count != requested.Count)
        {
            throw new BusinessException("组织不存在");
        }

        var subtree = index.SubtreeIds(requested);
        var hasUsers = await _db.Users.AsNoTracking()
            .AnyAsync(user => user.GroupId != null && subtree.Contains(user.GroupId), cancellationToken);
        if (hasUsers)
        {
            throw new BusinessException("组织或其子组织下有用户，不能删除");
        }

        foreach (var group in index.DeleteOrder(subtree))
        {
            _db.Groups.Remove(group);
            await _db.SaveChangesAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task AssertNoEnabledDescendantsAsync(string id, CancellationToken cancellationToken)
    {
        var all = await _db.Groups.AsNoTracking().ToListAsync(cancellationToken);
        var index = TreeIndex<Group>.Of(all, group => group.Id, group => group.ParentId);
        if (index.HasEnabledDescendant(id, group => group.Status == EffectivePermissions.StatusEnabled))
        {
            throw new BusinessException("请先禁用子组织", ErrorCodes.Conflict);
        }
    }

    private static GroupBean ToBean(Group group) => new()
    {
        Id = group.Id,
        Name = group.Name,
        Status = group.Status,
        ParentId = group.ParentId,
        CreateTime = group.CreateTime,
        UpdateTime = group.UpdateTime
    };
}
