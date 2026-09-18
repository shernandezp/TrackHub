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

using Common.Application.Extensions;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Common.Application.Tests.Extensions;

public class RetentionDeleteExtensionsTests
{
    private sealed class Row
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public int Age { get; set; }
    }

    private sealed class RowContext(DbContextOptions<RowContext> options) : DbContext(options)
    {
        public DbSet<Row> Rows => Set<Row>();
    }

    // SQLite in memory, not the InMemory provider: that one cannot execute ExecuteDelete at all, and
    // the bulk delete is the whole point of the loop under test.
    private static RowContext Seeded(int matching, int keep)
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var context = new RowContext(new DbContextOptionsBuilder<RowContext>()
            .UseSqlite(connection)
            .Options);

        context.Database.EnsureCreated();

        for (var i = 0; i < matching; i++)
        {
            context.Rows.Add(new Row { Age = 100 });
        }

        for (var i = 0; i < keep; i++)
        {
            context.Rows.Add(new Row { Age = 1 });
        }

        context.SaveChanges();
        return context;
    }

    [Theory]
    [InlineData(0, 3)]
    [InlineData(1, 3)]
    [InlineData(3, 3)]
    [InlineData(7, 3)]
    [InlineData(25, 4)]
    public async Task Deletes_every_matching_row_whatever_the_chunk_size(int matching, int chunkSize)
    {
        using var context = Seeded(matching, keep: 5);

        var deleted = await context.Rows
            .Where(r => r.Age > 50)
            .ExecuteDeleteInChunksAsync(r => r.Id, CancellationToken.None, chunkSize);

        deleted.Should().Be(matching);
        context.Rows.Count().Should().Be(5, "rows outside the predicate are untouched");
    }

    [Fact]
    public async Task Leaves_a_non_matching_set_alone()
    {
        using var context = Seeded(matching: 0, keep: 4);

        var deleted = await context.Rows
            .Where(r => r.Age > 50)
            .ExecuteDeleteInChunksAsync(r => r.Id, CancellationToken.None);

        deleted.Should().Be(0);
        context.Rows.Count().Should().Be(4);
    }

    [Fact]
    public async Task Refuses_a_chunk_size_that_could_never_make_progress()
    {
        using var context = Seeded(matching: 1, keep: 0);

        var act = async () => await context.Rows
            .ExecuteDeleteInChunksAsync(r => r.Id, CancellationToken.None, chunkSize: 0);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task Honours_cancellation_between_chunks()
    {
        using var context = Seeded(matching: 50, keep: 0);
        using var cancellation = new CancellationTokenSource();
        await cancellation.CancelAsync();

        var act = async () => await context.Rows
            .Where(r => r.Age > 50)
            .ExecuteDeleteInChunksAsync(r => r.Id, cancellation.Token, chunkSize: 10);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
