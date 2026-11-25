// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TrackHub.AuthorityServer.Web.Controllers;
using TrackHub.AuthorityServer.Web.Endpoints;

namespace Web.UnitTests;

// A missing registration lets the service start and answer /health, failing only on the first
// request that needs it. The other suites mock these interfaces; this is the only place the real
// container is ever constructed.
[TestFixture]
public sealed class ContainerValidationTests
{
    // A Release build loads the certificate from OpenIddict:Path, which exists on no build agent, so
    // the fixture supplies a throwaway one. It has to arrive as environment variables: Program.cs
    // reads the certificate while registering services, before a WebApplicationFactory
    // configuration callback would apply.
    private const string CertificatePassword = "container-validation";
    private static string _certificatePath = string.Empty;

    [OneTimeSetUp]
    public void CreateSigningCertificate()
    {
        using var key = RSA.Create(2048);
        var request = new CertificateRequest(
            "CN=TrackHub AuthorityServer Container Validation",
            key,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);

        using var certificate = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(1));

        _certificatePath = Path.Combine(Path.GetTempPath(), $"trackhub-authority-{Guid.NewGuid():N}.pfx");
        File.WriteAllBytes(_certificatePath, certificate.Export(X509ContentType.Pkcs12, CertificatePassword));

        Environment.SetEnvironmentVariable("OpenIddict__LoadCertFromFile", "true");
        Environment.SetEnvironmentVariable("OpenIddict__Path", _certificatePath);
        Environment.SetEnvironmentVariable("OpenIddict__Password", CertificatePassword);
    }

    [OneTimeTearDown]
    public void DeleteSigningCertificate()
    {
        Environment.SetEnvironmentVariable("OpenIddict__LoadCertFromFile", null);
        Environment.SetEnvironmentVariable("OpenIddict__Path", null);
        Environment.SetEnvironmentVariable("OpenIddict__Password", null);

        if (_certificatePath.Length > 0)
        {
            File.Delete(_certificatePath);
        }
    }

    // Anchored on a public Web type rather than Program: Program is generated from top-level
    // statements and making it addressable would mean editing production code to satisfy a test.
    private sealed class AuthorityServerFactory : WebApplicationFactory<LoginController>
    {
        protected override IHost CreateHost(IHostBuilder builder)
        {

            // ValidateScopes catches a singleton capturing a scoped service, e.g. an OpenIddict store
            // holding one request's DbContext for the lifetime of the process.
            builder.UseDefaultServiceProvider(options =>
            {
                options.ValidateOnBuild = true;
                options.ValidateScopes = true;
            });

            return base.CreateHost(builder);
        }
    }

    [Test]
    public void RealWebRegistrations_BuildAValidContainer()
    {
        using var factory = new AuthorityServerFactory();

        // Touching Services forces host construction, which is where ValidateOnBuild runs.
        Assert.DoesNotThrow(() => _ = factory.Services);
    }

    // Resolved by the minimal-API endpoints out of the request scope, so an unregistered one fails at
    // /authorize or /token, not at startup.
    [TestCase(typeof(AuthorizationHandler))]
    [TestCase(typeof(TokenHandler))]
    public void CriticalRequestScopedHandlers_AreResolvable(Type contract)
    {
        using var factory = new AuthorityServerFactory();
        using var scope = factory.Services.CreateScope();

        Assert.DoesNotThrow(() => scope.ServiceProvider.GetRequiredService(contract));
    }
}
