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
import { NameDetail, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import protocolTypes from 'data/protocolTypes';
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useOperatorService from "services/operator";
import useCredentialService from "services/credential";
import useRouterService from "services/router";
import useDeviceService from "services/device";
import { formatDateTime } from "utils/dateUtils";
import { handleSaveCredential, handleTestCredential } from "layouts/gpsintegration/actions/credentialActions";
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";
import { useNotification } from "context/NotificationContext";

function healthBadgeColor(status) {
  switch ((status || '').toUpperCase()) {
    case 'HEALTHY': return 'success';
    case 'DEGRADED': return 'warning';
    case 'OFFLINE': return 'error';
    default: return 'secondary';
  }
}

function useOperatorTableData(fetchData, handleEditClick, handleEditCredentialClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [operators, setOperators] = useState([]);
  const [open, setOpen] = useState(false);
  const [openCredential, setOpenCredential] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotateOperator, setRotateOperator] = useState(null);
  const [syncingMap, setSyncingMap] = useState({});
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const { showWarning } = useNotification();

  const hasLoaded = useRef(false);
  const {
    getOperatorsByCurrentAccount,
    updateOperator,
    createOperator,
    deleteOperator,
    getOperatorSyncRuns,
    getOperatorHealthHistory,
    setOperatorEnabled,
    triggerOperatorDeviceSync
  } = useOperatorService();
  const { getCredentialByOperator, createCredential, updateCredential } = useCredentialService();
  const { testConnectivity } = useRouterService();
  const { wipeDevices } = useDeviceService();

  const updateOperatorRows = (nextOperators) => {
    setOperators(nextOperators);
    setData(buildTableData(nextOperators));
  };

  const refreshOperators = async () => {
    const nextOperators = await getOperatorsByCurrentAccount() || [];
    updateOperatorRows(nextOperators);
  };

  const onSave = async (operator) => {
    setLoading(true);
    try {
      if (operator.operatorId) await updateOperator(operator.operatorId, operator);
      else await createOperator(operator);
      setOpen(false);
      await refreshOperators();
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (operatorId) => {
    setLoading(true);
    try {
      const response = await deleteOperator(operatorId);
      if (response) {
        setConfirmOpen(false);
        await refreshOperators();
      }
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
      setTestMessage(result ? t('credential.testSuccess') : t('credential.testError'));
      setTestOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (operator) => {
    setLoading(true);
    try {
      await setOperatorEnabled(operator.operatorId, !operator.enabled);
      await refreshOperators();
    } finally {
      setLoading(false);
    }
  };

  const pollSyncCompletion = async (operatorId) => {
    const poll = async () => {
      const runs = await getOperatorSyncRuns(null, operatorId, 1);
      const latest = (runs && runs.length > 0) ? runs[0] : null;
      const result = (latest?.result || '').toUpperCase();
      if (result === 'PENDING' || result === 'RUNNING' || !latest) {
        window.setTimeout(poll, 5000);
        return;
      }
      setSyncingMap(prev => ({ ...prev, [operatorId]: false }));
      await refreshOperators();
    };
    window.setTimeout(poll, 5000);
  };

  const handleSync = async (operator) => {
    setLoading(true);
    try {
      setSyncingMap(prev => ({ ...prev, [operator.operatorId]: true }));
      const triggered = await triggerOperatorDeviceSync(operator.operatorId);
      if (triggered) await pollSyncCompletion(operator.operatorId);
      else setSyncingMap(prev => ({ ...prev, [operator.operatorId]: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSync = async (operator) => {
    if (!window.confirm(t('gpsIntegration.actions.resetSyncConfirm'))) return;
    setLoading(true);
    try {
      setSyncingMap(prev => ({ ...prev, [operator.operatorId]: true }));
      const wiped = await wipeDevices(operator.operatorId);
      if (!wiped) {
        setSyncingMap(prev => ({ ...prev, [operator.operatorId]: false }));
        return;
      }
      const triggered = await triggerOperatorDeviceSync(operator.operatorId);
      if (triggered) await pollSyncCompletion(operator.operatorId);
      else {
        setSyncingMap(prev => ({ ...prev, [operator.operatorId]: false }));
        await refreshOperators();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHealthHistory = async (operator) => {
    setLoading(true);
    try {
      const rows = await getOperatorHealthHistory(operator.operatorId, 50);
      const text = (rows || []).slice(0, 10).map(x => `${x.startedAt} ${x.status} ${x.errorCode || ''}`).join('\n');
      showWarning(text || t('gpsIntegration.empty.healthHistory'));
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = (operator) => {
    setRotateOperator(operator);
    setRotateOpen(true);
  };

  const onRotateSaved = async () => {
    setRotateOpen(false);
    await refreshOperators();
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
      { name: "credential", title:t('credential.title'), align: "center" },
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
          badgeContent={operator.healthStatus || t('gpsIntegration.health.unknown')}
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
      credential: (
        <ArgonTypography
          component="a"
          href="#"
          variant="caption"
          color="secondary"
          fontWeight="medium"
          onClick={async() => await handleOpenCredential(operator.operatorId)}
        >
          {t('credential.title')}
        </ArgonTypography>
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
          <ArgonButton variant="text" color="warning" onClick={() => handleRotate(operator)}>
            <Icon>vpn_key</Icon>&nbsp;{t('gpsIntegration.actions.rotate')}
          </ArgonButton>
          <ArgonButton variant="text" color="warning" onClick={() => handleResetSync(operator)} disabled={!!syncingMap[operator.operatorId]}>
            <Icon>restart_alt</Icon>&nbsp;{t('gpsIntegration.actions.resetSync')}
          </ArgonButton>
          <ArgonButton variant="text" color="secondary" onClick={() => handleHealthHistory(operator)}>
            <Icon>history</Icon>&nbsp;{t('gpsIntegration.actions.healthHistory')}
          </ArgonButton>
        </>
      ),
      id: operator.operatorId
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        await refreshOperators();
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  return {
    data,
    open,
    openCredential,
    confirmOpen,
    testOpen,
    testMessage,
    rotateOpen,
    rotateOperator,
    onSave,
    onDelete,
    onSaveCredential,
    onRotateSaved,
    setOpen,
    setOpenCredential,
    setConfirmOpen,
    setRotateOpen,
    setTestOpen
  };
}

export default useOperatorTableData;
