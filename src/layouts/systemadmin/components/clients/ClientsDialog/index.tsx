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
import CustomPasswordFieldBase from 'controls/Dialogs/CustomPasswordField';
import type { ClientFormValues, ClientUserOption } from 'layouts/systemadmin/data/clientsTableData';

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
  value: string | number | null | undefined;
}
const CustomSelect = CustomSelectBase as unknown as (props: CustomSelectProps) => ReactNode;

interface ClientsFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: ClientFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
  users: ClientUserOption[];
}

function ClientsFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors, users }: ClientsFormDialogProps) {
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

export default ClientsFormDialog;
