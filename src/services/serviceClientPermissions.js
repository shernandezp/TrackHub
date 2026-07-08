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

/**
 * A module that provides functions for interacting with service client permission data.
 * @module useServiceClientPermissionService
 */
import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

const useServiceClientPermissionService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

  /**
   * Retrieves a paged list of service client permissions, optionally filtered by client/account.
   */
  const getServiceClientPermissions = async (clientId = null, accountId = null, skip = 0, take = 50) => {
    try {
      const data = {
        query: `
          query {
            serviceClientPermissions(
              query: {
                clientId: ${formatValue(clientId)},
                accountId: ${formatValue(accountId)},
                skip: ${skip},
                take: ${take}
              }
            ) {
              serviceClientPermissionId
              clientId
              accountId
              resource
              action
              scope
              audience
              active
              effectiveFrom
              effectiveTo
              lastModified
            }
          }
        `
      };
      const response = await post(data);
      return response.data.serviceClientPermissions;
    } catch (error) {
      handleError(error);
    }
  };

  const createServiceClientPermission = async (permission) => {
    try {
      const data = {
        query: `
          mutation {
            createServiceClientPermission(
              command: {
                permission: {
                  clientId: ${formatValue(permission.clientId)},
                  accountId: ${formatValue(permission.accountId)},
                  resource: ${formatValue(permission.resource)},
                  action: ${formatValue(permission.action)},
                  scope: ${formatValue(permission.scope)},
                  audience: ${formatValue(permission.audience)},
                  active: ${permission.active ? 'true' : 'false'},
                  effectiveFrom: ${formatValue(permission.effectiveFrom)},
                  effectiveTo: ${formatValue(permission.effectiveTo)}
                }
              }
            ) {
              serviceClientPermissionId
              clientId
              resource
              action
              scope
              audience
              active
              effectiveFrom
              effectiveTo
              lastModified
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createServiceClientPermission;
    } catch (error) {
      handleError(error);
    }
  };

  const updateServiceClientPermission = async (serviceClientPermissionId, permission) => {
    try {
      const data = {
        query: `
          mutation {
            updateServiceClientPermission(
              command: {
                serviceClientPermissionId: "${serviceClientPermissionId}",
                permission: {
                  clientId: ${formatValue(permission.clientId)},
                  accountId: ${formatValue(permission.accountId)},
                  resource: ${formatValue(permission.resource)},
                  action: ${formatValue(permission.action)},
                  scope: ${formatValue(permission.scope)},
                  audience: ${formatValue(permission.audience)},
                  active: ${permission.active ? 'true' : 'false'},
                  effectiveFrom: ${formatValue(permission.effectiveFrom)},
                  effectiveTo: ${formatValue(permission.effectiveTo)}
                }
              }
            )
          }
        `
      };
      const response = await post(data);
      return response.data.updateServiceClientPermission;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const deleteServiceClientPermission = async (serviceClientPermissionId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteServiceClientPermission(command: { serviceClientPermissionId: "${serviceClientPermissionId}" })
          }
        `
      };
      const response = await post(data);
      return response.data.deleteServiceClientPermission;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getServiceClientPermissions,
    createServiceClientPermission,
    updateServiceClientPermission,
    deleteServiceClientPermission
  };
};

export default useServiceClientPermissionService;
