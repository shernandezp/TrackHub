/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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
 * The `accountContext` bootstrap read lives here because it is a single-account read tied to
 * account identity; branding and features keep their own modules because they own CRUD screens.
 */

import { graphql } from './generated';

export const AccountItemFragment = graphql(`
  fragment AccountItem on AccountVm {
    accountId
    name
    description
    type
    typeId
    status
    statusId
    active
    timeZoneId
    lastModified
    version
  }
`);

export const GetAccountByUserDocument = graphql(`
  query GetAccountByUser {
    accountByUser {
      ...AccountItem
    }
  }
`);

export const GetAccountsDocument = graphql(`
  query GetAccounts($skip: Int, $take: Int, $search: String) {
    accounts(query: { skip: $skip, take: $take, search: $search }) {
      items {
        ...AccountItem
      }
      totalCount
    }
  }
`);

export const CreateAccountDocument = graphql(`
  mutation CreateAccount($account: AccountDtoInput!) {
    createAccount(command: { account: $account }) {
      ...AccountItem
    }
  }
`);

export const UpdateAccountDocument = graphql(`
  mutation UpdateAccount($id: UUID!, $account: UpdateAccountDtoInput!) {
    updateAccount(id: $id, command: { account: $account })
  }
`);

/**
 * The only account write that may target another account (`updateAccount` is the own-account
 * twin); gated by the Administrator-only AccountsMaster/Edit permission.
 */
export const UpdateAccountMasterDocument = graphql(`
  mutation UpdateAccountMaster($id: UUID!, $account: UpdateAccountDtoInput!) {
    updateAccountMaster(id: $id, command: { account: $account })
  }
`);

export const ChangeAccountStatusDocument = graphql(`
  mutation ChangeAccountStatus($accountId: UUID!, $targetStatus: AccountStatus!, $reason: String) {
    changeAccountStatus(
      command: { accountId: $accountId, targetStatus: $targetStatus, reason: $reason }
    ) {
      ...AccountItem
    }
  }
`);

/** Allowed on non-operational accounts so the shell can render a suspension state. */
export const GetAccountContextDocument = graphql(`
  query GetAccountContext {
    accountContext {
      status
      statusId
      timeZoneId
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
`);
