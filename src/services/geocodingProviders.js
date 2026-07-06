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

const useGeocodingProviderService = () => {
  const { execute } = useManagerGraphQL();

  const getGeocodingProviders = async () => execute(`
    query {
      geocodingProviders {
        geocodingProviderId
        name
        type
        endpointUri
        apiKey
        requestsPerSecond
        timeoutSeconds
        configurationJson
        active
      }
    }
  `, data => data.geocodingProviders, []);

  const createGeocodingProvider = async (provider) => execute(`
    mutation {
      createGeocodingProvider(command: { geocodingProvider: {
        name: ${formatValue(provider.name)}
        type: ${provider.type}
        endpointUri: ${formatValue(provider.endpointUri)}
        apiKey: ${formatValue(provider.apiKey)}
        requestsPerSecond: ${Number(provider.requestsPerSecond) || 1}
        timeoutSeconds: ${Number(provider.timeoutSeconds) || 5}
        configurationJson: ${formatValue(provider.configurationJson)}
        active: ${!!provider.active}
      }}) {
        geocodingProviderId
        name
        type
        endpointUri
        apiKey
        requestsPerSecond
        timeoutSeconds
        configurationJson
        active
      }
    }
  `, data => data.createGeocodingProvider, null);

  const updateGeocodingProvider = async (geocodingProviderId, provider) => execute(`
    mutation {
      updateGeocodingProvider(
        id: ${formatValue(geocodingProviderId)}
        command: { id: ${formatValue(geocodingProviderId)}, geocodingProvider: {
          name: ${formatValue(provider.name)}
          type: ${provider.type}
          endpointUri: ${formatValue(provider.endpointUri)}
          apiKey: ${formatValue(provider.apiKey)}
          requestsPerSecond: ${Number(provider.requestsPerSecond) || 1}
          timeoutSeconds: ${Number(provider.timeoutSeconds) || 5}
          configurationJson: ${formatValue(provider.configurationJson)}
        }}
      )
    }
  `, data => data.updateGeocodingProvider, false);

  const deleteGeocodingProvider = async (geocodingProviderId) => execute(`
    mutation {
      deleteGeocodingProvider(id: ${formatValue(geocodingProviderId)})
    }
  `, data => data.deleteGeocodingProvider, false);

  const setActiveGeocodingProvider = async (geocodingProviderId) => execute(`
    mutation {
      setActiveGeocodingProvider(id: ${formatValue(geocodingProviderId)})
    }
  `, data => data.setActiveGeocodingProvider, false);

  return {
    getGeocodingProviders,
    createGeocodingProvider,
    updateGeocodingProvider,
    deleteGeocodingProvider,
    setActiveGeocodingProvider
  };
};

export default useGeocodingProviderService;
