import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useAccountService from "services/account";
import useUserService from "services/users";
import { handleSave } from "layouts/systemadmin/actions/accountsActions";
import { formatDateTime } from "utils/dateUtils";
import { LoadingContext } from 'LoadingContext';
import accountTypes from "layouts/systemadmin/data/accountTypes";

function useAccountsTableData(fetchData, handleEditClick, handleAddManagerClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getAccounts, createAccount, updateAccount } = useAccountService();
  const { createManager } = useUserService();

  const onSave = async (account) => {
    setLoading(true);
    await handleSave(
      account, 
      accounts, 
      setAccounts, 
      setData, 
      buildTableData, 
      createAccount, 
      updateAccount,
      accountTypes);

    setOpen(false);
    setLoading(false);
  };

  const onSaveUser = async (user) => {
    setLoading(true);
    await createManager(user, user.accountId);
    setOpenUser(false);
    setLoading(false);
  };

  const handleOpen = (account) => {
    handleEditClick(account);
    setOpen(true);
  };

  const handleOpenUser = (accountId) => {
    handleAddManagerClick(accountId);
    setOpenUser(true);
  };

  const buildTableData = (accounts) => ({
    columns: [
      { name: "name", title:t('account.name'), align: "left" },
      { name: "description", title:t('account.description'), align: "left" },
      { name: "type", title:t('account.type'), align: "center" },
      { name: "modified", title:t('generic.modified'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "user", title:t('account.addUser'), align: "center" },
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
          <Icon>edit</Icon>&nbsp;{t('generic.edit')}
        </ArgonButton>
      ),
      user: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpenUser(account.accountId)}>
          <Icon>add</Icon>&nbsp;{t('generic.add')}
        </ArgonButton>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const accounts = await getAccounts();
        setAccounts(accounts);
        setData(buildTableData(accounts));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    open,
    openUser,
    onSave,
    onSaveUser,
    setOpen,
    setOpenUser,};
}

export default useAccountsTableData;