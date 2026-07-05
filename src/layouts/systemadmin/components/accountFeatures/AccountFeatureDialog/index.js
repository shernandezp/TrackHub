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
import FormDialog from 'controls/Dialogs/FormDialog';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomCheckbox from 'controls/Dialogs/CustomCheckbox';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import CustomReadOnly from 'controls/Dialogs/CustomReadOnly';

// SuperAdministrator editor for a single account feature. In "add" mode the account and feature
// are chosen; in "edit" mode they are fixed. Feature enablement, tier and the storage/cost
// configuration are billing-owned and only editable here.
function AccountFeatureDialog({ open, setOpen, handleSubmit, values, handleChange, errors, isAdd, accountOptions, featureOptions, configField }) {
  const { t } = useTranslation();
  const cfg = configField[values.featureKey];

  return (
    <FormDialog
      title={isAdd ? t('accountFeatures.addTitle') : `${values.accountName || ''} — ${values.featureKey || ''}`}
      handleSave={handleSubmit}
      open={open}
      setOpen={setOpen}
      maxWidth="sm">
      <form>
        {isAdd
          ? (
            <>
              <CustomSelect
                name="accountId"
                id="accountId"
                label={t('account.title')}
                list={accountOptions}
                value={values.accountId || ''}
                handleChange={handleChange}
                numericValue={false}
                required
              />
              <CustomSelect
                name="featureKey"
                id="featureKey"
                label={t('accountFeatures.feature')}
                list={featureOptions}
                value={values.featureKey || ''}
                handleChange={handleChange}
                numericValue={false}
                required
              />
            </>
          )
          : (
            <>
              <CustomReadOnly label={t('account.title')} value={values.accountName} />
              <CustomReadOnly label={t('accountFeatures.feature')} value={values.featureKey} />
            </>
          )}

        <CustomCheckbox
          name="enabled"
          id="enabled"
          value={!!values.enabled}
          handleChange={handleChange}
          label={t('accountFeatures.enabled')} />

        <CustomTextField
          margin="dense"
          name="tier"
          id="tier"
          label={t('accountFeatures.tier')}
          type="text"
          fullWidth
          value={values.tier || 'default'}
          onChange={handleChange}
          errorMsg={errors.tier}
        />

        {cfg && (
          <CustomTextField
            margin="dense"
            name="configValue"
            id="configValue"
            label={t(cfg.labelKey)}
            type="number"
            fullWidth
            value={values.configValue ?? cfg.default}
            onChange={handleChange}
            inputProps={{ min: 0 }}
            errorMsg={errors.configValue}
          />
        )}
      </form>
    </FormDialog>
  );
}

AccountFeatureDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  isAdd: PropTypes.bool,
  accountOptions: PropTypes.array,
  featureOptions: PropTypes.array,
  configField: PropTypes.object.isRequired,
};

export default AccountFeatureDialog;
