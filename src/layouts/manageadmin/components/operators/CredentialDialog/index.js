/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';

function CredentialFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('credential.title')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="uri"
            id="uri"
            label="URL"
            type="text"
            fullWidth
            value={values.uri || ''}
            onChange={handleChange}
            required
            errorMsg={errors.uri}
          />
          <CustomTextField
            margin="normal"
            name="username"
            id="username"
            label={t('credential.username')}
            type="text"
            fullWidth
            value={values.username || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="password"
            id="password"
            label={t('credential.password')}
            fullWidth
            value={values.password || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="key"
            id="key"
            label={t('credential.key')}
            fullWidth
            value={values.key || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="key2"
            id="key2"
            label={t('credential.key2')}
            fullWidth
            value={values.key2 || ''}
            onChange={handleChange}
          />
          
        </form>
      </FormDialog>
  );
}

CredentialFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default CredentialFormDialog;