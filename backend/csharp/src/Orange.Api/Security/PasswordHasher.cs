namespace Orange.Api.Security;

/// <summary>
/// BCrypt hashing compatible with the PostgreSQL seed. Seed hashes may carry the
/// Spring Security "{bcrypt}" prefix, which BCrypt.Net does not understand.
/// </summary>
public sealed class PasswordHasher
{
    private const string BcryptPrefix = "{bcrypt}";

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, 10);

    public bool Verify(string? password, string? storedHash)
    {
        if (password is null || string.IsNullOrWhiteSpace(storedHash))
        {
            return false;
        }
        var hash = storedHash.StartsWith(BcryptPrefix, StringComparison.Ordinal)
            ? storedHash[BcryptPrefix.Length..]
            : storedHash;
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }

    /// <summary>12 characters, excluding visually ambiguous ones.</summary>
    public static string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        var password = new char[12];
        for (var i = 0; i < password.Length; i++)
        {
            password[i] = chars[System.Security.Cryptography.RandomNumberGenerator.GetInt32(chars.Length)];
        }
        return new string(password);
    }
}
