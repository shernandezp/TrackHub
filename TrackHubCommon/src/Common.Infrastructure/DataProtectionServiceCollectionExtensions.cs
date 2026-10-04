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

using Ardalis.GuardClauses;
using Common.Infrastructure.DataProtection;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class DataProtectionServiceCollectionExtensions
{
    /// <summary>
    /// Key ring in the TrackHub database (the <c>Logging</c> connection every service has), encrypted at
    /// rest with the OpenIddict certificate, isolated per service by application name.
    /// </summary>
    public static TBuilder AddTrackHubDataProtection<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);
        // A development host without the platform certificate (a fresh clone, the container tests on a
        // Linux runner) keeps the framework default. Everywhere else a missing certificate must fail at start.
        if (builder.Environment.IsDevelopment() && !OpenIddictCertificate.IsPresent(builder.Configuration))
        {
            return builder;
        }

        var connectionString = Guard.Against.NullOrWhiteSpace(
            builder.Configuration.GetConnectionString("Logging"), "ConnectionStrings:Logging");

        builder.Services.AddDataProtection()
            .SetApplicationName(builder.Environment.ApplicationName)
            .ProtectKeysWithCertificate(OpenIddictCertificate.Load(builder.Configuration));
        builder.Services.Configure<KeyManagementOptions>(options =>
            options.XmlRepository = new PostgresXmlRepository(connectionString));

        return builder;
    }
}
