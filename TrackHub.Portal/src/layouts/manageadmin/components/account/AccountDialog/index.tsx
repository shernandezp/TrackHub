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

import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import type { FormChangeHandler } from 'controls/Dialogs/useForm';
import type { AccountFormValues } from 'layouts/manageadmin/data/accountTableData';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import ArgonTypography from 'components/ArgonTypography';
import { DEFAULT_TIME_ZONE, timeZoneOptions } from 'utils/timeZones';

interface AccountFormDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: () => void | Promise<void>;
  values: AccountFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
}

function AccountFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }: AccountFormDialogProps) {
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
          {/* Every date the platform computes for the account (today, day totals, report ranges) is
              read in this zone; the servers themselves run on UTC. */}
          <CustomSelect
            list={timeZoneOptions(values.timeZoneId)}
            handleChange={handleChange}
            name="timeZoneId"
            id="timeZoneId"
            label={t('account.timeZone')}
            value={values.timeZoneId || DEFAULT_TIME_ZONE}
            numericValue={false}
            required
          />
          <ArgonTypography variant="caption" color="secondary">
            {t('account.timeZoneHint')}
          </ArgonTypography>
        </form>
      </FormDialog>
  );
}

export default AccountFormDialog;
