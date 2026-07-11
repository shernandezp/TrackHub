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

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

/** Dialog/form state for a notification rule — a partial superset of the API record. */
export interface NotificationRuleFormValues {
  notificationRuleId?: string;
  accountId?: string;
  ruleKey?: string;
  ruleType?: string;
  enabled?: boolean;
  triggerEvent?: string;
  recipientSelector?: string;
  channelsJson?: string;
  throttlingJson?: string | null;
  configurationJson?: string | null;
  lastModified?: string;
}

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
  multiline?: boolean;
  minRows?: number;
  value: string | number;
  onChange: FormChangeHandler;
  required?: boolean;
  errorMsg?: string;
}
const CustomTextField = CustomTextFieldBase as unknown as (props: CustomTextFieldProps) => ReactNode;
interface CustomCheckboxProps { name: string; id: string; value?: boolean; handleChange: FormChangeHandler; label: string; }
const CustomCheckbox = CustomCheckboxBase as unknown as (props: CustomCheckboxProps) => ReactNode;

interface NotificationRuleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: NotificationRuleFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function NotificationRuleDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: NotificationRuleDialogProps) {
  const { t } = useTranslation();

  return (
    <FormDialog
      title={values.notificationRuleId ? t('notificationRules.update') : t('notificationRules.create')}
      handleSave={handleSubmit}
      open={open}
      setOpen={setOpen}
      maxWidth="md">
      <form>
        <CustomTextField
          autoFocus
          margin="dense"
          name="ruleKey"
          id="ruleKey"
          label={t('notificationRules.key')}
          type="text"
          fullWidth
          value={values.ruleKey || ''}
          onChange={handleChange}
          required
          errorMsg={errors.ruleKey}
        />
        <CustomTextField
          margin="normal"
          name="ruleType"
          id="ruleType"
          label={t('notificationRules.type')}
          type="text"
          fullWidth
          value={values.ruleType || ''}
          onChange={handleChange}
          required
          errorMsg={errors.ruleType}
        />
        <CustomTextField
          margin="normal"
          name="triggerEvent"
          id="triggerEvent"
          label={t('notificationRules.triggerEvent')}
          type="text"
          fullWidth
          value={values.triggerEvent || ''}
          onChange={handleChange}
          required
          errorMsg={errors.triggerEvent}
        />
        <CustomTextField
          margin="normal"
          name="recipientSelector"
          id="recipientSelector"
          label={t('notificationRules.recipientSelector')}
          type="text"
          fullWidth
          value={values.recipientSelector || ''}
          onChange={handleChange}
        />
        <CustomTextField
          margin="normal"
          name="channelsJson"
          id="channelsJson"
          label={t('notificationRules.channelsJson')}
          type="text"
          fullWidth
          multiline
          minRows={2}
          value={values.channelsJson || ''}
          onChange={handleChange}
        />
        <CustomTextField
          margin="normal"
          name="throttlingJson"
          id="throttlingJson"
          label={t('notificationRules.throttlingJson')}
          type="text"
          fullWidth
          multiline
          minRows={2}
          value={values.throttlingJson || ''}
          onChange={handleChange}
        />
        <CustomTextField
          margin="normal"
          name="configurationJson"
          id="configurationJson"
          label={t('notificationRules.configurationJson')}
          type="text"
          fullWidth
          multiline
          minRows={2}
          value={values.configurationJson || ''}
          onChange={handleChange}
        />
        <CustomCheckbox
          name="enabled"
          id="enabled"
          value={values.enabled}
          handleChange={handleChange}
          label={t('notificationRules.enabled')} />
      </form>
    </FormDialog>
  );
}

export default NotificationRuleDialog;
