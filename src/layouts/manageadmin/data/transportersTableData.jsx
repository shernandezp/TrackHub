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
import { Name } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useAccountService from "services/account";
import {
  useTransportersByAccount,
  useCreateTransporter,
  useUpdateTransporter,
  useDeleteTransporter,
} from 'queries/transporters';
import { cleanString } from 'utils/stringUtils';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function useTransporterTableData(fetchData, handleEditClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const { getAccountByUser } = useAccountService();

  const transportersQuery = useTransportersByAccount({ enabled: !!fetchData && isAuthenticated });
  const transporters = transportersQuery.data ?? [];
  const createTransporter = useCreateTransporter();
  const updateTransporter = useUpdateTransporter();
  const deleteTransporter = useDeleteTransporter();

  // Keep the global spinner UX for the initial load / invalidation refetch.
  useEffect(() => {
    setLoading(transportersQuery.isFetching);
  }, [transportersQuery.isFetching, setLoading]);

  // Current account id, required to create a transporter (TransporterDtoInput.accountId).
  // Loaded the same way sibling manageadmin screens (drivers, accountFeatures) obtain it.
  useEffect(() => {
    if (!!fetchData && isAuthenticated && !accountId) {
      getAccountByUser().then((account) => {
        if (account?.accountId) setAccountId(account.accountId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, isAuthenticated, accountId]);

  const handleOpen = (transporter) => {
    handleEditClick(transporter);
    setOpen(true);
  };

  const handleOpenDelete = (transporterId) => {
    handleDeleteClick(transporterId);
    setConfirmOpen(true);
  };

  const onSave = async (transporter) => {
    setLoading(true);
    try {
      if (transporter.transporterId) {
        await updateTransporter.mutateAsync({
          transporterId: transporter.transporterId,
          name: transporter.name,
          transporterTypeId: transporter.transporterTypeId,
        });
      } else {
        await createTransporter.mutateAsync({
          name: transporter.name,
          transporterTypeId: transporter.transporterTypeId,
          accountId,
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

  const onDelete = async (transporterId) => {
    setLoading(true);
    try {
      await deleteTransporter.mutateAsync(transporterId);
      setConfirmOpen(false);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const buildTableData = (rows) => ({
    columns: [
      { name: "name", title:t('transporter.name'), align: "left" },
      { name: "transporterType", title:t('transporter.type'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: rows.map(transporter => ({
      name: <Name name={transporter.name} />,
      transporterType: (
        <ArgonBadge variant="gradient"
          badgeContent={t(`transporterTypes.${cleanString(transporter.transporterType)}`)}
          color="success" size="xs" container />
      ),
      action: (
        <>
          <ArgonButton
              variant="text"
              color="dark"
              onClick={() => handleOpen(transporter)}>
            <Icon>edit</Icon>&nbsp;{t('generic.edit')}
          </ArgonButton>
          <ArgonButton
            variant="text"
            color="error"
            onClick={() => handleOpenDelete(transporter.transporterId)}>
            <Icon>delete</Icon>&nbsp;{t('generic.delete')}
          </ArgonButton>
        </>
      ),
      id: transporter.transporterId
    })),
  });

  const data = useMemo(
    () => buildTableData(transporters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transporters, t]
  );

  return {
    data,
    open,
    confirmOpen,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen };
}

export default useTransporterTableData;
