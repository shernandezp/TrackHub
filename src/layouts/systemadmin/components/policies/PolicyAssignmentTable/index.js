/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CheckboxTableDialog from 'controls/Dialogs/TableDialogs/CheckboxTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import usePolicyService from 'services/policies';
import useActionService from 'services/actions';
import useResourceService from 'services/resources';
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function PolicyAssignmentTable({ open }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getPolicies, getResourcesByPolicy, createResourceActionPolicy, deleteResourceActionPolicy } = usePolicyService();
  const { getActions } = useActionService();
  const { getResources } = useResourceService();
  const [data, setData] = useState({});
  const [policies, setPolicies] = useState([]);
  const [actions, setActions] = useState([]);
  const [resources, setResources] = useState([]);
  const [policy, setPolicy] = useState(0);

  useEffect(() => {
    const fetchActions = async () => {
        setLoading(true);
        const result = await getActions();
        setActions(result.map(action => ({
            value: action.actionId,
            name: action.actionName,
            label: t(`actions.${toCamelCase(action.actionName)}`)
        })));
        setLoading(false);
    };
    if (open)
      fetchActions();
  }, [open]);

  useEffect(() => {
    const fetchResources = async () => {
        setLoading(true);
        const result = await getResources();
        setResources(result.map(resource => ({
            value: resource.resourceId,
            name: resource.resourceName,
            label: t(`resources.${toCamelCase(resource.resourceName)}`)
        })));
        setLoading(false);
    };
    if (open)
      fetchResources();
  }, [open]);

  useEffect(() => {
    const fetchPolicies = async () => {
        setLoading(true);
        const result = await getPolicies();
        setPolicies(result.map(policy => ({
            value: policy.policyId,
            label: t(`policies.${toCamelCase(policy.name)}`, { defaultValue: policy.name })
        })));
        setLoading(false);
    };
    if (open)
        fetchPolicies();
  }, [open]);

  const handleChange = async (event) => {
    setLoading(true);
    setPolicy(event.target.value);
    let data = await getResourcesByPolicy(event.target.value);
    let actionMap = data.resources.reduce((map, resource) => {
      map[resource.resourceId] = resource.actions.reduce((actionMap, action) => {
          actionMap[action.actionId] = action;
          return actionMap;
      }, {});
      return map;
    }, {});
    setData(actionMap);
    setLoading(false);
  };

  const handleSubmit = async (resourceId, actionId, checked) => {
    setLoading(true);
    let result = null;
    if (checked) {
      result = await createResourceActionPolicy(resourceId, actionId, policy);
    } else {
      result = await deleteResourceActionPolicy(resourceId, actionId, policy);
    }
    setLoading(false);
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