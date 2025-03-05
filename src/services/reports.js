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

/**
 * Service for managing report-related operations.
 * @returns {Object} Object containing functions for report operations.
 */
const useReportService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves all reports.
   * @returns {Promise<Array>} A promise that resolves to an array of all reports.
   */
  const getReports = async () => {
    try {
      const data = {
        query: `
          query {
            reports {
              active
              code
              description
              reportId
              type
              typeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.reports;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing report.
   * @param {string} reportId - The ID of the report to update.
   * @param {Object} reportData - The updated data of the report.
   * @returns {Promise<Object|boolean>} A promise that resolves to the updated report if successful, or false if an error occurred.
   */
  const updateReport = async (reportId, reportData) => {
    try {
      const data = {
        query: `
          mutation {
            updateReport(
              id: "${reportId}",
              command: {
                report: { 
                  typeId: ${reportData.typeId}, 
                  reportId: "${reportData.reportId}", 
                  description: ${formatValue(reportData.description)}, 
                  active: ${reportData.active}
                }
              }
            ) 
          }
        `
      };
      const response = await post(data);
      return response.data.updateReport;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getReports,
    updateReport
  };
};

export default useReportService;
