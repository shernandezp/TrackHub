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

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatRESTValue, formatDateTimeOffSet } from 'utils/dataUtils';

const useExcelReportService = () => {
  const { postFile } = useApiService(`${process.env.REACT_APP_REPORTING_ENDPOINT}api/BasicReports/GetReport`);

  /**
  * Fetches an Excel report based on the provided report code, name, and filters.
  *
  * @function getReport
  * @param {string} reportCode - The code of the report to be fetched.
  * @param {string} reportName - The name of the report to be fetched.
  * @param {Object} reportFilters - The filters to be applied to the report.
  * @param {string} reportFilters.stringFilter1 - The first string filter.
  * @param {string} reportFilters.stringFilter2 - The second string filter.
  * @param {string} reportFilters.stringFilter3 - The third string filter.
  * @param {Date} reportFilters.dateTimeFilter1 - The first date-time filter.
  * @param {Date} reportFilters.dateTimeFilter2 - The second date-time filter.
  * @param {Date} reportFilters.dateTimeFilter3 - The third date-time filter.
  * @param {number} reportFilters.numericFilter1 - The first numeric filter.
  * @param {number} reportFilters.numericFilter2 - The second numeric filter.
  * @param {number} reportFilters.numericFilter3 - The third numeric filter.
  * @returns {Promise<Object>} The response from the API containing the report data.
  * @throws Will throw an error if the request fails.
  */
  const getReport = async (reportCode, reportName, reportFilters) => {
    try {
      const requestBody = {
        reportCode: reportCode,
        filters: {
          name: reportName,
          stringFilter1: formatRESTValue(reportFilters.selectedItem1),
          stringFilter2: formatRESTValue(reportFilters.selectedItem2),
          stringFilter3: formatRESTValue(reportFilters.selectedItem3),
          dateTimeFilter1: formatDateTimeOffSet(reportFilters.selectedDate1),
          dateTimeFilter2: formatDateTimeOffSet(reportFilters.selectedDate2),
          dateTimeFilter3: formatDateTimeOffSet(reportFilters.selectedDate3),
          numericFilter1: formatRESTValue(reportFilters.selectedNumber1),
          numericFilter2: formatRESTValue(reportFilters.selectedNumber1),
          numericFilter3: formatRESTValue(reportFilters.selectedNumber1)
        }
      };
      const response = await postFile(requestBody, reportName);
      return response;
    } catch (error) {
      handleError(error);
    }
  };

  return {
    getReport
  };
};

export default useExcelReportService;
