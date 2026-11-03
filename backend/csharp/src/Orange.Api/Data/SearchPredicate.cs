using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Orange.Api.Data;

/// <summary>
/// Builds the case-insensitive prefix/contains predicates used by the list
/// endpoints. PostgreSQL keeps <c>ILIKE</c> so its behavior is unchanged; the
/// other engines compare <c>lower(column)</c> with the already-lowercased
/// pattern, which is what the reference does.
/// </summary>
public static class SearchPredicate
{
    private static readonly MethodInfo ILikeMethod = typeof(NpgsqlDbFunctionsExtensions)
        .GetMethod(
            nameof(NpgsqlDbFunctionsExtensions.ILike),
            new[] { typeof(DbFunctions), typeof(string), typeof(string), typeof(string) })!;

    private static readonly MethodInfo LikeWithEscapeMethod = typeof(DbFunctionsExtensions)
        .GetMethod(
            nameof(DbFunctionsExtensions.Like),
            new[] { typeof(DbFunctions), typeof(string), typeof(string), typeof(string) })!;

    private static readonly MethodInfo LikeMethod = typeof(DbFunctionsExtensions)
        .GetMethod(
            nameof(DbFunctionsExtensions.Like),
            new[] { typeof(DbFunctions), typeof(string), typeof(string) })!;

    private static readonly MethodInfo ToLowerMethod =
        typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;

    /// <summary>
    /// A predicate equivalent to <c>column ILIKE pattern ESCAPE '\'</c>.
    /// The pattern is expected to be lowercased by <c>QueryUtils</c>.
    /// </summary>
    public static Expression<Func<T, bool>> Like<T>(
        Expression<Func<T, string?>> selector,
        string pattern,
        SqlDialect dialect)
    {
        var parameter = selector.Parameters[0];
        var column = Unwrap(selector.Body);
        var functions = Expression.Property(null, typeof(EF), nameof(EF.Functions));

        Expression body;
        if (dialect.IsPostgres)
        {
            body = Expression.Call(
                ILikeMethod,
                functions,
                column,
                Expression.Constant(pattern),
                Expression.Constant("\\"));
        }
        else
        {
            var lowered = Expression.Call(column, ToLowerMethod);
            // MySQL's LIKE uses '\' as its default escape; SQLite and EF Core
            // need it spelled out. Both accept the explicit ESCAPE clause.
            body = Expression.Call(
                LikeWithEscapeMethod,
                functions,
                lowered,
                Expression.Constant(pattern),
                Expression.Constant("\\"));
        }

        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }

    /// <summary>Removes the reference-conversion nodes a nullable lambda body can carry.</summary>
    private static Expression Unwrap(Expression expression)
    {
        while (expression is UnaryExpression { NodeType: ExpressionType.Convert or ExpressionType.ConvertChecked } unary
               && unary.Type == typeof(string))
        {
            expression = unary.Operand;
        }
        return expression;
    }
}
