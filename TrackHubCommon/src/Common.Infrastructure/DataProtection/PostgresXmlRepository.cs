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

using System.Xml.Linq;
using Microsoft.AspNetCore.DataProtection.Repositories;
using Npgsql;

namespace Common.Infrastructure.DataProtection;

/// <summary>
/// Key ring storage shared by every service, in the same database as the logs. Keys in a container
/// directory die with the container, and every redeploy then invalidates each cookie and
/// antiforgery token issued before it.
/// </summary>
public sealed class PostgresXmlRepository(string connectionString) : IXmlRepository
{
    public const string TableName = "dataprotection_keys";

    private bool _tableEnsured;

    public IReadOnlyCollection<XElement> GetAllElements()
    {
        using var connection = Open();
        using var command = new NpgsqlCommand($"SELECT xml FROM public.{TableName} ORDER BY createdat", connection);
        using var reader = command.ExecuteReader();
        var elements = new List<XElement>();
        while (reader.Read())
        {
            elements.Add(XElement.Parse(reader.GetString(0)));
        }

        return elements;
    }

    public void StoreElement(XElement element, string friendlyName)
    {
        using var connection = Open();
        using var command = new NpgsqlCommand(
            $"INSERT INTO public.{TableName} (friendlyname, xml) VALUES (@name, @xml)", connection);
        command.Parameters.AddWithValue("name", (object?)friendlyName ?? DBNull.Value);
        command.Parameters.AddWithValue("xml", element.ToString(SaveOptions.DisableFormatting));
        command.ExecuteNonQuery();
    }

    private NpgsqlConnection Open()
    {
        var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        if (!_tableEnsured)
        {
            using var command = new NpgsqlCommand(
                $"""
                CREATE TABLE IF NOT EXISTS public.{TableName} (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    friendlyname text,
                    xml text NOT NULL,
                    createdat timestamptz NOT NULL DEFAULT now())
                """, connection);
            command.ExecuteNonQuery();
            _tableEnsured = true;
        }

        return connection;
    }
}
