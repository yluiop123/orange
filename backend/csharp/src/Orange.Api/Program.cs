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
using Orange.Api.Swagger;

DotEnv.Load(".env.local");
var options = AppOptions.FromEnvironment();

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://0.0.0.0:{options.Port}");
builder.Services.AddSingleton(options);

builder.Services.AddDbContext<OrangeDbContext>(dbOptions =>
    DatabaseSetup.Configure(dbOptions, options));
builder.Services.AddSingleton(new SqlDialect(options.Driver));

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

// Read the shared contract once; the endpoints reuse these bytes for every request.
var openApiJson = SwaggerSupport.LoadContract(app.Logger);

app.Logger.LogInformation(
    "Orange API on port {Port} using database driver {Driver} ({Source})",
    options.Port,
    DatabaseDrivers.ToName(options.Driver),
    options.DatabaseSource);

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

// Documentation endpoints are anonymous despite the global authentication middleware.
app.MapGet("/openapi.json", () =>
{
    if (openApiJson is null)
    {
        app.Logger.LogError(
            "GET /openapi.json: contracts/openapi.json was not found at startup; returning 500");
        return Results.StatusCode(StatusCodes.Status500InternalServerError);
    }
    return Results.Text(openApiJson, "application/json");
}).AllowAnonymous();

app.MapGet("/swagger", () =>
        Results.Content(SwaggerSupport.UiHtml, "text/html; charset=utf-8"))
    .AllowAnonymous();

app.Run();
