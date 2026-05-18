import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import PublicLinkDialog from "layouts/manageadmin/components/publicLinks/PublicLinkDialog";
import useAccountService from "services/account";
import usePublicLinkService from "services/publicLinks";
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

function ManagePublicLinks() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState(null);
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const [mintedToken, setMintedToken] = useState(null);
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const { getPublicLinkGrantsByAccount, createPublicLinkGrant, revokePublicLinkGrant } = usePublicLinkService();

  const loadLinks = async () => {
    setLoading(true);
    try {
      const currentAccount = await getAccountByUser();
      if (!currentAccount?.accountId) return;
      setAccount(currentAccount);
      const items = await getPublicLinkGrantsByAccount(currentAccount.accountId);
      setLinks(items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadLinks();
    }
  }, [expanded]);

  const handleAddClick = () => {
    setValues({});
    setErrors({});
    setMintedToken(null);
  };

  const handleSubmit = async () => {
    if (!validate(['resourceType', 'resourceId', 'scopes', 'expiresAt']) || !account?.accountId) return;
    setLoading(true);
    try {
      const grant = {
        accountId: account.accountId,
        resourceType: values.resourceType,
        resourceId: values.resourceId,
        scopes: values.scopes,
        purpose: values.purpose,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null
      };
      const result = await createPublicLinkGrant(grant);
      if (result?.token) {
        setMintedToken(result.token);
      } else {
        setOpen(false);
      }
      await loadLinks();
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (link) => {
    if (!link?.publicLinkGrantId) return;
    setLoading(true);
    try {
      await revokePublicLinkGrant(link.publicLinkGrantId);
      await loadLinks();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('administration.publicLinks')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table
          columns={[
            { name: 'resource', title: t('administration.resource'), align: 'left' },
            { name: 'scopes', title: t('administration.scopes'), align: 'center' },
            { name: 'expires', title: t('administration.expiresAt'), align: 'center' },
            { name: 'accessCount', title: t('administration.accessCount'), align: 'center' },
            { name: 'status', title: t('administration.status'), align: 'center' },
            { name: 'action', title: t('generic.action'), align: 'center' },
            { name: 'id' }
          ]}
          rows={links.map(link => ({
            resource: <TextCell>{`${link.resourceType}:${link.resourceId}`}</TextCell>,
            scopes: <TextCell>{link.scopes}</TextCell>,
            expires: <TextCell>{formatDateTime(link.expiresAt)}</TextCell>,
            accessCount: <TextCell>{link.accessCount}</TextCell>,
            status: <TextCell>{link.revokedAt ? t('administration.revokedAt') : t('generic.active')}</TextCell>,
            action: (
              !link.revokedAt && (
                <ArgonButton variant="text" color="error" onClick={() => handleRevoke(link)}>
                  <Icon>block</Icon>&nbsp;{t('administration.revokePublicLinkGrant')}
                </ArgonButton>
              )
            ),
            id: link.publicLinkGrantId
          }))}
          selectedField="resource"
        />
      </TableAccordion>
      <PublicLinkDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
        mintedToken={mintedToken}
      />
    </>
  );
}

export default ManagePublicLinks;
