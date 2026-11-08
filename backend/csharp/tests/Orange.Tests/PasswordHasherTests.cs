using Orange.Api.Security;

namespace Orange.Tests;

public class PasswordHasherTests
{
    // Hashes copied from database/postgres/dml.sql; the seeded demo users must be able to log in.
    private const string SuperHash = "{bcrypt}$2a$10$9BL0hXULJ18bZRJF3Gr51OFbzX7vqsYK0.z7gYWrCuRtvnaMXICP6";
    private const string AdminHash = "{bcrypt}$2a$10$RV45X7iAB6F0BK95xOk0I.wo9gIbwOSYc8hG47yOU2wCtffDhyVYG";
    private const string UserHash = "{bcrypt}$2a$10$mMD/.jaPIuG58osnAub.d.hZO4QOAB7jOXVg5LAULc4O9YbNELxXy";

    private readonly PasswordHasher _hasher = new();

    [Theory]
    [InlineData("super", SuperHash)]
    [InlineData("admin", AdminHash)]
    [InlineData("user", UserHash)]
    public void SeedHashesVerifyWithTheirDemoPasswords(string password, string hash)
        => Assert.True(_hasher.Verify(password, hash));

    [Fact]
    public void WrongPasswordIsRejected()
    {
        Assert.False(_hasher.Verify("wrong", SuperHash));
        Assert.False(_hasher.Verify("super", null));
        Assert.False(_hasher.Verify("super", "not-a-hash"));
    }

    [Fact]
    public void GeneratedHashesAreVerifiableAndPrefixed()
    {
        var hash = _hasher.Hash("TempPass123");
        Assert.StartsWith("{bcrypt}$2", hash);
        Assert.True(_hasher.Verify("TempPass123", hash));
        Assert.False(_hasher.Verify("tempPass123", hash));
        // Rows written before the prefix was unified are still accepted.
        Assert.True(_hasher.Verify("TempPass123", hash["{bcrypt}".Length..]));
    }

    [Fact]
    public void TemporaryPasswordIsTwelveUnambiguousCharacters()
    {
        for (var i = 0; i < 50; i++)
        {
            var password = PasswordHasher.GenerateTemporaryPassword();
            Assert.Equal(12, password.Length);
            Assert.All(password, character =>
                Assert.Contains(character, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"));
        }
    }
}
