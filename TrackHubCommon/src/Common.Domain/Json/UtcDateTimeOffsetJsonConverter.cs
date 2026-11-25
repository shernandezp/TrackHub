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
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Common.Domain.Json;

// The default System.Text.Json behaviour applies the machine-local offset to a zone-less string,
// silently shifting naive timestamps by the host's offset. Here an explicit offset is honoured and
// normalized to UTC, a naive string is assumed UTC, and a JSON number is Unix epoch seconds.
internal static class UtcDateTimeOffset
{
    private const DateTimeStyles Styles =
        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal;

    public static DateTimeOffset Read(ref Utf8JsonReader reader)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.Number:
                return DateTimeOffset.FromUnixTimeSeconds(reader.GetInt64());
            case JsonTokenType.String:
                var value = reader.GetString();
                return string.IsNullOrEmpty(value)
                    ? DateTimeOffset.MinValue
                    : DateTimeOffset.Parse(value, CultureInfo.InvariantCulture, Styles);
            default:
                throw new JsonException($"Unexpected token '{reader.TokenType}' when parsing a UTC timestamp.");
        }
    }

    public static void Write(Utf8JsonWriter writer, DateTimeOffset value)
        => writer.WriteStringValue(value.ToUniversalTime());
}

/// <summary>Deserializes timestamps as UTC, assuming UTC for zone-less inputs instead of the machine-local offset.</summary>
public sealed class UtcDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset>
{
    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => UtcDateTimeOffset.Read(ref reader);

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
        => UtcDateTimeOffset.Write(writer, value);
}

public sealed class UtcNullableDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset?>
{
    public override DateTimeOffset? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.Null ? null : UtcDateTimeOffset.Read(ref reader);

    public override void Write(Utf8JsonWriter writer, DateTimeOffset? value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
        }
        else
        {
            UtcDateTimeOffset.Write(writer, value.Value);
        }
    }
}
