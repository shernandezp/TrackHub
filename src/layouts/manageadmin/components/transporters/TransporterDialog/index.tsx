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
import transporterTypes from 'data/transporterTypes';
import type { TransporterFormValues } from 'layouts/manageadmin/data/transportersTableData';

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

interface TransporterFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: TransporterFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function TransporterFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: TransporterFormDialogProps) {
  const { t } = useTranslation();
  const translatedTypes = transporterTypes.map(type => ({
    ...type,
    label: t(`transporterTypes.${type.label.toLowerCase()}` as 'transporterTypes.car')
  }));

  return (
    <FormDialog
          title={t('transporter.details')}
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
            label={t('transporter.name')}
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            required
            errorMsg={errors.name}
          />

          <CustomSelect
            list={translatedTypes}
            handleChange={handleChange}
            name="transporterTypeId"
            id="transporterTypeId"
            label={t('transporter.type')}
            value={values.transporterTypeId}
            required
          />
          {errors.transporterTypeId && <p>{errors.transporterTypeId}</p>}

        </form>
      </FormDialog>
  );
}

export default TransporterFormDialog;
