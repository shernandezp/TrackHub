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

/**
 * Drivers: one row per driver, a search box for accounts with hundreds of them, and three
 * icon actions. Credentials and devices live in the detail dialog rather than in another
 * accordion.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';
import Table from 'controls/Tables/Table';
import TableAccordion from 'controls/Accordions/TableAccordion';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import ArgonBadge from 'components/ArgonBadge';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import useForm from 'controls/Dialogs/useForm';
import DriverDialog from 'layouts/manageadmin/components/drivers/DriverDialog';
import type { DriverFormValues } from 'layouts/manageadmin/components/drivers/DriverDialog';
import DriverDetailDialog from 'layouts/manageadmin/components/drivers/DriverDetailDialog';
import ManageDriverQualifications from 'layouts/manageadmin/components/drivers/DriverQualifications';
import ManageDriverAssignments from 'layouts/manageadmin/components/drivers/DriverAssignments';
import QualificationExpirations from 'layouts/manageadmin/components/drivers/QualificationExpirations';
import { TextCell, statusColor } from 'layouts/manageadmin/components/drivers/workforceShared';
import type { BadgeColor } from 'layouts/manageadmin/components/drivers/workforceShared';
import { credentialState } from 'layouts/manageadmin/components/drivers/credentialLifecycle';
import { useFeatures } from 'context/features';
import { useAccountByUser } from 'queries/accounts';
import { useDriversByAccount, useCreateDriver, useUpdateDriver, useDeactivateDriver } from 'queries/drivers';
import { useDriverCredentials } from 'queries/driverIdentity';
import type { Driver, DriverDtoInput } from 'api/manager/drivers';
import type { DriverCredential } from 'api/security/driverIdentity';
import { LoadingContext } from 'LoadingContext';

const WORKFORCE_FEATURE_KEY = 'workforce';

function ManageDrivers() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { isFeatureEnabled } = useFeatures();
  const workforceEnabled = isFeatureEnabled(WORKFORCE_FEATURE_KEY);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Driver | null>(null);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm<DriverFormValues>({ active: true });

  const accountQuery = useAccountByUser({ enabled: expanded });
  const account = accountQuery.data ?? null;
  const accountId = account?.accountId;
  const driversQuery = useDriversByAccount(accountId, { enabled: expanded && !!accountId });
  const drivers = driversQuery.data ?? [];
  // One account-wide read feeds the credential column; the per-driver detail refetches its own.
  const credentialsQuery = useDriverCredentials(accountId, null, { enabled: expanded && !!accountId });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deactivateDriver = useDeactivateDriver();

  useEffect(() => {
    setLoading(accountQuery.isFetching || driversQuery.isFetching);
  }, [accountQuery.isFetching, driversQuery.isFetching, setLoading]);

  // The credential that speaks for a driver: an active one wins, else the newest of the rest.
  const credentialByDriver = useMemo(() => {
    const map = new Map<string, DriverCredential>();
    for (const credential of credentialsQuery.data ?? []) {
      const current = map.get(credential.driverId);
      if (!current || (!current.active && credential.active)) map.set(credential.driverId, credential);
    }
    return map;
  }, [credentialsQuery.data]);

  const accessBadge = (driver: Driver): { label: string; color: BadgeColor } => {
    const credential = credentialByDriver.get(driver.driverId);
    if (!credential) return { label: t('driver.accessNone'), color: 'secondary' };
    switch (credentialState(credential)) {
      case 'pending':
        return { label: t('workforce.credentials.statusPending'), color: 'info' };
      case 'revoked':
        return { label: t('workforce.credentials.statusRevoked'), color: statusColor('REVOKED') };
      case 'locked':
        return { label: t('workforce.credentials.statusLocked'), color: 'warning' };
      default:
        return { label: t('workforce.credentials.statusActive'), color: statusColor('ACTIVE') };
    }
  };

  const handleAddClick = () => {
    setValues({ accountId, active: true });
    setErrors({});
  };

  const handleEdit = (driver: Driver) => {
    setValues({ ...driver, accountId: accountId || driver.accountId });
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate(['name']) || !accountId) return;
    setLoading(true);
    try {
      const driver = { ...values, accountId, active: values.active !== false };
      if (driver.driverId) {
        await updateDriver.mutateAsync({ driverId: driver.driverId, driver: driver as DriverDtoInput });
      } else {
        await createDriver.mutateAsync(driver as DriverDtoInput);
      }
      setOpen(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open.
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (driver: Driver) => {
    if (!driver?.driverId || !window.confirm(t('driver.deactivateConfirmation'))) return;
    setLoading(true);
    try {
      await deactivateDriver.mutateAsync(driver.driverId);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const iconAction = (key: string, icon: string, color: 'dark' | 'info' | 'error', label: string, onClick: () => void) => (
    <Tooltip key={key} title={label}>
      <ArgonButton variant="text" color={color} size="small" iconOnly onClick={onClick}>
        <Icon>{icon}</Icon>
      </ArgonButton>
    </Tooltip>
  );

  return (
    <>
      <TableAccordion sectionKey="drivers"
        title={t('driver.title')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <ArgonBox mb={1} maxWidth={420}>
          <CustomTextField
            margin="none"
            name="driverSearch"
            id="driverSearch"
            type="search"
            placeholder={t('driver.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </ArgonBox>
        <Table
          searchQuery={search}
          columns={[
            { name: 'name', title: t('driver.name'), align: 'left' },
            { name: 'document', title: t('driver.document'), align: 'center' },
            { name: 'phone', title: t('driver.phone'), align: 'center' },
            { name: 'access', title: t('driver.access'), align: 'center' },
            { name: 'active', title: t('generic.active'), align: 'center' },
            { name: 'action', title: t('generic.action'), align: 'center', width: '140px' },
            { name: 'id' }
          ]}
          rows={drivers.map(driver => {
            const access = accessBadge(driver);
            return {
              name: <TextCell>{driver.name}</TextCell>,
              document: <TextCell>{driver.documentNumber}</TextCell>,
              phone: <TextCell>{driver.phone}</TextCell>,
              access: <ArgonBadge badgeContent={access.label} color={access.color} size="xs" container />,
              active: <TextCell>{driver.active ? t('generic.yes') : t('generic.no')}</TextCell>,
              action: (
                <ArgonBox display="flex" justifyContent="center" gap={0.5}>
                  {iconAction('manage', 'badge', 'info', t('driver.manage'), () => setDetail(driver))}
                  {iconAction('edit', 'edit', 'dark', t('generic.edit'), () => handleEdit(driver))}
                  {driver.active && iconAction('deactivate', 'block', 'error', t('driver.deactivate'), () => handleDeactivate(driver))}
                </ArgonBox>
              ),
              id: driver.driverId
            };
          })}
          selectedField="name"
        />
        {drivers.length === 0 && (
          <ArgonTypography variant="caption" color="secondary">
            {t('driver.empty')}
          </ArgonTypography>
        )}
      </TableAccordion>

      {/* Billable workforce surfaces — hidden without the feature (cosmetic
          only; the backend gate is authoritative). */}
      {workforceEnabled && (
        <>
          <ManageDriverQualifications />
          <ManageDriverAssignments />
          <QualificationExpirations />
        </>
      )}

      <DriverDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />
      {accountId && <DriverDetailDialog accountId={accountId} driver={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

export default ManageDrivers;
