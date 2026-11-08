using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Orange.Api.Configuration;
using Orange.Api.Data;
using Orange.Api.Domain;
using Orange.Api.Middleware;
using Orange.Api.Security;
using Orange.Api.Services;

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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(swagger =>
{
    swagger.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ORANGE API (ASP.NET Core)",
        Version = "1.0.0",
        Description = "Generated from the ASP.NET Core controllers and DTOs"
    });
    swagger.AddSecurityDefinition("bearerAuth", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    swagger.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("bearerAuth"), new List<string>() }
    });
});

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

// Documentation is generated from the controllers/DTOs and mounted before the
// authentication middleware, so both endpoints stay anonymous.
app.UseSwagger(swagger => swagger.RouteTemplate = "openapi/{documentName}.json");
app.UseSwaggerUI(swagger =>
{
    swagger.RoutePrefix = "swagger";
    swagger.SwaggerEndpoint("/openapi/v1.json", "Orange API");
    swagger.DocumentTitle = "Orange API";
});

app.UseRouting();
app.UseMiddleware<AuthenticationMiddleware>();
// Keep the cross-stack /openapi.json path while Swashbuckle serves the document
// under its document-name template.
app.MapGet("/openapi.json", () => Results.Redirect("/openapi/v1.json"))
    .AllowAnonymous();
app.MapControllers();

app.Run();
