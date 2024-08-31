import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { NameDetail } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import useAccountService from "services/accounts";
import useUserService from "services/users";
import { handleSave, handleDelete } from "layouts/manageadmin/actions/accountsActions";
import { LoadingContext } from 'LoadingContext';

function useAccountTableData(fetchData, handleEditClick, handleAddAccountClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getAccounts, createAccount, updateAccount, disableAccount } = useAccountService();
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
      updateAccount);

      setOpen(false);
      setLoading(false);
  };

  const onDelete = async (accountId) => {
    setLoading(true);
    await handleDelete(
      accountId, 
      accounts, 
      setAccounts, 
      setData, 
      buildTableData, 
      disableAccount);
      setConfirmOpen(false);
      setLoading(false);
  }

  const onSaveUser = async (user, accountId) => {
    setLoading(true);
      await createManager(user, accountId);

      setOpenUser(false);
      setLoading(false);
  };

  const handleOpen = (account) => {
    handleEditClick(account);
    setOpen(true);
  };

  const handleOpenUser = async (accountId) => {
    const user = { type: 0, accountId: accountId };
    handleAddAccountClick(user);
    setOpenUser(true);
  };

  const handleOpenDelete = (accountId) => {
    handleDeleteClick(accountId);
    setConfirmOpen(true);
  };

  const buildTableData = (accounts) => ({
    columns: [
      { name: "user", title:t('account.username'), align: "left" },
      { name: "firstName", title:t('account.firstName'), align: "left" },
      { name: "lastName", title:t('account.lastName'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "password", title:t('user.password'), align: "center" },
    ],
    rows: accounts.map(account => ({
      user: <NameDetail name={account.emailAddress} detail={account.username} />,
      firstName: <NameDetail name={account.firstName} detail={account.secondName || ''} />,
      lastName: <NameDetail name={account.lastName} detail={account.secondSurname || ''} />,
      action: (
        <>
            <ArgonButton 
                variant="text" 
                color="dark" 
                onClick={() => handleOpen(account)}>
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(account.accountId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
            </ArgonButton>
        </>
      ),
      password: (
        <ArgonTypography
          component="a"
          href="#"
          variant="caption"
          color="secondary"
          fontWeight="medium"
          onClick={async() => await handleOpenUser(account.accountId)}
        >
          {t('account.password')}
        </ArgonTypography>
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
    openAccount, 
    confirmOpen,
    onSave, 
    onDelete, 
    onSaveUser,
    setOpen, 
    setOpenAccount, 
    setConfirmOpen };
}

export default useAccountTableData;