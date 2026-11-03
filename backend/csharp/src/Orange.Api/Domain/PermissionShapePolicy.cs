namespace Orange.Api.Domain;

/// <summary>
/// type/action combination rule. Action permissions require an action;
/// menu and directory permissions must not have one.
/// </summary>
public static class PermissionShapePolicy
{
    public static void Validate(string? type, string? action)
    {
        if (type is not ("action" or "menu" or "directory"))
        {
            throw new BusinessException("未知的权限类型");
        }
        if (type == "action")
        {
            if (string.IsNullOrWhiteSpace(action))
            {
                throw new BusinessException("action 类型的权限必须填写 action");
            }
            return;
        }
        if (type is "menu" or "directory")
        {
            if (!string.IsNullOrWhiteSpace(action))
            {
                throw new BusinessException("menu/directory 类型的权限不能填写 action");
            }
        }
    }
}
