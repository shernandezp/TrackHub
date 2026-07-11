import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import NotificationRuleDialog from "layouts/manageadmin/components/notificationRules/NotificationRuleDialog";
import { getAccountByUser } from "api/manager/accounts";
import {
  getNotificationRules,
  createNotificationRule,
  updateNotificationRule,
  disableNotificationRule,
} from "api/manager/notificationRules";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

function TextCell({ children }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

TextCell.propTypes = {
  children: PropTypes.node
};

function ManageNotificationRules() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState(null);
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({ enabled: true });
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

  const handleEdit = (rule) => {
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
      };
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

  const handleDisable = async (rule) => {
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
