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

const usePositionRetentionService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const getPositionRetentionPolicy = async (accountId) => {
    try {
      const data = {
        query: `
          query {
            positionRetentionPolicy(query: { accountId: ${formatValue(accountId)} }) {
              historyEnabled retentionDays latestOnly effectiveSource
            }
          }
        `
      };
      const response = await post(data);
      return response.data.positionRetentionPolicy;
    } catch (error) {
      handleError(error);
    }
  };

  const setPositionRetentionPolicy = async (accountId, policy) => {
    try {
      const fields = [
        `historyEnabled: ${policy.historyEnabled}`,
        `retentionDays: ${policy.retentionDays ?? 0}`,
        `latestOnly: ${policy.latestOnly ?? false}`
      ].join(' ');
      const data = {
        query: `
          mutation {
            setPositionRetentionPolicy(command: { accountId: ${formatValue(accountId)}, policy: { ${fields} } })
          }
        `
      };
      const response = await post(data);
      return response.data.setPositionRetentionPolicy;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return { getPositionRetentionPolicy, setPositionRetentionPolicy };
};

export default usePositionRetentionService;
