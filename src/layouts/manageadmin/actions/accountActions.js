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