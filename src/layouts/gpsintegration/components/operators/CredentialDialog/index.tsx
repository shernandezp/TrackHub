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

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import FormDialogBase from "controls/Dialogs/FormDialog";
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import CustomPasswordFieldBase from 'controls/Dialogs/CustomPasswordField';
import type { CredentialFormValues } from 'layouts/gpsintegration/data/operatorsTableData';

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface FormDialogProps {
  title: string;
  handleSave: () => void | Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
  maxWidth?: string;
  children?: ReactNode;
}
const FormDialog = FormDialogBase as unknown as (props: FormDialogProps) => ReactNode;

interface CustomFieldProps {
  autoFocus?: boolean;
  margin?: string;
  name: string;
  id: string;
  label: string;
  type?: string;
  fullWidth?: boolean;
  value: string;
  onChange: FormChangeHandler;
  required?: boolean;
  errorMsg?: string;
}
const CustomTextField = CustomTextFieldBase as unknown as (props: CustomFieldProps) => ReactNode;
const CustomPasswordField = CustomPasswordFieldBase as unknown as (props: CustomFieldProps) => ReactNode;

interface CredentialFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: CredentialFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function CredentialFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: CredentialFormDialogProps) {
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

export default CredentialFormDialog;
