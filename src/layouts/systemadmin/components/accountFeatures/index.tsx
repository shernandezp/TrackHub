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

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonBadge from "components/ArgonBadge";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import CustomSelect from "controls/Dialogs/CustomSelect";
import useForm from "controls/Dialogs/useForm";
import type { FormChangeHandler } from "controls/Dialogs/useForm";
import AccountFeatureDialog from "layouts/systemadmin/components/accountFeatures/AccountFeatureDialog";
import { getAllAccounts } from "api/manager/accounts";
import type { Account } from "api/manager/accounts";
import { getAccountFeaturesMaster, setAccountFeatureMaster } from "api/manager/accountFeatures";
import type { AccountFeature, AccountFeatureDtoInput } from "api/manager/accountFeatures";
import { notifyApiError } from "api/core/errors";
import { parseJson } from 'utils/jsonUtils';
import { featureLabel, sourceLabel, tierLabel } from "utils/featureLabels";
import { LoadingContext } from 'LoadingContext';

/**
 * Editable configuration bound to a specific feature key, stored inside the feature row's
 * `configurationJson`. `kind` drives the control the dialog renders — storage/cost features carry a
 * numeric value, policy opt-ins (e.g. workforce's `blockAssignmentOnExpiredLicense`) carry a boolean.
 */
export interface ConfigFieldDef { name: string; labelKey: string; kind: 'number' | 'boolean'; default: number | boolean }

/**
 * SuperAdministrator editor state for a single account feature (loose until the
 * add-mode guard / save). In "add" mode account+feature are chosen; in "edit"
 * mode they are fixed.
 */
export interface FeatureFormValues {
  accountId?: string;
  accountName?: string;
  featureKey?: string;
  enabled?: boolean;
  tier?: string;
  source?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  existingConfigurationJson?: string | null;
  configValue?: number | boolean;
}

/** Option row for the account/feature selects. */
export interface FeatureSelectOption { value: string; label: string }

// Billing-owned features the SuperAdministrator can assign to an account.
const knownFeatures = [
  'gps.integration',
  'gps.positionHistory',
  'geofencing',
  'trip-management',
  'driver-mobile',
  'public-links',
  'documents',
  'notifications',
  'notifications.email',
  'notifications.whatsapp',
  'workforce'
];

// Features carrying an editable configuration value stored in configurationJson.
const configField: Record<string, ConfigFieldDef> = {
  'gps.integration': { name: 'storingIntervalSeconds', labelKey: 'accountFeatures.config.storingIntervalSeconds', kind: 'number', default: 360 },
  'gps.positionHistory': { name: 'retentionDays', labelKey: 'accountFeatures.config.retentionDays', kind: 'number', default: 30 },
  // Spec 09 §18.6: per-account opt-in, default false — accounts differ on strictness.
  workforce: { name: 'blockAssignmentOnExpiredLicense', labelKey: 'accountFeatures.config.blockAssignmentOnExpiredLicense', kind: 'boolean', default: false }
};


function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

function SystemAccountFeatures() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [features, setFeatures] = useState<AccountFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const loaded = useRef(false);
  const [values, handleChange, setValues, setErrors, , errors] = useForm<FeatureFormValues>({});

  const selectedAccount = accounts.find(account => account.accountId === accountId);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // Only the account picker needs the full list; features are read one account at a time.
      setAccounts(await getAllAccounts() || []);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async (targetAccountId: string) => {
    if (!targetAccountId) {
      setFeatures([]);
      return;
    }
    setLoading(true);
    try {
      setFeatures(await getAccountFeaturesMaster(targetAccountId) || []);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const handleAccountFilterChange: FormChangeHandler = (event) => {
    const nextAccountId = String(event.target.value ?? '');
    setAccountId(nextAccountId);
    loadFeatures(nextAccountId);
  };

  const handleAddClick = () => {
    setIsAdd(true);
    setErrors({});
    // Adding from a filtered view targets the account on screen by default.
    setValues({ accountId, featureKey: '', enabled: true, tier: 'default', source: 'superadmin', configValue: undefined });
  };

  const handleEditClick = (account: Account, feature: AccountFeature) => {
    const cfg = configField[feature.featureKey];
    setIsAdd(false);
    setErrors({});
    setValues({
      accountId: account.accountId,
      accountName: account.name,
      featureKey: feature.featureKey,
      enabled: !!feature.enabled,
      tier: feature.tier || 'default',
      source: feature.source || 'superadmin',
      effectiveFrom: feature.effectiveFrom,
      effectiveTo: feature.effectiveTo,
      existingConfigurationJson: feature.configurationJson,
      configValue: cfg ? ((parseJson<Record<string, unknown>>(feature.configurationJson)[cfg.name] as number | boolean | undefined) ?? cfg.default) : undefined
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (isAdd && (!values.accountId || !values.featureKey)) {
      setErrors({
        accountId: !values.accountId ? t('validation.required', { field: t('account.title') }) : undefined,
        featureKey: !values.featureKey ? t('validation.required', { field: t('accountFeatures.feature') }) : undefined
      });
      return;
    }

    setLoading(true);
    try {
      const cfg = configField[values.featureKey ?? ''];
      const configuredValue = values.configValue ?? cfg?.default;
      const configurationJson = cfg
        ? JSON.stringify({
          [cfg.name]: cfg.kind === 'boolean'
            ? Boolean(configuredValue)
            : parseInt(String(configuredValue), 10) || 0
        })
        : values.existingConfigurationJson;
      await setAccountFeatureMaster({
        accountId: values.accountId,
        featureKey: values.featureKey,
        enabled: !!values.enabled,
        tier: values.tier || 'default',
        source: values.source || 'superadmin',
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo,
        configurationJson
      } as AccountFeatureDtoInput);
      setOpen(false);
      // Follow the edit onto the account it targeted, which may differ from the filtered one.
      const savedAccountId = values.accountId ?? '';
      setAccountId(savedAccountId);
      await loadFeatures(savedAccountId);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const accountOptions: FeatureSelectOption[] = accounts.map(account => ({ value: account.accountId, label: account.name }));

  const featureOptions: FeatureSelectOption[] = useMemo(
    () => knownFeatures.map(key => ({ value: key, label: featureLabel(t, key) })),
    [t]
  );

  const rows = selectedAccount
    ? features.map(feature => ({
      feature: <TextCell>{featureLabel(t, feature.featureKey || '')}</TextCell>,
      enabled: <ArgonBadge variant="gradient" color={feature.enabled ? 'success' : 'secondary'} size="xs" container badgeContent={feature.enabled ? t('generic.yes') : t('generic.no')} />,
      tier: <TextCell>{tierLabel(t, feature.tier)}</TextCell>,
      source: <TextCell>{sourceLabel(t, feature.source)}</TextCell>,
      action: (
        <ArgonButton variant="text" color="dark" onClick={() => handleEditClick(selectedAccount, feature)}>
          <Icon>edit</Icon>&nbsp;{t('generic.edit')}
        </ArgonButton>
      ),
      id: `${selectedAccount.accountId}-${feature.featureKey}`
    }))
    : [];

  return (
    <>
      <TableAccordion
        title={t('accountFeatures.title')}
        expanded={expanded}
        setExpanded={setExpanded}
        showAddIcon
        setOpen={setOpen}
        handleAddClick={handleAddClick}>
        <ArgonBox maxWidth="320px">
          <CustomSelect
            name="accountFilter"
            id="accountFilter"
            label={t('account.title')}
            list={accountOptions}
            value={accountId}
            handleChange={handleAccountFilterChange}
            numericValue={false}
            placeholder={t('accountFeatures.selectAccount')}
          />
        </ArgonBox>
        {selectedAccount
          ? (
            <Table
              columns={[
                { name: 'feature', title: t('accountFeatures.feature'), align: 'left' },
                { name: 'enabled', title: t('accountFeatures.enabled'), align: 'center' },
                { name: 'tier', title: t('accountFeatures.tier'), align: 'center' },
                { name: 'source', title: t('accountFeatures.source'), align: 'center' },
                { name: 'action', title: t('generic.action'), align: 'center' },
                { name: 'id' }
              ]}
              rows={rows}
              selectedField="feature"
            />
          )
          : (
            <ArgonTypography variant="button" color="text" fontWeight="regular">
              {t('accountFeatures.selectAccount')}
            </ArgonTypography>
          )}
      </TableAccordion>

      <AccountFeatureDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
        isAdd={isAdd}
        accountOptions={accountOptions}
        featureOptions={featureOptions}
        configField={configField}
      />
    </>
  );
}

export default SystemAccountFeatures;
