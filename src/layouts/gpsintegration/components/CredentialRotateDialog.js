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

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import useCredentialService from 'services/credential';
import { formatDateTime } from 'utils/dateUtils';

function CredentialRotateDialog({ open, setOpen, operator, onSaved }) {
  const { t } = useTranslation();
  const { getOperatorCredentialMetadata, rotateOperatorCredential } = useCredentialService();
  const [meta, setMeta] = useState(null);
  const [values, setValues] = useState({ uri: '', username: '', password: '', key: '', key2: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !operator?.operatorId) return;
    (async () => {
      const md = await getOperatorCredentialMetadata(operator.operatorId);
      setMeta(md);
      setValues({ uri: md?.uri || '', username: '', password: '', key: '', key2: '' });
      setErrors({});
    })();
  }, [open, operator?.operatorId]);

  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    const next = {};
    if (!values.uri) next.uri = true;
    if (!values.username) next.username = true;
    if (!values.password) next.password = true;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const ok = await rotateOperatorCredential({
      operatorId: operator.operatorId,
      uri: values.uri, username: values.username, password: values.password,
      key: values.key || null, key2: values.key2 || null
    });
    if (ok) onSaved?.();
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t('gpsIntegration.credential.title')}</DialogTitle>
      <DialogContent>
        {meta && (
          <ArgonTypography variant="caption" color="secondary">
            v{meta.credentialVersion} · {t('gpsIntegration.credential.rotatedAt')}: {formatDateTime(meta.rotatedAt) || '-'}
            {meta.rotatedByPrincipalType ? ` (${meta.rotatedByPrincipalType})` : ''}
          </ArgonTypography>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField fullWidth required name="uri" label={t('gpsIntegration.credential.uri')}
              value={values.uri} onChange={handleChange} error={!!errors.uri} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required name="username" label={t('gpsIntegration.credential.username')}
              value={values.username} onChange={handleChange} error={!!errors.username}
              autoComplete="off" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required type="password" name="password" label={t('gpsIntegration.credential.password')}
              value={values.password} onChange={handleChange} error={!!errors.password}
              autoComplete="new-password" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="password" name="key" label={t('gpsIntegration.credential.key')}
              value={values.key} onChange={handleChange} autoComplete="off" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="password" name="key2" label={t('gpsIntegration.credential.key2')}
              value={values.key2} onChange={handleChange} autoComplete="off" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <ArgonButton color="secondary" onClick={() => setOpen(false)}>{t('generic.cancel')}</ArgonButton>
        <ArgonButton color="info" onClick={handleSubmit}>{t('generic.save')}</ArgonButton>
      </DialogActions>
    </Dialog>
  );
}

CredentialRotateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  operator: PropTypes.object,
  onSaved: PropTypes.func
};

export default CredentialRotateDialog;
