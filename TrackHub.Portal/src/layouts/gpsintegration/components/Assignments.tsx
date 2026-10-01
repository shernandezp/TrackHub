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

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mui/material/Icon';
import Grid from '@mui/material/Grid';
import Table from 'controls/Tables/Table';
import ServerPagination from 'controls/Tables/ServerPagination';
import useServerList, { useClampPage } from 'controls/Tables/useServerList';
import TableAccordion from 'controls/Accordions/TableAccordion';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import SearchSelect from 'edition/SearchSelect';
import type { SearchOption } from 'edition/SearchSelect';
import { unassignedDeviceOptions, useAccountTransporterOptions } from 'edition/pickerOptions';
import FormDialog from 'controls/Dialogs/FormDialog';
import ArgonBadge from 'components/ArgonBadge';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import { getAccountByUser } from 'api/manager/accounts';
import {
  useTransporterNames,
  useTransporterDeviceAssignmentsByAccount,
  useAssignDeviceToTransporter,
  useEndDeviceTransporterAssignment,
} from 'queries/transporters';
import type { TransporterAssignmentWithAudit } from 'api/manager/transporters';
import { deviceKeys, useDeviceNames, useUnassignedSynchronizedDevices } from 'queries/devices';
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from 'utils/dateUtils';
import { GPS_INTEGRATION_REFRESH_EVENT } from 'layouts/gpsintegration/gpsIntegrationEvents';

const PAGE_SIZE = 10;

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

type BadgeColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark';

function statusColor(status: string): BadgeColor {
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
  const [activeOnly, setActiveOnly] = useState(true);
  const queryClient = useQueryClient();
  const [selectedTransporter, setSelectedTransporter] = useState<SearchOption | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<SearchOption | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // End-assignment dialog: the row being ended (null = closed) and the typed reason.
  const [endTarget, setEndTarget] = useState<TransporterAssignmentWithAudit | null>(null);
  const [endReason, setEndReason] = useState('');
  const loaded = useRef(false);

  // The assignment table is one SERVER page, keyed by (accountId, activeOnly,
  // page); the assign/end mutations invalidate the whole assignments key.
  const { page, setPage, params } = useServerList(PAGE_SIZE);
  const assignmentsQuery = useTransporterDeviceAssignmentsByAccount(
    accountId ?? undefined,
    activeOnly,
    { skip: params.skip, take: params.take }
  );
  const assignments = assignmentsQuery.data?.items ?? [];
  const totalCount = assignmentsQuery.data?.totalCount ?? 0;
  useClampPage(page, PAGE_SIZE, totalCount, setPage);
  const pageTransporterIds = useMemo(() => Array.from(new Set(assignments.map((a) => a.transporterId))), [assignments]);
  const pageDeviceIds = useMemo(() => Array.from(new Set(assignments.map((a) => a.deviceId))), [assignments]);
  const transporterNames = useTransporterNames(pageTransporterIds);
  const deviceNames = useDeviceNames(pageDeviceIds);
  const assignDevice = useAssignDeviceToTransporter();
  const endAssignment = useEndDeviceTransporterAssignment();

  useEffect(() => {
    setLoading(assignmentsQuery.isFetching);
  }, [assignmentsQuery.isFetching, setLoading]);

  const useAssignableDeviceOptions = useMemo(() => unassignedDeviceOptions(accountId ?? undefined), [accountId]);
  const unassignedCountQuery = useUnassignedSynchronizedDevices(accountId ?? undefined, { skip: 0, take: 1 });
  const hasUnassignedDevices = (unassignedCountQuery.data?.totalCount ?? 0) > 0;

  const loadDevices = async () => {
    if (!accountId) return;
    await queryClient.invalidateQueries({ queryKey: deviceKeys.unassignedAll(accountId) });
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      (async () => {
        try {
          const acct = await getAccountByUser();
          if (!acct?.accountId) {
            setError(t('gpsIntegration.errors.assignmentsLoad'));
            return;
          }
          setAccountId(acct.accountId);
        } catch {
          setError(t('gpsIntegration.errors.assignmentsLoad'));
        }
      })();
    }
  }, [expanded]);

  const toggleActiveOnly = () => {
    // Re-keys the assignments query, which refetches automatically. The result
    // set changes size, so restart from the first page.
    setPage(0);
    setActiveOnly((prev) => !prev);
  };

  const handleEnd = (a: TransporterAssignmentWithAudit) => {
    setEndReason('');
    setEndTarget(a);
  };

  const confirmEnd = async () => {
    if (!endTarget) return;
    setLoading(true);
    try {
      await endAssignment.mutateAsync({
        assignmentId: endTarget.transporterDeviceAssignmentId,
        reason: endReason.trim() || 'portal',
      });
      setEndTarget(null);
      // Assignments refetch via query invalidation; refresh the device lists too.
      await loadDevices();
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open for a retry.
    } finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!accountId || !selectedTransporter || !selectedDevice) return;
    setLoading(true);
    try {
      await assignDevice.mutateAsync({
        accountId,
        transporterId: selectedTransporter.value,
        deviceId: selectedDevice.value,
        priority: 0,
        isPrimary: true,
        assignmentReason: 'portal'
      });
      setSelectedDevice(null);
      // Assignments refetch via query invalidation; refresh the device lists too.
      await loadDevices();
    } catch {
      // Failure is surfaced by the global toast.
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const handleRefresh = () => {
      if (loaded.current) {
        assignmentsQuery.refetch();
        loadDevices();
      }
    };
    window.addEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, activeOnly]);

  const statusLabel = (status: string): string => {
    const key = (status || '').toLowerCase();
    return t(`gpsIntegration.assignmentStatus.${key}` as 'gpsIntegration.assignmentStatus.active', { defaultValue: status || '-' });
  };

  const rows = assignments.map(a => ({
    transporterId: <TextCell>{transporterNames.get(a.transporterId) || a.transporterId}</TextCell>,
    deviceId: <TextCell>{deviceNames.get(a.deviceId) || a.deviceId}</TextCell>,
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
    <>
    <TableAccordion sectionKey="gps-assignments" title={t('gpsIntegration.sections.assignments')} expanded={expanded} setExpanded={setExpanded}>
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
              <Grid container spacing={1} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <SearchSelect
                    id="selectedTransporterId"
                    label={t('gpsIntegration.assignmentForm.transporter')}
                    value={selectedTransporter?.value ?? null}
                    valueLabel={selectedTransporter?.label}
                    onChange={setSelectedTransporter}
                    useOptions={useAccountTransporterOptions}
                    placeholder={t('gpsIntegration.assignmentForm.selectTransporter')}
                  />
                  <ArgonTypography variant="caption" color="secondary">
                    {t('gpsIntegration.assignmentForm.transporterHelp')}
                  </ArgonTypography>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <SearchSelect
                    id="selectedDeviceId"
                    label={t('gpsIntegration.assignmentForm.device')}
                    value={selectedDevice?.value ?? null}
                    valueLabel={selectedDevice?.label}
                    onChange={setSelectedDevice}
                    useOptions={useAssignableDeviceOptions}
                    placeholder={t('gpsIntegration.assignmentForm.selectDevice')}
                  />
                  <ArgonTypography variant="caption" color="secondary">
                    {hasUnassignedDevices
                      ? t('gpsIntegration.assignmentForm.deviceHelp')
                      : t('gpsIntegration.empty.unassignedDevices')}
                  </ArgonTypography>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <ArgonButton color="info" onClick={handleAssign} disabled={!selectedTransporter || !selectedDevice}>
                    {t('gpsIntegration.actions.assignDevice')}
                  </ArgonButton>
                </Grid>
              </Grid>
            </ArgonBox>
            {assignments.length === 0 && loaded.current
              ? <ArgonTypography variant="caption" color="secondary">{t('gpsIntegration.empty.assignments')}</ArgonTypography>
              : <>
                <Table
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
                  serverPaged
                />
                <ServerPagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  totalCount={totalCount}
                  pageLength={rows.length}
                  onPageChange={setPage}
                />
                </>
            }
          </>
        )
      }
    </TableAccordion>
    <FormDialog
      title={t('gpsIntegration.actions.endAssignment')}
      open={!!endTarget}
      setOpen={(next) => {
        const open = typeof next === 'function' ? next(!!endTarget) : next;
        if (!open) setEndTarget(null);
      }}
      handleSave={confirmEnd}
      maxWidth="xs"
    >
      <CustomTextField
        name="endAssignmentReason"
        id="endAssignmentReason"
        label={t('gpsIntegration.actions.endAssignmentReasonPrompt')}
        value={endReason}
        onChange={(e) => setEndReason(e.target.value)}
        placeholder="portal"
      />
    </FormDialog>
    </>
  );
}

ManageDeviceAssignments.propTypes = {};

export default ManageDeviceAssignments;
