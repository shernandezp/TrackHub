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

import { useTranslation } from 'react-i18next';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import type { Theme } from '@mui/material/styles';
import ArgonBox from 'components/ArgonBox';
import ArgonBadge from 'components/ArgonBadge';
import ArgonTypography from 'components/ArgonTypography';
import type { GpsIntegrationDashboard } from 'api/manager/gpsDashboard';

/** A single (operator, detectedStatus, count) tuple from the dashboard. */
type ProviderStatusItem = GpsIntegrationDashboard['deviceCountsByProviderStatus'][number];
/** Per-operator rollup: counts keyed by detected-status string. */
interface OperatorGroup { operatorName: string; statuses: Record<string, number>; }
type StatusLabelFn = (status: string) => string;

type BadgeColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark';

function statusColor(status: string): BadgeColor {
  switch ((status || '').toUpperCase()) {
    case 'NEW':
    case 'AVAILABLE': return 'warning';
    case 'ASSIGNED': return 'info';
    case 'IGNORED': return 'secondary';
    case 'REMOVED': return 'error';
    default: return 'secondary';
  }
}

function groupByOperator(items: ProviderStatusItem[] = []): OperatorGroup[] {
  const map = new Map<string, OperatorGroup>();
  items.forEach((item) => {
    const key = item.operatorId || item.operatorName || 'unknown';
    if (!map.has(key)) {
      map.set(key, { operatorName: item.operatorName || key, statuses: {} });
    }
    const entry = map.get(key)!;
    const status = item.detectedStatus || 'unknown';
    entry.statuses[status] = (entry.statuses[status] || 0) + (item.count || 0);
  });
  return Array.from(map.values()).sort((a, b) => a.operatorName.localeCompare(b.operatorName));
}

interface ProviderRowProps {
  operatorName: string;
  statuses: Record<string, number>;
  statusLabel: StatusLabelFn;
}

function ProviderRow({ operatorName, statuses, statusLabel }: ProviderRowProps) {
  const entries = Object.entries(statuses).filter(([, count]) => count > 0);
  return (
    <ArgonBox
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      gap={1}
      py={1}
      sx={{
        borderBottom: ({ borders: { borderWidth, borderColor } }: Theme) => `${borderWidth[1]} solid ${borderColor}`,
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <ArgonTypography variant="button" fontWeight="medium" sx={{ minWidth: 140 }}>
        {operatorName}
      </ArgonTypography>
      <ArgonBox display="flex" flexWrap="wrap" gap={0.5}>
        {entries.length === 0 ? (
          <ArgonTypography variant="caption" color="secondary">-</ArgonTypography>
        ) : (
          entries.map(([status, count]) => (
            <ArgonBadge
              key={status}
              variant="gradient"
              color={statusColor(status)}
              badgeContent={`${statusLabel(status)}: ${count}`}
              size="xs"
              container
            />
          ))
        )}
      </ArgonBox>
    </ArgonBox>
  );
}

interface ProviderStatusBreakdownProps {
  items?: ProviderStatusItem[];
}

function ProviderStatusBreakdown({ items }: ProviderStatusBreakdownProps) {
  const { t } = useTranslation();
  const statusLabel = (status: string): string => {
    const key = (status || '').toLowerCase();
    return t(`gpsIntegration.status.${key}` as 'gpsIntegration.status.new', { defaultValue: status || '-' });
  };
  const groups = groupByOperator(items);

  return (
    <Card sx={{ height: '100%' }}>
      <ArgonBox p={2}>
        <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <ArgonTypography variant="h6" fontWeight="medium">
            {t('gpsIntegration.dashboard.deviceCountsByProviderStatus')}
          </ArgonTypography>
          <ArgonTypography variant="caption" color="secondary">
            {t('gpsIntegration.dashboard.providerBreakdownHint')}
          </ArgonTypography>
        </ArgonBox>
        {groups.length === 0 ? (
          <ArgonTypography variant="caption" color="secondary">
            {t('gpsIntegration.empty.dashboard')}
          </ArgonTypography>
        ) : (
          <Grid container>
            {groups.map((group) => (
              <Grid size={{ xs: 12 }} key={group.operatorName}>
                <ProviderRow
                  operatorName={group.operatorName}
                  statuses={group.statuses}
                  statusLabel={statusLabel}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </ArgonBox>
    </Card>
  );
}

export default ProviderStatusBreakdown;
