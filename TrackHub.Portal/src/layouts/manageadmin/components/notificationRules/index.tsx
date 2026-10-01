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

import { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import ServerPagination from "controls/Tables/ServerPagination";
import { useClampPage, useServerList } from "controls/Tables/useServerList";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import NotificationRuleDialog, {
  ruleToFormValues,
  formValuesToRuleInput,
} from "layouts/manageadmin/components/notificationRules/NotificationRuleDialog";
import type { NotificationRuleFormValues } from "layouts/manageadmin/components/notificationRules/NotificationRuleDialog";
import { getAccountByUser } from "api/manager/accounts";
import type { Account } from "api/manager/accounts";
import { useFeatures } from "context/features";
import {
  getNotificationRules,
  createNotificationRule,
  updateNotificationRule,
  disableNotificationRule,
} from "api/manager/notificationRules";
import type { NotificationRule } from "api/manager/notificationRules";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";
import {
  NOTIFICATIONS_FEATURE_KEY,
  NOTIFICATIONS_EMAIL_FEATURE_KEY,
  NOTIFICATIONS_WHATSAPP_FEATURE_KEY,
} from 'utils/notificationsCatalog';

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

const PAGE_SIZE = 25;

function ManageNotificationRules() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const { isFeatureEnabled } = useFeatures();
  const notificationsEnabled = isFeatureEnabled(NOTIFICATIONS_FEATURE_KEY);
  const emailEnabled = isFeatureEnabled(NOTIFICATIONS_EMAIL_FEATURE_KEY);
  const whatsAppEnabled = isFeatureEnabled(NOTIFICATIONS_WHATSAPP_FEATURE_KEY);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm<NotificationRuleFormValues>({ enabled: true });
  const [totalCount, setTotalCount] = useState(0);
  const [pageLength, setPageLength] = useState(0);
  const { page, setPage, params } = useServerList(PAGE_SIZE);
  useClampPage(page, PAGE_SIZE, totalCount, setPage);

  const loadRules = async () => {
    setLoading(true);
    try {
      const currentAccount = await getAccountByUser();
      if (!currentAccount?.accountId) return;
      setAccount(currentAccount);
      const items = await getNotificationRules(currentAccount.accountId, params.skip, params.take);
      setRules(items.items);
      setTotalCount(items.totalCount);
      setPageLength(items.items.length);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      loadRules();
    }
  }, [expanded, params]);

  const handleAddClick = () => {
    setValues({
      accountId: account?.accountId,
      enabled: true,
      subscribers: true,
      channels: [],
      roles: [],
      contacts: [],
      digest: 'None',
    });
    setErrors({});
  };

  const handleEdit = (rule: NotificationRule) => {
    setValues(ruleToFormValues(rule));
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate(['ruleKey', 'ruleType', 'triggerEvent']) || !account?.accountId) return;
    setLoading(true);
    try {
      const rule = formValuesToRuleInput(values, account.accountId);
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
      <TableAccordion sectionKey="notification-rules"
        title={t('notificationRules.title')}
        showAddIcon={notificationsEnabled}
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
          serverPaged
        />
        <ServerPagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} pageLength={pageLength} onPageChange={setPage} />
      </TableAccordion>
      <NotificationRuleDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        setValues={setValues}
        errors={errors}
        emailEnabled={emailEnabled}
        whatsAppEnabled={whatsAppEnabled}
      />
    </>
  );
}

export default ManageNotificationRules;
