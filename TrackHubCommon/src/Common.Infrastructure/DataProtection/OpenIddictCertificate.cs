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

using System.Security.Cryptography.X509Certificates;
using Ardalis.GuardClauses;
using Microsoft.Extensions.Configuration;

namespace Common.Infrastructure.DataProtection;

/// <summary>The platform certificate every service holds: signs tokens and encrypts the Data Protection key ring.</summary>
public static class OpenIddictCertificate
{
    public static bool IsPresent(IConfiguration configuration)
        => configuration.GetValue<bool>("OpenIddict:LoadCertFromFile")
            ? File.Exists(configuration.GetValue<string>("OpenIddict:Path"))
            : !string.IsNullOrEmpty(configuration.GetValue<string>("OpenIddict:Thumbprint"));

    public static X509Certificate2 Load(IConfiguration configuration)
    {
        X509Certificate2? certificate;
        if (configuration.GetValue<bool>("OpenIddict:LoadCertFromFile"))
        {
            var bytes = File.ReadAllBytes(configuration.GetValue<string>("OpenIddict:Path") ?? "");
            certificate = X509CertificateLoader.LoadPkcs12(bytes, configuration.GetValue<string>("OpenIddict:Password"));
        }
        else
        {
            var thumbprint = configuration.GetValue<string>("OpenIddict:Thumbprint");
            Guard.Against.Null(thumbprint, message: $"Thumbprint for OpenIddict not found");
            using var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
            store.Open(OpenFlags.ReadOnly);
            var certificates = store.Certificates.Find(X509FindType.FindByThumbprint, thumbprint, false);
            certificate = certificates.Count > 0 ? certificates[0] : null;
        }

        return Guard.Against.Null(certificate, message: $"Certificate for OpenIddict not found");
    }
}
