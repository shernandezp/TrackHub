import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import useForm from "controls/Dialogs/useForm";
import DriverDialog from "layouts/manageadmin/components/drivers/DriverDialog";
import useAccountService from "services/account";
import useDriverService from "services/drivers";
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

function ManageDrivers() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [account, setAccount] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({ active: true });
  const loaded = useRef(false);
  const { getAccountByUser } = useAccountService();
  const { getDriversByAccount, createDriver, updateDriver, deactivateDriver } = useDriverService();

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const currentAccount = await getAccountByUser();
      if (!currentAccount?.accountId) return;
      setAccount(currentAccount);
      const items = await getDriversByAccount(currentAccount.accountId);
      setDrivers(items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadDrivers();
    }
  }, [expanded]);

  const handleAddClick = () => {
    setValues({ accountId: account?.accountId, active: true });
    setErrors({});
  };

  const handleEdit = (driver) => {
    setValues({ ...driver, accountId: account?.accountId || driver.accountId });
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate(['name']) || !account?.accountId) return;
    setLoading(true);
    try {
      const driver = { ...values, accountId: account.accountId, active: values.active !== false };
      if (driver.driverId) {
        await updateDriver(driver.driverId, driver);
      } else {
        await createDriver(driver);
      }
      setOpen(false);
      await loadDrivers();
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (driver) => {
    if (!driver?.driverId || !window.confirm(t('administration.deactivateDriverConfirmation'))) return;
    setLoading(true);
    try {
      await deactivateDriver(driver.driverId);
      await loadDrivers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('administration.drivers')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
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
                <ArgonButton variant="text" color="dark" onClick={() => handleEdit(driver)}>
                  <Icon>edit</Icon>&nbsp;{t('generic.edit')}
                </ArgonButton>
                {driver.active && (
                  <ArgonButton variant="text" color="error" onClick={() => handleDeactivate(driver)}>
                    <Icon>block</Icon>&nbsp;{t('administration.deactivateDriver')}
                  </ArgonButton>
                )}
              </>
            ),
            id: driver.driverId
          }))}
          selectedField="name"
        />
      </TableAccordion>
      <DriverDialog
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

export default ManageDrivers;
