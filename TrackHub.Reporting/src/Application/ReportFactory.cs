using TrackHub.Reporting.Domain.Exceptions;
using TrackHub.Reporting.Domain.Interfaces.Factory;

namespace TrackHub.Reporting.Application;

// Scoped, and resolves the report from the CALLER's own request scope, so the report's dependencies
// (GraphQL clients, IUser, feature readers) live as long as the request instead of a disposed scope.
public class ReportFactory(IServiceProvider serviceProvider) : IReportFactory
{
    public IReport GetReport(string reportCode)
        => serviceProvider.GetServices<IReport>()
            .FirstOrDefault(reader => reader.ReportCode.Equals(reportCode))
            ?? throw new ReportNotFoundException(reportCode);
}
