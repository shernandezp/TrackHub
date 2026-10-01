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

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import TableAccordion from 'controls/Accordions/TableAccordion';
import CustomReadOnly from 'controls/Dialogs/CustomReadOnly';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import { useFeatures } from 'context/features';
import { parseJson } from 'utils/jsonUtils';

// Read-only for managers. Position storage/retention is a billing/storage-cost decision owned by
// the SuperAdministrator (gps.integration + gps.positionHistory feature configuration).
function RetentionSettings() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { features, isFeatureEnabled } = useFeatures();

  const state = useMemo(() => {
    const historyEnabled = isFeatureEnabled('gps.positionHistory');
    const history = features.find(f => f.featureKey === 'gps.positionHistory');
    const integration = features.find(f => f.featureKey === 'gps.integration');
    return {
      historyEnabled,
      retentionDays: historyEnabled ? (parseJson<{ retentionDays?: number }>(history?.configurationJson).retentionDays ?? null) : null,
      storingIntervalSeconds: parseJson<{ storingIntervalSeconds?: number }>(integration?.configurationJson).storingIntervalSeconds ?? null,
    };
  }, [features, isFeatureEnabled]);

  return (
    <TableAccordion sectionKey="gps-retention" title={t('gpsIntegration.sections.retention')} expanded={expanded} setExpanded={setExpanded}>
      <ArgonBox p={1}>
        <ArgonBox mb={2}>
          <ArgonTypography variant="caption" color="text">
            {t('gpsIntegration.retention.managedNote')}
          </ArgonTypography>
        </ArgonBox>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomReadOnly
              label={t('gpsIntegration.retention.historyStatus')}
              value={state.historyEnabled ? t('generic.yes') : t('generic.no')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomReadOnly
              label={t('gpsIntegration.retention.retentionDays')}
              value={state.retentionDays ?? '-'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomReadOnly
              label={t('gpsIntegration.retention.storingInterval')}
              value={state.storingIntervalSeconds ?? '-'} />
          </Grid>
        </Grid>
      </ArgonBox>
    </TableAccordion>
  );
}

export default RetentionSettings;
