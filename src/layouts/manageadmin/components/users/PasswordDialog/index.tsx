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
import CustomPasswordFieldBase from 'controls/Dialogs/CustomPasswordField';
import type { PasswordFormValues } from 'layouts/manageadmin/data/usersTableData';

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

interface CustomPasswordFieldProps {
  margin?: string;
  name: string;
  id: string;
  label: string;
  fullWidth?: boolean;
  value: string;
  onChange: FormChangeHandler;
  errorMsg?: string;
}
const CustomPasswordField = CustomPasswordFieldBase as unknown as (props: CustomPasswordFieldProps) => ReactNode;

interface PasswordFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: PasswordFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function PasswordFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: PasswordFormDialogProps) {
  const { t } = useTranslation();
  return (
    <FormDialog
          title={t('user.updatePassword')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomPasswordField
            margin="normal"
            name="password"
            id="password"
            label={t('user.password')}
            fullWidth
            value={values.password || ''}
            onChange={handleChange}
            errorMsg={errors.password}
          />
        </form>
      </FormDialog>
  );
}

export default PasswordFormDialog;
