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
import Grid from '@mui/material/Grid';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import Card from '@mui/material/Card';
import PropTypes from 'prop-types';
import useGpsDashboardService from 'services/gpsDashboard';
import useAccountService from 'services/account';
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from 'utils/dateUtils';

function StatCard({ label, value, compact }) {
  return (
    <Card sx={{ height: '100%' }}>
      <ArgonBox p={2}>
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">{label}</ArgonTypography>
        <ArgonTypography variant={compact ? 'button' : 'h4'} fontWeight="bold">{value ?? '-'}</ArgonTypography>
      </ArgonBox>
    </Card>
  );
}

function GpsDashboard() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getDashboard } = useGpsDashboardService();
  const { getAccountByUser } = useAccountService();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      setLoading(true);
      try {
        const acct = await getAccountByUser();
        if (!acct?.accountId) {
          setError(t('gpsIntegration.errors.dashboardLoad'));
          return;
        }
        const result = await getDashboard(acct.accountId);
        if (result) setDashboard(result);
        else setError(t('gpsIntegration.errors.dashboardLoad'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (error) {
    return (
      <Card>
        <ArgonBox p={3}>
          <ArgonTypography variant="button" color="error">{error}</ArgonTypography>
        </ArgonBox>
      </Card>
    );
  }
  if (!dashboard) {
    return (
      <Card>
        <ArgonBox p={3}>
          <ArgonTypography variant="caption" color="secondary">{t('gpsIntegration.empty.dashboard')}</ArgonTypography>
        </ArgonBox>
      </Card>
    );
  }

  const statusLabel = (status) => {
    const key = (status || '').toLowerCase();
    return t(`gpsIntegration.status.${key}`, { defaultValue: status || '-' });
  };

  const deviceStatusSummary = () => {
    const totals = (dashboard.deviceCountsByProviderStatus || []).reduce((acc, item) => {
      const status = item.detectedStatus || 'unknown';
      acc[status] = (acc[status] || 0) + (item.count || 0);
      return acc;
    }, {});
    const parts = Object.entries(totals)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => `${statusLabel(status)}: ${count}`);
    return parts.length ? parts.join(' · ') : '-';
  };

  const cells = [
    [t('gpsIntegration.dashboard.operatorsEnabled'), `${dashboard.operatorsEnabled}/${dashboard.operatorsTotal}`],
    [t('gpsIntegration.dashboard.operatorsHealthy'), dashboard.operatorsHealthy],
    [t('gpsIntegration.dashboard.operatorsDegraded'), dashboard.operatorsDegraded],
    [t('gpsIntegration.dashboard.operatorsOffline'), dashboard.operatorsOffline],
    [t('gpsIntegration.dashboard.devicesTotal'), dashboard.devicesTotal],
    [t('gpsIntegration.dashboard.devicesAssigned'), dashboard.devicesAssigned],
    [t('gpsIntegration.dashboard.devicesUnassigned'), dashboard.unassignedDevicesCount],
    [t('gpsIntegration.dashboard.devicesIgnored'), dashboard.devicesIgnored],
    [t('gpsIntegration.dashboard.recentlyAdded24h'), dashboard.recentlyAddedDevicesLast24h],
    [t('gpsIntegration.dashboard.syncsOk24h'), dashboard.syncRunsSucceededLast24h],
    [t('gpsIntegration.dashboard.syncsFailed24h'), dashboard.syncRunsFailedLast24h],
    [t('gpsIntegration.dashboard.lastAutoSync'), formatDateTime(dashboard.lastAutomaticSyncAt)],
    [t('gpsIntegration.dashboard.lastManualSync'), formatDateTime(dashboard.lastManualSyncAt)],
    [t('gpsIntegration.dashboard.averageSyncDuration'), dashboard.averageSyncDurationSeconds == null ? '-' : `${Math.round(dashboard.averageSyncDurationSeconds)} s`],
    [t('gpsIntegration.dashboard.deviceCountsByProviderStatus'), deviceStatusSummary(), true]
  ];

  return (
    <Grid container spacing={2}>
      {cells.map(([label, value, compact]) => (
        <Grid item xs={6} sm={4} md={3} key={label}>
          <StatCard label={label} value={value} compact={!!compact} />
        </Grid>
      ))}
    </Grid>
  );
}

GpsDashboard.propTypes = {};
StatCard.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node, compact: PropTypes.bool };

export default GpsDashboard;
