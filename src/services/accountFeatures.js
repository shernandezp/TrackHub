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
const useAccountFeatureService = () => {
  const { execute } = useManagerGraphQL();

  const getAccountFeatures = async (accountId) => execute(`
    query {
      accountFeatures(query: { accountId: ${formatValue(accountId)} }) {
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
  `, data => data.accountFeatures, []);

  const setAccountFeature = async (feature) => execute(`
    mutation {
      setAccountFeature(command: { feature: {
        accountId: ${formatValue(feature.accountId)}
        featureKey: ${formatValue(feature.featureKey)}
        enabled: ${feature.enabled}
        tier: ${formatValue(feature.tier || 'default')}
        source: ${formatValue(feature.source || 'portal')}
        effectiveFrom: ${formatValue(feature.effectiveFrom)}
        effectiveTo: ${formatValue(feature.effectiveTo)}
        configurationJson: ${formatValue(feature.configurationJson)}
      }}) {
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
  `, data => data.setAccountFeature, null);

  // Cross-account read for the SuperAdministrator (AccountFeaturesMaster resource).
  const getAccountFeaturesMaster = async (accountId) => execute(`
    query {
      accountFeaturesMaster(query: { accountId: ${formatValue(accountId)} }) {
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
  `, data => data.accountFeaturesMaster, []);

  // Cross-account write for the SuperAdministrator (AccountFeaturesMaster resource).
  const setAccountFeatureMaster = async (feature) => execute(`
    mutation {
      setAccountFeatureMaster(command: { feature: {
        accountId: ${formatValue(feature.accountId)}
        featureKey: ${formatValue(feature.featureKey)}
        enabled: ${feature.enabled}
        tier: ${formatValue(feature.tier || 'default')}
        source: ${formatValue(feature.source || 'superadmin')}
        effectiveFrom: ${formatValue(feature.effectiveFrom)}
        effectiveTo: ${formatValue(feature.effectiveTo)}
        configurationJson: ${formatValue(feature.configurationJson)}
      }}) {
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
  `, data => data.setAccountFeatureMaster, null);

  return { getAccountFeatures, setAccountFeature, getAccountFeaturesMaster, setAccountFeatureMaster };
};

export default useAccountFeatureService;

