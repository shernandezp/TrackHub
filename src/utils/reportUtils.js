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
 *
 * @param {Function} fetchFunction - The function to fetch the data.
 * @param {Function} mapFunction - The function to map the fetched data.
 * @returns {Promise<Array>} The mapped result of the fetched data.
 */
export const fetchList = async (fetchFunction, mapFunction) => {
    const result = await fetchFunction();
    return result.map(mapFunction);
};

/**
 * Builds table data with visibility settings for different filters.
 *
 * @param {Array} list1 - The data for the first string filter.
 * @param {Array} list2 - The data for the second string filter.
 * @param {Array} list3 - The data for the third string filter.
 * @param {Array<boolean>} visibility - An array of booleans indicating the visibility of each filter.
 * @param {Array<boolean>} labels - An array of string indicating the label of each filter.
 * @returns {Object} The table data with visibility settings.
 */
export const buildTableData = ({ 
    list1 = [], 
    list2 = [], 
    list3 = [], 
    visibility = [false, false, false, false, false, false, false, false, false], 
    labels = ['', '', '', '', '', '', '', '', ''] 
  }) => ({
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