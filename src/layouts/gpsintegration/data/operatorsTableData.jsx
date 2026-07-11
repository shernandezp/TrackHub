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

import { useEffect, useState, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { NameDetail, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useCredentialService from "services/credential";
import { pingOperator } from "api/router/router";
import {
  useOperatorsByCurrentAccount,
  useCreateOperator,
  useUpdateOperator,
  useDeleteOperator,
  useSetOperatorEnabled,
  useTriggerOperatorDeviceSync,
} from "queries/operators";
import { formatDateTime } from "utils/dateUtils";
import { handleSaveCredential, handleTestCredential } from "layouts/gpsintegration/actions/credentialActions";
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";
import { notifyGpsIntegrationRefresh } from "layouts/gpsintegration/gpsIntegrationEvents";

function healthBadgeColor(status) {
  switch ((status || '').toUpperCase()) {
    case 'HEALTHY': return 'success';
    case 'DEGRADED': return 'warning';
    case 'OFFLINE': return 'error';
    case 'DISABLED': return 'secondary';
    default: return 'secondary';
  }
}

function useOperatorTableData(fetchData, handleEditClick, handleEditCredentialClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openCredential, setOpenCredential] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [syncingMap, setSyncingMap] = useState({});
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const operatorsQuery = useOperatorsByCurrentAccount({ enabled: !!fetchData && isAuthenticated });
  const operators = operatorsQuery.data ?? [];
  const createOperator = useCreateOperator();
  const updateOperator = useUpdateOperator();
  const deleteOperator = useDeleteOperator();
  const setOperatorEnabled = useSetOperatorEnabled();
  const triggerOperatorDeviceSync = useTriggerOperatorDeviceSync();
  const { getCredentialByOperator, createCredential, updateCredential } = useCredentialService();

  // Keep the global spinner UX for the initial load / invalidation refetch.
  useEffect(() => {
    setLoading(operatorsQuery.isFetching);
  }, [operatorsQuery.isFetching, setLoading]);

  // Silent op: connectivity failures surface in the test dialog, not the
  // global toast, so call the api function directly and swallow the error.
  const testConnectivity = async (operatorId) => {
    try {
      return await pingOperator(operatorId);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error(error);
      return false;
    }
  };

  const healthLabel = (status) => {
    const key = (status || 'unknown').toLowerCase();
    return t(`gpsIntegration.health.${key}`, { defaultValue: status || t('gpsIntegration.health.unknown') });
  };

  const onSave = async (operator) => {
    setLoading(true);
    try {
      if (operator.operatorId) {
        await updateOperator.mutateAsync({ operatorId: operator.operatorId, ...operator });
      } else {
        await createOperator.mutateAsync(operator);
      }
      setOpen(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open so the
      // user can retry without re-entering the values.
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (operatorId) => {
    setLoading(true);
    try {
      await deleteOperator.mutateAsync(operatorId);
      setConfirmOpen(false);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const onSaveCredential = async (credential) => {
    setLoading(true);
    try {
      await handleSaveCredential(
        credential,
        createCredential,
        updateCredential);
        setOpenCredential(false);
        await operatorsQuery.refetch();
        notifyGpsIntegrationRefresh();
      } finally {
        setLoading(false);
      }
  };

  const handleOpen = (operator) => {
    handleEditClick(operator);
    setOpen(true);
  };

  const handleOpenCredential = async (operatorId) => {
    const credential = await getCredentialByOperator(operatorId) || { operatorId };
    handleEditCredentialClick(credential);
    setOpenCredential(true);
  };

  const handleOpenDelete = (operatorId) => {
    handleDeleteClick(operatorId);
    setConfirmOpen(true);
  };

  const onTestCredential = async (operatorId) => {
    setLoading(true);
    try {
      let result = await handleTestCredential(
        operatorId,
        testConnectivity);
      setTestTitle(t('credential.connectivityTest'));
      setTestMessage(result ? t('credential.testSuccess') : t('credential.testError'));
      setTestOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (operator) => {
    setLoading(true);
    try {
      // Mutation success invalidates the operators cache, so the list refetches
      // with the new enabled/health values (replaces the old manual re-read).
      await setOperatorEnabled.mutateAsync({ operatorId: operator.operatorId, enabled: !operator.enabled });
      notifyGpsIntegrationRefresh();
    } catch {
      // Failure is surfaced by the global toast; the cache is left unchanged.
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (operator, resetDeviceCatalog = false) => {
    setLoading(true);
    try {
      setSyncingMap(prev => ({ ...prev, [operator.operatorId]: true }));
      const completed = await triggerOperatorDeviceSync.mutateAsync({
        operatorId: operator.operatorId,
        resetDeviceCatalog,
      });
      if (!completed) {
        setTestTitle(t('gpsIntegration.actions.sync'));
        setTestMessage(t('gpsIntegration.actions.syncNotCompleted'));
        setTestOpen(true);
      }
      notifyGpsIntegrationRefresh();
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setSyncingMap(prev => ({ ...prev, [operator.operatorId]: false }));
      setLoading(false);
    }
  };

  const handleResetSync = async (operator) => {
    if (!window.confirm(t('gpsIntegration.actions.resetSyncConfirm'))) return;
    await handleSync(operator, true);
  };

  const buildTableData = (operators) => ({
    columns: [
      { name: "name", title:t('operator.name'), align: "left" },
      { name: "description", title:t('operator.description'), align: "left" },
      { name: "contactname", title:t('operator.contactName'), align: "left" },
      { name: "protocoltype", title:t('operator.type'), align: "center" },
      { name: "syncInterval", title:t('gpsIntegration.columns.syncInterval'), align: "center" },
      { name: "enabled", title:t('generic.enabled'), align: "center" },
      { name: "health", title:t('gpsIntegration.columns.health'), align: "center" },
      { name: "lastSuccess", title:t('gpsIntegration.columns.lastSuccess'), align: "center" },
      { name: "modified", title:t('generic.modified'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "testcredential", title:t('credential.testCredential'), align: "center" },
      { name: "gpsActions", title:t('gpsIntegration.sections.operators'), align: "center" },
      { name: "id" }
    ],
    rows: operators.map(operator => ({
      name: <NameDetail name={operator.name} detail={operator.emailAddress} />,
      description: <Description description={operator.description} />,
      contactname: <Description description={operator.contactName} />,
      protocoltype: (
        <ArgonBadge variant="gradient" badgeContent={operator.protocolType} color="success" size="xs" container />
      ),
      syncInterval: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {operator.syncIntervalMinutes ?? 30}
        </ArgonTypography>
      ),
      enabled: (
        <ArgonBadge
          variant="gradient"
          badgeContent={operator.enabled ? t('generic.yes') : t('generic.no')}
          color={operator.enabled ? 'success' : 'secondary'}
          size="xs"
          container
        />
      ),
      health: (
        <ArgonBadge
          variant="gradient"
          badgeContent={healthLabel(operator.healthStatus)}
          color={healthBadgeColor(operator.healthStatus)}
          size="xs"
          container
        />
      ),
      lastSuccess: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(operator.lastSuccessfulSyncAt)}
        </ArgonTypography>
      ),
      modified: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(operator.lastModified)}
        </ArgonTypography>
      ),
      action: (
        <>
            <ArgonButton
                variant="text"
                color="dark"
                onClick={() => handleOpen(operator)}>
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton variant="text" color="dark" onClick={() => handleToggleEnabled(operator)}>
              <Icon>power_settings_new</Icon>&nbsp;{operator.enabled ? t('generic.disable') : t('generic.enable')}
            </ArgonButton>
            <ArgonButton
              variant="text"
              color="error"
              onClick={() => handleOpenDelete(operator.operatorId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
            </ArgonButton>
        </>
      ),
      testcredential: (
        <ArgonButton
            variant="text"
            color="dark"
            onClick={async() => await onTestCredential(operator.operatorId)}>
          <Icon>check</Icon>
        </ArgonButton>
      ),
      gpsActions: (
        <>
          <ArgonButton variant="text" color="info" onClick={() => handleSync(operator)} disabled={!!syncingMap[operator.operatorId]}>
            <Icon>sync</Icon>&nbsp;{t('gpsIntegration.actions.sync')}
          </ArgonButton>
          <ArgonButton variant="text" color="warning" onClick={async() => await handleOpenCredential(operator.operatorId)}>
            <Icon>vpn_key</Icon>&nbsp;{t('credential.title')}
          </ArgonButton>
          <ArgonButton variant="text" color="warning" onClick={() => handleResetSync(operator)} disabled={!!syncingMap[operator.operatorId]}>
            <Icon>restart_alt</Icon>&nbsp;{t('gpsIntegration.actions.resetSync')}
          </ArgonButton>
        </>
      ),
      id: operator.operatorId
    })),
  });

  const data = buildTableData(operators);

  return {
    data,
    open,
    openCredential,
    confirmOpen,
    testOpen,
    testTitle,
    testMessage,
    onSave,
    onDelete,
    onSaveCredential,
    setOpen,
    setOpenCredential,
    setConfirmOpen,
    setTestOpen
  };
}

export default useOperatorTableData;
