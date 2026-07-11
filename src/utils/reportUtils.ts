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

/**
 * Fetches a list using the provided fetch function and maps the result using the provided map function.
 */
export const fetchList = async <T, U>(
    fetchFunction: () => Promise<T[]>,
    mapFunction: (value: T, index: number, array: T[]) => U
): Promise<U[]> => {
    const result = await fetchFunction();
    return result.map(mapFunction);
};

/** Parameters accepted by {@link buildTableData}. */
interface BuildTableDataParams {
    list1?: unknown[];
    list2?: unknown[];
    list3?: unknown[];
    visibility?: boolean[];
    labels?: string[];
}

interface VisibleDataFilter {
    visible: boolean;
    data: unknown[];
    label: string;
}

interface VisibleFilter {
    visible: boolean;
    label: string;
}

/** The table data with visibility settings produced by {@link buildTableData}. */
interface TableData {
    stringFilter1: VisibleDataFilter;
    stringFilter2: VisibleDataFilter;
    stringFilter3: VisibleDataFilter;
    dateTimeFilter1: VisibleFilter;
    dateTimeFilter2: VisibleFilter;
    dateTimeFilter3: VisibleFilter;
    numericFilter1: VisibleFilter;
    numericFilter2: VisibleFilter;
    numericFilter3: VisibleFilter;
}

/**
 * Builds table data with visibility settings for different filters.
 */
export const buildTableData = ({
    list1 = [],
    list2 = [],
    list3 = [],
    visibility = [false, false, false, false, false, false, false, false, false],
    labels = ['', '', '', '', '', '', '', '', '']
  }: BuildTableDataParams): TableData => ({
    stringFilter1: { visible: visibility[0], data: list1, label: labels[0] },
    stringFilter2: { visible: visibility[1], data: list2, label: labels[1] },
    stringFilter3: { visible: visibility[2], data: list3, label: labels[2] },
    dateTimeFilter1: { visible: visibility[3], label: labels[3] },
    dateTimeFilter2: { visible: visibility[4], label: labels[4] },
    dateTimeFilter3: { visible: visibility[5], label: labels[5] },
    numericFilter1: { visible: visibility[6], label: labels[6] },
    numericFilter2: { visible: visibility[7], label: labels[7] },
    numericFilter3: { visible: visibility[8], label: labels[8] }
});
