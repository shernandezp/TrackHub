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
import SupportGrantDialog from "layouts/systemadmin/components/foundation/SupportGrantDialog";
import useAccountService from "services/account";
import useFoundationService from "services/foundation";
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

function SystemFoundation() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState([]);
  const [grants, setGrants] = useState([]);
  const [principal, setPrincipal] = useState(null);
  const loaded = useRef(false);
  const { getAccounts } = useAccountService();
  const {
    getAccountFeatures,
    getAccountSupportGrants,
    getCurrentPrincipal,
    createAccountSupportGrant,
    approveAccountSupportGrant,
    revokeAccountSupportGrant
  } = useFoundationService();
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantValues, handleGrantChange, setGrantValues, setGrantErrors, validateGrant, grantErrors] = useForm({ accessLevel: 'read' });

  const refreshGrants = async () => {
    const items = await getAccountSupportGrants(null);
    setGrants(items || []);
  };

  useEffect(() => {
    if (!expanded || loaded.current) return;

    async function load() {
      loaded.current = true;
      setLoading(true);
      try {
        const [accounts, current] = await Promise.all([
          getAccounts(),
          getCurrentPrincipal()
        ]);
        setPrincipal(current);
        const featureRows = [];
        for (const account of accounts || []) {
          const features = await getAccountFeatures(account.accountId);
          (features || []).forEach(feature => {
            featureRows.push({
              account: <TextCell>{account.name}</TextCell>,
              feature: <TextCell>{feature.featureKey}</TextCell>,
              enabled: <ArgonBadge variant="gradient" color={feature.enabled ? 'success' : 'secondary'} size="xs" container>{feature.enabled ? t('generic.yes') : t('generic.no')}</ArgonBadge>,
              tier: <TextCell>{feature.tier}</TextCell>,
              source: <TextCell>{feature.source}</TextCell>,
              id: `${account.accountId}-${feature.featureKey}`
            });
          });
        }
        setRows(featureRows);
        await refreshGrants();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [expanded]);

  const handleAddGrant = () => {
    setGrantValues({ accessLevel: 'read', supportUserId: principal?.principalId || '' });
    setGrantErrors({});
    setGrantDialogOpen(true);
  };

  const handleSaveGrant = async () => {
    if (!validateGrant(['accountId', 'supportUserId', 'reason', 'ticketReference', 'startsAt', 'endsAt'])) return;
    setLoading(true);
    try {
      const grant = {
        accountId: grantValues.accountId,
        supportUserId: grantValues.supportUserId,
        reason: grantValues.reason,
        ticketReference: grantValues.ticketReference,
        accessLevel: grantValues.accessLevel || 'read',
        startsAt: grantValues.startsAt ? new Date(grantValues.startsAt).toISOString() : null,
        endsAt: grantValues.endsAt ? new Date(grantValues.endsAt).toISOString() : null
      };
      await createAccountSupportGrant(grant);
      setGrantDialogOpen(false);
      await refreshGrants();
    } finally {
      setLoading(false);
    }
  };

  const handleApproveGrant = async (grant) => {
    if (!grant?.accountSupportGrantId || !principal?.principalId) return;
    setLoading(true);
    try {
      await approveAccountSupportGrant(grant.accountSupportGrantId, principal.principalId);
      await refreshGrants();
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeGrant = async (grant) => {
    if (!grant?.accountSupportGrantId || !principal?.principalId) return;
    setLoading(true);
    try {
      await revokeAccountSupportGrant(grant.accountSupportGrantId, principal.principalId);
      await refreshGrants();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TableAccordion title={t('foundation.systemTitle')} expanded={expanded} setExpanded={setExpanded}>
      <ArgonBox p={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ArgonTypography variant="h6">{t('foundation.features')}</ArgonTypography>
            <Table
              columns={[
                { name: 'account', title: t('account.title'), align: 'left' },
                { name: 'feature', title: t('foundation.feature'), align: 'left' },
                { name: 'enabled', title: t('foundation.enabled'), align: 'center' },
                { name: 'tier', title: t('foundation.tier'), align: 'center' },
                { name: 'source', title: t('foundation.source'), align: 'center' },
                { name: 'id' }
              ]}
              rows={rows}
              selectedField="feature"
            />
          </Grid>
          <Grid item xs={12}>
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
              <ArgonTypography variant="h6">{t('foundation.supportGrants')}</ArgonTypography>
              <ArgonButton size="small" color="info" onClick={handleAddGrant}>
                <Icon>support_agent</Icon>&nbsp;{t('foundation.supportGrantRequest')}
              </ArgonButton>
            </ArgonBox>
            <Table
              columns={[
                { name: 'account', title: t('account.title'), align: 'left' },
                { name: 'supportUser', title: t('foundation.supportUserId'), align: 'center' },
                { name: 'reason', title: t('foundation.reason'), align: 'left' },
                { name: 'ticket', title: t('foundation.ticketReference'), align: 'center' },
                { name: 'accessLevel', title: t('foundation.accessLevel'), align: 'center' },
                { name: 'window', title: t('foundation.startsAt'), align: 'center' },
                { name: 'status', title: t('foundation.status'), align: 'center' },
                { name: 'action', title: t('generic.action'), align: 'center' },
                { name: 'id' }
              ]}
              rows={grants.map(grant => {
                const status = grant.revokedAt
                  ? t('foundation.revokedAt')
                  : (grant.approvedAt ? t('foundation.approvedAt') : t('foundation.supportGrantRequest'));
                return {
                  account: <TextCell>{grant.accountId}</TextCell>,
                  supportUser: <TextCell>{grant.supportUserId}</TextCell>,
                  reason: <TextCell>{grant.reason}</TextCell>,
                  ticket: <TextCell>{grant.ticketReference}</TextCell>,
                  accessLevel: <TextCell>{grant.accessLevel}</TextCell>,
                  window: <TextCell>{`${formatDateTime(grant.startsAt)} → ${formatDateTime(grant.endsAt)}`}</TextCell>,
                  status: <TextCell>{status}</TextCell>,
                  action: (
                    <>
                      {!grant.approvedAt && !grant.revokedAt && (
                        <ArgonButton variant="text" color="success" onClick={() => handleApproveGrant(grant)}>
                          <Icon>verified</Icon>&nbsp;{t('foundation.approveSupportGrant')}
                        </ArgonButton>
                      )}
                      {!grant.revokedAt && (
                        <ArgonButton variant="text" color="error" onClick={() => handleRevokeGrant(grant)}>
                          <Icon>block</Icon>&nbsp;{t('foundation.revokeSupportGrant')}
                        </ArgonButton>
                      )}
                    </>
                  ),
                  id: grant.accountSupportGrantId
                };
              })}
              selectedField="reason"
            />
          </Grid>
        </Grid>
      </ArgonBox>
      <SupportGrantDialog
        open={grantDialogOpen}
        setOpen={setGrantDialogOpen}
        handleSubmit={handleSaveGrant}
        values={grantValues}
        handleChange={handleGrantChange}
        errors={grantErrors}
      />
    </TableAccordion>
  );
}

export default SystemFoundation;
