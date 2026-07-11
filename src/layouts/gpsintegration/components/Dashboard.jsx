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
import { useQueryClient } from '@tanstack/react-query';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import StatCard from 'layouts/gpsintegration/components/dashboard/StatCard';
import ProviderStatusBreakdown from 'layouts/gpsintegration/components/dashboard/ProviderStatusBreakdown';
import useAccountService from 'services/account';
import { useGpsDashboard, gpsDashboardKeys } from 'queries/gpsDashboard';
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from 'utils/dateUtils';
import { GPS_INTEGRATION_REFRESH_EVENT } from 'layouts/gpsintegration/gpsIntegrationEvents';

function GpsDashboard() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getAccountByUser } = useAccountService();
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState(null);
  const [error, setError] = useState(null);
  const loaded = useRef(false);

  const dashboardQuery = useGpsDashboard(accountId);
  const dashboard = dashboardQuery.data ?? null;

  // Keep the global spinner UX for the dashboard load / invalidation refetch.
  useEffect(() => {
    setLoading(dashboardQuery.isFetching);
  }, [dashboardQuery.isFetching, setLoading]);

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
    })();
  }, [getAccountByUser, t]);

  // The refresh bus (operator toggle/sync/credential save) now drives a cache
  // invalidation; the query refetches. A read failure is surfaced by the toast.
  useEffect(() => {
    const handleRefresh = () => queryClient.invalidateQueries({ queryKey: gpsDashboardKeys.all });
    window.addEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(GPS_INTEGRATION_REFRESH_EVENT, handleRefresh);
  }, [queryClient]);

  const errorMessage = error || (dashboardQuery.isError ? t('gpsIntegration.errors.dashboardLoad') : null);
  if (errorMessage) {
    return (
      <Card>
        <ArgonBox p={3}>
          <ArgonTypography variant="button" color="error">{errorMessage}</ArgonTypography>
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
