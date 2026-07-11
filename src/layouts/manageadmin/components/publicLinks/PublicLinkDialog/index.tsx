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
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import ArgonBoxBase from "components/ArgonBox";
import ArgonTypographyBase from "components/ArgonTypography";

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

/** Dialog/form state for minting a public-link grant. */
export interface PublicLinkFormValues {
  resourceType?: string;
  resourceId?: string;
  scopes?: string;
  purpose?: string;
  expiresAt?: string;
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
  InputProps?: object;
  InputLabelProps?: object;
}
const CustomTextField = CustomTextFieldBase as unknown as (props: CustomTextFieldProps) => ReactNode;
interface ArgonBoxProps { p?: number; mt?: number; children?: ReactNode; }
const ArgonBox = ArgonBoxBase as unknown as (props: ArgonBoxProps) => ReactNode;
interface ArgonTypographyProps { variant?: string; color?: string; fontWeight?: string; children?: ReactNode; }
const ArgonTypography = ArgonTypographyBase as unknown as (props: ArgonTypographyProps) => ReactNode;

interface PublicLinkDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void | Promise<void>;
  values: PublicLinkFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
  mintedToken?: string | null;
}

function PublicLinkDialog({ open, setOpen, handleSubmit, values, handleChange, errors, mintedToken = null }: PublicLinkDialogProps) {
  const { t } = useTranslation();

  return (
    <FormDialog
      title={t('publicLinks.create')}
      handleSave={mintedToken ? () => setOpen(false) : handleSubmit}
      open={open}
      setOpen={setOpen}
      maxWidth="md">
      {mintedToken ? (
        <ArgonBox p={2}>
          <ArgonTypography variant="caption" color="error" fontWeight="medium">
            {t('publicLinks.tokenWarning')}
          </ArgonTypography>
          <ArgonBox mt={2}>
            <CustomTextField
              margin="normal"
              name="mintedToken"
              id="mintedToken"
              label={t('publicLinks.token')}
              type="text"
              fullWidth
              multiline
              minRows={2}
              value={mintedToken}
              InputProps={{ readOnly: true }}
              onChange={() => { }}
            />
          </ArgonBox>
        </ArgonBox>
      ) : (
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="resourceType"
            id="resourceType"
            label={t('publicLinks.resourceType')}
            type="text"
            fullWidth
            value={values.resourceType || ''}
            onChange={handleChange}
            required
            errorMsg={errors.resourceType}
          />
          <CustomTextField
            margin="normal"
            name="resourceId"
            id="resourceId"
            label={t('publicLinks.resourceId')}
            type="text"
            fullWidth
            value={values.resourceId || ''}
            onChange={handleChange}
            required
            errorMsg={errors.resourceId}
          />
          <CustomTextField
            margin="normal"
            name="scopes"
            id="scopes"
            label={t('publicLinks.scopes')}
            type="text"
            fullWidth
            value={values.scopes || ''}
            onChange={handleChange}
            required
            errorMsg={errors.scopes}
          />
          <CustomTextField
            margin="normal"
            name="purpose"
            id="purpose"
            label={t('publicLinks.purpose')}
            type="text"
            fullWidth
            value={values.purpose || ''}
            onChange={handleChange}
          />
          <CustomTextField
            margin="normal"
            name="expiresAt"
            id="expiresAt"
            label={t('publicLinks.expiresAt')}
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={values.expiresAt || ''}
            onChange={handleChange}
            required
            errorMsg={errors.expiresAt}
          />
        </form>
      )}
    </FormDialog>
  );
}

export default PublicLinkDialog;
