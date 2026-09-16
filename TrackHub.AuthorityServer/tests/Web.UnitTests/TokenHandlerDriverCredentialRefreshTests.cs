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

using System.Security.Claims;
using Moq;
using TrackHub.AuthorityServer.Domain.Interfaces;
using TrackHub.AuthorityServer.Web.Endpoints;

namespace Web.UnitTests;

/// <summary>
/// A driver may hold several credentials. Re-validating a refresh token against "does this DRIVER
/// have any active credential" meant a revoked credential's sessions survived as long as the driver
/// still had another one — so a lost phone kept refreshing after its credential was revoked and
/// replaced. The session is tied to the credential it was issued from.
/// </summary>
[TestFixture]
public class TokenHandlerDriverCredentialRefreshTests
{
    private static readonly Guid DriverId = Guid.NewGuid();
    private static readonly Guid CredentialId = Guid.NewGuid();

    private Mock<IDriverCredentialReader> _credentials = null!;
    private TokenHandler _handler = null!;

    [SetUp]
    public void SetUp()
    {
        _credentials = new Mock<IDriverCredentialReader>();
        _handler = new TokenHandler(
            Mock.Of<IClientReader>(),
            Mock.Of<IUserReader>(),
            _credentials.Object,
            Mock.Of<IServiceClientPermissionReader>());
    }

    private static ClaimsPrincipal DriverPrincipal(Guid? credentialId)
    {
        var claims = new List<Claim>
        {
            new("principal_type", "Driver"),
            new("driver_id", DriverId.ToString()),
        };
        if (credentialId is not null)
        {
            claims.Add(new Claim("driver_credential_id", credentialId.Value.ToString()));
        }

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
    }

    [Test]
    public async Task ARevokedCredentialEndsItsOwnSession_EvenWhenTheDriverHasAnotherActiveOne()
    {
        _credentials.Setup(r => r.IsCredentialActiveAsync(CredentialId, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _credentials.Setup(r => r.HasActiveCredentialAsync(DriverId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var valid = await _handler.IsSubjectStillValidAsync(DriverPrincipal(CredentialId), CancellationToken.None);

        Assert.That(valid, Is.False,
            "the replacement credential must not keep the revoked one's refresh token alive");
    }

    [Test]
    public async Task AnActiveCredentialKeepsRefreshing()
    {
        _credentials.Setup(r => r.IsCredentialActiveAsync(CredentialId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var valid = await _handler.IsSubjectStillValidAsync(DriverPrincipal(CredentialId), CancellationToken.None);

        Assert.That(valid, Is.True);
    }

    [Test]
    public async Task TheDriverLevelCheckIsNotConsulted_WhenTheSessionNamesItsCredential()
    {
        _credentials.Setup(r => r.IsCredentialActiveAsync(CredentialId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        await _handler.IsSubjectStillValidAsync(DriverPrincipal(CredentialId), CancellationToken.None);

        _credentials.Verify(r => r.HasActiveCredentialAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // Refresh tokens issued before the claim existed still carry only the driver; they must keep
    // working until they age out rather than logging every driver in the field out on deploy.
    [Test]
    public async Task APreUpgradeSessionFallsBackToTheDriverLevelCheck()
    {
        _credentials.Setup(r => r.HasActiveCredentialAsync(DriverId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var valid = await _handler.IsSubjectStillValidAsync(DriverPrincipal(credentialId: null), CancellationToken.None);

        Assert.That(valid, Is.True);
        _credentials.Verify(r => r.IsCredentialActiveAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
