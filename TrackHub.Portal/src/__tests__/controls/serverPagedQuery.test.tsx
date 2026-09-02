/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import useServerList, { useClampPage } from 'controls/Tables/useServerList';
import { useDevicesByAccount } from 'queries/devices';

vi.mock('api/manager/devices', () => ({
  getDevicesByAccount: vi.fn(async (params: { skip?: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { items: [{ deviceId: `device-${params.skip ?? 0}` }], totalCount: 94 };
  }),
}));

// The admin lists wire a paged query, useServerList and useClampPage together. While the next
// page loads the query has no data for its new key, so the clamp saw totalCount 0 and snapped
// the page back to one — the "next" button never moved. The hooks now keep the previous page's
// data as a placeholder, which is what this pins.
function usePagedDevices() {
  const { page, setPage, params } = useServerList(10);
  const query = useDevicesByAccount(params);
  const totalCount = query.data?.totalCount ?? 0;
  useClampPage(page, 10, totalCount, setPage);
  return { page, setPage, totalCount, isFetching: query.isFetching, items: query.data?.items ?? [] };
}

describe('server-paged admin lists', () => {
  it('stays on the requested page while the next page loads', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => usePagedDevices(), { wrapper });
    await waitFor(() => expect(result.current.totalCount).toBe(94));

    act(() => result.current.setPage(1));
    // The previous page's total is still known during the fetch, so no clamp fires.
    expect(result.current.totalCount).toBe(94);
    await waitFor(() => expect(result.current.items[0]?.deviceId).toBe('device-10'));
    expect(result.current.page).toBe(1);
  });
});
