/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
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

import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Grid from '@mui/material/Grid';
import Table from 'controls/Tables/Table';
import TableAccordion from 'controls/Accordions/TableAccordion';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import ArgonBadge from 'components/ArgonBadge';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import useAccountService from 'services/account';
import useTransporterService from 'services/transporter';
import useDeviceService from 'services/device';
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from 'utils/dateUtils';
import { GPS_INTEGRATION_REFRESH_EVENT } from 'layouts/gpsintegration/gpsIntegrationEvents';

function TextCell({ children }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}
TextCell.propTypes = { children: PropTypes.node };

function statusColor(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE': return 'success';
    case 'ENDED': return 'secondary';
    case 'SUPERSEDED': return 'warning';
    default: return 'info';
  }
}

function ManageDeviceAssignments() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [transporters, setTransporters] = useState([]);
  const [unassignedDevices, setUnassignedDevices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [error, setError] = useState(null);
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const {
    getTransporterByAccount,
    getTransporterDeviceAssignmentsByAccount,
    assignDeviceToTransporter,
    endDeviceTransporterAssignment
  } = useTransporterService();
  const { getSynchronizedDevices, getUnassignedSynchronizedDevices } = useDeviceService();

  const load = async (acct = accountId, only = activeOnly) => {
    if (!acct) return;
    setLoading(true);
    try {
      const result = await getTransporterDeviceAssignmentsByAccount(acct, only);
      if (!result) setError(t('gpsIntegration.errors.assignmentsLoad'));
      else setAssignments(result);
      const freeDevices = await getUnassignedSynchronizedDevices(acct);
      setUnassignedDevices(freeDevices || []);
      const syncedDevices = await getSynchronizedDevices(acct);
      setDevices(syncedDevices || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      (async () => {
        const acct = await getAccountByUser();
        if (!acct?.accountId) {
          setError(t('gpsIntegration.errors.assignmentsLoad'));
          return;
        }
        setAccountId(acct.accountId);
        const trs = await getTransporterByAccount();
        setTransporters(trs || []);
        await load(acct.accountId, activeOnly);
      })();
    }
  }, [expanded]);

  const toggleActiveOnly = async () => {
    const next = !activeOnly;
    setActiveOnly(next);
    await load(accountId, next);
  };

  const handleEnd = async (a) => {
    setLoading(true);
    try {
      const reason = window.prompt(t('gpsIntegration.actions.endAssignmentReasonPrompt'), 'portal') || 'portal';
      await endDeviceTransporterAssignment(a.transporterDeviceAssignmentId, reason);
      await load();
    } finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!accountId || !selectedTransporterId || !selectedDeviceId) return;
    setLoading(true);
    try {
      await assignDeviceToTransporter({
        accountId,
        transporterId: selectedTransporterId,
        deviceId: selectedDeviceId,
        priority: 0,
        isPrimary: true,
        assignmentReason: 'portal'
      });
      setSelectedDeviceId('');
      await load();
    } finally { setLoading(false); }
  };

  const transporterNames = transporters.reduce((acc, transporter) => {
    acc[transporter.transporterId] = transporter.name;
    return acc;
  }, {});

  const deviceNames = devices.reduce((acc, device) => {
    acc[device.deviceId] = device.name || device.providerDisplayName || device.serial || device.identifier;
    return acc;
  }, {});

  useEffect(() => {
    const handleRefresh = () => {
      if (loaded.current) load();
    };
    window.addEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
  }, [accountId, activeOnly]);

  const statusLabel = (status) => {
    const key = (status || '').toLowerCase();
    return t(`gpsIntegration.assignmentStatus.${key}`, { defaultValue: status || '-' });
  };

  const rows = assignments.map(a => ({
    transporterId: <TextCell>{transporterNames[a.transporterId] || a.transporterId}</TextCell>,
    deviceId: <TextCell>{deviceNames[a.deviceId] || a.deviceId}</TextCell>,
    isPrimary: (
      <ArgonBadge
        variant="gradient"
        badgeContent={a.isPrimary ? t('generic.yes') : t('generic.no')}
        color={a.isPrimary ? 'success' : 'secondary'}
        size="xs"
        container
      />
    ),
    priority: <TextCell>{a.priority}</TextCell>,
    status: (
      <ArgonBadge
        variant="gradient"
        badgeContent={statusLabel(a.status)}
        color={statusColor(a.status)}
        size="xs"
        container
      />
    ),
    effectiveFrom: <TextCell>{formatDateTime(a.effectiveFrom)}</TextCell>,
    effectiveTo: <TextCell>{formatDateTime(a.effectiveTo)}</TextCell>,
    actions: (
      (a.status || '').toUpperCase() === 'ACTIVE' ? (
        <ArgonButton variant="text" color="error" onClick={() => handleEnd(a)}>
          <Icon>stop_circle</Icon>&nbsp;{t('gpsIntegration.actions.endAssignment')}
        </ArgonButton>
      ) : null
    ),
    id: a.transporterDeviceAssignmentId
  }));

  return (
    <TableAccordion title={t('gpsIntegration.sections.assignments')} expanded={expanded} setExpanded={setExpanded}>
      {error
        ? <ArgonBox><ArgonTypography variant="button" color="error">{error}</ArgonTypography></ArgonBox>
        : (
          <>
            <ArgonBox display="flex" justifyContent="flex-end" mb={1}>
              <ArgonButton variant="text" color="info" onClick={toggleActiveOnly}>
                <Icon>{activeOnly ? 'visibility' : 'visibility_off'}</Icon>&nbsp;
                {activeOnly ? t('gpsIntegration.actions.showAll') : t('gpsIntegration.actions.showActive')}
              </ArgonButton>
            </ArgonBox>
            <ArgonBox mb={1}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} md={5}>
                  <CustomSelect
                    list={transporters.map(x => ({ value: x.transporterId, label: x.name }))}
                    name="selectedTransporterId"
                    id="selectedTransporterId"
                    label={t('gpsIntegration.assignmentForm.transporter')}
                    value={selectedTransporterId}
                    handleChange={(e) => setSelectedTransporterId(e.target.value)}
                    numericValue={false}
                    placeholder={t('gpsIntegration.assignmentForm.selectTransporter')}
                  />
                  <ArgonTypography variant="caption" color="secondary">
                    {t('gpsIntegration.assignmentForm.transporterHelp')}
                  </ArgonTypography>
                </Grid>
                <Grid item xs={12} md={5}>
                  <CustomSelect
                    list={unassignedDevices.map(x => ({
                      value: x.deviceId,
                      label: x.name || x.providerDisplayName || x.serial || x.identifier
                    }))}
                    name="selectedDeviceId"
                    id="selectedDeviceId"
                    label={t('gpsIntegration.assignmentForm.device')}
                    value={selectedDeviceId}
                    handleChange={(e) => setSelectedDeviceId(e.target.value)}
                    numericValue={false}
                    placeholder={t('gpsIntegration.assignmentForm.selectDevice')}
                  />
                  <ArgonTypography variant="caption" color="secondary">
                    {unassignedDevices.length > 0
                      ? t('gpsIntegration.assignmentForm.deviceHelp')
                      : t('gpsIntegration.empty.unassignedDevices')}
                  </ArgonTypography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <ArgonButton color="info" onClick={handleAssign} disabled={!selectedTransporterId || !selectedDeviceId}>
                    {t('gpsIntegration.actions.assignDevice')}
                  </ArgonButton>
                </Grid>
              </Grid>
            </ArgonBox>
            {assignments.length === 0 && loaded.current
              ? <ArgonTypography variant="caption" color="secondary">{t('gpsIntegration.empty.assignments')}</ArgonTypography>
              : <Table
                  columns={[
                    { name: 'transporterId', title: t('transporter.title'), align: 'left' },
                    { name: 'deviceId', title: t('device.title'), align: 'left' },
                    { name: 'isPrimary', title: t('gpsIntegration.columns.isPrimary'), align: 'center' },
                    { name: 'priority', title: t('gpsIntegration.columns.priority'), align: 'center' },
                    { name: 'status', title: t('gpsIntegration.columns.status'), align: 'center' },
                    { name: 'effectiveFrom', title: t('gpsIntegration.columns.effectiveFrom'), align: 'center' },
                    { name: 'effectiveTo', title: t('gpsIntegration.columns.effectiveTo'), align: 'center' },
                    { name: 'actions', title: t('generic.action'), align: 'center' },
                    { name: 'id' }
                  ]}
                  rows={rows}
                  selectedField="transporterId"
                />
            }
          </>
        )
      }
    </TableAccordion>
  );
}

ManageDeviceAssignments.propTypes = {};

export default ManageDeviceAssignments;
