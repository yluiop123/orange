namespace Orange.Api.Swagger;

/// <summary>
/// Serves the repository-wide OpenAPI contract and a CDN-backed Swagger UI page.
/// The contract is read once at startup and the same bytes are returned for every request.
/// </summary>
public static class SwaggerSupport
{
    public const string UiHtml = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Orange API</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            SwaggerUIBundle({
              url: '/openapi.json',
              dom_id: '#swagger-ui',
              persistAuthorization: true,
              docExpansion: 'none'
            });
          </script>
        </body>
        </html>
        """;

    /// <summary>Reads contracts/openapi.json once; returns null (and logs) when it cannot be found.</summary>
    public static string? LoadContract(ILogger logger)
    {
        var path = FindContract();
        if (path is null)
        {
            logger.LogError(
                "contracts/openapi.json was not found within 5 directories above {WorkingDirectory}",
                Directory.GetCurrentDirectory());
            return null;
        }

        try
        {
            var json = File.ReadAllText(path);
            logger.LogInformation("Loaded OpenAPI contract from {Path}", path);
            return json;
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            logger.LogError(exception, "Failed to read OpenAPI contract from {Path}", path);
            return null;
        }
    }

    private static string? FindContract()
    {
        DirectoryInfo? directory = new(Directory.GetCurrentDirectory());
        for (var depth = 0; depth <= 5 && directory is not null; depth++)
        {
            var candidate = Path.Combine(directory.FullName, "contracts", "openapi.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }
            directory = directory.Parent;
        }
        return null;
    }
}
