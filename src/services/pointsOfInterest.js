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

const usePointOfInterestService = () => {
  const { execute } = useManagerGraphQL();

  const getPointsOfInterestByAccount = async () => execute(`
    query {
      pointsOfInterestByAccount {
        pointOfInterestId
        accountId
        name
        description
        type
        latitude
        longitude
        address
        color
        groupId
        active
      }
    }
  `, data => data.pointsOfInterestByAccount, []);

  const createPointOfInterest = async (poi) => execute(`
    mutation {
      createPointOfInterest(command: { pointOfInterest: {
        name: ${formatValue(poi.name)}
        description: ${formatValue(poi.description)}
        type: ${poi.type}
        latitude: ${poi.latitude}
        longitude: ${poi.longitude}
        address: ${formatValue(poi.address)}
        color: ${poi.color ? poi.color : null}
        groupId: ${poi.groupId ? poi.groupId : null}
        active: ${!!poi.active}
      }}) {
        pointOfInterestId
        accountId
        name
        description
        type
        latitude
        longitude
        address
        color
        groupId
        active
      }
    }
  `, data => data.createPointOfInterest, null);

  const updatePointOfInterest = async (pointOfInterestId, poi) => execute(`
    mutation {
      updatePointOfInterest(
        id: ${formatValue(pointOfInterestId)}
        command: { id: ${formatValue(pointOfInterestId)}, pointOfInterest: {
          name: ${formatValue(poi.name)}
          description: ${formatValue(poi.description)}
          type: ${poi.type}
          latitude: ${poi.latitude}
          longitude: ${poi.longitude}
          address: ${formatValue(poi.address)}
          color: ${poi.color ? poi.color : null}
          groupId: ${poi.groupId ? poi.groupId : null}
          active: ${!!poi.active}
        }}
      )
    }
  `, data => data.updatePointOfInterest, false);

  const deletePointOfInterest = async (pointOfInterestId) => execute(`
    mutation {
      deletePointOfInterest(id: ${formatValue(pointOfInterestId)})
    }
  `, data => data.deletePointOfInterest, false);

  return {
    getPointsOfInterestByAccount,
    createPointOfInterest,
    updatePointOfInterest,
    deletePointOfInterest
  };
};

export default usePointOfInterestService;
