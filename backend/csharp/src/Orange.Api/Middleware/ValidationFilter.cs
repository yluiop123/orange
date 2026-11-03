using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Orange.Api.Domain;
using Orange.Api.Security;

namespace Orange.Api.Middleware;

/// <summary>
/// Converts model-state failures into the same envelope shape as the Java backend:
/// 40002 with a field-to-message map, or 40001 when a value could not be converted at all.
/// </summary>
public sealed class ValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.ModelState.IsValid)
        {
            return;
        }

        var conversionFailed = context.ModelState.Values
            .SelectMany(entry => entry.Errors)
            .Any(error => error.Exception is not null && string.IsNullOrEmpty(error.ErrorMessage));

        var errors = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var (key, entry) in context.ModelState)
        {
            var message = entry.Errors
                .Select(error => error.ErrorMessage)
                .FirstOrDefault(text => !string.IsNullOrWhiteSpace(text));
            if (string.IsNullOrWhiteSpace(message))
            {
                message = ErrorCodes.ParamErrorMessage;
            }
            var field = NormalizeFieldName(key);
            errors.TryAdd(field, message);
        }

        var code = conversionFailed ? ErrorCodes.ParamError : ErrorCodes.ValidationError;
        var messageText = conversionFailed ? ErrorCodes.ParamErrorMessage : ErrorCodes.ValidationErrorMessage;
        var data = conversionFailed ? null : errors.ToDictionary(item => item.Key, item => (object?)item.Value);

        context.Result = new ObjectResult(new Contracts.ApiResponse<object?>
        {
            Code = code,
            Message = messageText,
            Data = data,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            TraceId = TraceContext.Get(context.HttpContext)
        })
        {
            StatusCode = ErrorCodes.HttpStatusFor(code)
        };
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }

    private static string NormalizeFieldName(string key)
    {
        var name = key.StartsWith("$.", StringComparison.Ordinal) ? key[2..] : key;
        var dot = name.LastIndexOf('.');
        if (dot >= 0)
        {
            name = name[(dot + 1)..];
        }
        if (name.Length == 0)
        {
            return "request";
        }
        return char.ToLowerInvariant(name[0]) + name[1..];
    }
}
