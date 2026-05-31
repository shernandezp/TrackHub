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

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';

function SupportGrantDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();

  return (
    <FormDialog
      title={t('supportGrants.request')}
      handleSave={handleSubmit}
      open={open}
      setOpen={setOpen}
      maxWidth="md">
      <form>
        <CustomTextField
          autoFocus
          margin="dense"
          name="accountId"
          id="accountId"
          label={t('account.title')}
          type="text"
          fullWidth
          value={values.accountId || ''}
          onChange={handleChange}
          required
          errorMsg={errors.accountId}
        />
        <CustomTextField
          margin="normal"
          name="supportUserId"
          id="supportUserId"
          label={t('supportGrants.supportUserId')}
          type="text"
          fullWidth
          value={values.supportUserId || ''}
          onChange={handleChange}
          required
          errorMsg={errors.supportUserId}
        />
        <CustomTextField
          margin="normal"
          name="reason"
          id="reason"
          label={t('supportGrants.reason')}
          type="text"
          fullWidth
          multiline
          minRows={2}
          value={values.reason || ''}
          onChange={handleChange}
          required
          errorMsg={errors.reason}
        />
        <CustomTextField
          margin="normal"
          name="ticketReference"
          id="ticketReference"
          label={t('supportGrants.ticketReference')}
          type="text"
          fullWidth
          value={values.ticketReference || ''}
          onChange={handleChange}
          required
          errorMsg={errors.ticketReference}
        />
        <CustomTextField
          margin="normal"
          name="accessLevel"
          id="accessLevel"
          label={t('supportGrants.accessLevel')}
          type="text"
          fullWidth
          value={values.accessLevel || 'read'}
          onChange={handleChange}
        />
        <CustomTextField
          margin="normal"
          name="startsAt"
          id="startsAt"
          label={t('supportGrants.startsAt')}
          type="datetime-local"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={values.startsAt || ''}
          onChange={handleChange}
          required
          errorMsg={errors.startsAt}
        />
        <CustomTextField
          margin="normal"
          name="endsAt"
          id="endsAt"
          label={t('supportGrants.endsAt')}
          type="datetime-local"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={values.endsAt || ''}
          onChange={handleChange}
          required
          errorMsg={errors.endsAt}
        />
      </form>
    </FormDialog>
  );
}

SupportGrantDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
};

export default SupportGrantDialog;
