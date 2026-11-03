using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Orange.Api.Configuration;
using Orange.Api.Data;
using Orange.Api.Domain;
using Orange.Api.Middleware;
using Orange.Api.Security;
using Orange.Api.Services;

var options = AppOptions.FromEnvironment();

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{options.Port}");
builder.Services.AddSingleton(options);

builder.Services.AddDbContext<OrangeDbContext>(dbOptions =>
    dbOptions.UseNpgsql(options.ConnectionString));

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ApiResponseFactory>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddScoped<TokenStore>();
builder.Services.AddScoped<UserLoader>();
builder.Services.AddScoped<CurrentUserAccessor>();
builder.Services.AddScoped<GrantGuard>();
builder.Services.AddScoped<ILoginAttemptStore, LoginAttemptStore>();
builder.Services.AddScoped<LoginAttemptService>();
builder.Services.AddScoped<RefreshCookieService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<GroupService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<MenuService>();
builder.Services.AddScoped<OperationLogService>();
builder.Services.AddSingleton<OperationLogWriter>();
builder.Services.AddHostedService<OperationLogRetentionService>();

builder.Services
    .AddControllers(controllerOptions => controllerOptions.Filters.Add<ValidationFilter>())
    .ConfigureApiBehaviorOptions(apiOptions =>
    {
        // Errors are rendered by ValidationFilter and ExceptionHandlingMiddleware,
        // never as ProblemDetails.
        apiOptions.SuppressModelStateInvalidFilter = true;
        apiOptions.SuppressMapClientErrors = true;
    })
    .AddJsonOptions(jsonOptions =>
    {
        jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        jsonOptions.JsonSerializerOptions.DictionaryKeyPolicy = null;
        jsonOptions.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
        jsonOptions.JsonSerializerOptions.Encoder =
            System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        jsonOptions.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(cors => cors.AddPolicy("frontend", policy =>
{
    policy.WithOrigins(options.CorsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithExposedHeaders(TraceContext.Header, TraceContext.LegacyHeader);
}));

var app = builder.Build();

app.UseMiddleware<TraceIdMiddleware>();
app.UseCors("frontend");
app.UseMiddleware<OperationLogMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStatusCodePages(async statusContext =>
{
    var context = statusContext.HttpContext;
    if (context.Response.HasStarted || context.Response.ContentType is not null)
    {
        return;
    }
    switch (context.Response.StatusCode)
    {
        case 404:
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.NotFound, ErrorCodes.NotFoundMessage);
            break;
        case 405:
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.MethodNotAllowed, ErrorCodes.MethodNotAllowedMessage);
            break;
        case 401:
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.Unauthorized, ErrorCodes.UnauthorizedMessage);
            break;
        case 403:
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.Forbidden, ErrorCodes.ForbiddenMessage);
            break;
    }
});

app.UseRouting();
app.UseMiddleware<AuthenticationMiddleware>();
app.MapControllers();

app.Run();
