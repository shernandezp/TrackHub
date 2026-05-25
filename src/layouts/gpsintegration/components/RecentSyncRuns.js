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
import Table from 'controls/Tables/Table';
import TableAccordion from 'controls/Accordions/TableAccordion';
import ArgonBadge from 'components/ArgonBadge';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import useAccountService from 'services/account';
import useOperatorService from 'services/operator';
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from 'utils/dateUtils';

function TextCell({ children }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}
TextCell.propTypes = { children: PropTypes.node };

function resultColor(result) {
  switch ((result || '').toUpperCase()) {
    case 'SUCCEEDED': return 'success';
    case 'PARTIAL': return 'warning';
    case 'FAILED': return 'error';
    case 'RUNNING':
    case 'PENDING': return 'info';
    default: return 'secondary';
  }
}

function RecentSyncRuns() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const { getOperatorSyncRuns } = useOperatorService();

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      (async () => {
        setLoading(true);
        try {
          const acct = await getAccountByUser();
          if (!acct?.accountId) {
            setError(t('gpsIntegration.errors.syncRunsLoad'));
            return;
          }
          const result = await getOperatorSyncRuns(acct.accountId, null, 20);
          if (!result) setError(t('gpsIntegration.errors.syncRunsLoad'));
          else setRuns(result);
        } finally { setLoading(false); }
      })();
    }
  }, [expanded]);

  const rows = runs.map(r => ({
    operator: <TextCell>{r.operatorId}</TextCell>,
    trigger: <TextCell>{r.triggerType}</TextCell>,
    result: (
      <ArgonBadge variant="gradient" badgeContent={r.result} color={resultColor(r.result)} size="xs" container />
    ),
    startedAt: <TextCell>{formatDateTime(r.startedAt)}</TextCell>,
    completedAt: <TextCell>{formatDateTime(r.completedAt)}</TextCell>,
    devices: <TextCell>{`+${r.devicesAdded ?? 0} / ~${r.devicesUpdated ?? 0} / -${r.devicesRemoved ?? 0}`}</TextCell>,
    positions: <TextCell>{`${r.positionsAccepted ?? 0}/${r.positionsRead ?? 0}`}</TextCell>,
    error: <TextCell>{r.errorCode}</TextCell>,
    id: r.operatorSyncRunId
  }));

  return (
    <TableAccordion title={t('gpsIntegration.sections.recentSyncRuns')} expanded={expanded} setExpanded={setExpanded}>
      {error
        ? <ArgonBox><ArgonTypography variant="button" color="error">{error}</ArgonTypography></ArgonBox>
        : runs.length === 0 && loaded.current
          ? <ArgonTypography variant="caption" color="secondary">{t('gpsIntegration.empty.syncRuns')}</ArgonTypography>
          : <Table
              columns={[
                { name: 'operator', title: t('operator.title'), align: 'left' },
                { name: 'trigger', title: t('gpsIntegration.columns.trigger'), align: 'center' },
                { name: 'result', title: t('gpsIntegration.columns.result'), align: 'center' },
                { name: 'startedAt', title: t('gpsIntegration.columns.startedAt'), align: 'center' },
                { name: 'completedAt', title: t('gpsIntegration.columns.completedAt'), align: 'center' },
                { name: 'devices', title: t('gpsIntegration.columns.devicesDelta'), align: 'center' },
                { name: 'positions', title: t('gpsIntegration.columns.positions'), align: 'center' },
                { name: 'error', title: t('gpsIntegration.columns.errorCode'), align: 'center' },
                { name: 'id' }
              ]}
              rows={rows}
              selectedField="operator"
            />
      }
    </TableAccordion>
  );
}

export default RecentSyncRuns;
