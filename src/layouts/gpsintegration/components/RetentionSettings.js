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
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TableAccordion from 'controls/Accordions/TableAccordion';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import useAccountService from 'services/account';
import usePositionRetentionService from 'services/positionRetention';
import { LoadingContext } from 'LoadingContext';

function RetentionSettings() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [policy, setPolicy] = useState({ historyEnabled: false, retentionDays: 30, latestOnly: true });
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const { getPositionRetentionPolicy, setPositionRetentionPolicy } = usePositionRetentionService();

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      (async () => {
        setLoading(true);
        try {
          const acct = await getAccountByUser();
          if (!acct?.accountId) {
            setError(t('gpsIntegration.errors.retentionLoad'));
            return;
          }
          setAccountId(acct.accountId);
          const current = await getPositionRetentionPolicy(acct.accountId);
          if (current) {
            setPolicy({
              historyEnabled: !!current.historyEnabled,
              retentionDays: current.retentionDays ?? 30,
              latestOnly: !!current.latestOnly
            });
            setSource(current.effectiveSource);
          }
        } finally { setLoading(false); }
      })();
    }
  }, [expanded]);

  const handleSave = async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      await setPositionRetentionPolicy(accountId, policy);
    } finally { setLoading(false); }
  };

  return (
    <TableAccordion title={t('gpsIntegration.sections.retention')} expanded={expanded} setExpanded={setExpanded}>
      {error
        ? <ArgonTypography variant="button" color="error">{error}</ArgonTypography>
        : (
          <ArgonBox p={1}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.historyEnabled}
                      onChange={(e) => setPolicy(p => ({ ...p, historyEnabled: e.target.checked }))}
                    />
                  }
                  label={t('gpsIntegration.retention.historyEnabled')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth type="number" label={t('gpsIntegration.retention.retentionDays')}
                  value={policy.retentionDays}
                  onChange={(e) => setPolicy(p => ({ ...p, retentionDays: parseInt(e.target.value, 10) || 0 }))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.latestOnly}
                      onChange={(e) => setPolicy(p => ({ ...p, latestOnly: e.target.checked }))}
                    />
                  }
                  label={t('gpsIntegration.retention.latestOnly')}
                />
              </Grid>
              <Grid item xs={12}>
                <ArgonTypography variant="caption" color="secondary">
                  {t('gpsIntegration.retention.source')}: {source || t('gpsIntegration.retention.default')}
                </ArgonTypography>
              </Grid>
              <Grid item xs={12}>
                <ArgonButton color="info" onClick={handleSave} disabled={!accountId}>
                  {t('generic.save')}
                </ArgonButton>
              </Grid>
            </Grid>
          </ArgonBox>
        )
      }
    </TableAccordion>
  );
}

export default RetentionSettings;
