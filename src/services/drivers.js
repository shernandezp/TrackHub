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
const useDriverService = () => {
  const { execute } = useManagerGraphQL();

  const getDriversByAccount = async (accountId, skip = 0, take = 50) => execute(`
    query {
      driversByAccount(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        driverId
        accountId
        name
        phone
        documentType
        documentNumber
        active
        employeeCode
        licenseNumber
        licenseExpiresAt
        defaultTransporterId
        lastModified
      }
    }
  `, data => data.driversByAccount, []);

  const createDriver = async (driver) => execute(`
    mutation {
      createDriver(command: { driver: {
        accountId: ${formatValue(driver.accountId)}
        name: ${formatValue(driver.name)}
        phone: ${formatValue(driver.phone)}
        documentType: ${formatValue(driver.documentType)}
        documentNumber: ${formatValue(driver.documentNumber)}
        active: ${driver.active}
        employeeCode: ${formatValue(driver.employeeCode)}
        licenseNumber: ${formatValue(driver.licenseNumber)}
        licenseExpiresAt: ${formatValue(driver.licenseExpiresAt)}
        defaultTransporterId: ${formatValue(driver.defaultTransporterId)}
      }}) {
        driverId
        accountId
        name
        active
        lastModified
      }
    }
  `, data => data.createDriver, null);

  const updateDriver = async (driverId, driver) => execute(`
    mutation {
      updateDriver(command: { driverId: ${formatValue(driverId)}, driver: {
        accountId: ${formatValue(driver.accountId)}
        name: ${formatValue(driver.name)}
        phone: ${formatValue(driver.phone)}
        documentType: ${formatValue(driver.documentType)}
        documentNumber: ${formatValue(driver.documentNumber)}
        active: ${driver.active}
        employeeCode: ${formatValue(driver.employeeCode)}
        licenseNumber: ${formatValue(driver.licenseNumber)}
        licenseExpiresAt: ${formatValue(driver.licenseExpiresAt)}
        defaultTransporterId: ${formatValue(driver.defaultTransporterId)}
      }})
    }
  `, data => data.updateDriver, false);

  const deactivateDriver = async (driverId) => execute(`
    mutation {
      deactivateDriver(command: { driverId: ${formatValue(driverId)} })
    }
  `, data => data.deactivateDriver, false);

  return { getDriversByAccount, createDriver, updateDriver, deactivateDriver };
};

export default useDriverService;

