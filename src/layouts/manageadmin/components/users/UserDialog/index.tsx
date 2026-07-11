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
import CustomCheckboxBase from 'controls/Dialogs/CustomCheckbox';
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import CustomPasswordFieldBase from 'controls/Dialogs/CustomPasswordField';
import type { UserFormValues } from 'layouts/manageadmin/data/usersTableData';

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

interface CustomTextFieldProps {
  autoFocus?: boolean;
  margin?: string;
  name: string;
  id: string;
  label: string;
  type?: string;
  fullWidth?: boolean;
  value: string | number;
  onChange: FormChangeHandler;
  required?: boolean;
  errorMsg?: string;
}
const CustomTextField = CustomTextFieldBase as unknown as (props: CustomTextFieldProps) => ReactNode;

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

interface CustomCheckboxProps {
  name: string;
  id: string;
  value?: boolean;
  handleChange: FormChangeHandler;
  label: string;
}
const CustomCheckbox = CustomCheckboxBase as unknown as (props: CustomCheckboxProps) => ReactNode;

interface UserFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: UserFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function UserFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: UserFormDialogProps) {
  const { t } = useTranslation();
  return (
    <FormDialog
          title={t('user.details')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="emailAddress"
            id="emailAddress"
            label={t('user.emailAddress')}
            type="email"
            fullWidth
            value={values.emailAddress || ''}
            onChange={handleChange}
            required
            errorMsg={errors.emailAddress}
          />

          {!values.userId && (
            <CustomPasswordField
                margin="normal"
                name="password"
                id="password"
                label={t('user.password')}
                fullWidth
                value={values.password || ''}
                onChange={handleChange}
                errorMsg={errors.password}
          />)}

          <CustomTextField
            margin="normal"
            name="username"
            id="username"
            label={t('user.username')}
            type="text"
            fullWidth
            value={values.username || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="firstName"
            id="firstName"
            label={t('user.firstName')}
            type="text"
            fullWidth
            value={values.firstName || ''}
            onChange={handleChange}
            errorMsg={errors.firstName}
            required
          />

          <CustomTextField
            margin="normal"
            name="secondName"
            id="secondName"
            label={t('user.secondName')}
            type="text"
            fullWidth
            value={values.secondName || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="lastName"
            id="lastName"
            label={t('user.lastName')}
            type="text"
            fullWidth
            value={values.lastName || ''}
            onChange={handleChange}
            errorMsg={errors.lastName}
            required
          />

          <CustomTextField
            margin="normal"
            name="secondSurname"
            id="secondSurname"
            label={t('user.secondSurname')}
            type="text"
            fullWidth
            value={values.secondSurname || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="dob"
            id="dob"
            label={t('user.dob')}
            type="date"
            fullWidth
            value={values.dob || ''}
            onChange={handleChange}
          />

          <CustomCheckbox
            name="active"
            id="active"
            value={values.active}
            handleChange={handleChange}
            label={t('user.active')} />

          <CustomCheckbox
            name="integrationUser"
            id="integrationUser"
            value={values.integrationUser}
            handleChange={handleChange}
            label={t('user.integrationUser')} />

        </form>
      </FormDialog>
  );
}

export default UserFormDialog;
