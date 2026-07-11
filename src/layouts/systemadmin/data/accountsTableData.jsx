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
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useChangeAccountStatus,
} from "queries/accounts";
import { useCreateManager } from "queries/users";
import { formatDateTime } from "utils/dateUtils";
import { LoadingContext } from 'LoadingContext';
import {
  ACCOUNT_STATUS_NAME,
  ACCOUNT_STATUS_COLOR,
  ACCOUNT_STATUS_I18N,
  ALLOWED_TRANSITIONS
} from "data/accountStatuses";

function useAccountsTableData(fetchData, handleEditClick, handleAddManagerClick, handleStatusClick) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const accountsQuery = useAccounts({ enabled: !!fetchData });
  const accounts = accountsQuery.data ?? [];
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const changeAccountStatus = useChangeAccountStatus();
  const createManager = useCreateManager();

  // Keep the global spinner UX for the initial load / invalidation refetch.
  useEffect(() => {
    setLoading(accountsQuery.isFetching);
  }, [accountsQuery.isFetching, setLoading]);

  const onSave = async (account) => {
    setLoading(true);
    try {
      if (account.accountId) {
        await updateAccount.mutateAsync({
          accountId: account.accountId,
          name: account.name,
          description: account.description,
          typeId: account.typeId,
          active: account.active,
        });
      } else {
        await createAccount.mutateAsync({
          active: account.active,
          typeId: account.typeId,
          password: account.password,
          name: account.name,
          lastName: account.lastName,
          firstName: account.firstName,
          emailAddress: account.emailAddress,
          description: account.description,
        });
      }
      setOpen(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open so the
      // user can retry without re-entering the values.
    } finally {
      setLoading(false);
    }
  };

  const onSaveUser = async (user) => {
    setLoading(true);
    try {
      await createManager.mutateAsync({ user, accountId: user.accountId });
      setOpenUser(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open.
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (account) => {
    handleEditClick(account);
    setOpen(true);
  };

  const handleOpenUser = (accountId) => {
    handleAddManagerClick(accountId);
    setOpenUser(true);
  };

  const handleOpenStatus = (account) => {
    handleStatusClick(account);
    setOpenStatus(true);
  };

  const onChangeStatus = async (statusValues) => {
    setLoading(true);
    try {
      await changeAccountStatus.mutateAsync({
        accountId: statusValues.accountId,
        targetStatus: statusValues.targetStatus,
        reason: statusValues.reason,
      });
      setOpenStatus(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open.
    } finally {
      setLoading(false);
    }
  };

  const buildTableData = (accounts) => ({
    columns: [
      { name: "name", title:t('account.name'), align: "left" },
      { name: "description", title:t('account.description'), align: "left" },
      { name: "type", title:t('account.type'), align: "center" },
      { name: "status", title:t('account.status'), align: "center" },
      { name: "modified", title:t('generic.modified'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "lifecycle", title:t('account.changeStatus'), align: "center" },
      { name: "user", title:t('account.addUser'), align: "center" },
      { name: "id" }
    ],
    rows: accounts.map(account => ({
      name: <Name name={account.name} />,
      description: <Description description={account.description} />,
      type: (
        <ArgonBadge variant="gradient" badgeContent={account.type} color="success" size="xs" container />
      ),
      status: (() => {
        const name = ACCOUNT_STATUS_NAME[account.statusId] || 'ACTIVE';
        return (
          <ArgonBadge
            variant="gradient"
            badgeContent={t(ACCOUNT_STATUS_I18N[name])}
            color={ACCOUNT_STATUS_COLOR[name]}
            size="xs"
            container />
        );
      })(),
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
      lifecycle: (
        (ALLOWED_TRANSITIONS[account.statusId] || []).length > 0 ? (
          <ArgonButton
              variant="text"
              color="dark"
              onClick={() => handleOpenStatus(account)}>
            <Icon>sync_alt</Icon>&nbsp;{t('account.changeStatus')}
          </ArgonButton>
        ) : null
      ),
      user: (
        <ArgonButton
            variant="text"
            color="dark"
            onClick={() => handleOpenUser(account.accountId)}>
          <Icon>add</Icon>&nbsp;{t('generic.add')}
        </ArgonButton>
      ),
      id: account.accountId
    })),
  });

  const data = useMemo(
    () => buildTableData(accounts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts, t]
  );

  return {
    data,
    open,
    openUser,
    openStatus,
    onSave,
    onSaveUser,
    onChangeStatus,
    setOpen,
    setOpenUser,
    setOpenStatus,};
}

export default useAccountsTableData;
