using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Orange.Api.Domain;
using Orange.Api.Security;

namespace Orange.Api.Middleware;

/// <summary>Maps every exception to the canonical envelope and the documented business code.</summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client went away; nothing useful to write.
        }
        catch (BusinessException exception)
        {
            var message = string.IsNullOrWhiteSpace(exception.Message)
                ? ErrorCodes.ValidationErrorMessage
                : exception.Message;
            _logger.LogWarning("Business exception [{Code}]: {Message}", exception.Code, message);
            await ApiResponseWriter.WriteAsync(context, exception.Code, message);
        }
        catch (ValidationFailedException exception)
        {
            _logger.LogWarning("Validation failed: {@Errors}", exception.Errors);
            await ApiResponseWriter.WriteAsync(
                context,
                ErrorCodes.ValidationError,
                ErrorCodes.ValidationErrorMessage,
                exception.Errors.ToDictionary(item => item.Key, item => (object?)item.Value));
        }
        catch (BadRequestException exception)
        {
            _logger.LogWarning("Bad request: {Message}", exception.Message);
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.ParamError, exception.Message);
        }
        catch (UnauthorizedException exception)
        {
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.Unauthorized, exception.Message);
        }
        catch (RateLimitedException exception)
        {
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.TooManyRequests, exception.Message);
        }
        catch (BadHttpRequestException exception)
        {
            _logger.LogWarning("Malformed request: {Message}", exception.Message);
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.ParamError, ErrorCodes.ParamErrorMessage);
        }
        catch (JsonException exception)
        {
            _logger.LogWarning("Malformed JSON: {Message}", exception.Message);
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.ParamError, ErrorCodes.ParamErrorMessage);
        }
        catch (DbUpdateConcurrencyException exception)
        {
            _logger.LogWarning(exception, "Optimistic lock conflict");
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.Conflict, "数据冲突，请刷新后重试");
        }
        catch (DbUpdateException exception)
        {
            _logger.LogWarning(exception, "Data integrity conflict");
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.Conflict, "数据冲突，请刷新后重试");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception");
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.SystemError, ErrorCodes.SystemErrorMessage);
        }
    }
}
