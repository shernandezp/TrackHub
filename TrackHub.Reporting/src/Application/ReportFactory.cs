using TrackHub.Reporting.Domain.Exceptions;
using TrackHub.Reporting.Domain.Interfaces.Factory;

namespace TrackHub.Reporting.Application;

// Scoped, and resolves the report from the CALLER's own request scope. The previous singleton
// created a throw-away scope, resolved the report from it and disposed that scope on return, so
// every report ran on dependencies (GraphQL clients, IUser, feature readers) whose owning scope
// was already gone — the same disposed-scope hand-off the Router registries had to be cured of.
public class ReportFactory(IServiceProvider serviceProvider) : IReportFactory
{
    public IReport GetReport(string reportCode)
        => serviceProvider.GetServices<IReport>()
            .FirstOrDefault(reader => reader.ReportCode.Equals(reportCode))
            ?? throw new ReportNotFoundException(reportCode);
}
