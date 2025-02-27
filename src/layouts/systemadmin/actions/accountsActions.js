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
 * Handles adding a new account.
 * @param {Object} account - The account to be added.
 * @param {Array} accounts - The current list of accounts.
 * @param {Function} setAccounts - The function to update the list of accounts.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createAccount - The function to create a new account.
 * @returns {Promise<void>}
 */
async function handleAdd(account, accounts, setAccounts, setData, buildTableData, createAccount) {
    let response = await createAccount(account);
    if (response) {
        const updatedAccounts = [...accounts, response];
        setAccounts(updatedAccounts);
        setData(buildTableData(updatedAccounts));
    }
}

/**
 * Handles editing an existing account.
 * @param {Object} account - The account to be edited.
 * @param {Array} accounts - The current list of accounts.
 * @param {Function} setAccounts - The function to update the list of accounts.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updateAccount - The function to update an existing account.
 * @param {Array} accountTypes - The list of account types.
 * @returns {Promise<void>}
 */
async function handleEdit(account, accounts, setAccounts, setData, buildTableData, updateAccount, accountTypes) {
    let response = await updateAccount(account.accountId, account);
    if (response) {
        const selectedType = accountTypes.find(pt => pt.value === account.typeId);
        account.type = selectedType.label;
        const updatedAccounts = [...accounts];
        const index = updatedAccounts.findIndex(a => a.accountId === account.accountId);
        updatedAccounts[index] = account;
        setAccounts(updatedAccounts);
        setData(buildTableData(updatedAccounts));
    }
}

/**
 * Handles saving an account. If the account has an accountId, it will be edited, otherwise it will be added.
 * @param {Object} account - The account to be saved.
 * @param {Array} accounts - The current list of accounts.
 * @param {Function} setAccounts - The function to update the list of accounts.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createAccount - The function to create a new account.
 * @param {Function} updateAccount - The function to update an existing account.
 * @param {Array} accountTypes - The list of account types.
 * @returns {Promise<void>}
 */
export async function handleSave(account, accounts, setAccounts, setData, buildTableData, createAccount, updateAccount, accountTypes) {
    if (!account.accountId) {
        await handleAdd(account, accounts, setAccounts, setData, buildTableData, createAccount);
    } else {
        await handleEdit(account, accounts, setAccounts, setData, buildTableData, updateAccount, accountTypes);
    }
}