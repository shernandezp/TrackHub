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

using Microsoft.Extensions.DependencyInjection.Extensions;
using Common.Infrastructure.Time;
using Common.Domain.Time;
using Common.Infrastructure.Interceptors;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Common.Application.Interfaces;
using Common.Infrastructure;
using Common.Infrastructure.DataProtection;
using Ardalis.GuardClauses;
using Common.Domain.Constants;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration, bool isGraphQLClient = true)
    {
        services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
        services.AddSingleton<IExpectedOutcomeClassifier, DatabaseRefusalClassifier>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Absent keys default to VALIDATING. GetValue<bool> returns false for a missing
                // key, so one dropped environment variable silently turned a service into one that
                // accepts any token from any issuer with any signature, with no startup error.
                var validateSigningKey = configuration.GetValue<bool?>("AuthorityServer:ValidateIssuerSigningKey") ?? true;
                options.Authority = Guard.Against.NullOrWhiteSpace(
                    configuration.GetValue<string>("AuthorityServer:Authority"),
                    "AuthorityServer:Authority");
                options.TokenValidationParameters.ValidateAudience = configuration.GetValue<bool?>("AuthorityServer:ValidateAudience") ?? true;
                options.TokenValidationParameters.ValidateIssuer = configuration.GetValue<bool?>("AuthorityServer:ValidateIssuer") ?? true;
                options.TokenValidationParameters.ValidateIssuerSigningKey = validateSigningKey;
                options.TokenValidationParameters.ValidIssuer = configuration.GetValue<string>("AuthorityServer:Authority");
                var validAudience = configuration.GetValue<string>("AuthorityServer:ValidAudience");
                if (!string.IsNullOrEmpty(validAudience))
                {
                    options.TokenValidationParameters.ValidAudiences = [validAudience];
                }
                if (validateSigningKey)
                {
                    var certificate = OpenIddictCertificate.Load(configuration);
                    var signingKey = new X509SecurityKey(certificate);
                    options.TokenValidationParameters.IssuerSigningKey = signingKey;
                }
            });

        services.AddSingleton(TimeProvider.System);


        if (isGraphQLClient)
        {
            // Identity client runs queries only — full resilience (incl. retry) is safe.
            services.AddGraphQLClient(Clients.Identity, resilience: GraphQLClientResilience.WithRetry);
            services.AddMemoryCache();
            // The calendar of the account a request serves, read from Manager and cached (Manager
            // itself overrides this with a database-backed resolver).
            services.AddScoped<IAccountTimeZoneResolver, ManagerAccountTimeZoneResolver>();
            services.AddSingleton<AccountTimeZoneResolverHealth>();
            services.AddHealthChecks().AddCheck<AccountTimeZoneResolverHealthCheck>("account-time-zone");
            services.AddClientCredentialsTokenProvider();
            services.AddSingleton<IGraphQLClientFactory, GraphQLClientFactory>();
            services.AddScoped<IIdentityService, IdentityService>();
        }

        return services;
    }
}
