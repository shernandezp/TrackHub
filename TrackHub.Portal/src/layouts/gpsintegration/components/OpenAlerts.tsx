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

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Table from 'controls/Tables/Table';
import ServerPagination from 'controls/Tables/ServerPagination';
import TableAccordion from 'controls/Accordions/TableAccordion';
import ArgonBadge from 'components/ArgonBadge';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import { getAccountByUser } from 'api/manager/accounts';
import { getAlertEvents } from 'api/manager/alertEvents';
import type { AlertEvent } from 'api/manager/alertEvents';
import { formatDateTime } from 'utils/dateUtils';

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

type BadgeColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark';

function severityColor(severity: string): BadgeColor {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    default: return 'secondary';
  }
}

const PAGE_SIZE = 20;

// The GPS integration's own alert types; open ones are counted and paged by the server.
const GPS_ALERT_EVENT_TYPES = [
  'GpsCredentialExpiring',
  'GpsOperatorPositionSyncFailed',
  'GpsOperatorDeviceSyncFailed',
  'GpsOperatorOffline',
  'GpsDeviceDetected',
  'GpsDeviceRemoved',
  'GpsDuplicateDeviceIdentifier',
  'GpsDuplicateTransporterName',
  'GpsAutoAssignGroupAmbiguous',
];

function OpenAlerts() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    try {
      const account = await getAccountByUser();
      if (!account?.accountId) {
        setError(t('gpsIntegration.errors.alertsLoad'));
        return;
      }
      const result = await getAlertEvents(
        account.accountId,
        { status: 'Open', eventTypes: GPS_ALERT_EVENT_TYPES },
        targetPage * PAGE_SIZE,
        PAGE_SIZE
      );
      setAlerts(result.items);
      setTotalCount(result.totalCount);
      setPage(targetPage);
      setError(null);
    } catch {
      setError(t('gpsIntegration.errors.alertsLoad'));
    } finally {
      setLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    if (expanded && !loaded) {
      void load(0);
    }
  }, [expanded, loaded, load]);

  const rows = alerts.map(a => ({
    eventType: <TextCell>{a.eventType}</TextCell>,
    severity: (
      <ArgonBadge variant="gradient" badgeContent={t(`gpsIntegration.severity.${(a.severity || '').toLowerCase()}` as 'gpsIntegration.severity.critical', { defaultValue: a.severity })} color={severityColor(a.severity)} size="xs" container />
    ),
    status: <TextCell>{a.status}</TextCell>,
    source: <TextCell>{a.sourceModule}</TextCell>,
    lastSeen: <TextCell>{formatDateTime(a.lastSeenAt)}</TextCell>,
    id: a.alertEventId
  }));

  return (
    <TableAccordion sectionKey="gps-open-alerts" title={t('gpsIntegration.sections.openAlerts')} expanded={expanded} setExpanded={setExpanded}>
      {error
        ? <ArgonBox><ArgonTypography variant="button" color="error">{error}</ArgonTypography></ArgonBox>
        : alerts.length === 0 && loaded
          ? <ArgonTypography variant="caption" color="secondary">{t('gpsIntegration.empty.alerts')}</ArgonTypography>
          : <Table
              columns={[
                { name: 'eventType', title: t('gpsIntegration.columns.eventType'), align: 'left' },
                { name: 'severity', title: t('gpsIntegration.columns.severity'), align: 'center' },
                { name: 'status', title: t('gpsIntegration.columns.status'), align: 'center' },
                { name: 'source', title: t('gpsIntegration.columns.sourceModule'), align: 'center' },
                { name: 'lastSeen', title: t('gpsIntegration.columns.lastSeen'), align: 'center' },
                { name: 'id' }
              ]}
              rows={rows}
              selectedField="eventType"
              serverPaged
            />
      }
      {totalCount > PAGE_SIZE && (
        <ServerPagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} pageLength={alerts.length} onPageChange={(next) => void load(next)} />
      )}
    </TableAccordion>
  );
}

export default OpenAlerts;
