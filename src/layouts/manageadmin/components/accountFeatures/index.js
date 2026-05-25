import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useAccountService from "services/account";
import useAccountFeatureService from "services/accountFeatures";
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

function ManageAccountFeatures() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState(null);
  const [features, setFeatures] = useState([]);
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const { getAccountFeatures, setAccountFeature } = useAccountFeatureService();

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const currentAccount = await getAccountByUser();
      if (!currentAccount?.accountId) return;
      setAccount(currentAccount);
      const accountFeatures = await getAccountFeatures(currentAccount.accountId);
      setFeatures(accountFeatures || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadFeatures();
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

  const rows = defaultFeatures.map(featureKey => {
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
          <Icon>{feature.enabled ? 'toggle_off' : 'toggle_on'}</Icon>&nbsp;{feature.enabled ? t('accountFeatures.disable') : t('accountFeatures.enable')}
        </ArgonButton>
      ),
      id: feature.featureKey
    };
  });

  return (
    <TableAccordion title={t('accountFeatures.title')} expanded={expanded} setExpanded={setExpanded}>
      <Table
        columns={[
          { name: 'feature', title: t('accountFeatures.feature'), align: 'left' },
          { name: 'enabled', title: t('accountFeatures.enabled'), align: 'center' },
          { name: 'tier', title: t('accountFeatures.tier'), align: 'center' },
          { name: 'source', title: t('accountFeatures.source'), align: 'center' },
          { name: 'modified', title: t('generic.modified'), align: 'center' },
          { name: 'action', title: t('generic.action'), align: 'center' },
          { name: 'id' }
        ]}
        rows={rows}
        selectedField="feature"
      />
    </TableAccordion>
  );
}

export default ManageAccountFeatures;
