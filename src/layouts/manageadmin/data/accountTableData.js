import { useEffect, useState, useRef } from "react";
import {Name, Description} from "controls/Tables/components/tableComponents";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import Icon from "@mui/material/Icon";
import useAccountService from "services/account";
import { formatDateTime } from "utils/dateUtils";

function useAccountTableData(fetchData, handleRowClick) {
  const [data, setData] = useState({ columns: [], rows: [] });
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const hasLoaded = useRef(false);
  const { getAccountByUser, updateAccount } = useAccountService();

  const handleSave = async (account) => {
    let response = await updateAccount(account.accountId, account);
    if (response) {
      const updatedAccounts = [...accounts];
      const index = updatedAccounts.findIndex(a => a.accountId === account.accountId);
      updatedAccounts[index] = account;
      setAccounts(updatedAccounts);
      setData(buildTableData(updatedAccounts));
    }
  };

  const handleOpen = (account) => {
    handleRowClick(account);
    setOpen(true);
  };

  const buildTableData = (accounts) => ({
    columns: [
      { name: "name", align: "left" },
      { name: "description", align: "left" },
      { name: "type", align: "center" },
      { name: "modified", align: "center" },
      { name: "action", align: "center" },
    ],
    rows: accounts.map(account => ({
      name: <Name name={account.name} />,
      description: <Description description={account.description} />,
      type: (
        <ArgonBadge variant="gradient" badgeContent={account.type} color="success" size="xs" container />
      ),
      modified: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(account.lastModified)}
        </ArgonTypography>
      ),
      action: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpen(account)}>
          <Icon>edit</Icon>&nbsp;Edit
        </ArgonButton>
      ),
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        const account = await getAccountByUser();
        const accounts = [account];
        setAccounts(accounts);
        setData(buildTableData(accounts));
        hasLoaded.current = true;
      }
      fetchData();
    }
  }, [fetchData]);

  return { data, open, handleSave, setOpen };
}

export default useAccountTableData;