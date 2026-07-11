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

import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useAccountService from "services/account";
import { useCreateManager } from "queries/users";
import { handleSave } from "layouts/systemadmin/actions/accountsActions";
import { formatDateTime } from "utils/dateUtils";
import { LoadingContext } from 'LoadingContext';
import accountTypes from "data/accountTypes";
import {
  ACCOUNT_STATUS_NAME,
  ACCOUNT_STATUS_COLOR,
  ACCOUNT_STATUS_I18N,
  ALLOWED_TRANSITIONS
} from "data/accountStatuses";

function useAccountsTableData(fetchData, handleEditClick, handleAddManagerClick, handleStatusClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getAccounts, createAccount, updateAccount, changeAccountStatus } = useAccountService();
  const createManager = useCreateManager();

  const onSave = async (account) => {
    setLoading(true);
    try {
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
      const updated = await changeAccountStatus(
        statusValues.accountId, statusValues.targetStatus, statusValues.reason);
      if (updated) {
        const next = accounts.map(a =>
          a.accountId === updated.accountId ? { ...a, ...updated } : a);
        setAccounts(next);
        setData(buildTableData(next));
      }
      setOpenStatus(false);
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
    openStatus,
    onSave,
    onSaveUser,
    onChangeStatus,
    setOpen,
    setOpenUser,
    setOpenStatus,};
}

export default useAccountsTableData;