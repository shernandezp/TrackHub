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
import CustomSelectBase from 'controls/Dialogs/CustomSelect';
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import { ALLOWED_TRANSITIONS, ACCOUNT_STATUS_I18N, requiresReason } from 'data/accountStatuses';
import type { AccountStatusId, AccountStatusName } from 'data/accountStatuses';
import type { AccountStatusFormValues } from 'layouts/systemadmin/data/accountsTableData';

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

interface CustomTextFieldProps {
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

interface AccountStatusDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: AccountStatusFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function AccountStatusDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: AccountStatusDialogProps) {
  const { t } = useTranslation();

  const targets = (ALLOWED_TRANSITIONS[values.statusId as AccountStatusId] || []).map((name: AccountStatusName) => ({
    value: name,
    label: t(ACCOUNT_STATUS_I18N[name])
  }));

  const reasonRequired = requiresReason(values.targetStatus as AccountStatusName);

  return (
    <FormDialog
        title={t('account.changeStatus')}
        handleSave={handleSubmit}
        open={open}
        setOpen={setOpen}
        maxWidth="sm">
      <form>
        <CustomSelect
          list={targets}
          handleChange={handleChange}
          name="targetStatus"
          id="targetStatus"
          label={t('account.targetStatus')}
          value={values.targetStatus || ''}
          required
        />
        {errors.targetStatus && <p>{errors.targetStatus}</p>}

        <CustomTextField
          margin="dense"
          name="reason"
          id="reason"
          label={t('account.reason')}
          type="text"
          fullWidth
          value={values.reason || ''}
          onChange={handleChange}
          errorMsg={errors.reason}
          required={reasonRequired}
        />
      </form>
    </FormDialog>
  );
}

export default AccountStatusDialog;
