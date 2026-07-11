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

import { useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mui/material/Icon';
import TableBase from "controls/Tables/Table";
import TableAccordionBase from "controls/Accordions/TableAccordion";
import ArgonButtonBase from "components/ArgonButton";
import ArgonTypographyBase from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import NotificationRuleDialog from "layouts/manageadmin/components/notificationRules/NotificationRuleDialog";
import type { NotificationRuleFormValues } from "layouts/manageadmin/components/notificationRules/NotificationRuleDialog";
import { getAccountByUser } from "api/manager/accounts";
import type { Account } from "api/manager/accounts";
import {
  getNotificationRules,
  createNotificationRule,
  updateNotificationRule,
  disableNotificationRule,
} from "api/manager/notificationRules";
import type { NotificationRule, NotificationRuleDtoInput } from "api/manager/notificationRules";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

// The vendored useForm hook is still JS; type its tuple result at the boundary.
type NotificationRuleUseFormResult = [
  NotificationRuleFormValues,
  FormChangeHandler,
  (values: NotificationRuleFormValues) => void,
  (errors: Record<string, string>) => void,
  (requiredFields: string[]) => boolean,
  Record<string, string>,
];

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface TableColumn { name: string; title?: string; align?: string; }
type TableRow = Record<string, ReactNode>;
interface TableProps { columns: TableColumn[]; rows: TableRow[]; selectedField?: string; }
const Table = TableBase as unknown as (props: TableProps) => ReactNode;
interface TableAccordionProps {
  title: string;
  showAddIcon?: boolean;
  expanded: boolean;
  setOpen?: (open: boolean) => void;
  handleAddClick?: () => void;
  setExpanded: (expanded: boolean) => void;
  children?: ReactNode;
}
const TableAccordion = TableAccordionBase as unknown as (props: TableAccordionProps) => ReactNode;
interface ArgonButtonProps { variant?: string; color?: string; onClick?: () => void; children?: ReactNode; }
const ArgonButton = ArgonButtonBase as unknown as (props: ArgonButtonProps) => ReactNode;
interface ArgonTypographyProps { variant?: string; color?: string; fontWeight?: string; children?: ReactNode; }
const ArgonTypography = ArgonTypographyBase as unknown as (props: ArgonTypographyProps) => ReactNode;

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

function ManageNotificationRules() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({ enabled: true }) as NotificationRuleUseFormResult;
  const loaded = useRef(false);

  const loadRules = async () => {
    setLoading(true);
    try {
      const currentAccount = await getAccountByUser();
      if (!currentAccount?.accountId) return;
      setAccount(currentAccount);
      const items = await getNotificationRules(currentAccount.accountId);
      setRules(items || []);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadRules();
    }
  }, [expanded]);

  const handleAddClick = () => {
    setValues({ accountId: account?.accountId, enabled: true });
    setErrors({});
  };

  const handleEdit = (rule: NotificationRule) => {
    setValues({ ...rule, accountId: account?.accountId || rule.accountId });
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate(['ruleKey', 'ruleType', 'triggerEvent']) || !account?.accountId) return;
    setLoading(true);
    try {
      // recipientSelector/channelsJson are required (String!) by the backend but
      // not enforced by the dialog — default them so the typed create/update succeeds.
      // validate() gates the required fields, so assert the mutation input at the boundary.
      const rule = {
        accountId: account.accountId,
        ruleKey: values.ruleKey,
        ruleType: values.ruleType,
        enabled: values.enabled !== false,
        triggerEvent: values.triggerEvent,
        recipientSelector: values.recipientSelector ?? '',
        channelsJson: values.channelsJson ?? '',
        throttlingJson: values.throttlingJson ?? null,
        configurationJson: values.configurationJson ?? null,
      } as NotificationRuleDtoInput;
      if (values.notificationRuleId) {
        await updateNotificationRule(values.notificationRuleId, rule);
      } else {
        await createNotificationRule(rule);
      }
      setOpen(false);
      await loadRules();
    } catch (error) {
      // Keep the dialog open on failure so the user can retry without re-entering.
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (rule: NotificationRule) => {
    if (!rule?.notificationRuleId) return;
    setLoading(true);
    try {
      await disableNotificationRule(rule.notificationRuleId);
      await loadRules();
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('notificationRules.title')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table
          columns={[
            { name: 'key', title: t('notificationRules.key'), align: 'left' },
            { name: 'type', title: t('notificationRules.type'), align: 'center' },
            { name: 'status', title: t('notificationRules.status'), align: 'center' },
            { name: 'modified', title: t('generic.modified'), align: 'center' },
            { name: 'action', title: t('generic.action'), align: 'center' },
            { name: 'id' }
          ]}
          rows={rules.map(rule => ({
            key: <TextCell>{rule.ruleKey}</TextCell>,
            type: <TextCell>{rule.ruleType}</TextCell>,
            status: <TextCell>{rule.enabled ? t('generic.yes') : t('generic.no')}</TextCell>,
            modified: <TextCell>{formatDateTime(rule.lastModified)}</TextCell>,
            action: (
              <>
                <ArgonButton variant="text" color="dark" onClick={() => handleEdit(rule)}>
                  <Icon>edit</Icon>&nbsp;{t('generic.edit')}
                </ArgonButton>
                {rule.enabled && (
                  <ArgonButton variant="text" color="error" onClick={() => handleDisable(rule)}>
                    <Icon>block</Icon>&nbsp;{t('notificationRules.disable')}
                  </ArgonButton>
                )}
              </>
            ),
            id: rule.notificationRuleId
          }))}
          selectedField="key"
        />
      </TableAccordion>
      <NotificationRuleDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />
    </>
  );
}

export default ManageNotificationRules;
