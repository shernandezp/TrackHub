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

import { useEffect, useMemo, useState, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { NameDetail } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import {
  useUsersByAccount,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdatePassword,
  useUnlockUser,
} from "queries/users";
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function useUserTableData(fetchData, handleEditClick, handleUpdatePasswordClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const usersQuery = useUsersByAccount({ enabled: !!fetchData && isAuthenticated });
  const users = usersQuery.data ?? [];
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();
  const unlockUser = useUnlockUser();

  // Keep the global spinner UX for the initial load / invalidation refetch.
  useEffect(() => {
    setLoading(usersQuery.isFetching);
  }, [usersQuery.isFetching, setLoading]);

  const isLocked = (user) => !!user.lockedUntil && new Date(user.lockedUntil) > new Date();

  const onUnlock = async (userId) => {
    setLoading(true);
    try {
      await unlockUser.mutateAsync(userId);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (user) => {
    setLoading(true);
    try {
      if (user.userId) {
        await updateUser.mutateAsync(user);
      } else {
        await createUser.mutateAsync(user);
      }
      setOpen(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open so the
      // user can retry without re-entering the values.
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (userId) => {
    setLoading(true);
    try {
      await deleteUser.mutateAsync(userId);
      setConfirmOpen(false);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const onSavePassword = async (user) => {
    setLoading(true);
    try {
      await updatePassword.mutateAsync({ userId: user.userId, password: user.password });
      setOpenPassword(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open.
    } finally {
      setLoading(false);
    }
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
      { name: "status", title:t('user.status'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "password", title:t('user.password'), align: "center" },
      { name: "id" }
    ],
    rows: users.map(user => ({
      user: <NameDetail name={user.emailAddress} detail={user.username} />,
      firstName: <NameDetail name={user.firstName} detail={user.secondName || ''} />,
      lastName: <NameDetail name={user.lastName} detail={user.secondSurname || ''} />,
      status: (
        isLocked(user) ? (
          <ArgonButton
            variant="text"
            color="warning"
            onClick={async () => await onUnlock(user.userId)}>
            <Icon>lock_open</Icon>&nbsp;{t('user.unlock')}
          </ArgonButton>
        ) : (
          <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
            {t('generic.active')}
          </ArgonTypography>
        )
      ),
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
      ),
      id: user.userId
    })),
  });

  const data = useMemo(
    () => buildTableData(users),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, t]
  );

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
