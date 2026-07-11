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

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import FormDialogBase from "controls/Dialogs/FormDialog";
import CustomCheckboxBase from 'controls/Dialogs/CustomCheckbox';
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import CustomSelectBase from 'controls/Dialogs/CustomSelect';
import { poiTypes } from 'data/poiTypes';
import { colors } from 'data/colors';
import { toCamelCase } from 'utils/stringUtils';
import type { PoiFormValues, PoiGroupOption } from 'layouts/manageadmin/data/poisTableData';

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
  value: string | number | undefined | null;
  required?: boolean;
}
const CustomSelect = CustomSelectBase as unknown as (props: CustomSelectProps) => ReactNode;

interface CustomCheckboxProps {
  name: string;
  id: string;
  value?: boolean;
  handleChange: FormChangeHandler;
  label: string;
}
const CustomCheckbox = CustomCheckboxBase as unknown as (props: CustomCheckboxProps) => ReactNode;

interface PoiFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: PoiFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
  groupOptions: PoiGroupOption[];
}

function PoiFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors, groupOptions }: PoiFormDialogProps) {
  const { t } = useTranslation();
  const translatedTypes = poiTypes.map(type => ({
    ...type,
    label: t(`poi.types.${toCamelCase(type.label)}` as 'poi.types.clientSite')
  }));
  const translatedColors = colors.map(color => ({
    ...color,
    label: t(`colors.${color.label.toLowerCase()}` as 'colors.red')
  }));
  return (
    <FormDialog
          title={t('poi.details')}
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
            label={t('poi.name')}
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            errorMsg={errors.name}
            required
          />

          <CustomTextField
            margin="normal"
            name="description"
            id="description"
            label={t('poi.description')}
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
            errorMsg={errors.description}
          />

          <CustomSelect
            list={translatedTypes}
            handleChange={handleChange}
            name="type"
            id="type"
            label={t('poi.type')}
            value={values.type}
            required
          />

          <CustomTextField
            margin="normal"
            name="latitude"
            id="latitude"
            label={t('poi.latitude')}
            type="number"
            fullWidth
            value={values.latitude ?? ''}
            onChange={handleChange}
            errorMsg={errors.latitude}
            required
          />

          <CustomTextField
            margin="normal"
            name="longitude"
            id="longitude"
            label={t('poi.longitude')}
            type="number"
            fullWidth
            value={values.longitude ?? ''}
            onChange={handleChange}
            errorMsg={errors.longitude}
            required
          />

          <CustomTextField
            margin="normal"
            name="address"
            id="address"
            label={t('poi.address')}
            type="text"
            fullWidth
            value={values.address || ''}
            onChange={handleChange}
            errorMsg={errors.address}
          />

          <CustomSelect
            list={translatedColors}
            handleChange={handleChange}
            name="color"
            id="color"
            label={t('poi.color')}
            value={values.color}
          />

          <CustomSelect
            list={groupOptions}
            handleChange={handleChange}
            name="groupId"
            id="groupId"
            label={t('poi.group')}
            value={values.groupId}
          />

          <CustomCheckbox
            name="active"
            id="active"
            value={values.active}
            handleChange={handleChange}
            label={t('poi.active')} />

        </form>
      </FormDialog>
  );
}

export default PoiFormDialog;
