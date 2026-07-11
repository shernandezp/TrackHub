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
import CustomSelectBase from 'controls/Dialogs/CustomSelect';
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import CustomCheckboxBase from 'controls/Dialogs/CustomCheckbox';
import CustomPasswordFieldBase from 'controls/Dialogs/CustomPasswordField';
import accountTypes from 'data/accountTypes';
import type { AccountFormValues } from 'layouts/systemadmin/data/accountsTableData';

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
  required?: boolean;
  errorMsg?: string;
}
const CustomPasswordField = CustomPasswordFieldBase as unknown as (props: CustomPasswordFieldProps) => ReactNode;

interface CustomSelectProps {
  list: readonly unknown[];
  handleChange: FormChangeHandler;
  name: string;
  id: string;
  label: string;
  value: string | number | undefined;
  required?: boolean;
}
const CustomSelect = CustomSelectBase as unknown as (props: CustomSelectProps) => ReactNode;

interface CustomCheckboxProps {
  name: string;
  id: string;
  value: boolean | undefined;
  handleChange: FormChangeHandler;
  label: string;
}
const CustomCheckbox = CustomCheckboxBase as unknown as (props: CustomCheckboxProps) => ReactNode;

interface AccountsFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: AccountFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function AccountsFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: AccountsFormDialogProps) {
  const { t } = useTranslation();
  return (
    <FormDialog
          title={t('account.details')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="name"
            id="name"
            label={t('account.name')}
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            errorMsg={errors.name}
            required
          />

          <CustomTextField
            margin="dense"
            name="description"
            id="description"
            label={t('account.description')}
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
          />

          {!values.accountId && (
            <CustomTextField
                autoFocus
                margin="dense"
                name="emailAddress"
                id="emailAddress"
                label={t('user.emailAddress')}
                type="text"
                fullWidth
                value={values.emailAddress || ''}
                onChange={handleChange}
                errorMsg={errors.emailAddress}
                required
            />
          )}
          {!values.accountId && (
            <CustomPasswordField
                margin="normal"
                name="password"
                id="password"
                label={t('user.password')}
                fullWidth
                value={values.password || ''}
                onChange={handleChange}
                required
            />
          )}
          {!values.accountId && (
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
          )}
          {!values.accountId && (
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
          )}

          <CustomSelect
            list={accountTypes}
            handleChange={handleChange}
            name="typeId"
            id="typeId"
            label={t('account.type')}
            value={values.typeId}
            required
          />
          {errors.typeId && <p>{errors.typeId}</p>}

          <CustomCheckbox
            name="active"
            id="active"
            value={values.active}
            handleChange={handleChange}
            label={t('account.active')} />

        </form>
      </FormDialog>
  );
}

export default AccountsFormDialog;
