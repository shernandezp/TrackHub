namespace TrackHub.Router.Infrastructure.ManagerApi;

// Service identity: the manual "sync now" runs off the request on SyncDispatchService, where no
// caller headers exist to propagate, and the worker loop never had any.
public class DeviceSyncWriter(IGraphQLClientFactory graphQLClient)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IDeviceSyncWriter
{
    internal const string SynchronizeOperatorDevicesMutation = @"
                mutation($command: SynchronizeOperatorDevicesCommandInput!) {
                    synchronizeOperatorDevices(command: $command) {
                        devicesSeen
                        devicesAdded
                        devicesUpdated
                        devicesRemoved
                        devicesIgnored
                    }
                }";

    public async Task<DeviceSyncCountsVm> SynchronizeAsync(
        Guid accountId,
        Guid operatorId,
        IEnumerable<SynchronizedDeviceDto> devices,
        string correlationId,
        string triggerType,
        bool autoAssignNewDevices,
        bool resetDeviceCatalog,
        CancellationToken cancellationToken)
    {
        var request = new GraphQLRequest
        {
            Query = SynchronizeOperatorDevicesMutation,
            Variables = new
            {
                command = new
                {
                    accountId,
                    operatorId,
                    correlationId,
                    triggerType,
                    autoAssignNewDevices,
                    resetDeviceCatalog,
                    devices = devices.Select(d => new
                    {
                        accountId = d.AccountId,
                        operatorId = d.OperatorId,
                        serial = d.Serial,
                        name = d.Name,
                        identifier = d.Identifier,
                        providerDisplayName = d.ProviderDisplayName,
                        deviceTypeId = d.DeviceTypeId,
                        description = d.Description,
                        providerMetadataHash = d.ProviderMetadataHash,
                        providerStatus = d.ProviderStatus
                    }).ToArray()
                }
            }
        };
        return await MutationAsync<DeviceSyncCountsVm>(request, cancellationToken);
    }
}
