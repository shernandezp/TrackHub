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

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import FormDialogBase from "controls/Dialogs/FormDialog";
import CustomTextFieldBase from 'controls/Dialogs/CustomTextField';
import useForm from "controls/Dialogs/useForm";
import ArgonBoxBase from "components/ArgonBox";
import ArgonTypographyBase from "components/ArgonTypography";
import { createPublicLinkGrant } from "api/manager/publicLinks";
import type { PublicLinkGrantDtoInput } from "api/manager/publicLinks";
import { getCurrentPrincipal } from "api/manager/principals";
import { notifyApiError } from "api/core/errors";
import { publicDownloadUrl } from "api/manager/documents";
import type { DocumentVm } from "api/manager/documents";

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

interface ShareFormValues { purpose?: string; expiresAt?: string; }

// The vendored useForm hook is still JS; type its tuple result at the boundary.
type ShareUseFormResult = [
  ShareFormValues,
  FormChangeHandler,
  (values: ShareFormValues) => void,
  (errors: Record<string, string>) => void,
  (requiredFields: string[]) => boolean,
  Record<string, string>,
];

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface FormDialogProps {
  title: string;
  handleSave: () => void | Promise<void>;
  handleCancel?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  maxWidth?: string;
  children?: ReactNode;
}
const FormDialog = FormDialogBase as unknown as (props: FormDialogProps) => ReactNode;
interface CustomTextFieldProps {
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

interface ShareState { token: string; url: string; }

interface ShareDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  accountId?: string | null;
  document?: DocumentVm | null;
}

// Create/copy a document public-share link (spec 04 §7, §8). Reuses PublicLinkGrant with
// ResourceType="Document" + scope "document.read"; the token + URL are shown once at creation.
function ShareDialog({ open, setOpen, accountId = null, document = null }: ShareDialogProps) {
  const { t } = useTranslation();
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({}) as ShareUseFormResult;
  const [share, setShare] = useState<ShareState | null>(null);

  const reset = () => { setValues({}); setErrors({}); setShare(null); };

  const handleSave = async () => {
    if (share) { reset(); setOpen(false); return; }
    if (!validate(['expiresAt']) || !document?.documentId || !accountId) return;
    const principal = await getCurrentPrincipal().catch(() => null);
    const createdBy = principal?.userId || principal?.driverId || principal?.clientId || principal?.subjectId || '';
    try {
      // expiresAt is gated by validate(['expiresAt']); assert the mutation input at the boundary.
      const grant = await createPublicLinkGrant({
        accountId,
        resourceType: 'Document',
        resourceId: document.documentId,
        scopes: 'document.read',
        purpose: values.purpose || 'Document share',
        subjectTokenIdHash: null,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
        createdByPrincipalId: createdBy,
      } as PublicLinkGrantDtoInput);
      if (grant?.token) {
        setShare({
          token: grant.token,
          url: publicDownloadUrl(grant.publicLinkGrantId, accountId, document.documentId, grant.token),
        });
      } else {
        setOpen(false);
      }
    } catch (error) {
      // Keep the dialog open on failure so the user can retry.
      notifyApiError(error);
    }
  };

  return (
    <FormDialog title={t('documentManagement.share')} handleSave={handleSave} handleCancel={reset} open={open} setOpen={setOpen} maxWidth="md">
      {share ? (
        <ArgonBox p={1}>
          <ArgonTypography variant="caption" color="error" fontWeight="medium">
            {t('documentManagement.shareTokenWarning')}
          </ArgonTypography>
          <ArgonBox mt={2}>
            <CustomTextField
              margin="normal" name="shareUrl" id="shareUrl" label="URL" type="text" fullWidth multiline minRows={2}
              value={share.url} InputProps={{ readOnly: true }} onChange={() => { }}
            />
          </ArgonBox>
        </ArgonBox>
      ) : (
        <form>
          <CustomTextField
            margin="dense" name="purpose" id="purpose" label={t('publicLinks.purpose')} type="text" fullWidth
            value={values.purpose || ''} onChange={handleChange}
          />
          <CustomTextField
            margin="normal" name="expiresAt" id="expiresAt" label={t('documentManagement.expiresAt')} type="datetime-local"
            fullWidth InputLabelProps={{ shrink: true }} value={values.expiresAt || ''} onChange={handleChange}
            required errorMsg={errors.expiresAt}
          />
        </form>
      )}
    </FormDialog>
  );
}

export default ShareDialog;
