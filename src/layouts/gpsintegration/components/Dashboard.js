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

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import StatCard from 'layouts/gpsintegration/components/dashboard/StatCard';
import ProviderStatusBreakdown from 'layouts/gpsintegration/components/dashboard/ProviderStatusBreakdown';
import useGpsDashboardService from 'services/gpsDashboard';
import useAccountService from 'services/account';
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from 'utils/dateUtils';
import { GPS_INTEGRATION_REFRESH_EVENT } from 'layouts/gpsintegration/gpsIntegrationEvents';

function GpsDashboard() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getDashboard } = useGpsDashboardService();
  const { getAccountByUser } = useAccountService();
  const [dashboard, setDashboard] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [error, setError] = useState(null);
  const loaded = useRef(false);

  const loadDashboard = useCallback(async (acct = accountId) => {
    if (!acct) return;
    setLoading(true);
    try {
      const result = await getDashboard(acct);
      if (result) {
        setDashboard(result);
        setError(null);
      } else setError(t('gpsIntegration.errors.dashboardLoad'));
    } finally {
      setLoading(false);
    }
  }, [accountId, getDashboard, setLoading, t]);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      const acct = await getAccountByUser();
      if (!acct?.accountId) {
        setError(t('gpsIntegration.errors.dashboardLoad'));
        return;
      }
      setAccountId(acct.accountId);
      await loadDashboard(acct.accountId);
    })();
  }, [getAccountByUser, loadDashboard, t]);

  useEffect(() => {
    const handleRefresh = () => loadDashboard();
    window.addEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
  }, [loadDashboard]);

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

  const stats = [
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
    [t('gpsIntegration.dashboard.averageSyncDuration'),
      dashboard.averageSyncDurationSeconds == null ? '-' : `${Math.round(dashboard.averageSyncDurationSeconds)} s`],
    [t('gpsIntegration.dashboard.lastAutoSync'), formatDateTime(dashboard.lastAutomaticSyncAt)],
    [t('gpsIntegration.dashboard.lastManualSync'), formatDateTime(dashboard.lastManualSyncAt)],
  ];

  return (
    <ArgonBox>
      <Grid container spacing={2}>
        {stats.map(([label, value]) => (
          <Grid item xs={6} sm={4} md={3} key={label}>
            <StatCard label={label} value={value} />
          </Grid>
        ))}
      </Grid>
      <ArgonBox mt={2}>
        <ProviderStatusBreakdown items={dashboard.deviceCountsByProviderStatus} />
      </ArgonBox>
    </ArgonBox>
  );
}

export default GpsDashboard;
