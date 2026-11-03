using System.Text.Json.Serialization;

namespace Orange.Api.Domain;

/// <summary>
/// A business rule violation. The transport code is derived from the message the same way
/// the Java reference derives it, so callers see identical codes for the same failures.
/// </summary>
public class BusinessException : Exception
{
    public BusinessException(string message) : base(message)
    {
    }

    [JsonIgnore]
    public int Code => ResolveCode(Message);

    [JsonIgnore]
    public int HttpStatus => ErrorCodes.HttpStatusFor(Code);

    public static int ResolveCode(string message)
    {
        if (message.Contains("不存在", StringComparison.Ordinal))
        {
            return ErrorCodes.NotFound;
        }
        if (message.Contains("已存在", StringComparison.Ordinal)
            || message.Contains("已被", StringComparison.Ordinal)
            || message.Contains("不能删除", StringComparison.Ordinal))
        {
            return ErrorCodes.Conflict;
        }
        return ErrorCodes.ValidationError;
    }
}

public sealed class ValidationFailedException : Exception
{
    public ValidationFailedException(IDictionary<string, string> errors)
        : base(ErrorCodes.ValidationErrorMessage)
    {
        Errors = errors;
    }

    public IDictionary<string, string> Errors { get; }
}

public sealed class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message)
    {
    }
}

public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}

public sealed class RateLimitedException : Exception
{
    public RateLimitedException(string message) : base(message)
    {
    }
}
