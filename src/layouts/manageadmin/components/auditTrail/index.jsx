import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonTypography from "components/ArgonTypography";
import { getAccountByUser } from "api/manager/accounts";
import { getAuditTrail } from "api/manager/auditEvents";
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

function ManageAuditTrail() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [auditTrail, setAuditTrail] = useState([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (!expanded || loaded.current) return;
    loaded.current = true;

    async function loadAuditTrail() {
      setLoading(true);
      try {
        const account = await getAccountByUser();
        if (!account?.accountId) return;
        const items = await getAuditTrail(account.accountId);
        setAuditTrail(items || []);
      } catch (error) {
        notifyApiError(error);
      } finally {
        setLoading(false);
      }
    }

    loadAuditTrail();
  }, [expanded]);

  return (
    <TableAccordion title={t('auditTrail.title')} expanded={expanded} setExpanded={setExpanded}>
      <Table
        columns={[
          { name: 'action', title: t('generic.action'), align: 'left' },
          { name: 'actor', title: t('auditTrail.actor'), align: 'center' },
          { name: 'resource', title: t('auditTrail.resource'), align: 'center' },
          { name: 'result', title: t('auditTrail.result'), align: 'center' },
          { name: 'occurredAt', title: t('auditTrail.occurredAt'), align: 'center' },
          { name: 'id' }
        ]}
        rows={auditTrail.map(item => ({
          action: <TextCell>{item.action}</TextCell>,
          actor: <TextCell>{`${item.actorType}:${item.actorId}`}</TextCell>,
          resource: <TextCell>{`${item.resourceType}:${item.resourceId}`}</TextCell>,
          result: <TextCell>{item.result}</TextCell>,
          occurredAt: <TextCell>{formatDateTime(item.occurredAt)}</TextCell>,
          id: item.auditEventId
        }))}
        selectedField="action"
      />
    </TableAccordion>
  );
}

export default ManageAuditTrail;
