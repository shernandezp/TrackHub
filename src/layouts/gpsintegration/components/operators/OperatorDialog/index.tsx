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
import CustomSelectBase from 'controls/Dialogs/CustomSelect';
import protocolTypes from 'data/protocolTypes';
import type { OperatorFormValues } from 'layouts/gpsintegration/data/operatorsTableData';

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

interface OperatorFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: OperatorFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function OperatorFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: OperatorFormDialogProps) {
  const { t } = useTranslation();
  return (
    <FormDialog
          title={t('operator.details')}
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
            label={t('operator.name')}
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            required
            errorMsg={errors.name}
          />
          <CustomTextField
            margin="normal"
            name="description"
            id="description"
            label={t('operator.description')}
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="phoneNumber"
            id="phoneNumber"
            label={t('generic.phoneNumber')}
            type="text"
            fullWidth
            value={values.phoneNumber || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="emailAddress"
            id="emailAddress"
            label={t('generic.emailAddress')}
            type="email"
            fullWidth
            value={values.emailAddress || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="address"
            id="address"
            label={t('generic.address')}
            type="text"
            fullWidth
            value={values.address || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="contactName"
            id="contactName"
            label={t('operator.contactName')}
            type="text"
            fullWidth
            value={values.contactName || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="syncIntervalMinutes"
            id="syncIntervalMinutes"
            label={t('gpsIntegration.columns.syncInterval')}
            type="number"
            fullWidth
            value={values.syncIntervalMinutes ?? 30}
            onChange={handleChange}
          />

          <CustomSelect
            list={protocolTypes}
            handleChange={handleChange}
            name="protocolTypeId"
            id="protocolTypeId"
            label={t('operator.type')}
            value={values.protocolTypeId}
            required
          />
          {errors.protocolTypeId && <p>{errors.protocolTypeId}</p>}
        </form>
      </FormDialog>
  );
}

export default OperatorFormDialog;
