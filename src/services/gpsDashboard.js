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

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

const useGpsDashboardService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const getDashboard = async (accountId) => {
    try {
      const data = {
        query: `
          query {
            gpsIntegrationDashboard(query: { accountId: ${formatValue(accountId)} }) {
              operatorsTotal operatorsEnabled operatorsHealthy operatorsDegraded operatorsOffline
              devicesTotal devicesNew devicesAvailable devicesAssigned devicesIgnored devicesRemoved
              recentlyAddedDevicesLast24h unassignedDevicesCount
              syncRunsSucceededLast24h syncRunsFailedLast24h
              lastAutomaticSyncAt lastManualSyncAt averageSyncDurationSeconds
              deviceCountsByProviderStatus { operatorId operatorName detectedStatus count }
            }
          }
        `
      };
      const response = await post(data);
      return response.data.gpsIntegrationDashboard;
    } catch (error) {
      handleError(error);
    }
  };

  return { getDashboard };
};

export default useGpsDashboardService;
