using System.Reflection;
using System.Text.RegularExpressions;

namespace TrackHub.ServiceContracts.Tests.ContractTests;

// Every coded refusal a service can raise must have a portal translation; an unmapped code reaches
// the user as "unexpected error" or as untranslated server text.
[TestFixture]
public partial class ErrorCodeMappingContractTests
{
    // Rendered from the server's own per-field text by design (REFUSAL_CODES in errors.ts).
    private static readonly HashSet<string> ServerWorded = ["VALIDATION_ERROR", "CONFLICT", "NOT_FOUND"];

    [Test]
    public void Every_backend_error_code_is_mapped_in_the_portal()
    {
        var mapped = PortalMappedCodes();
        var missing = BackendCodes()
            .Where(c => !ServerWorded.Contains(c.Value) && !mapped.Contains(c.Value))
            .Select(c => $"{c.Value} ({c.Source})")
            .Order()
            .ToList();

        Assert.That(missing, Is.Empty, $"Backend error codes with no ERROR_CODE_I18N entry: {string.Join(", ", missing)}");
    }

    private static IEnumerable<(string Value, string Source)> BackendCodes()
    {
        foreach (var assembly in ServiceAssemblies())
        {
            foreach (var type in LoadableTypes(assembly))
            {
                var isCodeCatalog = type.Name.EndsWith("ErrorCodes", StringComparison.Ordinal);
                foreach (var field in type.GetFields(BindingFlags.Public | BindingFlags.Static))
                {
                    if (!field.IsLiteral || field.GetRawConstantValue() is not string value || !CodeShape().IsMatch(value))
                    {
                        continue;
                    }

                    if (isCodeCatalog || (field.Name.EndsWith("Code", StringComparison.Ordinal) && value.Contains('_')))
                    {
                        yield return (value, $"{type.FullName}.{field.Name}");
                    }
                }
            }
        }
    }

    private static IEnumerable<Assembly> ServiceAssemblies()
        => Directory.EnumerateFiles(AppContext.BaseDirectory, "*.dll")
            .Where(p => Path.GetFileName(p) is var n && (n.StartsWith("TrackHub.", StringComparison.Ordinal) || n.StartsWith("Common.", StringComparison.Ordinal)))
            .Where(p => !Path.GetFileName(p).Contains("Tests", StringComparison.Ordinal))
            .Select(Assembly.LoadFrom);

    private static IEnumerable<Type> LoadableTypes(Assembly assembly)
    {
        try
        {
            return assembly.GetTypes();
        }
        catch (ReflectionTypeLoadException ex)
        {
            return ex.Types.OfType<Type>();
        }
    }

    private static HashSet<string> PortalMappedCodes()
    {
        var errorsTs = Path.Combine(FindRepositoryRoot(), "TrackHub.Portal", "src", "api", "core", "errors.ts");
        var source = File.ReadAllText(errorsTs);
        return MappedEntry().Matches(source).Select(m => m.Groups[1].Value).ToHashSet(StringComparer.Ordinal);
    }

    private static string FindRepositoryRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "TrackHub.slnx")))
        {
            dir = dir.Parent;
        }

        return dir?.FullName ?? throw new InvalidOperationException("Repository root not found (no ancestor containing TrackHub.slnx).");
    }

    [GeneratedRegex("^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$")]
    private static partial Regex CodeShape();

    [GeneratedRegex(@"^\s*([A-Z][A-Z0-9_]+):\s*'errors\.", RegexOptions.Multiline)]
    private static partial Regex MappedEntry();
}
