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

using Common.Domain.Constants;

namespace DBInitializer;

/// <summary>
/// The core platform's RBAC seed data. Feature modules add their own
/// <see cref="IRbacSeedContribution"/> files rather than growing these lists.
/// </summary>
internal sealed class CoreRbacSeedContribution : IRbacSeedContribution
{
    public IReadOnlyList<string> Resources { get; } =
    [
        Common.Domain.Constants.Resources.Accounts,
        Common.Domain.Constants.Resources.AccountsMaster,
        Common.Domain.Constants.Resources.Administrative,
        Common.Domain.Constants.Resources.AccountFeatures,
        Common.Domain.Constants.Resources.AccountFeaturesMaster,
        Common.Domain.Constants.Resources.Alerts,
        Common.Domain.Constants.Resources.Audit,
        Common.Domain.Constants.Resources.BackgroundJobs,
        Common.Domain.Constants.Resources.Credentials,
        Common.Domain.Constants.Resources.Devices,
        Common.Domain.Constants.Resources.DevicesMaster,
        Common.Domain.Constants.Resources.Documents,
        Common.Domain.Constants.Resources.Staff,
        Common.Domain.Constants.Resources.GeocodingProviders,
        Common.Domain.Constants.Resources.Geofences,
        Common.Domain.Constants.Resources.Geofencing,
        Common.Domain.Constants.Resources.GpsIntegrationDashboard,
        Common.Domain.Constants.Resources.Groups,
        Common.Domain.Constants.Resources.Notifications,
        Common.Domain.Constants.Resources.Operators,
        Common.Domain.Constants.Resources.OperatorHealth,
        Common.Domain.Constants.Resources.OperatorSyncRuns,
        Common.Domain.Constants.Resources.OperatorsMaster,
        Common.Domain.Constants.Resources.Permissions,
        Common.Domain.Constants.Resources.PointsOfInterest,
        Common.Domain.Constants.Resources.Positions,
        Common.Domain.Constants.Resources.PositionHistory,
        Common.Domain.Constants.Resources.Profile,
        Common.Domain.Constants.Resources.PublicLinks,
        Common.Domain.Constants.Resources.Reports,
        Common.Domain.Constants.Resources.ServiceClients,
        Common.Domain.Constants.Resources.SupportGrants,
        Common.Domain.Constants.Resources.SynchronizedDevices,
        Common.Domain.Constants.Resources.TollCatalog,
        Common.Domain.Constants.Resources.Transporters,
        Common.Domain.Constants.Resources.TransporterType,
        Common.Domain.Constants.Resources.Trips,
        Common.Domain.Constants.Resources.TripTracking,
        Common.Domain.Constants.Resources.Users,
    ];

    // Without a Custom ResourceAction row there is no ResourceActionRole to grant, so the Custom
    // operations answer FORBIDDEN for EVERY user including Administrator. TripTracking/Custom is
    // deliberately absent: only service clients call it, through service_client_permissions.
    public IReadOnlyList<string> CustomActionResources { get; } =
    [
        Common.Domain.Constants.Resources.Users,
        Common.Domain.Constants.Resources.Positions,
        Common.Domain.Constants.Resources.Credentials,
        Common.Domain.Constants.Resources.Notifications,
        Common.Domain.Constants.Resources.Trips,
        Common.Domain.Constants.Resources.Operators,
    ];

    // Administrator is absent: it receives grant-all over the whole catalog. TollCatalog stays
    // read-only for every other role because it is platform reference data. TripTracking carries
    // NO role grant: its only operation is a service-identity Custom, so a Read grant would only
    // pre-authorize any TripTracking read added later.
    public IReadOnlyDictionary<string, (string Resource, string[] Actions)[]> RoleGrants { get; } =
        new Dictionary<string, (string Resource, string[] Actions)[]>
        {
            [Roles.Manager] =
            [
                (Common.Domain.Constants.Resources.Accounts, [Actions.Read, Actions.Edit]),
                // Read only: entitlement provisioning is the platform operator's, through the
                // AccountFeaturesMaster surface. Write here would let a tenant Manager enable any paid
                // module for their own account and raise their own API quota through ConfigurationJson.
                (Common.Domain.Constants.Resources.AccountFeatures, [Actions.Read]),
                (Common.Domain.Constants.Resources.Alerts, [Actions.Read, Actions.Edit]),
                (Common.Domain.Constants.Resources.Audit, [Actions.Read]),
                (Common.Domain.Constants.Resources.BackgroundJobs, [Actions.Read]),
                (Common.Domain.Constants.Resources.Credentials, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.Devices, [Actions.Read, Actions.Delete]),
                (Common.Domain.Constants.Resources.Documents, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.Staff, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.Geofences, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.Geofencing, [Actions.Read]),
                (Common.Domain.Constants.Resources.GpsIntegrationDashboard, [Actions.Read]),
                (Common.Domain.Constants.Resources.Groups, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.Notifications, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete, Actions.Custom]),
                // Custom = operate the GPS integration (pingOperator, triggerOperatorSync). The Router
                // reaches the provider with its own service identity, so this grants operation of the
                // integration without granting sight of credential material.
                (Common.Domain.Constants.Resources.Operators, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete, Actions.Custom]),
                (Common.Domain.Constants.Resources.OperatorHealth, [Actions.Read]),
                (Common.Domain.Constants.Resources.OperatorSyncRuns, [Actions.Read]),
                (Common.Domain.Constants.Resources.Permissions, [Actions.Read]),
                (Common.Domain.Constants.Resources.PointsOfInterest, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                // Read only. Positions/Custom gates two commands — bulkTransporterPosition and
                // persistResolvedAddress — and both are service-identity writes from the Router feed.
                // Every user-facing positions operation uses Actions.Read.
                (Common.Domain.Constants.Resources.Positions, [Actions.Read]),
                (Common.Domain.Constants.Resources.PositionHistory, [Actions.Read]),
                (Common.Domain.Constants.Resources.Profile, [Actions.Read, Actions.Edit]),
                (Common.Domain.Constants.Resources.PublicLinks, [Actions.Read, Actions.Write, Actions.Delete]),
                (Common.Domain.Constants.Resources.Reports, [Actions.Read]),
                (Common.Domain.Constants.Resources.SynchronizedDevices, [Actions.Read, Actions.Write, Actions.Edit, Actions.Execute]),
                (Common.Domain.Constants.Resources.TollCatalog, [Actions.Read]),
                (Common.Domain.Constants.Resources.Transporters, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.TransporterType, [Actions.Read]),
                // Custom is planTripRoute / shareTrip / revokeTripShare. Role inheritance does not
                // fill the gap: ResourceActionRoleReader matches role names exactly, no ParentRoleId walk.
                (Common.Domain.Constants.Resources.Trips, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete, Actions.Export, Actions.Custom]),
                (Common.Domain.Constants.Resources.Users, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete, Actions.Custom]),
            ],
            [Roles.User] =
            [
                (Common.Domain.Constants.Resources.Accounts, [Actions.Read]),
                (Common.Domain.Constants.Resources.Alerts, [Actions.Read]),
                (Common.Domain.Constants.Resources.Devices, [Actions.Read]),
                (Common.Domain.Constants.Resources.Documents, [Actions.Read]),
                (Common.Domain.Constants.Resources.Geofences, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                (Common.Domain.Constants.Resources.Geofencing, [Actions.Read]),
                (Common.Domain.Constants.Resources.Groups, [Actions.Read]),
                (Common.Domain.Constants.Resources.Notifications, [Actions.Read, Actions.Write, Actions.Edit, Actions.Delete]),
                // Custom = ping / manual sync. See the Manager entry.
                (Common.Domain.Constants.Resources.Operators, [Actions.Read, Actions.Custom]),
                (Common.Domain.Constants.Resources.PointsOfInterest, [Actions.Read]),
                // Read only — see the note on the Manager entry above.
                (Common.Domain.Constants.Resources.Positions, [Actions.Read]),
                (Common.Domain.Constants.Resources.PositionHistory, [Actions.Read]),
                (Common.Domain.Constants.Resources.Profile, [Actions.Read, Actions.Edit]),
                (Common.Domain.Constants.Resources.Reports, [Actions.Read]),
                (Common.Domain.Constants.Resources.TollCatalog, [Actions.Read]),
                (Common.Domain.Constants.Resources.Transporters, [Actions.Read]),
                (Common.Domain.Constants.Resources.TransporterType, [Actions.Read]),
                // Custom = plan route / share / revoke; Export = the trip-* report feeds. The
                // dispatcher is the primary actor for both.
                (Common.Domain.Constants.Resources.Trips, [Actions.Read, Actions.Write, Actions.Edit, Actions.Export, Actions.Custom]),
                // Custom on Users gates exactly one command: UpdatePasswordCommand, whose handler
                // requires the subject to be the caller (or a verified manager of the subject). This
                // is the self-service password change; it grants no user administration.
                (Common.Domain.Constants.Resources.Users, [Actions.Custom]),
            ],
        };

    public IReadOnlyList<string> ServiceClientNames { get; } =
        ["router_client", "syncworker_client", "security_client", "geofence_client", "trip_client", "reporting_client"];

    public IReadOnlyList<(string[] Clients, (string Resource, string Action)[] Grants)> ServiceClientGrants { get; } =
    [
        (["router_client", "syncworker_client"],
        [
            (Common.Domain.Constants.Resources.Positions, Actions.Custom),
            (Common.Domain.Constants.Resources.PositionHistory, Actions.Write),
            (Common.Domain.Constants.Resources.PositionHistory, Actions.Read),
            (Common.Domain.Constants.Resources.OperatorHealth, Actions.Write),
            (Common.Domain.Constants.Resources.OperatorSyncRuns, Actions.Write),
        ]),
        (["router_client", "syncworker_client"],
        [
            (Common.Domain.Constants.Resources.Accounts, Actions.Read),
            (Common.Domain.Constants.Resources.AccountsMaster, Actions.Read),
            (Common.Domain.Constants.Resources.AccountFeatures, Actions.Read),
            (Common.Domain.Constants.Resources.AccountFeaturesMaster, Actions.Read),
            (Common.Domain.Constants.Resources.Operators, Actions.Read),
            (Common.Domain.Constants.Resources.OperatorsMaster, Actions.Read),
            (Common.Domain.Constants.Resources.SynchronizedDevices, Actions.Read),
            (Common.Domain.Constants.Resources.SynchronizedDevices, Actions.Write),
            (Common.Domain.Constants.Resources.Devices, Actions.Delete),
            (Common.Domain.Constants.Resources.TransporterType, Actions.Read),
            (Common.Domain.Constants.Resources.Credentials, Actions.Write),
            (Common.Domain.Constants.Resources.Alerts, Actions.Write),
            (Common.Domain.Constants.Resources.GeocodingProviders, Actions.Read),
        ]),
        (["security_client"],
        [
            (Common.Domain.Constants.Resources.Audit, Actions.Write),
            (Common.Domain.Constants.Resources.AccountFeatures, Actions.Read),
            (Common.Domain.Constants.Resources.Accounts, Actions.Read),
            (Common.Domain.Constants.Resources.Staff, Actions.Read),
        ]),
        (["geofence_client"],
        [
            (Common.Domain.Constants.Resources.Alerts, Actions.Write),
            (Common.Domain.Constants.Resources.BackgroundJobs, Actions.Write),
        ]),
        (["router_client", "syncworker_client"],
        [
            (Common.Domain.Constants.Resources.Geofencing, Actions.Custom),
        ]),
        (["trip_client"],
        [
            (Common.Domain.Constants.Resources.Alerts, Actions.Write),
            (Common.Domain.Constants.Resources.BackgroundJobs, Actions.Write),
            (Common.Domain.Constants.Resources.Staff, Actions.Read),
            (Common.Domain.Constants.Resources.Transporters, Actions.Read),
            (Common.Domain.Constants.Resources.Groups, Actions.Read),
            (Common.Domain.Constants.Resources.Documents, Actions.Read),
            (Common.Domain.Constants.Resources.PublicLinks, Actions.Write),
            (Common.Domain.Constants.Resources.PublicLinks, Actions.Delete),
            (Common.Domain.Constants.Resources.PublicLinks, Actions.Read),
            (Common.Domain.Constants.Resources.PositionHistory, Actions.Read),
            (Common.Domain.Constants.Resources.AccountFeatures, Actions.Read),
        ]),
        (["router_client", "syncworker_client"],
        [
            (Common.Domain.Constants.Resources.TripTracking, Actions.Custom),
        ]),
        // The reporting_client reads the account's time zone and operational status from Manager;
        // every other Reporting feed travels on the requesting user's token.
        (["reporting_client"],
        [
            (Common.Domain.Constants.Resources.AccountFeatures, Actions.Read),
            (Common.Domain.Constants.Resources.Accounts, Actions.Read),
        ]),
    ];
}
