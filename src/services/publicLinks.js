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
const usePublicLinkService = () => {
  const { execute } = useManagerGraphQL();

  const getPublicLinkGrant = async (publicLinkGrantId) => execute(`
    query {
      publicLinkGrant(query: { publicLinkGrantId: ${formatValue(publicLinkGrantId)} }) {
        publicLinkGrantId
        accountId
        resourceType
        resourceId
        scopes
        purpose
        expiresAt
        revokedAt
        accessCount
        lastAccessedAt
        lastModified
      }
    }
  `, data => data.publicLinkGrant, null);

  const getPublicLinkGrantsByAccount = async (accountId, skip = 0, take = 50) => execute(`
    query {
      publicLinkGrantsByAccount(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        publicLinkGrantId
        accountId
        resourceType
        resourceId
        scopes
        purpose
        expiresAt
        revokedAt
        revokedBy
        createdByPrincipalId
        accessCount
        lastAccessedAt
        lastModified
      }
    }
  `, data => data.publicLinkGrantsByAccount, []);

  const createPublicLinkGrant = async (grant) => execute(`
    mutation {
      createPublicLinkGrant(command: { publicLinkGrant: {
        accountId: ${formatValue(grant.accountId)}
        resourceType: ${formatValue(grant.resourceType)}
        resourceId: ${formatValue(grant.resourceId)}
        scopes: ${formatValue(grant.scopes)}
        purpose: ${formatValue(grant.purpose)}
        subjectTokenIdHash: ${formatValue(grant.subjectTokenIdHash)}
        expiresAt: ${formatValue(grant.expiresAt)}
        createdByPrincipalId: ${formatValue(grant.createdByPrincipalId)}
      }}) {
        publicLinkGrantId
        accountId
        resourceType
        resourceId
        token
        expiresAt
        lastModified
      }
    }
  `, data => data.createPublicLinkGrant, null);

  const revokePublicLinkGrant = async (publicLinkGrantId, revokedBy) => execute(`
    mutation {
      revokePublicLinkGrant(command: { publicLinkGrantId: ${formatValue(publicLinkGrantId)}, revokedBy: ${formatValue(revokedBy)} })
    }
  `, data => data.revokePublicLinkGrant, false);

  return { getPublicLinkGrant, getPublicLinkGrantsByAccount, createPublicLinkGrant, revokePublicLinkGrant };
};

export default usePublicLinkService;

