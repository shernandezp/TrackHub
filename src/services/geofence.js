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

/**
 * Custom hook to interact with the geofencing service.
 * 
 * @module useGeofenceService
 */
const useGeofenceService = () => {
  const { post } = useApiService(process.env.REACT_APP_GEOFENCING_ENDPOINT);

   /**
  * Fetches a geofence by its ID.
  * 
  * @function getGeofence
  * @param {string} geofenceId - The ID of the geofence to fetch.
  * @returns {Promise<Object>} The geofence data.
  * @throws Will throw an error if the request fails.
  */
  const getGeofence = async (geofenceId) => {
    try {
      const data = {
        query: `
          query {
            geofence(query: { id: "${geofenceId}" }) {
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
      return response.data.geofence;
    } catch (error) {
      handleError(error);
    }
  };

   /**
  * Fetches all geofences associated with the current account.
  * 
  * @function getGeofencesByAccount
  * @returns {Promise<Array<Object>>} An array of geofence data.
  * @throws Will throw an error if the request fails.
  */
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

   /**
  * Creates a new geofence.
  * 
  * @function createGeofence
  * @param {Object} geofenceData - The data for the new geofence.
  * @param {string} geofenceData.geofenceId - The ID of the geofence.
  * @param {string} geofenceData.type - The type of the geofence.
  * @param {string} geofenceData.name - The name of the geofence.
  * @param {Object} geofenceData.geom - The geometry of the geofence.
  * @param {number} geofenceData.geom.srid - The SRID of the geofence.
  * @param {Array<Object>} geofenceData.geom.coordinates - The coordinates of the geofence.
  * @param {number} geofenceData.geom.coordinates.latitude - The latitude of the coordinate.
  * @param {number} geofenceData.geom.coordinates.longitude - The longitude of the coordinate.
  * @param {string} geofenceData.description - The description of the geofence.
  * @param {string} geofenceData.color - The color of the geofence.
  * @param {boolean} geofenceData.active - The active status of the geofence.
  * @returns {Promise<Object>} The created geofence data.
  * @throws Will throw an error if the request fails.
  */
  const createGeofence = async (geofenceData) => {
    const data = {
      query: `
        mutation {
          createGeofence(
            command: {
              geofence: {
                geofenceId: "${geofenceData.geofenceId}",
                type: ${geofenceData.type},
                name: ${formatValue(geofenceData.name)},
                geom: {
                    srid: ${geofenceData.geom.srid},
                    coordinates: [
                        ${geofenceData.geom.coordinates.map(coord => `{
                            longitude: ${coord.longitude},
                            latitude: ${coord.latitude}
                        }`).join(',')}
                    ]
                },
                description: ${formatValue(geofenceData.description)},
                color: ${geofenceData.color},
                active: ${geofenceData.active}
              }
            }
          ) {
              type
              name
              geom {
                srid
                coordinates { latitude, longitude }
              }
              geofenceId
              description
              color
              active
              accountId
          }
        }
      `
    };

    try {
      const response = await post(data);
      return response.data.createGeofence;
    } catch (error) {
      handleError(error);
    }
  };

   /**
  * Updates an existing geofence.
  * 
  * @function updateGeofence
  * @param {string} geofenceId - The ID of the geofence to update.
  * @param {Object} geofenceData - The updated data for the geofence.
  * @param {string} geofenceData.type - The type of the geofence.
  * @param {string} geofenceData.name - The name of the geofence.
  * @param {Object} geofenceData.geom - The geometry of the geofence.
  * @param {number} geofenceData.geom.srid - The SRID of the geofence.
  * @param {Array<Object>} geofenceData.geom.coordinates - The coordinates of the geofence.
  * @param {number} geofenceData.geom.coordinates.latitude - The latitude of the coordinate.
  * @param {number} geofenceData.geom.coordinates.longitude - The longitude of the coordinate.
  * @param {string} geofenceData.description - The description of the geofence.
  * @param {string} geofenceData.color - The color of the geofence.
  * @param {boolean} geofenceData.active - The active status of the geofence.
  * @returns {Promise<Object>} The updated geofence data.
  * @throws Will throw an error if the request fails.
  */
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
                  geom: {
                    srid: ${geofenceData.geom.srid},
                    coordinates: [
                      ${geofenceData.geom.coordinates.map(coord => `{
                          longitude: ${coord.longitude},
                          latitude: ${coord.latitude}
                      }`).join(',')}
                    ]
                  },
                  geofenceId: "${geofenceData.geofenceId}"
                  description: ${formatValue(geofenceData.description)}
                  color: ${geofenceData.color}
                  active: ${geofenceData.active}
                }
              }
              id: "${geofenceId}"
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

   /**
  * Deletes a geofence by its ID.
  * 
  * @function deleteGeofence
  * @param {string} geofenceId - The ID of the geofence to delete.
  * @returns {Promise<boolean>} True if the geofence was deleted successfully, false otherwise.
  * @throws Will throw an error if the request fails.
  */
  const deleteGeofence = async (geofenceId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteGeofence(id: "${geofenceId}") 
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
