using Common.Application.Interfaces;
using Common.Domain.Enums;
using Moq;
using TrackHub.Manager.Application.Accounts.Queries.GetContext;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Domain.Models;

namespace TrackHub.Manager.Application.UnitTests.Accounts;

[TestFixture]
public class GetAccountContextQueryTests
{
    [Test]
    public async Task Handle_CarriesTheAccountTimeZoneBesideStatusBrandingAndFeatures()
    {
        var accountId = Guid.NewGuid();
        var branding = new AccountBrandingVm(accountId, "Fleet", null, "#000000", null, DateTimeOffset.UtcNow);
        var user = new Mock<IUser>();
        user.SetupGet(u => u.AccountId).Returns(accountId);
        var status = new Mock<IAccountOperationalStatusReader>();
        status.Setup(r => r.GetAccountStatusAsync(accountId, CancellationToken.None)).ReturnsAsync(AccountStatus.Trial);
        var brandingReader = new Mock<IAccountBrandingReader>();
        brandingReader.Setup(r => r.GetBrandingAsync(accountId, CancellationToken.None)).ReturnsAsync(branding);
        var features = new Mock<IAccountFeatureReader>();
        features.Setup(r => r.GetAccountFeaturesAsync(accountId, CancellationToken.None)).ReturnsAsync([]);
        var accounts = new Mock<IAccountReader>();
        accounts.Setup(r => r.GetTimeZoneAsync(accountId, CancellationToken.None)).ReturnsAsync("America/Bogota");
        var handler = new GetAccountContextQueryHandler(
            user.Object, Mock.Of<IUserReader>(), status.Object, brandingReader.Object, features.Object, accounts.Object);

        var result = await handler.Handle(new GetAccountContextQuery(), CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(result.Status, Is.EqualTo(AccountStatus.Trial));
            Assert.That(result.Branding, Is.EqualTo(branding));
            Assert.That(result.Features, Is.Empty);
            Assert.That(result.TimeZoneId, Is.EqualTo("America/Bogota"));
        });
    }
}
