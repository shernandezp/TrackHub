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

import { useEffect, useMemo, useRef, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from 'utils/useDebouncedValue';



export interface UseServerListResult {
  page: number;
  setPage: (page: number) => void;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  /** `{ skip, take, search }` for the paged query — stable between keystrokes. */
  params: { skip: number; take: number; search: string | null };
}

/**
 * The shared `Table` searches and pages CLIENT-side, so a screen reading one server page drives
 * both from here: the draft is debounced into `params.search`, jumping back to the first page.
 * Call {@link useClampPage} with the server total afterwards.
 */
export function useServerList(pageSize: number): UseServerListResult {
  const [page, setPage] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');

  // The ref guards against re-applying an unchanged value (e.g. the initial
  // empty draft), which would otherwise reset the page on every mount.
  const appliedSearchRef = useRef('');
  useEffect(() => {
    const handle = setTimeout(() => {
      if (appliedSearchRef.current === searchDraft) return;
      appliedSearchRef.current = searchDraft;
      setPage(0);
      setSearch(searchDraft);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchDraft]);

  const params = useMemo(
    () => ({
      skip: page * pageSize,
      take: pageSize,
      search: search.trim() === '' ? null : search.trim(),
    }),
    [page, pageSize, search]
  );

  return { page, setPage, searchDraft, setSearchDraft, params };
}

/** Deleting the last row of a non-first page otherwise leaves the user on an empty page. */
export function useClampPage(
  page: number,
  pageSize: number,
  totalCount: number,
  setPage: (page: number) => void
): void {
  useEffect(() => {
    if (page > 0 && page * pageSize >= totalCount) {
      setPage(Math.max(0, Math.ceil(totalCount / pageSize) - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, page, pageSize]);
}

export default useServerList;
