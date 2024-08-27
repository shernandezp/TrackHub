import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { NameDetail } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import useUserService from "services/users";
import { handleDelete, handleSave, handleUpdatePassword } from "layouts/manageadmin/actions/usersActions";
import { LoadingContext } from 'LoadingContext';

function useUserTableData(fetchData, handleEditClick, handleUpdatePasswordClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getUsersByAccount, createUser, updateUser, deleteUser, updatePassword } = useUserService();

  const onSave = async (user) => {
    setLoading(true);
    await handleSave(
      user, 
      users, 
      setUsers, 
      setData, 
      buildTableData, 
      createUser, 
      updateUser);

      setOpen(false);
      setLoading(false);
  };

  const onDelete = async (userId) => {
    setLoading(true);
    await handleDelete(
      userId, 
      users, 
      setUsers, 
      setData, 
      buildTableData, 
      deleteUser);
      setConfirmOpen(false);
      setLoading(false);
  }

  const onSavePassword = async (user) => {
    setLoading(true);
    await handleUpdatePassword(
      user, 
      updatePassword);

      setOpenPassword(false);
      setLoading(false);
  };

  const handleOpen = (user) => {
    handleEditClick(user);
    setOpen(true);
  };

  const handleOpenPassword = async (userId) => {
    const user = { userId };
    handleUpdatePasswordClick(user);
    setOpenPassword(true);
  };

  const handleOpenDelete = (userId) => {
    handleDeleteClick(userId);
    setConfirmOpen(true);
  };

  const buildTableData = (users) => ({
    columns: [
      { name: "user", title:t('user.username'), align: "left" },
      { name: "firstName", title:t('user.firstName'), align: "left" },
      { name: "lastName", title:t('user.lastName'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "password", title:t('user.password'), align: "center" },
    ],
    rows: users.map(user => ({
      user: <NameDetail name={user.emailAddress} detail={user.username} />,
      firstName: <NameDetail name={user.firstName} detail={user.secondName || ''} />,
      lastName: <NameDetail name={user.lastName} detail={user.secondSurname || ''} />,
      action: (
        <>
            <ArgonButton 
                variant="text" 
                color="dark" 
                onClick={() => handleOpen(user)}>
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(user.userId)}>
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
          onClick={async() => await handleOpenPassword(user.userId)}
        >
          {t('user.password')}
        </ArgonTypography>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const users = await getUsersByAccount();
        setUsers(users);
        setData(buildTableData(users));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    open, 
    openPassword, 
    confirmOpen,
    onSave, 
    onDelete, 
    onSavePassword,
    setOpen, 
    setOpenPassword, 
    setConfirmOpen };
}

export default useUserTableData;