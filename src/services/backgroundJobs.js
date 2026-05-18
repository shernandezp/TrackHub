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

const useManagerGraphQL = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const execute = async (query, selector, fallback = undefined) => {
    try {
      const response = await post({ query });
      return selector(response.data);
    } catch (error) {
      handleError(error);
      return fallback;
    }
  };

  return { execute };
};
const useBackgroundJobService = () => {
  const { execute } = useManagerGraphQL();

  const getBackgroundJobRuns = async (accountId, skip = 0, take = 50) => execute(`
    query {
      backgroundJobRuns(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        backgroundJobRunId
        jobKey
        accountId
        resourceKey
        idempotencyKey
        status
        attempts
        startedAt
        completedAt
        errorCode
        errorMessage
      }
    }
  `, data => data.backgroundJobRuns, []);

  return { getBackgroundJobRuns };
};

export default useBackgroundJobService;

