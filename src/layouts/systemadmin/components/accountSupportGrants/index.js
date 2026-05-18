import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import SupportGrantDialog from "layouts/systemadmin/components/accountSupportGrants/SupportGrantDialog";
import usePrincipalService from "services/principals";
import useSupportGrantService from "services/supportGrants";
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

function ManageAccountSupportGrants() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [grants, setGrants] = useState([]);
  const [principal, setPrincipal] = useState(null);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({ accessLevel: 'read' });
  const loaded = useRef(false);
  const { getCurrentPrincipal } = usePrincipalService();
  const { getAccountSupportGrants, createAccountSupportGrant, approveAccountSupportGrant, revokeAccountSupportGrant } = useSupportGrantService();
  const principalId = principal?.userId || principal?.driverId || principal?.clientId || principal?.subjectId || '';

  const loadGrants = async () => {
    setLoading(true);
    try {
      const [items, current] = await Promise.all([
        getAccountSupportGrants(null),
        getCurrentPrincipal()
      ]);
      setGrants(items || []);
      setPrincipal(current);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadGrants();
    }
  }, [expanded]);

  const handleAddClick = () => {
    setValues({ accessLevel: 'read', supportUserId: principalId });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate(['accountId', 'supportUserId', 'reason', 'ticketReference', 'startsAt', 'endsAt'])) return;
    setLoading(true);
    try {
      await createAccountSupportGrant({
        accountId: values.accountId,
        supportUserId: values.supportUserId,
        reason: values.reason,
        ticketReference: values.ticketReference,
        accessLevel: values.accessLevel || 'read',
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null
      });
      setOpen(false);
      await loadGrants();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (grant) => {
    if (!grant?.accountSupportGrantId || !principalId) return;
    setLoading(true);
    try {
      await approveAccountSupportGrant(grant.accountSupportGrantId, principalId);
      await loadGrants();
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (grant) => {
    if (!grant?.accountSupportGrantId || !principalId) return;
    setLoading(true);
    try {
      await revokeAccountSupportGrant(grant.accountSupportGrantId, principalId);
      await loadGrants();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('administration.supportGrants')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table
          columns={[
            { name: 'account', title: t('account.title'), align: 'left' },
            { name: 'supportUser', title: t('administration.supportUserId'), align: 'center' },
            { name: 'reason', title: t('administration.reason'), align: 'left' },
            { name: 'ticket', title: t('administration.ticketReference'), align: 'center' },
            { name: 'accessLevel', title: t('administration.accessLevel'), align: 'center' },
            { name: 'window', title: t('administration.startsAt'), align: 'center' },
            { name: 'status', title: t('administration.status'), align: 'center' },
            { name: 'action', title: t('generic.action'), align: 'center' },
            { name: 'id' }
          ]}
          rows={grants.map(grant => {
            const status = grant.revokedAt
              ? t('administration.revokedAt')
              : (grant.approvedAt ? t('administration.approvedAt') : t('administration.supportGrantRequest'));
            return {
              account: <TextCell>{grant.accountId}</TextCell>,
              supportUser: <TextCell>{grant.supportUserId}</TextCell>,
              reason: <TextCell>{grant.reason}</TextCell>,
              ticket: <TextCell>{grant.ticketReference}</TextCell>,
              accessLevel: <TextCell>{grant.accessLevel}</TextCell>,
              window: <TextCell>{`${formatDateTime(grant.startsAt)} -> ${formatDateTime(grant.endsAt)}`}</TextCell>,
              status: <TextCell>{status}</TextCell>,
              action: (
                <>
                  {!grant.approvedAt && !grant.revokedAt && (
                    <ArgonButton variant="text" color="success" onClick={() => handleApprove(grant)}>
                      <Icon>verified</Icon>&nbsp;{t('administration.approveSupportGrant')}
                    </ArgonButton>
                  )}
                  {!grant.revokedAt && (
                    <ArgonButton variant="text" color="error" onClick={() => handleRevoke(grant)}>
                      <Icon>block</Icon>&nbsp;{t('administration.revokeSupportGrant')}
                    </ArgonButton>
                  )}
                </>
              ),
              id: grant.accountSupportGrantId
            };
          })}
          selectedField="reason"
        />
      </TableAccordion>
      <SupportGrantDialog
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

export default ManageAccountSupportGrants;
