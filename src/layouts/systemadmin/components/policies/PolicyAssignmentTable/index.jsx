/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import React, { useState, useEffect, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CheckboxTableDialog from 'controls/Dialogs/TableDialogs/CheckboxTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import { usePolicies, usePolicyResources } from 'queries/policies';
import { useActions } from 'queries/actions';
import { useResources } from 'queries/resources';
import { createResourceActionPolicy, deleteResourceActionPolicy } from 'api/security/policies';
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function PolicyAssignmentTable({ open }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [policy, setPolicy] = useState(0);

  const actionsQuery = useActions({ enabled: open });
  const resourcesQuery = useResources({ enabled: open });
  const policiesQuery = usePolicies({ enabled: open });
  const policyResourcesQuery = usePolicyResources(policy);

  // Keep the global spinner UX while the lists load/refresh.
  useEffect(() => {
    setLoading(
      actionsQuery.isFetching ||
      resourcesQuery.isFetching ||
      policiesQuery.isFetching ||
      policyResourcesQuery.isFetching
    );
  }, [
    actionsQuery.isFetching,
    resourcesQuery.isFetching,
    policiesQuery.isFetching,
    policyResourcesQuery.isFetching,
    setLoading
  ]);

  const actions = useMemo(
    () => (actionsQuery.data ?? []).map(action => ({
      value: action.actionId,
      name: action.actionName,
      label: t(`actions.${toCamelCase(action.actionName)}`)
    })),
    [actionsQuery.data, t]
  );

  const resources = useMemo(
    () => (resourcesQuery.data ?? []).map(resource => ({
      value: resource.resourceId,
      name: resource.resourceName,
      label: t(`resources.${toCamelCase(resource.resourceName)}`)
    })),
    [resourcesQuery.data, t]
  );

  const policies = useMemo(
    () => (policiesQuery.data ?? []).map(policyItem => ({
      value: policyItem.policyId,
      label: t(`policies.${toCamelCase(policyItem.name)}`, { defaultValue: policyItem.name })
    })),
    [policiesQuery.data, t]
  );

  const data = useMemo(() => {
    const policyResources = policyResourcesQuery.data;
    if (!policyResources) return {};
    return policyResources.resources.reduce((map, resource) => {
      map[resource.resourceId] = resource.actions.reduce((actionMap, action) => {
        actionMap[action.actionId] = action;
        return actionMap;
      }, {});
      return map;
    }, {});
  }, [policyResourcesQuery.data]);

  const handleChange = (event) => {
    setPolicy(event.target.value);
  };

  const handleSubmit = async (resourceId, actionId, checked) => {
    setLoading(true);
    let result = false;
    try {
      if (checked) {
        const created = await createResourceActionPolicy(resourceId, actionId, policy);
        result = created.policyId === policy;
      } else {
        const deleted = await deleteResourceActionPolicy(resourceId, actionId, policy);
        result = deleted === policy;
      }
    } catch {
      // Silent (matches the old handleSilentError): no toast, treat as failure.
      result = false;
    } finally {
      setLoading(false);
    }
    return result;
  };

  return (
    <CheckboxTableDialog
      key="policy"
      handleSave={handleSubmit}
      title={t('policy.resources')}
      data={data}
      columns={actions}
      rows={resources}>
      <CustomSelect
        list={policies}
        name="name"
        id="policyId"
        label={t('policy.singleTitle')}
        value={policy}
        handleChange={handleChange}
        required
      />
    </CheckboxTableDialog>
  );
}

PolicyAssignmentTable.propTypes = {
    open: PropTypes.bool.isRequired
};

export default PolicyAssignmentTable;
