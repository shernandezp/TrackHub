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

using System.Globalization;
using System.Text;
using System.Text.Json;
using Common.Application.Interfaces;
using GraphQL;
using GraphQL.Client.Abstractions;
using Moq;
using TrackHub.Reporting.Domain.Exceptions;
using TrackHub.Reporting.Domain.Interfaces;
using TrackHub.Reporting.Infrastructure.GraphQLApi;

namespace TrackHub.Reporting.Infrastructure.UnitTests;

[TestFixture]
public class WorkforceReportReaderPagingTests
{
    private const int PageSize = 500;

    private readonly Guid _accountId = Guid.NewGuid();
    private Mock<IGraphQLClient> _client = null!;
    private WorkforceReportReader _reader = null!;
    private List<(int Skip, int Take)> _requests = null!;

    [SetUp]
    public void SetUp()
    {
        _requests = [];
        _client = new Mock<IGraphQLClient>();

        var factory = new Mock<IGraphQLClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(_client.Object);

        var user = new Mock<IUser>();
        user.SetupGet(u => u.AccountId).Returns(_accountId);

        var features = new Mock<IAccountFeatureReader>();
        features
            .Setup(f => f.EnsureFeatureEnabledAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _reader = new WorkforceReportReader(factory.Object, user.Object, features.Object);
    }

    // Serves the driver list as Manager pages it: each request gets the rows of its window of `total`.
    private void RespondWithDrivers(int total, int maxRequests = 250)
        => Respond(maxRequests, (skip, take) => Page("driversByAccount", DriverRows(Math.Clamp(total - skip, 0, take)), total));

    private void Respond(int maxRequests, Func<int, int, string> page)
        => _client
            .Setup(c => c.SendQueryAsync<object>(It.IsAny<GraphQLRequest>(), It.IsAny<CancellationToken>()))
            .Returns((GraphQLRequest request, CancellationToken _) =>
            {
                var (skip, take) = ReadWindow(request);
                _requests.Add((skip, take));
                Assert.That(_requests, Has.Count.LessThanOrEqualTo(maxRequests), "the drain is not terminating.");
                return Task.FromResult(new GraphQLResponse<object> { Data = JsonDocument.Parse(page(skip, take)).RootElement.Clone() });
            });

    private static (int Skip, int Take) ReadWindow(GraphQLRequest request)
    {
        var variables = request.Variables!;
        var type = variables.GetType();
        return ((int)type.GetProperty("skip")!.GetValue(variables)!,
                (int)type.GetProperty("take")!.GetValue(variables)!);
    }

    private static string Page(string field, string rows, int totalCount)
        => $"{{\"{field}\":{{\"items\":[{rows}],\"totalCount\":{totalCount}}}}}";

    private static string DriverRows(int count)
        => string.Join(',', Enumerable.Range(0, count).Select(i => $$"""
            {"driverId":"{{Guid.NewGuid()}}","name":"Driver {{i}}","phone":null,"documentType":null,
             "documentNumber":null,"active":true,"employeeCode":null,"licenseNumber":null,
             "licenseExpiresAt":null,"defaultTransporterId":null}
            """));

    private static string QualificationRows(int count)
        => string.Join(',', Enumerable.Range(0, count).Select(i => $$"""
            {"driverQualificationId":"{{Guid.NewGuid()}}","driverId":"{{Guid.NewGuid()}}","driverName":"D{{i}}",
             "qualificationType":"License","category":"C2","number":"L-{{i}}","issuedAt":null,"expiresAt":null,
             "issuingAuthority":null,"status":"Valid"}
            """));

    private static string AssignmentRows(int count)
        => string.Join(',', Enumerable.Range(0, count).Select(i => $$"""
            {"driverId":"{{Guid.NewGuid()}}","driverName":"D{{i}}","transporterId":"{{Guid.NewGuid()}}",
             "transporterName":"T{{i}}","startsAt":"2026-07-01T00:00:00+00:00","endsAt":null,
             "assignmentType":"Regular","status":"Active","createdByPrincipal":"user:1"}
            """));

    [Test]
    public async Task SinglePartialPage_StopsAfterOneRequest()
    {
        RespondWithDrivers(37);

        var drivers = await _reader.GetDriversAsync(CancellationToken.None);

        Assert.That(drivers, Has.Count.EqualTo(37));
        Assert.That(_requests, Is.EqualTo(new[] { (0, PageSize) }));
    }

    [Test]
    public async Task ShortFinalPage_AccumulatesEveryPageAndStops()
    {
        RespondWithDrivers((PageSize * 2) + 12);

        var drivers = await _reader.GetDriversAsync(CancellationToken.None);

        Assert.That(drivers, Has.Count.EqualTo((PageSize * 2) + 12));
        Assert.That(_requests, Is.EqualTo(new[] { (0, PageSize), (PageSize, PageSize), (PageSize * 2, PageSize) }));
    }

    // The total, not an empty probe page, proves exhaustion.
    [Test]
    public async Task ExactMultipleOfPageSize_StopsWithoutAProbePage()
    {
        RespondWithDrivers(PageSize * 2);

        var drivers = await _reader.GetDriversAsync(CancellationToken.None);

        Assert.That(drivers, Has.Count.EqualTo(PageSize * 2));
        Assert.That(_requests, Has.Count.EqualTo(2));
    }

    [Test]
    public async Task EmptyFirstPage_ReturnsNothingAndDoesNotPageAgain()
    {
        RespondWithDrivers(0);

        var drivers = await _reader.GetDriversAsync(CancellationToken.None);

        Assert.That(drivers, Is.Empty);
        Assert.That(_requests, Has.Count.EqualTo(1));
    }

    // A set larger than a report may carry raises instead of returning a truncated export.
    [Test]
    public void OverTheRowLimit_RaisesAfterOneOverLimitPage()
    {
        RespondWithDrivers(500_000);

        Assert.ThrowsAsync<ReportLimitExceededException>(() => _reader.GetDriversAsync(CancellationToken.None));
        Assert.That(_requests, Has.Count.EqualTo(201));
    }

    [Test]
    public async Task QualificationsAndAssignments_PageThroughTheSameLoop()
    {
        Respond(2, (skip, _) => Page("driverQualifications", QualificationRows(skip == 0 ? PageSize : 1), PageSize + 1));
        var qualifications = await _reader.GetDriverQualificationsAsync(null, 30, CancellationToken.None);
        Assert.That(qualifications, Has.Count.EqualTo(PageSize + 1));
        Assert.That(_requests, Is.EqualTo(new[] { (0, PageSize), (PageSize, PageSize) }));

        _requests.Clear();
        Respond(1, (_, _) => Page("driverAssignmentHistory", AssignmentRows(3), 3));
        var assignments = await _reader.GetDriverAssignmentHistoryAsync(null, null, null, null, CancellationToken.None);
        Assert.That(assignments, Has.Count.EqualTo(3));
        Assert.That(_requests, Is.EqualTo(new[] { (0, PageSize) }));
    }
}
