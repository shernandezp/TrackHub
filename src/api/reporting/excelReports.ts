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
 * Excel report generation (Reporting backend — REST, not GraphQL). Downloads
 * the generated .xlsx through the shared authenticated REST client. Throws
 * ApiError on failure.
 */

import i18n from 'i18next';
import { downloadFile } from 'api/core/restClient';
import { REST_ENDPOINTS } from 'api/core/endpoints';
import { formatJSONValue, formatDateTimeOffSet } from 'utils/dataUtils';

export interface ReportFilterValues {
  selectedItem1?: string | null;
  selectedItem2?: string | null;
  selectedItem3?: string | null;
  selectedDate1?: string | number | Date | null;
  selectedDate2?: string | number | Date | null;
  selectedDate3?: string | number | Date | null;
  selectedNumber1?: number | null;
  selectedNumber2?: number | null;
  selectedNumber3?: number | null;
}

/**
 * Generates the report server-side and saves it as `<reportName>.xlsx`.
 */
export async function downloadExcelReport(
  reportCode: string,
  reportName: string,
  filters: ReportFilterValues
): Promise<void> {
  const language = i18n.language || 'en';
  const requestBody = {
    reportCode,
    filters: {
      name: reportName,
      stringFilter1: formatJSONValue(filters.selectedItem1),
      stringFilter2: formatJSONValue(filters.selectedItem2),
      stringFilter3: formatJSONValue(filters.selectedItem3),
      dateTimeFilter1: formatDateTimeOffSet(filters.selectedDate1),
      dateTimeFilter2: formatDateTimeOffSet(filters.selectedDate2),
      dateTimeFilter3: formatDateTimeOffSet(filters.selectedDate3),
      numericFilter1: formatJSONValue(filters.selectedNumber1),
      // Fixed in the TS port: these previously sent selectedNumber1 (copy-paste bug).
      numericFilter2: formatJSONValue(filters.selectedNumber2),
      numericFilter3: formatJSONValue(filters.selectedNumber3),
      language,
    },
  };
  await downloadFile(REST_ENDPOINTS.reportingBasicReports, requestBody, `${reportName}.xlsx`, {
    timeout: 60000,
  });
}
