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
 * Handles saving an account.
 *
 * @param {Object} account - The account object to be saved.
 * @param {Array} accounts - The array of existing accounts.
 * @param {Function} setAccounts - The function to update the accounts state.
 * @param {Function} setData - The function to update the data state.
 * @param {Function} buildTableData - The function to build table data.
 * @param {Function} updateAccount - The function to update an account.
 * @returns {Promise<void>} - A promise that resolves when the account is saved.
 */
export async function handleSave(account, accounts, setAccounts, setData, buildTableData, updateAccount) {
    let response = await updateAccount(account.accountId, account);
    if (response) {
      const updatedAccounts = [...accounts];
      const index = updatedAccounts.findIndex(a => a.accountId === account.accountId);
      updatedAccounts[index] = account;
      setAccounts(updatedAccounts);
      setData(buildTableData(updatedAccounts));
    }
}