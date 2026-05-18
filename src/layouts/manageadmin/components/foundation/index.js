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
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonBadge from "components/ArgonBadge";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import DriverDialog from "layouts/manageadmin/components/foundation/DriverDialog";
import NotificationRuleDialog from "layouts/manageadmin/components/foundation/NotificationRuleDialog";
import PublicLinkDialog from "layouts/manageadmin/components/foundation/PublicLinkDialog";
import useAccountService from "services/account";
import useFoundationService from "services/foundation";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

const defaultFeatures = [
  'geofencing',
  'trip-management',
  'driver-mobile',
  'reports',
  'public-links',
  'documents',
  'notifications'
];

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

function ManageFoundation() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState(null);
  const [features, setFeatures] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [notificationRules, setNotificationRules] = useState([]);
  const [alertEvents, setAlertEvents] = useState([]);
  const [jobRuns, setJobRuns] = useState([]);
  const [publicLinks, setPublicLinks] = useState([]);
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const {
    getAccountFeatures,
    setAccountFeature,
    getDriversByAccount,
    getAuditTrail,
    getNotificationRules,
    getAlertEvents,
    getBackgroundJobRuns,
    getPublicLinkGrantsByAccount,
    createDriver,
    updateDriver,
    deactivateDriver,
    createNotificationRule,
    updateNotificationRule,
    disableNotificationRule,
    acknowledgeAlertEvent,
    resolveAlertEvent,
    createPublicLinkGrant,
    revokePublicLinkGrant
  } = useFoundationService();
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [driverValues, handleDriverChange, setDriverValues, setDriverErrors, validateDriver, driverErrors] = useForm({ active: true });
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleValues, handleRuleChange, setRuleValues, setRuleErrors, validateRule, ruleErrors] = useForm({ enabled: true });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkValues, handleLinkChange, setLinkValues, setLinkErrors, validateLink, linkErrors] = useForm({});
  const [mintedToken, setMintedToken] = useState(null);

  const loadFoundation = async () => {
    setLoading(true);
    try {
      const currentAccount = await getAccountByUser();
      if (!currentAccount?.accountId) return;

      setAccount(currentAccount);
      const [
        accountFeatures,
        accountDrivers,
        accountAuditTrail,
        accountNotificationRules,
        accountAlertEvents,
        accountJobRuns,
        accountPublicLinks
      ] = await Promise.all([
        getAccountFeatures(currentAccount.accountId),
        getDriversByAccount(currentAccount.accountId),
        getAuditTrail(currentAccount.accountId),
        getNotificationRules(currentAccount.accountId),
        getAlertEvents(currentAccount.accountId),
        getBackgroundJobRuns(currentAccount.accountId),
        getPublicLinkGrantsByAccount(currentAccount.accountId)
      ]);

      setFeatures(accountFeatures || []);
      setDrivers(accountDrivers || []);
      setAuditTrail(accountAuditTrail || []);
      setNotificationRules(accountNotificationRules || []);
      setAlertEvents(accountAlertEvents || []);
      setJobRuns(accountJobRuns || []);
      setPublicLinks(accountPublicLinks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadFoundation();
    }
  }, [expanded]);

  const handleToggleFeature = async (feature) => {
    if (!account?.accountId) return;

    setLoading(true);
    try {
      await setAccountFeature({
        accountId: account.accountId,
        featureKey: feature.featureKey,
        enabled: !feature.enabled,
        tier: feature.tier || 'default',
        source: 'portal',
        effectiveFrom: feature.effectiveFrom,
        effectiveTo: feature.effectiveTo,
        configurationJson: feature.configurationJson
      });
      const accountFeatures = await getAccountFeatures(account.accountId);
      setFeatures(accountFeatures || []);
    } finally {
      setLoading(false);
    }
  };

  const refreshDrivers = async () => {
    if (!account?.accountId) return;
    const accountDrivers = await getDriversByAccount(account.accountId);
    setDrivers(accountDrivers || []);
  };

  const handleAddDriver = () => {
    setDriverValues({ accountId: account?.accountId, active: true });
    setDriverErrors({});
    setDriverDialogOpen(true);
  };

  const handleEditDriver = (driver) => {
    setDriverValues({ ...driver, accountId: account?.accountId || driver.accountId });
    setDriverErrors({});
    setDriverDialogOpen(true);
  };

  const handleSaveDriver = async () => {
    if (!validateDriver(['name']) || !account?.accountId) return;

    setLoading(true);
    try {
      const driver = { ...driverValues, accountId: account.accountId, active: driverValues.active !== false };
      if (driver.driverId) {
        await updateDriver(driver.driverId, driver);
      } else {
        await createDriver(driver);
      }
      setDriverDialogOpen(false);
      await refreshDrivers();
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateDriver = async (driver) => {
    if (!driver?.driverId || !window.confirm(t('foundation.deactivateDriverConfirmation'))) return;

    setLoading(true);
    try {
      await deactivateDriver(driver.driverId);
      await refreshDrivers();
    } finally {
      setLoading(false);
    }
  };

  const refreshNotificationRules = async () => {
    if (!account?.accountId) return;
    const items = await getNotificationRules(account.accountId);
    setNotificationRules(items || []);
  };

  const refreshAlertEvents = async () => {
    if (!account?.accountId) return;
    const items = await getAlertEvents(account.accountId);
    setAlertEvents(items || []);
  };

  const refreshPublicLinks = async () => {
    if (!account?.accountId) return;
    const items = await getPublicLinkGrantsByAccount(account.accountId);
    setPublicLinks(items || []);
  };

  const handleAddRule = () => {
    setRuleValues({ accountId: account?.accountId, enabled: true });
    setRuleErrors({});
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule) => {
    setRuleValues({ ...rule, accountId: account?.accountId || rule.accountId });
    setRuleErrors({});
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!validateRule(['ruleKey', 'ruleType', 'triggerEvent']) || !account?.accountId) return;
    setLoading(true);
    try {
      const rule = { ...ruleValues, accountId: account.accountId, enabled: ruleValues.enabled !== false };
      if (rule.notificationRuleId) {
        await updateNotificationRule(rule.notificationRuleId, rule);
      } else {
        await createNotificationRule(rule);
      }
      setRuleDialogOpen(false);
      await refreshNotificationRules();
    } finally {
      setLoading(false);
    }
  };

  const handleDisableRule = async (rule) => {
    if (!rule?.notificationRuleId) return;
    setLoading(true);
    try {
      await disableNotificationRule(rule.notificationRuleId);
      await refreshNotificationRules();
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alert) => {
    if (!alert?.alertEventId) return;
    setLoading(true);
    try {
      await acknowledgeAlertEvent(alert.alertEventId);
      await refreshAlertEvents();
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alert) => {
    if (!alert?.alertEventId) return;
    setLoading(true);
    try {
      await resolveAlertEvent(alert.alertEventId);
      await refreshAlertEvents();
    } finally {
      setLoading(false);
    }
  };

  const handleAddPublicLink = () => {
    setLinkValues({});
    setLinkErrors({});
    setMintedToken(null);
    setLinkDialogOpen(true);
  };

  const handleSavePublicLink = async () => {
    if (!validateLink(['resourceType', 'resourceId', 'scopes', 'expiresAt']) || !account?.accountId) return;
    setLoading(true);
    try {
      const grant = {
        accountId: account.accountId,
        resourceType: linkValues.resourceType,
        resourceId: linkValues.resourceId,
        scopes: linkValues.scopes,
        purpose: linkValues.purpose,
        expiresAt: linkValues.expiresAt ? new Date(linkValues.expiresAt).toISOString() : null
      };
      const result = await createPublicLinkGrant(grant);
      if (result?.token) {
        setMintedToken(result.token);
      } else {
        setLinkDialogOpen(false);
      }
      await refreshPublicLinks();
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePublicLink = async (link) => {
    if (!link?.publicLinkGrantId) return;
    setLoading(true);
    try {
      await revokePublicLinkGrant(link.publicLinkGrantId);
      await refreshPublicLinks();
    } finally {
      setLoading(false);
    }
  };

  const featureRows = defaultFeatures.map(featureKey => {
    const feature = features.find(item => item.featureKey === featureKey) || {
      accountId: account?.accountId,
      featureKey,
      enabled: false,
      tier: 'default',
      source: 'portal'
    };

    return {
      feature: <TextCell>{feature.featureKey}</TextCell>,
      enabled: <ArgonBadge variant="gradient" color={feature.enabled ? 'success' : 'secondary'} size="xs" container>{feature.enabled ? t('generic.yes') : t('generic.no')}</ArgonBadge>,
      tier: <TextCell>{feature.tier}</TextCell>,
      source: <TextCell>{feature.source}</TextCell>,
      modified: <TextCell>{formatDateTime(feature.lastModified)}</TextCell>,
      action: (
        <ArgonButton variant="text" color="dark" onClick={() => handleToggleFeature(feature)}>
          <Icon>{feature.enabled ? 'toggle_off' : 'toggle_on'}</Icon>&nbsp;{feature.enabled ? t('foundation.disable') : t('foundation.enable')}
        </ArgonButton>
      ),
      id: feature.featureKey
    };
  });

  const featureColumns = [
    { name: 'feature', title: t('foundation.feature'), align: 'left' },
    { name: 'enabled', title: t('foundation.enabled'), align: 'center' },
    { name: 'tier', title: t('foundation.tier'), align: 'center' },
    { name: 'source', title: t('foundation.source'), align: 'center' },
    { name: 'modified', title: t('generic.modified'), align: 'center' },
    { name: 'action', title: t('generic.action'), align: 'center' },
    { name: 'id' }
  ];

  const simpleRows = (items, idField, mappings) => items.map(item => ({
    ...Object.fromEntries(mappings.map(([key, selector]) => [key, <TextCell key={key}>{selector(item)}</TextCell>])),
    id: item[idField]
  }));

  return (
    <TableAccordion title={t('foundation.title')} expanded={expanded} setExpanded={setExpanded}>
      <ArgonBox p={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ArgonTypography variant="h6">{t('foundation.features')}</ArgonTypography>
            <Table columns={featureColumns} rows={featureRows} selectedField="feature" />
          </Grid>
          <Grid item xs={12}>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h6">{t('foundation.drivers')}</ArgonTypography>
              <ArgonButton size="small" color="info" onClick={handleAddDriver} disabled={!account?.accountId}>
                <Icon>add</Icon>&nbsp;{t('foundation.createDriver')}
              </ArgonButton>
            </ArgonBox>
            <Table
              columns={[
                { name: 'name', title: t('driver.name'), align: 'left' },
                { name: 'phone', title: t('driver.phone'), align: 'center' },
                { name: 'document', title: t('driver.document'), align: 'center' },
                { name: 'active', title: t('generic.active'), align: 'center' },
                { name: 'action', title: t('generic.action'), align: 'center' },
                { name: 'id' }
              ]}
              rows={drivers.map(driver => ({
                name: <TextCell>{driver.name}</TextCell>,
                phone: <TextCell>{driver.phone}</TextCell>,
                document: <TextCell>{driver.documentNumber}</TextCell>,
                active: <TextCell>{driver.active ? t('generic.yes') : t('generic.no')}</TextCell>,
                action: (
                  <>
                    <ArgonButton variant="text" color="dark" onClick={() => handleEditDriver(driver)}>
                      <Icon>edit</Icon>&nbsp;{t('generic.edit')}
                    </ArgonButton>
                    {driver.active && (
                      <ArgonButton variant="text" color="error" onClick={() => handleDeactivateDriver(driver)}>
                        <Icon>block</Icon>&nbsp;{t('foundation.deactivateDriver')}
                      </ArgonButton>
                    )}
                  </>
                ),
                id: driver.driverId
              }))}
              selectedField="name"
            />
          </Grid>
          <Grid item xs={12}>
            <ArgonTypography variant="h6">{t('foundation.auditTrail')}</ArgonTypography>
            <Table
              columns={[
                { name: 'action', title: t('generic.action'), align: 'left' },
                { name: 'actor', title: t('foundation.actor'), align: 'center' },
                { name: 'resource', title: t('foundation.resource'), align: 'center' },
                { name: 'result', title: t('foundation.result'), align: 'center' },
                { name: 'occurredAt', title: t('foundation.occurredAt'), align: 'center' },
                { name: 'id' }
              ]}
              rows={simpleRows(auditTrail, 'auditEventId', [
                ['action', item => item.action],
                ['actor', item => `${item.actorType}:${item.actorId}`],
                ['resource', item => `${item.resourceType}:${item.resourceId}`],
                ['result', item => item.result],
                ['occurredAt', item => formatDateTime(item.occurredAt)]
              ])}
              selectedField="action"
            />
          </Grid>
          <Grid item xs={12}>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h6">{t('foundation.notificationsAndAlerts')}</ArgonTypography>
              <ArgonButton size="small" color="info" onClick={handleAddRule} disabled={!account?.accountId}>
                <Icon>add_alert</Icon>&nbsp;{t('foundation.createRule')}
              </ArgonButton>
            </ArgonBox>
            <Table
              columns={[
                { name: 'type', title: t('foundation.type'), align: 'left' },
                { name: 'key', title: t('foundation.key'), align: 'center' },
                { name: 'status', title: t('foundation.status'), align: 'center' },
                { name: 'modified', title: t('generic.modified'), align: 'center' },
                { name: 'action', title: t('generic.action'), align: 'center' },
                { name: 'id' }
              ]}
              rows={[
                ...notificationRules.map(rule => ({
                  type: <TextCell>{t('foundation.notificationRule')}</TextCell>,
                  key: <TextCell>{rule.ruleKey}</TextCell>,
                  status: <TextCell>{rule.enabled ? t('generic.yes') : t('generic.no')}</TextCell>,
                  modified: <TextCell>{formatDateTime(rule.lastModified)}</TextCell>,
                  action: (
                    <>
                      <ArgonButton variant="text" color="dark" onClick={() => handleEditRule(rule)}>
                        <Icon>edit</Icon>&nbsp;{t('generic.edit')}
                      </ArgonButton>
                      {rule.enabled && (
                        <ArgonButton variant="text" color="error" onClick={() => handleDisableRule(rule)}>
                          <Icon>block</Icon>&nbsp;{t('foundation.disable')}
                        </ArgonButton>
                      )}
                    </>
                  ),
                  id: rule.notificationRuleId
                })),
                ...alertEvents.map(alert => ({
                  type: <TextCell>{t('foundation.alert')}</TextCell>,
                  key: <TextCell>{alert.eventType}</TextCell>,
                  status: <TextCell>{alert.status}</TextCell>,
                  modified: <TextCell>{formatDateTime(alert.lastSeenAt)}</TextCell>,
                  action: (
                    <>
                      {alert.status !== 'acknowledged' && alert.status !== 'resolved' && (
                        <ArgonButton variant="text" color="dark" onClick={() => handleAcknowledgeAlert(alert)}>
                          <Icon>done</Icon>&nbsp;{t('foundation.acknowledgeAlert')}
                        </ArgonButton>
                      )}
                      {alert.status !== 'resolved' && (
                        <ArgonButton variant="text" color="success" onClick={() => handleResolveAlert(alert)}>
                          <Icon>done_all</Icon>&nbsp;{t('foundation.resolveAlert')}
                        </ArgonButton>
                      )}
                    </>
                  ),
                  id: alert.alertEventId
                }))
              ]}
              selectedField="key"
            />
          </Grid>
          <Grid item xs={12}>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h6">{t('foundation.publicLinks')}</ArgonTypography>
              <ArgonButton size="small" color="info" onClick={handleAddPublicLink} disabled={!account?.accountId}>
                <Icon>link</Icon>&nbsp;{t('foundation.createPublicLinkGrant')}
              </ArgonButton>
            </ArgonBox>
            <Table
              columns={[
                { name: 'resource', title: t('foundation.resource'), align: 'left' },
                { name: 'scopes', title: t('foundation.scopes'), align: 'center' },
                { name: 'expires', title: t('foundation.expiresAt'), align: 'center' },
                { name: 'accessCount', title: t('foundation.accessCount'), align: 'center' },
                { name: 'status', title: t('foundation.status'), align: 'center' },
                { name: 'action', title: t('generic.action'), align: 'center' },
                { name: 'id' }
              ]}
              rows={publicLinks.map(link => ({
                resource: <TextCell>{`${link.resourceType}:${link.resourceId}`}</TextCell>,
                scopes: <TextCell>{link.scopes}</TextCell>,
                expires: <TextCell>{formatDateTime(link.expiresAt)}</TextCell>,
                accessCount: <TextCell>{link.accessCount}</TextCell>,
                status: <TextCell>{link.revokedAt ? t('foundation.revokedAt') : t('generic.active')}</TextCell>,
                action: (
                  !link.revokedAt && (
                    <ArgonButton variant="text" color="error" onClick={() => handleRevokePublicLink(link)}>
                      <Icon>block</Icon>&nbsp;{t('foundation.revokePublicLinkGrant')}
                    </ArgonButton>
                  )
                ),
                id: link.publicLinkGrantId
              }))}
              selectedField="resource"
            />
          </Grid>
          <Grid item xs={12}>
            <ArgonTypography variant="h6">{t('foundation.backgroundJobs')}</ArgonTypography>
            <Table
              columns={[
                { name: 'job', title: t('foundation.job'), align: 'left' },
                { name: 'status', title: t('foundation.status'), align: 'center' },
                { name: 'attempts', title: t('foundation.attempts'), align: 'center' },
                { name: 'started', title: t('foundation.startedAt'), align: 'center' },
                { name: 'id' }
              ]}
              rows={simpleRows(jobRuns, 'backgroundJobRunId', [
                ['job', item => item.jobKey],
                ['status', item => item.status],
                ['attempts', item => item.attempts],
                ['started', item => formatDateTime(item.startedAt)]
              ])}
              selectedField="job"
            />
          </Grid>
        </Grid>
      </ArgonBox>
      <DriverDialog
        open={driverDialogOpen}
        setOpen={setDriverDialogOpen}
        handleSubmit={handleSaveDriver}
        values={driverValues}
        handleChange={handleDriverChange}
        errors={driverErrors}
      />
      <NotificationRuleDialog
        open={ruleDialogOpen}
        setOpen={setRuleDialogOpen}
        handleSubmit={handleSaveRule}
        values={ruleValues}
        handleChange={handleRuleChange}
        errors={ruleErrors}
      />
      <PublicLinkDialog
        open={linkDialogOpen}
        setOpen={setLinkDialogOpen}
        handleSubmit={handleSavePublicLink}
        values={linkValues}
        handleChange={handleLinkChange}
        errors={linkErrors}
        mintedToken={mintedToken}
      />
    </TableAccordion>
  );
}

export default ManageFoundation;
