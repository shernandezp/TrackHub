/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';

function ClientsFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors, users }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('clients.details')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
            {!values.clientId && (
                <CustomTextField
                    autoFocus
                    margin="dense"
                    name="name"
                    id="name"
                    label={t('clients.name')}
                    type="text"
                    fullWidth
                    value={values.name || ''}
                    onChange={handleChange}
                    errorMsg={errors.name}
                    required
                />
            )}

            {!values.clientId && (
                <CustomTextField
                    margin="dense"
                    name="description"
                    id="description"
                    label={t('clients.description')}
                    type="text"
                    fullWidth
                    value={values.description || ''}
                    onChange={handleChange}
                />
            )}

            {!values.clientId && (
                <CustomPasswordField
                    margin="normal"
                    name="secret"
                    id="secret"
                    label={t('clients.secret')}
                    fullWidth
                    value={values.secret || ''}
                    onChange={handleChange}
                    errorMsg={errors.secret}
                    required
                />
            )}

            <CustomSelect
                list={users}
                handleChange={handleChange}
                name="userId"
                id="userId"
                label={t('clients.linkedUser')}
                value={values.userId}
            />
        </form>
      </FormDialog>
  );
}

ClientsFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired
};

export default ClientsFormDialog;