namespace Orange.Api.Domain;

/// <summary>
/// Business code rule shared by the group and permission trees.
/// Root length is resource-specific; a child is the parent code plus two digits.
/// Codes are immutable after creation (enforced by services, not here).
/// </summary>
public sealed record CodePolicy(int RootLength, int SegmentLength, string Label)
{
    public static readonly CodePolicy Group = new(2, 2, "组织");
    public static readonly CodePolicy Permission = new(4, 2, "权限");

    public void Validate(string? id, string? parentId)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new BusinessException(Label + "编码不能为空");
        }
        if (!id.All(char.IsAsciiDigit))
        {
            throw new BusinessException(Label + "编码只能包含数字");
        }
        var parent = string.IsNullOrWhiteSpace(parentId) ? null : parentId.Trim();
        if (parent is null)
        {
            if (id.Length != RootLength)
            {
                throw new BusinessException("根" + Label + "编码长度必须为" + RootLength);
            }
            return;
        }
        var expectedLength = parent.Length + SegmentLength;
        if (id.Length != expectedLength)
        {
            throw new BusinessException(Label + "编码长度必须为" + expectedLength);
        }
        if (!id.StartsWith(parent, StringComparison.Ordinal))
        {
            throw new BusinessException(Label + "编码必须以" + parent + "开头");
        }
    }
}
