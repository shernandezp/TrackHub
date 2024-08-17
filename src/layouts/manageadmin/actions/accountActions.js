
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