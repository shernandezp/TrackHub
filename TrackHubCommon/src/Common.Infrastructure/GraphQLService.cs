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

using System.Text.Json;
using Common.Application.Exceptions;
using Common.Domain.Extensions;
using GraphQL;
using GraphQL.Client.Abstractions;
using HotChocolate;

namespace Common.Infrastructure;

public abstract class GraphQLService(IGraphQLClient graphQLClient)
{

    public async Task<T> QueryAsync<T>(GraphQLRequest request, CancellationToken token)
    {
        var response = await graphQLClient.SendQueryAsync<object>(request, token)
            ?? throw new Exception("GraphQL query execution error.");

        if (response.Errors != null && response.Errors.Length > 0)
        {
            throw new GraphQLException(response.Errors.ConvertToUpstreamIError());
        }

        var dataString = response.Data.ToString();
        return string.IsNullOrEmpty(dataString)
            ? throw new Exception("Data string is null or empty.")
            : ExtractFirstPropertyValue<T>(dataString);
    }

    public async Task<T> MutationAsync<T>(GraphQLRequest request, CancellationToken token)
    {
        var response = await graphQLClient.SendMutationAsync<object>(request, token)
            ?? throw new Exception("GraphQL mutation execution error.");

        if (response.Errors != null && response.Errors.Length > 0)
        {
            throw new GraphQLException(response.Errors.ConvertToUpstreamIError());
        }

        var dataString = response.Data.ToString();
        return string.IsNullOrEmpty(dataString)
            ? throw new Exception("Data string is null or empty.")
            : ExtractFirstPropertyValue<T>(dataString);
    }

    private static T ExtractFirstPropertyValue<T>(string json)
    {
        var dataObject = JsonDocument.Parse(json);
        var property = dataObject.RootElement.EnumerateObject().FirstOrDefault();
        if (property.Value.ValueKind != JsonValueKind.Null)
        {
            var propertyJson = property.Value.GetRawText();
            var propertyValue = propertyJson.Deserialize<T>();
            if (propertyValue != null)
                return propertyValue;
        }

        // A Nullable<T> return type means the caller declared null a valid answer for this field. Only
        // Nullable<T>, not every reference type: nullable reference annotations are erased at runtime, so
        // widening would turn a genuinely empty field into a silent null. Cross-service Vms are record structs.
        if (Nullable.GetUnderlyingType(typeof(T)) is not null)
            return default!;

        throw new Exception("Response is null or empty.");
    }
}
