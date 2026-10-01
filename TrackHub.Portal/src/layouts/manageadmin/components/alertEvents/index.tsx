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

import { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import ServerPagination from "controls/Tables/ServerPagination";
import { useClampPage, useServerList } from "controls/Tables/useServerList";
import TableAccordion from "controls/Accordions/TableAccordion";
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useForm from "controls/Dialogs/useForm";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import { getAccountByUser } from "api/manager/accounts";
import { getAlertEvents, acknowledgeAlertEvent, resolveAlertEvent } from "api/manager/alertEvents";
import type { AlertEvent } from "api/manager/alertEvents";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";
import { toCamelCase } from "utils/stringUtils";

const PAGE_SIZE = 25;
const ALL = 'all';
const STATUSES = ['Open', 'Acknowledged', 'Resolved'];
const SEVERITIES = ['Critical', 'High', 'Warning', 'Info'];

interface FilterValues { status?: string; severity?: string; }

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

function ManageAlertEvents() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, handleFilterChange] = useForm<FilterValues>({ status: 'Open', severity: ALL });
  const [applied, setApplied] = useState<FilterValues>({ status: 'Open', severity: ALL });
  const { page, setPage, params } = useServerList(PAGE_SIZE);
  useClampPage(page, PAGE_SIZE, totalCount, setPage);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const currentAccountId = accountId ?? (await getAccountByUser())?.accountId ?? null;
      if (!currentAccountId) return;
      setAccountId(currentAccountId);
      const result = await getAlertEvents(currentAccountId, {
        status: applied.status && applied.status !== ALL ? applied.status : null,
        severity: applied.severity && applied.severity !== ALL ? applied.severity : null,
      }, params.skip, params.take);
      setAlerts(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      loadAlerts();
    }
  }, [expanded, params, applied]);

  const applyFilters = () => {
    setPage(0);
    setApplied({ ...filters });
  };

  const handleTransition = async (alert: AlertEvent, transition: (id: string) => Promise<boolean>) => {
    setLoading(true);
    try {
      await transition(alert.alertEventId);
      await loadAlerts();
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: ALL, label: t('alertEvents.allStatuses') },
    ...STATUSES.map(status => ({ value: status, label: t(`alertEvents.statuses.${status}` as 'alertEvents.statuses.Open') })),
  ];
  const severityOptions = [
    { value: ALL, label: t('alertEvents.allSeverities') },
    ...SEVERITIES.map(severity => ({ value: severity, label: t(`alertEvents.severities.${severity}` as 'alertEvents.severities.Info') })),
  ];

  return (
    <TableAccordion sectionKey="alert-events" title={t('alertEvents.title')} expanded={expanded} setExpanded={setExpanded}>
      <ArgonBox display="flex" gap={2} mb={1} alignItems="flex-end" flexWrap="wrap">
        <ArgonBox minWidth="12rem">
          <CustomSelect list={statusOptions} name="status" id="alertFilterStatus" label={t('alertEvents.filterStatus')}
            value={filters.status || ALL} handleChange={handleFilterChange} numericValue={false} fullWidth={false} />
        </ArgonBox>
        <ArgonBox minWidth="12rem">
          <CustomSelect list={severityOptions} name="severity" id="alertFilterSeverity" label={t('alertEvents.filterSeverity')}
            value={filters.severity || ALL} handleChange={handleFilterChange} numericValue={false} fullWidth={false} />
        </ArgonBox>
        <ArgonButton color="primary" size="small" onClick={applyFilters}>
          <Icon>search</Icon>
        </ArgonButton>
      </ArgonBox>
      <Table
        columns={[
          { name: 'type', title: t('alertEvents.type'), align: 'left' },
          { name: 'severity', title: t('alertEvents.severity'), align: 'center' },
          { name: 'unit', title: t('alertEvents.unit'), align: 'left' },
          { name: 'status', title: t('alertEvents.status'), align: 'center' },
          { name: 'firstSeen', title: t('alertEvents.firstSeen'), align: 'center' },
          { name: 'lastSeen', title: t('alertEvents.lastSeen'), align: 'center' },
          { name: 'action', title: t('generic.action'), align: 'center' },
          { name: 'id' }
        ]}
        rows={alerts.map(alert => ({
          type: (
            <TextCell>
              {t(
                `alertEventTypes.${toCamelCase(alert.eventType)}` as 'alertEventTypes.geofenceEntered',
                { defaultValue: alert.eventType }
              )}
            </TextCell>
          ),
          severity: (
            <TextCell>
              {t(`alertEvents.severities.${alert.severity}` as 'alertEvents.severities.Info', { defaultValue: alert.severity })}
            </TextCell>
          ),
          unit: <TextCell>{alert.resourceName}</TextCell>,
          status: (
            <TextCell>
              {t(
                `alertEvents.statuses.${alert.status}` as 'alertEvents.statuses.Open',
                { defaultValue: alert.status }
              )}
            </TextCell>
          ),
          firstSeen: <TextCell>{formatDateTime(alert.firstSeenAt)}</TextCell>,
          lastSeen: <TextCell>{formatDateTime(alert.lastSeenAt)}</TextCell>,
          action: (
            <>
              {alert.status === 'Open' && (
                <ArgonButton variant="text" color="dark" onClick={() => handleTransition(alert, acknowledgeAlertEvent)}>
                  <Icon>done</Icon>&nbsp;{t('alertEvents.acknowledge')}
                </ArgonButton>
              )}
              {alert.status !== 'Resolved' && (
                <ArgonButton variant="text" color="success" onClick={() => handleTransition(alert, resolveAlertEvent)}>
                  <Icon>done_all</Icon>&nbsp;{t('alertEvents.resolve')}
                </ArgonButton>
              )}
            </>
          ),
          id: alert.alertEventId
        }))}
        selectedField="type"
        serverPaged
      />
      <ServerPagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} pageLength={alerts.length} onPageChange={setPage} />
    </TableAccordion>
  );
}

export default ManageAlertEvents;
