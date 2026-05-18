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
const useSupportGrantService = () => {
  const { execute } = useManagerGraphQL();

  const getSupportGrantStatus = async (accountSupportGrantId) => execute(`
    query {
      supportGrantStatus(query: { accountSupportGrantId: ${formatValue(accountSupportGrantId)} }) {
        accountSupportGrantId
        accountId
        supportUserId
        reason
        ticketReference
        approvedBy
        approvedAt
        accessLevel
        startsAt
        endsAt
        revokedAt
        revokedBy
        lastModified
      }
    }
  `, data => data.supportGrantStatus, null);

  const getAccountSupportGrants = async (accountId, skip = 0, take = 50) => execute(`
    query {
      accountSupportGrants(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        accountSupportGrantId
        accountId
        supportUserId
        reason
        ticketReference
        approvedBy
        approvedAt
        accessLevel
        startsAt
        endsAt
        revokedAt
        revokedBy
        lastModified
      }
    }
  `, data => data.accountSupportGrants, []);

  const createAccountSupportGrant = async (grant) => execute(`
    mutation {
      createAccountSupportGrant(command: { accountSupportGrant: {
        accountId: ${formatValue(grant.accountId)}
        supportUserId: ${formatValue(grant.supportUserId)}
        reason: ${formatValue(grant.reason)}
        ticketReference: ${formatValue(grant.ticketReference)}
        accessLevel: ${formatValue(grant.accessLevel)}
        startsAt: ${formatValue(grant.startsAt)}
        endsAt: ${formatValue(grant.endsAt)}
      }}) {
        accountSupportGrantId
        accountId
        supportUserId
        approvedAt
        revokedAt
        lastModified
      }
    }
  `, data => data.createAccountSupportGrant, null);

  const approveAccountSupportGrant = async (accountSupportGrantId, approvedBy) => execute(`
    mutation {
      approveAccountSupportGrant(command: { accountSupportGrantId: ${formatValue(accountSupportGrantId)}, approvedBy: ${formatValue(approvedBy)} })
    }
  `, data => data.approveAccountSupportGrant, false);

  const revokeAccountSupportGrant = async (accountSupportGrantId, revokedBy) => execute(`
    mutation {
      revokeAccountSupportGrant(command: { accountSupportGrantId: ${formatValue(accountSupportGrantId)}, revokedBy: ${formatValue(revokedBy)} })
    }
  `, data => data.revokeAccountSupportGrant, false);

  return { getSupportGrantStatus, getAccountSupportGrants, createAccountSupportGrant, approveAccountSupportGrant, revokeAccountSupportGrant };
};

export default useSupportGrantService;

