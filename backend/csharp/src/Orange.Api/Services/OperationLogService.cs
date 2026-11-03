using Microsoft.EntityFrameworkCore;
using Orange.Api.Configuration;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Services;

public sealed class OperationLogService
{
    private readonly OrangeDbContext _db;

    public OperationLogService(OrangeDbContext db)
    {
        _db = db;
    }

    public async Task<PageData<OperationLogBean>> QueryAsync(
        QueryOperationLogRequest request,
        CancellationToken cancellationToken)
    {
        var (page, size, skip) = Pagination.Resolve(request.Page, request.Size);
        var query = _db.OperationLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var pattern = QueryUtils.LikeContains(request.Username);
            query = query.Where(log => log.Username != null && EF.Functions.ILike(log.Username, pattern, "\\"));
        }
        if (!string.IsNullOrWhiteSpace(request.Path))
        {
            var pattern = QueryUtils.LikeContains(request.Path);
            query = query.Where(log => EF.Functions.ILike(log.Path, pattern, "\\"));
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = int.Parse(request.Status);
            query = query.Where(log => log.Status == status);
        }
        if (request.From is not null)
        {
            query = query.Where(log => log.CreateTime >= request.From);
        }
        if (request.To is not null)
        {
            query = query.Where(log => log.CreateTime <= request.To);
        }

        var total = await query.LongCountAsync(cancellationToken);
        var logs = await query
            .OrderByDescending(log => log.Id)
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        var beans = logs.Select(log => new OperationLogBean
        {
            Id = log.Id,
            TraceId = log.TraceId,
            Username = log.Username,
            Method = log.Method,
            Path = log.Path,
            QueryString = log.QueryString,
            RequestBody = log.RequestBody,
            Status = log.Status,
            DurationMs = log.DurationMs,
            Ip = log.Ip,
            CreateTime = log.CreateTime
        }).ToList();

        return PageData<OperationLogBean>.Of(total, beans, page, size);
    }

    public Task<int> CleanupAsync(int retentionDays, CancellationToken cancellationToken)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-Math.Max(1, retentionDays));
        return _db.OperationLogs
            .Where(log => log.CreateTime < cutoff)
            .ExecuteDeleteAsync(cancellationToken);
    }
}

/// <summary>
/// Writes audit rows through an isolated DbContext. Using the request-scoped context here
/// would let SaveChanges flush partially-applied changes left behind by a failed endpoint.
/// </summary>
public sealed class OperationLogWriter
{
    private readonly AppOptions _options;

    public OperationLogWriter(AppOptions options)
    {
        _options = options;
    }

    public async Task RecordAsync(OperationLogEntry entry, CancellationToken cancellationToken)
    {
        var options = new DbContextOptionsBuilder<OrangeDbContext>()
            .UseNpgsql(_options.ConnectionString)
            .Options;
        await using var db = new OrangeDbContext(options);
        db.OperationLogs.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
    }
}

/// <summary>Deletes audit rows older than the retention period, at startup and every six hours.</summary>
public sealed class OperationLogRetentionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AppOptions _options;
    private readonly ILogger<OperationLogRetentionService> _logger;

    public OperationLogRetentionService(
        IServiceScopeFactory scopeFactory,
        AppOptions options,
        ILogger<OperationLogRetentionService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<OperationLogService>();
                var removed = await service.CleanupAsync(_options.OperationLogRetentionDays, stoppingToken);
                if (removed > 0)
                {
                    _logger.LogInformation("Removed {Count} expired operation logs", removed);
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                _logger.LogWarning("Operation log cleanup failed: {Message}", exception.Message);
            }
            try
            {
                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }
}
