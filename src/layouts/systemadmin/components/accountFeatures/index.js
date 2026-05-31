import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonBadge from "components/ArgonBadge";
import ArgonTypography from "components/ArgonTypography";
import useAccountService from "services/account";
import useAccountFeatureService from "services/accountFeatures";
import { LoadingContext } from 'LoadingContext';

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

function SystemAccountFeatures() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState([]);
  const loaded = useRef(false);
  const { getAccounts } = useAccountService();
  const { getAccountFeatures } = useAccountFeatureService();

  useEffect(() => {
    if (!expanded || loaded.current) return;
    loaded.current = true;

    async function loadFeatures() {
      setLoading(true);
      try {
        const accounts = await getAccounts();
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
      } finally {
        setLoading(false);
      }
    }

    loadFeatures();
  }, [expanded]);

  return (
    <TableAccordion title={t('accountFeatures.title')} expanded={expanded} setExpanded={setExpanded}>
      <Table
        columns={[
          { name: 'account', title: t('account.title'), align: 'left' },
          { name: 'feature', title: t('accountFeatures.feature'), align: 'left' },
          { name: 'enabled', title: t('accountFeatures.enabled'), align: 'center' },
          { name: 'tier', title: t('accountFeatures.tier'), align: 'center' },
          { name: 'source', title: t('accountFeatures.source'), align: 'center' },
          { name: 'id' }
        ]}
        rows={rows}
        selectedField="feature"
      />
    </TableAccordion>
  );
}

export default SystemAccountFeatures;
