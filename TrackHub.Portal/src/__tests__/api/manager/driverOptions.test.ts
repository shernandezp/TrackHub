/**
 * Copyright (c) 2026 Sergio Hernandez. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import { getDriverOptions } from 'api/manager/drivers';
import { GetDriverOptionsDocument } from 'api/manager/driverOperations';

vi.mock('api/core/graphqlClient', () => ({ executeGraphQL: vi.fn() }));

const mockExecute = vi.mocked(executeGraphQL);

beforeEach(() => {
  mockExecute.mockReset();
});

describe('getDriverOptions', () => {
  test('pages the driver-operations picker source and returns the page whole', async () => {
    const page = { items: [{ driverId: 'd1', name: 'Ana', active: true }], totalCount: 7 };
    mockExecute.mockResolvedValue({ driverOptions: page } as never);
    const signal = new AbortController().signal;

    expect(await getDriverOptions({ search: 'an', skip: 20, take: 20 }, { signal })).toEqual(page);
    expect(mockExecute).toHaveBeenCalledWith(
      'manager',
      GetDriverOptionsDocument,
      { search: 'an', skip: 20, take: 20 },
      { signal }
    );
  });

  test('an empty search is sent as no search', async () => {
    mockExecute.mockResolvedValue({ driverOptions: { items: [], totalCount: 0 } } as never);

    await getDriverOptions({ search: '', skip: 0, take: 20 });

    expect(mockExecute.mock.calls[0][2]).toEqual({ search: null, skip: 0, take: 20 });
  });
});
