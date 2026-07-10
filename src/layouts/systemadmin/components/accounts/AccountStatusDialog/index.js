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
import CustomSelect from 'controls/Dialogs/CustomSelect';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import { ALLOWED_TRANSITIONS, ACCOUNT_STATUS_I18N, requiresReason } from 'data/accountStatuses';

function AccountStatusDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();

  const targets = (ALLOWED_TRANSITIONS[values.statusId] || []).map((name) => ({
    value: name,
    label: t(ACCOUNT_STATUS_I18N[name])
  }));

  const reasonRequired = requiresReason(values.targetStatus);

  return (
    <FormDialog
        title={t('account.changeStatus')}
        handleSave={handleSubmit}
        open={open}
        setOpen={setOpen}
        maxWidth="sm">
      <form>
        <CustomSelect
          list={targets}
          handleChange={handleChange}
          name="targetStatus"
          id="targetStatus"
          label={t('account.targetStatus')}
          value={values.targetStatus || ''}
          required
        />
        {errors.targetStatus && <p>{errors.targetStatus}</p>}

        <CustomTextField
          margin="dense"
          name="reason"
          id="reason"
          label={t('account.reason')}
          type="text"
          fullWidth
          value={values.reason || ''}
          onChange={handleChange}
          errorMsg={errors.reason}
          required={reasonRequired}
        />
      </form>
    </FormDialog>
  );
}

AccountStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
};

export default AccountStatusDialog;
