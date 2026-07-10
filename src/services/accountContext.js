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

const useAccountContextService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Single bootstrap read for the current principal's account: lifecycle status, branding, and the
   * effective feature set. Allowed on non-operational accounts so the shell can render a suspension
   * state without issuing further operational queries.
   * @returns {Promise<Object|null>} The account context, or null on error.
   */
  const getAccountContext = async () => {
    try {
      const data = {
        query: `
          query {
            accountContext {
              status
              statusId
              branding {
                accountId
                displayName
                logoDocumentId
                primaryColor
                reportHeader
                lastModified
              }
              features {
                accountFeatureId
                accountId
                featureKey
                enabled
                tier
                source
                effectiveFrom
                effectiveTo
                configurationJson
                lastModified
              }
            }
          }
        `
      };
      const response = await post(data);
      return response.data.accountContext;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  return { getAccountContext };
};

export default useAccountContextService;
