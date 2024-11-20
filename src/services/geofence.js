/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

const useGeofenceService = () => {
  const { post } = useApiService(process.env.REACT_APP_GEOFENCING_ENDPOINT);

  const getGeofence = async (geofenceId) => {
    try {
      const data = {
        query: `
          query {
            geofence(query: { id: ${geofenceId} }) {
              type
              name
              geom {
                srid
                coordinates
              }
              geofenceId
              color
              active
              description
            }
          }
        `
      };
      const response = await post(data);
      return response.data.geofence;
    } catch (error) {
      handleError(error);
    }
  };

  const getGeofencesByAccount = async () => {
    try {
      const data = {
        query: `
          query {
            geofencesByAccount {
              active
              color
              description
              geofenceId
              name
              type
              geom {
                srid
                coordinates { latitude, longitude }
              }
            }
          }
        `
      };
      const response = await post(data);
      return response.data.geofencesByAccount;
    } catch (error) {
      handleError(error);
    }
  };

  const createGeofence = async (geofenceData) => {
    try {
      const data = {
        query: `
          mutation {
            createGeofence(
              command: {
                geofence: {
                  geom: { coordinates: [${geofenceData.geom.coordinates.map(coord => `[${coord.longitude}, ${coord.latitude}]`).join(', ')}], srid: ${geofenceData.geom.srid} }
                  type: ${geofenceData.type}
                  name: ${formatValue(geofenceData.name)}
                  description: ${formatValue(geofenceData.description)}
                  color: ${formatValue(geofenceData.color)}
                  active: ${geofenceData.active}
                }
              }
            ) {
              active
              type
              name
              geom {
                srid
                coordinates
              }
              geofenceId
              description
              color
              accountId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createGeofence;
    } catch (error) {
      handleError(error);
    }
  };

  const updateGeofence = async (geofenceId, geofenceData) => {
    try {
      const data = {
        query: `
          mutation {
            updateGeofence(
              command: {
                geofence: {
                  type: ${geofenceData.type}
                  name: ${formatValue(geofenceData.name)}
                  geom: { coordinates: [${geofenceData.geom.coordinates.map(coord => `[${coord.longitude}, ${coord.latitude}]`).join(', ')}], srid: ${geofenceData.geom.srid} }
                  geofenceId: ${geofenceData.geofenceId}
                  description: ${formatValue(geofenceData.description)}
                  color: ${formatValue(geofenceData.color)}
                  active: ${geofenceData.active}
                }
              }
              id: ${geofenceId}
            ) 
          }
        `
      };
      const response = await post(data);
      return response.data.updateGeofence;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const deleteGeofence = async (geofenceId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteGeofence(id: ${geofenceId}) 
          }
        `
      };
      const response = await post(data);
      return response.data.deleteGeofence;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getGeofence,
    getGeofencesByAccount,
    createGeofence,
    updateGeofence,
    deleteGeofence
  };
};

export default useGeofenceService;
